const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// --- Emergency Profile Table ---
db.run(`CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY DEFAULT 1,
    name TEXT,
    emergency_contact TEXT,
    blood_group TEXT
)`);

// --- Emergency Profile API ---
app.post('/api/profile', (req, res) => {
    const { name, emergency_contact, blood_group } = req.body;
    const sql = `INSERT OR REPLACE INTO user_profile (id, name, emergency_contact, blood_group) VALUES (1, ?, ?, ?)`;
    db.run(sql, [name, emergency_contact, blood_group], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Emergency Profile Updated" });
    });
});

app.get('/api/profile', (req, res) => {
    db.get("SELECT * FROM user_profile WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
    });
});

// Signup Endpoint
app.post('/api/signup', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Please provide all fields' });
    }

    const checkSql = 'SELECT * FROM users WHERE email = ?';
    db.get(checkSql, [email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        const params = [username, email, password];
        db.run(sql, params, function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({
                message: 'User registered successfully',
                data: { id: this.lastID, username, email }
            });
        });
    });
});

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password' });
    }

    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.get(sql, [email, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            res.json({
                message: 'Login successful',
                user: row // Return all fields including profile_picture, etc.
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    });
});

// Update Profile Endpoint
app.put('/api/user/:id', (req, res) => {
    const { id } = req.params;
    const { full_name, profile_picture, vehicle_details, contact_details } = req.body;

    const sql = `UPDATE users SET 
                 full_name = COALESCE(?, full_name), 
                 profile_picture = COALESCE(?, profile_picture), 
                 vehicle_details = COALESCE(?, vehicle_details), 
                 contact_details = COALESCE(?, contact_details) 
                 WHERE id = ?`;

    const params = [full_name, profile_picture, vehicle_details, contact_details, id];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        // Return updated user
        db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                message: 'Profile updated successfully',
                user: row
            });
        });
    });
});

// --- Road Data API ---
app.post('/api/road-data', (req, res) => {
    const { type, confidence, vibration, latitude, longitude, distance, temperature, humidity, alcohol, network_strength, sos_alert, gsm_connected } = req.body;
    const sql = `INSERT INTO road_events (type, confidence, vibration, latitude, longitude, distance, temperature, humidity, alcohol, network_strength, sos_alert, gsm_connected) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        type || 'Unknown',
        confidence || 0,
        vibration || 0,
        latitude || 0,
        longitude || 0,
        distance || -1,
        temperature || 0,
        humidity || 0,
        req.body.alcohol || 0,
        req.body.network_strength || 0,

        req.body.sos_alert || 0,
        req.body.gsm_connected || 0
    ];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            success: true,
            id: this.lastID,
            message: "Event logged successfully"
        });
    });
});

app.get('/api/road-data', (req, res) => {
    const sql = `SELECT * FROM road_events ORDER BY id DESC LIMIT 50`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// --- Drowsiness Detection API ---
let latestDrowsinessStatus = {
    isDrowsy: false,
    events: 0,
    timestamp: Date.now()
};

app.post('/api/drowsiness', (req, res) => {
    const { isDrowsy, events } = req.body;
    latestDrowsinessStatus = {
        isDrowsy,
        events,
        timestamp: Date.now()
    };

    // Log to Database
    db.run(`INSERT INTO drowsiness_logs (is_drowsy, events_count) VALUES (?, ?)`, [isDrowsy, events], (err) => {
        if (err) console.error("Drowsiness Log Error:", err.message);
    });

    // Log if drowsy
    if (isDrowsy) {
        console.log("⚠️ DROWSINESS ALERT RECEIVED!");
        const lat = locationData.latitude;
        const lon = locationData.longitude;
        db.run(`INSERT INTO road_events (type, confidence, latitude, longitude, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
            ['Drowsiness Alert', 100, lat, lon],
            (err) => { if (err) console.error("Drowsiness Incident Error", err); }
        );
    }
    res.json({ success: true });
});

app.get('/api/drowsiness', (req, res) => {
    // Auto-reset if data is stale (> 5 seconds old)
    // This prevents "Drowsiness Detected" from sticking if the Python script crashes or is closed
    if (Date.now() - latestDrowsinessStatus.timestamp > 5000) {
        latestDrowsinessStatus.isDrowsy = false;
    }

    // Return latest status + history
    const sql = "SELECT * FROM drowsiness_logs ORDER BY id DESC LIMIT 10";
    db.all(sql, [], (err, rows) => {
        if (err) return res.json(latestDrowsinessStatus);
        res.json({
            current: latestDrowsinessStatus,
            history: rows
        });
    });
});

// --- Radar / LiDAR API ---
let radarData = {
    angle: 0,
    distance: 0, // cm
    timestamp: Date.now()
};

app.post('/api/radar', (req, res) => {
    const { angle, distance } = req.body;
    radarData = {
        angle: parseInt(angle) || 0,
        distance: parseInt(distance) || 0,
        timestamp: Date.now()
    };

    // Log to Sensor Logs (Throttle? logging every ping might be too much, but user asked for "every data")
    // We will log it.
    db.run(`INSERT INTO sensor_logs (sensor_type, value_1, value_2) VALUES (?, ?, ?)`,
        ['Radar', radarData.angle, radarData.distance],
        (err) => { if (err) console.error("Radar Log Error:", err.message); }
    );

    // Optional: Log only significant obstacles?
    if (radarData.timestamp % 100 < 10) console.log(`📡 Radar Data: Angle ${angle}°, Dist ${distance}cm`);
    res.json({ success: true });
});

app.get('/api/radar', (req, res) => {
    res.json(radarData);
});

// --- Vibration Monitor API (Dual MPU) ---
let vibrationData = {
    left: 0,
    right: 0,
    timestamp: Date.now()
};

let lastCriticalLog = 0; // Debounce for critical logs
let lastVibrationLog = 0; // Throttle for continuous logs

app.post('/api/vibration', (req, res) => {
    const { left, right, raw_left, raw_right } = req.body;
    let lVal = parseFloat(left) || 0;
    let rVal = parseFloat(right) || 0;

    // Server-side Sensitivity Calibration (Use Raw Data if available)
    // Overrides Pi's internal normalization to allow remote tuning
    if (raw_left !== undefined && raw_right !== undefined) {
        lVal = Math.min(parseFloat(raw_left) / 35000.0, 1.2); // Divisor 35k (User Tuned)
        rVal = Math.min(parseFloat(raw_right) / 35000.0, 1.2);
    }

    vibrationData = {
        left: lVal,
        right: rVal,
        timestamp: Date.now()
    };

    // 1. Critical Incident Logging (> 0.8)
    // Debounce: Only log once every 5 seconds per event sequence
    if ((lVal >= 0.8 || rVal >= 0.8) && (Date.now() - lastCriticalLog > 5000)) {
        lastCriticalLog = Date.now();
        const maxVib = Math.max(lVal, rVal);
        const lat = locationData.latitude;
        const lon = locationData.longitude;

        const sql = `INSERT INTO road_events (type, confidence, vibration, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`;
        db.run(sql, ['Critical Vibration', 100, maxVib, lat, lon], (err) => {
            if (err) console.error("Failed to log Critical Vibration:", err.message);
            else console.log(`⚠️ Critical Vibration Logged: ${maxVib} at ${lat},${lon}`);
        });
    }

    // 2. Continuous Sensor Logging (Throttle: 1s to prevent DB bloating)
    if (Date.now() - lastVibrationLog > 1000) {
        lastVibrationLog = Date.now();
        db.run(`INSERT INTO sensor_logs (sensor_type, value_1, value_2) VALUES (?, ?, ?)`,
            ['Vibration', lVal, rVal],
            (err) => { if (err) console.error("Vibration Log Error:", err.message); }
        );
    }

    res.json({ success: true });
});

app.get('/api/vibration', (req, res) => {
    res.json(vibrationData);
});

// --- GSM Status API ---
let gsmStatus = {
    connected: false,
    timestamp: Date.now()
};

app.post('/api/gsm-status', (req, res) => {
    const { connected } = req.body;
    gsmStatus = {
        connected: !!connected,
        timestamp: Date.now()
    };
    console.log(`📶 GSM Status Update: ${gsmStatus.connected ? "CONNECTED" : "DISCONNECTED"}`);
    res.json({ success: true });
});

app.get('/api/gsm-status', (req, res) => {
    res.json(gsmStatus);
});

// --- Alcohol Monitor API (MQ-3) ---
let alcoholData = {
    value: 0, // 0-100
    level: 'Normal', // Normal, Moderate, High
    timestamp: Date.now()
};

app.post('/api/alcohol', (req, res) => {
    const { value } = req.body;
    const val = parseFloat(value) || 0;

    let level = 'Normal';
    if (val > 30) level = 'Moderate';
    if (val > 70) {
        level = 'High';
        const lat = locationData.latitude;
        const lon = locationData.longitude;
        db.run(`INSERT INTO road_events (type, confidence, alcohol, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
            ['Alcohol Alert', 100, val, lat, lon],
            (err) => { if (err) console.error("Alcohol Incident Error", err); }
        );
    }

    alcoholData = {
        value: val,
        level,
        timestamp: Date.now()
    };

    // Log to Sensor Logs
    db.run(`INSERT INTO sensor_logs (sensor_type, value_1) VALUES (?, ?)`, ['Alcohol', val], (err) => {
        if (err) console.error("Alcohol Log Error:", err.message);
    });

    res.json({ success: true });
});

app.get('/api/alcohol', (req, res) => {
    res.json(alcoholData);
});

// --- GPS Location API (NEO-7) ---
let locationData = {
    latitude: 0.0,
    longitude: 0.0,
    speed: 0.0, // km/h
    timestamp: Date.now()
};

app.post('/api/location', (req, res) => {
    const { latitude, longitude, speed } = req.body;
    const newLat = parseFloat(latitude) || 0;
    const newLon = parseFloat(longitude) || 0;

    // Smart Update: Only update if we have a fix (non-zero)
    // This allows Browser Geolocation (Phone/Laptop) to take over if Hardware GPS (Pi) fails and sends 0,0
    if (newLat !== 0 || newLon !== 0) {
        locationData = {
            latitude: newLat,
            longitude: newLon,
            speed: parseFloat(speed) || 0.0,
            timestamp: Date.now()
        };

        // Log GPS to Sensor Logs
        db.run(`INSERT INTO sensor_logs (sensor_type, value_1, value_2, value_3) VALUES (?, ?, ?, ?)`,
            ['GPS', locationData.latitude, locationData.longitude, locationData.speed],
            (err) => { if (err) console.error("GPS Log Error:", err.message); }
        );

        // Log occasionally
        if (Date.now() % 5000 < 100) console.log(`📍 GPS Update: ${locationData.latitude}, ${locationData.longitude}`);
    }

    res.json({ success: true });
});

app.get('/api/location', (req, res) => {
    res.json(locationData);
});

// --- Sensor Logs History API ---
app.get('/api/sensor-logs', (req, res) => {
    const sql = `SELECT * FROM sensor_logs ORDER BY id DESC LIMIT 50`;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- User Management API ---
app.get('/api/users', (req, res) => {
    // Select all users (excluding passwords for security)
    const sql = "SELECT id, username, email, full_name, vehicle_details, contact_details FROM users";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// --- GSM / SOS Alert API ---
const { exec } = require('child_process');

app.post('/api/sos', (req, res) => {
    const { type, message } = req.body; // type: 'manual' or 'drowsiness'

    // 1. Get Location
    const lat = locationData.latitude;
    const lon = locationData.longitude;
    const mapLink = (lat && lon) ? ` https://maps.google.com/?q=${lat},${lon}` : "";

    // Default Message
    let smsMsg = message || "CRITICAL ALERT: Driver triggered SOS! Immediate assistance required.";
    if (type === 'drowsiness') {
        smsMsg = "URGENT: Driver is exceedingly drowsy (10+ events). Risk of accident high. Please contact driver.";
    }

    // Append Location Link
    smsMsg += mapLink;

    // 2. Log to Database (Incidents)
    const sql = `INSERT INTO road_events (type, confidence, vibration, latitude, longitude, sos_alert, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`;
    const params = ['SOS', 100, 0, lat, lon, 1];

    db.run(sql, params, (err) => {
        if (err) console.error("Failed to log SOS incident:", err.message);
        else console.log("✅ SOS Incident Logged to Database");
    });

    // 3. Mark SOS as Pending for Pi to Pick up
    // We will use a simple in-memory flag or DB. 
    // Since we don't have a 'commands' table, let's use a global variable that the Pi polls.
    global.sosCommandPending = {
        active: true,
        message: smsMsg,
        timestamp: Date.now()
    };

    console.log(`🚨 SOS Alert Received from Web/App. Waiting for Pi to sync...`);

    // We do NOT run python here anymore.
    res.json({ success: true, message: 'SOS Alert Queued for GSM Module' });
});



// --- Pi Polling Endpoint ---
app.get('/api/sos/check', (req, res) => {
    if (global.sosCommandPending && global.sosCommandPending.active) {
        // user only sees this once
        const msg = global.sosCommandPending.message;

        // Timeout check (expire after 30s)
        if (Date.now() - global.sosCommandPending.timestamp > 30000) {
            global.sosCommandPending.active = false;
            return res.json({ trigger: false });
        }

        // Fetch Emergency Contact from DB to ensure we have the latest
        db.get("SELECT emergency_contact FROM user_profile WHERE id = 1", (err, row) => {
            const contact = row ? row.emergency_contact : null;

            // Send Command
            global.sosCommandPending.active = false; // Reset after sending
            return res.json({
                trigger: true,
                message: msg,
                target_contact: contact
            });
        });
    } else {
        res.json({ trigger: false });
    }
});

// --- GSM Status API ---
app.get('/api/gsm-status', (req, res) => {
    // 1. Get Count of SOS Alerts
    db.get("SELECT COUNT(*) as count FROM road_events WHERE type = 'SOS'", [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        // 2. We cannot verify physical GSM connection without running a script.
        // We will only return what we know: The server is ready to handle requests.

        res.json({
            connected: true, // API is reachable
            status: "Service Ready",
            alertsSent: row.count
            // Removed dummy signal strength/provider as per user request
        });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT} (Accessible via IP)`);
    console.log(`Database updated with distance, temperature, humidity, alcohol, GPS, and SOS support.`);
});
