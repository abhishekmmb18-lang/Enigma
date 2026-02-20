# 🛠️ I-SARTHI Build & Setup Guide

This document provides step-by-step instructions to build the **I-SARTHI** hardware and set up the software.

## 📦 1. Hardware Requirements

### Core Components
*   **Raspberry Pi 4 or 5** (4GB+ RAM recommended).
*   **MicroSD Card** (32GB+, Class 10).
*   **Power Bank** (5V, 3A Output) for Pi.
*   **L298N Motor Driver** + 4x DC Gear Motors + Wheels + Chassis.
*   **Li-Ion Batteries (2x 18650)** for Motors.

### Sensors
*   **Camera**: Pi Camera Module v2 or USB Webcam.
*   **GPS**: NEO-6M / NEO-7M Module.
*   **GSM**: SIM800L / A7670C / A77670C (for SMS).
*   **Alcohol**: MQ-3 Gas Sensor.
*   **Vibration/Crash**: MPU6050 Accelerometer.
*   **LiDAR/Distance**: VL53L0X Time-of-Flight Sensor.

---

## 🔌 2. Wiring & Assembly

For the detailed Pinout and Circuit Diagram, please open:
👉 **[WIRING_AND_SETUP.md](./WIRING_AND_SETUP.md)**

---

## 💻 3. Software Installation (Raspberry Pi)

### Step A: Flash OS
1.  Download **Raspberry Pi Imager**.
2.  Flash **Raspberry Pi OS (64-bit)** to your SD card.
3.  Boot the Pi and connect to Wi-Fi.

### Step B: Clone Repository
Open the terminal on your Raspberry Pi:
```bash
cd Desktop
git clone https://github.com/abhishekmmb18-lang/i-SARTHI.git
cd i-SARTHI
```

### Step C: Install System Dependencies
Update and install required libraries:
```bash
sudo apt update
sudo apt install -y python3-opencv cmake libopenblas-dev liblapack-dev libjpeg-dev
```

### Step D: Install Python Requirements
```bash
pip3 install opencv-python dlib imutils scipy RPi.GPIO gpiozero smbus2 pyserial requests
```
*(Note: `dlib` installation may take 30-60 minutes on a Pi.)*

### Step E: Install Node.js (For Dashboard)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
cd client
npm install
cd ../server
npm install
```

---

## 🚀 4. Running the System

### Option 1: Full System (Hardware + Dashboard)
Run the master script that launches everything (Motors, AI, Sensors, Server):
```bash
python3 start_car.py
```
*   **Dashboard URL**: `http://localhost:5173` (or your Pi's IP address).

### Option 2: Individual Modules (Testing)
*   **Drowsiness Detection**: `python3 drowsiness_detector.py`
*   **Motors/Control**: `python3 car_control.py` (if available)

---

## ☁️ 5. Cloud Deployment (Optional)

If you want to view the dashboard remotely (from another city):
👉 **[DEPLOYMENT_ONLINE.md](./DEPLOYMENT_ONLINE.md)**
