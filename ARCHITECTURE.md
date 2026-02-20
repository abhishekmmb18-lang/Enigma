# 🏗️ I-SARTHI Architecture: Hybrid Deployment

This document explains how **I-SARTHI** works when deployed online. It is a **Hybrid System** combining a local robotic car (Raspberry Pi) and a global cloud dashboard.

## 🌟 High-Level Overview

```mermaid
graph TD
    subgraph Cloud [Global Cloud (Internet)]
        User[User / Administrator] -->|Visits Website| Frontend[Frontend (Vercel)]
        Frontend -->|API Calls / REST| Backend[Backend Integration (Render)]
        Backend <-->|Read/Write Data| DB[(SQLite Database)]
        Backend -->|Send SMS Alert| GSM_Gateway[GSM Network (A77670C)]
    end

    subgraph Robot [Local Car (Raspberry Pi)]
        PiMain[Start Car System (start_car.py)] -->|Runs| Sensors[Sensors (MQ-3, GPS, MPU6050)]
        PiMain -->|Runs| AI_Cam[AI Camera (Drowsiness / Potholes)]
        
        Sensors -->|POST Data /api/sensor| Backend
        AI_Cam -->|POST Alert /api/drowsiness| Backend
        
        Controller[Hardware Control] -->|Action| MotorDriver[L298N Motors]
        PiMain <-->|Read/Control| Controller
    end

    %% Communication Bridge
    Robot -.->|Needs Internet Access| Cloud
```

---

## 🧩 Component Breakdown

### 1. 🚗 Local Robot (Raspberry Pi)
The "Brain" on the actual car. It does the heavy lifting locally and **uploads data** to the cloud.
*   **Sensors**: Reads Alcohol (MQ-3), Vibration (MPU6050), GPS (NEO-7).
*   **AI Vision**: Runs Python scripts (`drowsiness_detector.py`, `pothole_detector.py`) to analyze camera feeds in real-time.
*   **Action**: Controls motors and servos.
*   **Connectivity**: Uses `fetch()` or `requests.post()` to send critical data (accidents, drowsiness alerts) to the **Cloud Backend**.

### 2. ☁️ Backend Server (Render)
The "Central Hub" accessible from anywhere in the world.
*   **Role**: Receives data from the Pi and serves it to the User.
*   **API**: REST endpoints (e.g., `/api/drowsiness`, `/api/location`).
*   **Database**: Stores history of incidents and user profiles.

### 3. 💻 Frontend Dashboard (Vercel)
The "Window" for the user.
*   **Role**: Displays live maps, graphs, and alerts.
*   **Access**: Users log in via browser from phone or laptop.
*   **Real-time**: Fetches latest data from the Backend to show car status.

## 🚀 How Data Flows
1.  **Event**: Driver falls asleep.
2.  **Local Pi**: `drowsiness_detector.py` sees closed eyes -> Triggers Alert locally.
3.  **Upload**: Pi sends `POST /api/drowsiness` to `https://i-sarthi-backend.onrender.com`.
4.  **Backend**: Saves alert to database.
5.  **Frontend**: Police/Admin dashboard auto-refreshes and shows "CRITICAL ALERT".

## ⚠️ Important Deployment Note
*   **Camera Feed**: Streaming a raw video feed from a moving car (on 4G) to Vercel is difficult/laggy.
*   **Solution**: We upload **Snapshots** or **Alert Logs** instead of continuous video. The driver sees the live feed locally on the car's LCD screen.
