# 🌟 I-SARTHI: Key Features

**I-SARTHI (Intelligent Safety & Road Tracking Hybrid Interface)** is a comprehensive driver safety system designed to prevent accidents and improve road infrastructure.

## 1. 😴 Advanced Driver Safety System (ADAS)
*   **Real-Time Drowsiness Detection**: Uses AI (MediaPipe/Dlib) to track eye aspect ratio (EAR). If eyes close for >2 seconds or blink rate increases, it triggers an alarm.
*   **Drunk Driving Prevention**: Integrated **MQ-3 Alcohol Sensor** detects alcohol vapors. If levels exceed safely limits, it can disable ignition or trigger a "Do Not Drive" alert.
*   **Voice Assistant**: Interactive AI companion (OpenAI-powered) keeps the driver engaged and awake through conversation.

## 2. 🛣️ Smart Road Monitoring
*   **Pothole Detection**: AI Camera scans the road surface for potholes and cracks in real-time.
*   **Road Quality Analysis**: **MPU6050 Accelerometer** measures vehicle vibration. High vibration + visual confirmation = Logging a "Bad Road" segment.
*   **Data Mapping**: Automatically maps road hazards to GPS coordinates for government/repair crews.

## 3. 🚨 Emergency Response System (ERS)
*   **One-Touch SOS**: Physical or digital SOS button instantly sends help.
*   **Crash Detection**: Sudden G-force spikes (via MPU6050) automatically trigger a crash alert.
*   **GSM & GPS Integration**: Uses **A77670C GSM Module** to send SMS alerts containing precise **Google Maps links** to emergency contacts and authorities.

## 4. 📊 Intelligent Cloud Dashboard
*   **Live Tracking**: View the car's location and sensor status in real-time on a map.
*   **Hybrid Architecture**:
    *   **Edge Computing (Raspberry Pi)**: Processes video and sensors locally for zero latency.
    *   **Cloud Storage (Render/SQLite)**: Syncs critical incidents to the cloud for permanent record-keeping.
*   **User Reports**: Generates driving performance reports (drowsiness events, speed, routes).

## 5. 🔌 Hardware Integration
*   **Modular Design**: Supports "Plug & Play" sensors (LiDAR, Radar, Cameras).
*   **Battery Efficient**: Optimized Python code ensures long runtime on standard car batteries or power banks.
