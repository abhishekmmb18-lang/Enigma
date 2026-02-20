import cv2
import time
import json
import numpy as np
import requests
from flask import Flask, Response

app = Flask(__name__)

# Config
CAMERA_INDEX = 1 
SERVER_IP = "http://localhost:5000" # Updated to localhost as this runs on laptop
API_ENDPOINT = f"{SERVER_IP}/api/road-data"

# Global State
pothole_detected = False
last_alert_time = 0

def send_alert(confidence=0.9):
    global last_alert_time
    # Debounce: Only send 1 alert every 3 seconds
    if time.time() - last_alert_time < 3:
        return

    try:
        payload = {
            "type": "Pothole",
            "confidence": confidence,
            "latitude": 0,    # Default, will remain 0 if no GPS
            "longitude": 0,   # Default
            "vibration": 0    # Default
        }
        res = requests.post(API_ENDPOINT, json=payload, timeout=0.5)
        print(f"📡 Sent Alert: {res.status_code}")
        last_alert_time = time.time()
    except Exception as e:
        print(f"❌ Failed to send alert: {e}")

def generate_frames():
    global pothole_detected
    # Try opening camera
    camera = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)
    if not camera.isOpened():
        camera = cv2.VideoCapture(0, cv2.CAP_DSHOW) # Fallback to 0
    
    using_simulation = not camera.isOpened()
    print(f"Pothole Detector: Camera Open? {not using_simulation}")

    while True:
        if not using_simulation:
            # REAL CAMERA LOGIC
            success, frame = camera.read()
            if not success:
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(frame, "Camera Error", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            else:
                # Placeholder for YOUR Model Inference
                # if model.predict(frame) == "pothole":
                #     pothole_detected = True
                #     send_alert(0.95)
                pass 

        else:
            # Simulation Mode (Black background with moving "road")
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            # Draw Road
            cv2.fillPoly(frame, [np.array([[100, 480], [250, 240], [390, 240], [540, 480]])], (50, 50, 50))
            # Draw Lane Lines
            cv2.line(frame, (320, 240), (320, 480), (255, 255, 255), 2)
            
            # Simulate Pothole
            if int(time.time() * 2) % 10 < 2: # Show pothole every 5 seconds
                cv2.circle(frame, (320, 400), 40, (0, 0, 0), -1) # Hole
                cv2.circle(frame, (320, 400), 45, (0, 0, 255), 2) # Red Ring
                cv2.putText(frame, "POTHOLE DETECTED", (200, 350), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                
                pothole_detected = True
                send_alert(0.99) # Send Data to Server!
            else:
                pothole_detected = False

        # Overlay Info
        cv2.putText(frame, "Road Surface Monitor", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(frame, "Status: Scanning...", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 1)

        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/status')
def get_status():
    global pothole_detected
    return Response(json.dumps({'detected': pothole_detected}), mimetype='application/json')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("Starting Pothole Detector on Port 5002...")
    print(f"Sending alerts to: {API_ENDPOINT}")
    app.run(host='0.0.0.0', port=5002, threaded=True)
