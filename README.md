# I-SARTHI: Intelligent Safety & Road Transport Helper Interface 🚗🛡️

> **"Your Intelligent Companion for Safer Roads."**

![Project Banner](https://via.placeholder.com/1200x400?text=I-SARTHI+Hackathon+Project) 
*(Replace with actual project screenshot)*

## 📖 Overview
**I-SARTHI** is a comprehensive, AI-powered road safety system designed to prevent accidents and ensure rapid response in emergencies. By integrating **Computer Vision, IoT Sensors, and a centralized Database**, it monitors driver behavior, vehicle status, and road conditions in real-time.

---

## 🚀 Key Features

### 1. **Driver Monitoring System (DMS)** 😴
*   **Real-time Drowsiness Detection**: Uses OpenCV & Python to track eye closure ratios. 
*   **Instant Alerts**: Triggers loud alarms and voice warnings when fatigue is detected.
*   **Automatic SOS**: If drowsiness persists (10+ events), an automatic SOS SMS with GPS location is sent to emergency contacts.

### 2. **Smart Sensor Suite** 📡
*   **Alcohol Detection**: MQ-3 sensor prevents drunk driving by monitoring cabin air quality.
*   **Accident Detection**: Vibration sensors (MPU6050) detect impacts and crash forces.
*   **Blind Spot Monitoring**: Ultrasonic/Radar sensors warn of obstacles.
*   **Live GPS Tracking**: Real-time location logging for fleet management.

### 3. **Centralized Database Dashboard** 📊
*   **Secure Cloud/Local Storage**: All data (incidents, sensor logs, user profiles) is stored in a robust **SQLite Database**.
*   **Government/Admin Panel**: A dedicated "Database" dashboard for authorities to view:
    *   registered users.
    *   history of drowsiness events.
    *   black-box sensor logs (Speed, Location, Alcohol levels).
*   **Data Export**: Download comprehensive JSON reports for forensic analysis.

---

## 🛠️ Technology Stack

| Component | Tech Used |
| :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (Embedded Relational DB) |
| **AI/ML** | Python, OpenCV (Haar Cascades/Dlib), Flask |
| **Hardware** | Raspberry Pi / Jetson Nano, GSM Module (A7670C), GPS (NEO-7M), MQ-3, MPU6050 |

---

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v16+)
*   Python (v3.8+)
*   Raspberry Pi (Optional, for hardware features)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/i-sarthi.git
cd i-sarthi
```

### 2. Setup Backend (Server)
```bash
cd server
npm install
npm run dev
```
*Server runs on port 5000.*

### 3. Setup Frontend (Client)
Open a new terminal:
```bash
cd client
npm install
npm run dev
```
*Client runs on port 5173.*

### 4. Setup AI Modules (Python)
Open a new terminal:
```bash
pip install opencv-python flask requests pyserial
python drowsiness_detector.py
```

---

## 🔌 Hardware Wiring
## 🔮 Future Enhancements
*   Integration with **V2V (Vehicle-to-Vehicle)** communication.
*   **Blockchain-based** black box data storage for immutable evidence.
*   Mobile App version using React Native.

---

## 👥 Contributors
*   **Team Lead**: [ABHSIHEK VERMA]
*   **Developer**: [RITIK GORAI]
*   **Hardware Specialist**: [ANVESHA TIWARI]

---

**Built with ❤️ for Safer Roads.**
