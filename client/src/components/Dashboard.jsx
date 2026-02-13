import React from 'react';

const Dashboard = () => {
    const [drowsiness, setDrowsiness] = React.useState({ isDrowsy: false, events: 0 });

    React.useEffect(() => {
        const fetchDrowsiness = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/drowsiness`);
                const data = await res.json();
                // Server returns { current: { isDrowsy, events }, history: [] }
                // We need to set the state to the 'current' object
                setDrowsiness(data.current || data);
            } catch (err) {
                console.error("Failed to fetch drowsiness status");
            }
        };

        const interval = setInterval(fetchDrowsiness, 1000);
        return () => clearInterval(interval);
    }, []);

    // Voice Alert Logic
    const [lastVoiceAlertCount, setLastVoiceAlertCount] = React.useState(0);
    const [lastAlertTime, setLastAlertTime] = React.useState(null);

    React.useEffect(() => {
        // Trigger voice alert every 5 events
        if (drowsiness.events > 0 && drowsiness.events >= lastVoiceAlertCount + 5) {
            console.log("🚨 TRIGGERING VOICE ALERT (Every 5 events)!");

            const event = new CustomEvent('TRIGGER_DROWSINESS_ALERT');
            window.dispatchEvent(event);

            setLastVoiceAlertCount(drowsiness.events);
            setLastAlertTime(new Date().toLocaleTimeString());
        }
    }, [drowsiness.events, lastVoiceAlertCount]);

    // Alerts in last 1 minute logic
    const [recentAlerts, setRecentAlerts] = React.useState(0);
    const alertTimestamps = React.useRef([]);
    const prevEvents = React.useRef(0);

    React.useEffect(() => {
        if (drowsiness.events > prevEvents.current) {
            alertTimestamps.current.push(Date.now());
        }
        prevEvents.current = drowsiness.events;

        // Filter to last 60 seconds
        const now = Date.now();
        alertTimestamps.current = alertTimestamps.current.filter(t => now - t <= 60000);
        setRecentAlerts(alertTimestamps.current.length);

        // Also run this cleanup every second even if no new events, so the count drops automatically
        // (We piggyback on the existing interval poll or just trust the next event update? 
        //  Better to trust event updates for now to keep it simple, or add a separate interval?
        //  Let's just rely on re-renders for now, or add a small check in the fetch loop?)
    }, [drowsiness.events]);

    return (
        <div className="p-8 w-full min-h-screen text-white animate-fade-in space-y-6">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                System Dashboard
            </h2>

            {/* Drowsiness Alert Box */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 flex items-center justify-between
                ${drowsiness.isDrowsy
                    ? 'bg-red-900/80 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-pulse'
                    : 'bg-gray-900/40 border-green-500/30'}`}>

                <div className="flex items-center gap-4">
                    {/* Live Video Feed */}
                    <div className="relative w-48 h-36 rounded-lg overflow-hidden border border-white/20 bg-black shadow-lg">
                        <img
                            src="http://localhost:5001/video_feed"
                            alt="Driver Cam"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="flex items-center justify-center w-full h-full text-xs text-gray-500 text-center p-2">Camera Offline<br/>Run Python Script</div>';
                            }}
                        />
                        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold">
                            {drowsiness.isDrowsy ? 'DROWSINESS DETECTED!' : 'Driver Status: ACTIVE'}
                        </h3>
                        <p className="text-lg opacity-80">
                            {drowsiness.isDrowsy ? 'Driver eyes closed! Alerting...' : 'Monitoring driver behavior...'}
                        </p>
                        {lastAlertTime && (
                            <p className="text-sm text-red-400 mt-2 font-mono">
                                Last Voice Alert: {lastAlertTime}
                            </p>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-4xl font-bold">{recentAlerts}</div>
                    <div className="text-sm text-gray-400">Alerts (Last 1m)</div>
                    <div className="text-xs text-gray-500 mt-1">Total: {drowsiness.events}</div>
                </div>
            </div>

            {/* Radar / LiDAR Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RadarWidget />

                {/* Alcohol Monitor (MQ-3) */}
                <div className="bg-gray-900/40 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                    <AlcoholWidget />
                </div>

                {/* GPS Location (NEO-7) */}
                <div className="bg-gray-900/40 p-6 rounded-2xl border border-white/5 md:col-span-2">
                    <LocationWidget />
                </div>
            </div>
        </div>
    );
};

// Location Widget Component
const LocationWidget = () => {
    const [gps, setGps] = React.useState({ latitude: 0, longitude: 0, speed: 0 });

    React.useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/location`);
                const data = await res.json();
                setGps(data);
            } catch (e) { }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const mapsUrl = `https://www.google.com/maps?q=${gps.latitude},${gps.longitude}`;

    return (
        <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
                    <span className="text-2xl">🌍</span>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-blue-400">Live GPS Tracking</h3>
                    <p className="text-gray-400 text-sm">NEO-7 Module</p>
                </div>
            </div>

            <div className="flex gap-8 text-center">
                <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Latitude</div>
                    <div className="text-2xl font-mono font-bold">{gps.latitude.toFixed(6)}°</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Longitude</div>
                    <div className="text-2xl font-mono font-bold">{gps.longitude.toFixed(6)}°</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Speed</div>
                    <div className="text-2xl font-mono font-bold text-yellow-400">{gps.speed.toFixed(1)} km/h</div>
                </div>
            </div>

            <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold transition-colors flex items-center gap-2"
            >
                View on Map ↗
            </a>
        </div>
    );
};

// Radar Widget Component
const RadarWidget = () => {
    const [radar, setRadar] = React.useState({ angle: 0, distance: 0 });
    const [history, setHistory] = React.useState(new Array(181).fill(0)); // 0-180 degrees
    const canvasRef = React.useRef(null);

    React.useEffect(() => {
        const fetchRadar = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/radar`);
                const data = await res.json();

                // Only update if angle changed significantly or it's new data
                // For polling, we just update state
                setRadar(data);

                // Update history map
                setHistory(prev => {
                    const newHist = [...prev];
                    // If distance is valid (e.g., > 0 and < max range), store it
                    // Assuming max range 200cm for visualization
                    newHist[data.angle] = data.distance;
                    return newHist;
                });
            } catch (e) {
                console.error("Radar fetch error", e);
            }
        };
        // Fast polling for smooth-ish animation
        const interval = setInterval(fetchRadar, 100);
        return () => clearInterval(interval);
    }, []);

    // Draw Radar
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const cx = width / 2;
        const cy = height - 20; // Bottom center
        const radius = Math.min(width, height * 2) / 2 - 20;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Draw Grid (Semi-circles)
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, Math.PI, 0); // Outer
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.66, Math.PI, 0); // Mid
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.33, Math.PI, 0); // Inner
        ctx.stroke();

        // Draw Angles lines
        for (let a = 0; a <= 180; a += 30) {
            const rad = (a * Math.PI) / 180;
            // Note: Canvas arc 0 is right (3 o'clock). We want 0 to be Left (9 o'clock) for 0-180 sweep?
            // Usually 0-180 Servo: 0 is Left, 90 Up, 180 Right.
            // Canvas: PI is Left, 1.5PI Up, 0/2PI Right.
            // Mapping: CanvasAngle = PI + (ServoAngle * -PI / 180)? No.
            // Let's map Servo 0 -> Canvas PI (Left)
            // Servo 90 -> Canvas 1.5PI (Up)
            // Servo 180 -> Canvas 0 (Right)
            // Formula: angle_res = Math.PI + (a * Math.PI / 180) ... wait
            // PI (180 deg) + 0 = 180 (Left). Correct.
            // PI + 90 = 270 (Up). Correct.
            // PI + 180 = 360/0 (Right). Correct.
            // Actually standard servo: 0 is usually Right? Let's assume 0 Left for standard radar view.

            const renderAngle = Math.PI + (a * Math.PI / 180);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(renderAngle) * radius, cy + Math.sin(renderAngle) * radius);
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.stroke();
        }

        // Draw Blips from History
        history.forEach((dist, angle) => {
            if (dist > 0 && dist < 400) { // Max range 400cm?
                // Scale distance to radius
                const r = (dist / 200) * radius; // 200cm circle limit
                if (r < radius) {
                    const renderAngle = Math.PI + (angle * Math.PI / 180);
                    const x = cx + Math.cos(renderAngle) * r;
                    const y = cy + Math.sin(renderAngle) * r;

                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, 2 * Math.PI);
                    ctx.fillStyle = dist < 50 ? '#f00' : '#0f0'; // Red if close
                    ctx.fill();
                }
            }
        });

        // Draw Sweeping Line (Current Angle)
        const currentRenderAngle = Math.PI + (radar.angle * Math.PI / 180);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(currentRenderAngle) * radius, cy + Math.sin(currentRenderAngle) * radius);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw Current Object Text
        ctx.fillStyle = '#fff';
        ctx.font = '16px monospace';
        ctx.fillText(`Angle: ${radar.angle}°`, 10, 30);
        ctx.fillText(`Dist: ${radar.distance}cm`, 10, 50);

    }, [radar, history]);

    return (
        <div className="bg-black/80 rounded-2xl p-4 border border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <h3 className="text-green-400 font-bold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                LiDAR Radar (360° Vision)
            </h3>
            <div className="flex justify-center">
                <canvas ref={canvasRef} width={400} height={250} className="w-full h-full" />
            </div>
            <div className="text-center text-xs text-green-600 mt-2">VL53L0X + SG90 Servo</div>
        </div>
    );
};

const AlcoholWidget = () => {
    const [data, setData] = React.useState({ value: 0, level: 'Normal' });

    React.useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'}/api/alcohol`);
                const json = await res.json();
                setData(json);
            } catch (e) { }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const getColor = () => {
        if (data.level === 'High') return 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]';
        if (data.level === 'Moderate') return 'text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]';
        return 'text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]';
    };

    const getBgColor = () => {
        if (data.level === 'High') return 'bg-red-500/10 border-red-500/50';
        if (data.level === 'Moderate') return 'bg-orange-500/10 border-orange-500/50';
        return 'bg-green-500/10 border-green-500/50';
    };

    return (
        <div className={`w-full h-full flex flex-col items-center justify-center transition-all duration-500 ${getBgColor()} rounded-xl p-4`}>
            <h3 className="text-xl font-bold text-gray-300 mb-2">Driver Alcohol Level</h3>

            <div className={`text-6xl font-black mb-2 transition-all duration-500 ${getColor()}`}>
                {data.level === 'Normal' ? 'SAFE' : data.level.toUpperCase()}
            </div>

            <div className="w-full bg-gray-700 h-4 rounded-full mt-4 overflow-hidden relative">
                <div
                    className={`h-full transition-all duration-1000 ${data.level === 'High' ? 'bg-red-500' : data.level === 'Moderate' ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(data.value, 100)}%` }}
                />
            </div>

            <div className="flex items-end gap-1 mt-2">
                <span className={`text-4xl font-bold ${getColor()}`}>{data.value.toFixed(1)}</span>
                <span className="text-gray-400 text-lg mb-1">% Alcohol</span>
            </div>
        </div>
    );
};


export default Dashboard;
