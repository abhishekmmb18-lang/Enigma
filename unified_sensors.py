import threading
import time
import json
import requests
import serial
import smbus
import math
import sys
import board
import busio
import signal
import RPi.GPIO as GPIO
from gpiozero import AngularServo
import adafruit_vl53l0x
import pynmea2
# ==========================================
# I-SARTHI: UNIFIED SENSOR SYSTEM
# ==========================================

# --- Global Configuration ---
SERVER_IP = "http://10.137.73.214:5000" # CHANGE THIS TO YOUR LAPTOP IP
# SERVER_IP = "http://localhost:5000" # Use this if server is ALSO on the Pi

ENDPOINTS = {
    "alcohol": f"{SERVER_IP}/api/alcohol",
    "location": f"{SERVER_IP}/api/location",
    "radar": f"{SERVER_IP}/api/radar",
    "vibration": f"{SERVER_IP}/api/vibration",
    "gsm": f"{SERVER_IP}/api/gsm-status",
    "sos": f"{SERVER_IP}/api/sos"
}

# --- Pin Definitions ---
ALCOHOL_PIN = 26        # GPIO 26 (Physical Pin 37)
SERVO_PIN = 6           # GPIO 6 (Physical Pin 31)
GPS_PORT = "/dev/ttyAMA5" # UART5
GSM_PORT = "/dev/serial0" # UART0
I2C_BUS = 1

# --- Global Flags ---
RUNNING = True

# ==========================================
# 1. ALCOHOL MONITOR (MQ-3)
# ==========================================
def run_alcohol_monitor():
    print("🍺 [Alcohol] Starting Monitor on GPIO", ALCOHOL_PIN)
    GPIO.setup(ALCOHOL_PIN, GPIO.IN)
    
    while RUNNING:
        try:
            # LOW (0) = Alcohol Detected; HIGH (1) = Clean
            # Standard Logic: LED ON = LOW = DETECTED
            is_alcohol = GPIO.input(ALCOHOL_PIN) == 0 
            
            val = 90.0 if is_alcohol else 5.0
            
            try:
                requests.post(ENDPOINTS["alcohol"], json={'value': val}, timeout=0.5)
            except:
                pass

            # Heartbeat print for Alcohol (every ~5 seconds)
            if int(time.time()) % 5 == 0:
                state = "DETECTED" if is_alcohol else "CLEAR"
                print(f"🍺 Alcohol Sensor: {state} (GPIO {ALCOHOL_PIN})")
                
        except Exception as e:
            print(f"❌ [Alcohol] Error: {e}")
            
        time.sleep(1)

# ==========================================
# 2. GPS TRACKER (NEO-7M)
# ==========================================
def run_gps_tracker():
    print(f"📡 [GPS] Starting Tracker on {GPS_PORT}")
    try:
        ser = serial.Serial(GPS_PORT, 9600, timeout=1)
    except Exception as e:
        print(f"❌ [GPS] Failed to open serial: {e}")
        return

    while RUNNING:
        try:
            line = ser.readline().decode('utf-8', errors='ignore')
            if "$GPRMC" in line:
                try:
                    msg = pynmea2.parse(line)
                    if msg.status == 'A':
                        lat = msg.latitude
                        lon = msg.longitude
                        speed = float(msg.spd_over_grnd) * 1.852 # Knots to km/h
                        
                        payload = {'latitude': lat, 'longitude': lon, 'speed': speed}
                        requests.post(ENDPOINTS["location"], json=payload, timeout=0.5)
                        # print(f"📍 [GPS] {lat:.5f}, {lon:.5f}")
                except pynmea2.ParseError:
                    pass
        except Exception as e:
            print(f"❌ [GPS] Error: {e}")
            time.sleep(1)
            
    ser.close()

# ==========================================
# 3. RADAR SYSTEM (LiDAR + Servo)
# ==========================================
def run_radar_system():
    print("🦇 [Radar] Starting LiDAR + Servo...")
    
    # Setup I2C LiDAR
    try:
        i2c = busio.I2C(board.SCL, board.SDA)
        vl53 = adafruit_vl53l0x.VL53L0X(i2c)
    except Exception as e:
        print(f"❌ [Radar] LiDAR Init Failed: {e}")
        return

    # Setup Servo
    try:
        servo = AngularServo(SERVO_PIN, min_angle=0, max_angle=180, min_pulse_width=0.0005, max_pulse_width=0.0025)
    except Exception as e:
        print(f"❌ [Radar] Servo Init Failed: {e}")
        servo = None

    def scan_sweep(start, end, step):
        for angle in range(start, end, step):
            if not RUNNING: break
            
            if servo: servo.angle = angle
            time.sleep(0.05) # Settle time
            
            try:
                dist_mm = vl53.range
                dist_cm = dist_mm / 10.0
                
                requests.post(ENDPOINTS["radar"], json={'angle': angle, 'distance': int(dist_cm)}, timeout=0.05)
            except:
                pass

    while RUNNING:
        try:
            scan_sweep(0, 181, 5)   # 0 to 180
            scan_sweep(180, -1, -5) # 180 to 0
        except Exception as e:
            print(f"❌ [Radar] Loop Error: {e}")
            time.sleep(1)

# ==========================================
# 4. VIBRATION MONITOR (Dual MPU6050)
# ==========================================
def run_vibration_monitor():
    print("〰️ [Vibration] Starting Dual MPU6050...")
    
    ADDR_L = 0x68
    ADDR_R = 0x69
    bus = smbus.SMBus(1)
    
    def mpu_init(addr):
        try:
            bus.write_byte_data(addr, 0x19, 7)
            bus.write_byte_data(addr, 0x6B, 1)
            return True
        except:
            return False

    l_ok = mpu_init(ADDR_L)
    r_ok = mpu_init(ADDR_R)
    
    if not l_ok and not r_ok:
        print("❌ [Vibration] No MPUs found!")
        return

    def read_accel(addr):
        try:
            h = bus.read_byte_data(addr, 0x3B)
            l = bus.read_byte_data(addr, 0x3C)
            val = (h << 8) | l
            if val > 32768: val -= 65536
            return val
        except:
            return 0

    last_L, last_R = 0, 0

    while RUNNING:
        try:
            curr_L = read_accel(ADDR_L) if l_ok else 0
            curr_R = read_accel(ADDR_R) if r_ok else 0
            
            delta_L = abs(curr_L - last_L)
            delta_R = abs(curr_R - last_R)
            
            last_L, last_R = curr_L, curr_R
            
            # Normalize 0-1
            norm_L = min(delta_L / 10000.0, 1.0)
            norm_R = min(delta_R / 10000.0, 1.0)
            
            payload = {
                'left': norm_L, 
                'right': norm_R,
                'raw_left': delta_L,
                'raw_right': delta_R,
                'sos_alert': 0
            }
            
            try:
                requests.post(ENDPOINTS["vibration"], json=payload, timeout=0.1)
            except:
                pass
            
            
            # Heartbeat print (every ~2 seconds) to show sensor is alive
            if int(time.time() * 10) % 20 == 0:
                 print(f"〰️ Vib Check: L={delta_L} R={delta_R}")
                
            time.sleep(0.1)
            
        except Exception as e:
            print(f"❌ [Vibration] Error: {e}")
            time.sleep(1)

# ==========================================
# 5. GSM SERVICE (A7670C)
# ==========================================
# --- Global Flags ---
RUNNING = True
SOS_TRIGGERED = False # Global flag for thread communication
EMERGENCY_CONTACT = None # Will be fetched from server

def fetch_emergency_contact():
    global EMERGENCY_CONTACT
    try:
        res = requests.get(f"{SERVER_IP}/api/profile", timeout=2)
        if res.status_code == 200:
            data = res.json()
            if 'emergency_contact' in data and data['emergency_contact']:
                EMERGENCY_CONTACT = data['emergency_contact']
                print(f"📞 Loaded Emergency Contact: {EMERGENCY_CONTACT}")
    except:
        print("⚠️ Failed to fetch profile from server")

# ==========================================
# 5. GSM SERVICE (A7670C)
# ==========================================
def run_gsm_service():
    print(f"📶 [GSM] Starting Service on {GSM_PORT}")
    fetch_emergency_contact() # Fetch on start
    
    try:
        ser = serial.Serial(GSM_PORT, 115200, timeout=1)
        ser.write(b'AT\r')
        time.sleep(0.5)
        ser.read_all()
        
        # Setup Text Mode
        ser.write(b'AT+CMGF=1\r')
        time.sleep(0.5)
        if "OK" in ser.read_all().decode():
            print("✅ [GSM] Ready for SMS")
            try:
                requests.post(ENDPOINTS["gsm"], json={'connected': True}, timeout=1)
            except:
                pass
        else:
            print("⚠️ [GSM] Text Mode Failed")
            requests.post(ENDPOINTS["gsm"], json={'connected': False}, timeout=1)

    except Exception as e:
        print(f"❌ [GSM] Init Error: {e}")
        try:
            requests.post(ENDPOINTS["gsm"], json={'connected': False}, timeout=1)
        except:
            pass
        return

    global SOS_TRIGGERED
    
    def send_sms(phone, msg):
        print(f"📨 Sending SMS to {phone}...")
        try:
            cmd = f'AT+CMGS="{phone}"\r'
            ser.write(cmd.encode())
            time.sleep(1)
            ser.write(msg.encode())
            ser.write(bytes([26])) # Ctrl+Z
            time.sleep(5)
            
            # Read Response
            resp = ser.read_all().decode('utf-8', errors='ignore')
            print(f"📠 GSM Response:\n{resp}")
            
            if "ERROR" in resp:
                print("❌ SMS Failed (Modem returned ERROR)")
            else:
                print("✅ SMS Request Sent")
                
        except Exception as e:
            print(f"❌ SMS Failed: {e}")

    while RUNNING:
        if SOS_TRIGGERED:
            if EMERGENCY_CONTACT:
                msg = "🆘 ALERT: Crash Detected! Location: Check App."
                if hasattr(check_server_commands, "custom_msg"):
                     msg = check_server_commands.custom_msg
                send_sms(EMERGENCY_CONTACT, msg)
                SOS_TRIGGERED = False # Reset flag
            else:
                print("❌ SOS Triggered but NO Emergency Contact saved!")
                SOS_TRIGGERED = False
        
        # Poll for Web-Triggered SOS (Every 3 seconds)
        if int(time.time()) % 3 == 0:
            check_server_commands()

        # Periodically refresh contact info (every 1 min)
        if int(time.time()) % 60 == 0:
            fetch_emergency_contact()
            
        time.sleep(0.5)

def check_server_commands():
    global SOS_TRIGGERED
    global EMERGENCY_CONTACT
    try:
        res = requests.get(f"{SERVER_IP}/api/sos/check", timeout=1)
        data = res.json()
        if data.get('trigger') == True:
            print("🚨 Received REMOTE SOS Command from Server!")
            
            # Update Contact if provided by server
            if data.get('target_contact'):
                EMERGENCY_CONTACT = data.get('target_contact')
                print(f"📞 Using Emergency Contact from Server: {EMERGENCY_CONTACT}")

            check_server_commands.custom_msg = data.get('message', "Remote SOS Alert")
            SOS_TRIGGERED = True
    except:
        pass


# ==========================================
# MAIN RUNNER
# ==========================================
def main():
    global RUNNING
    GPIO.setmode(GPIO.BCM)
    
    print("\n🚀 I-SARTHI UNIFIED SENSOR SYSTEM STARTED")
    print(f"📡 Server IP: {SERVER_IP}")
    print("-------------------------------------------")

    # Create Threads
    threads = [
        threading.Thread(target=run_alcohol_monitor, name="Alcohol"),
        threading.Thread(target=run_gps_tracker, name="GPS"),
        threading.Thread(target=run_radar_system, name="Radar"),
        threading.Thread(target=run_vibration_monitor, name="Vibration"),
        threading.Thread(target=run_gsm_service, name="GSM")
    ]

    # Start Threads
    for t in threads:
        t.daemon = True # Daemon threads exit when main program exits
        t.start()
        time.sleep(0.5) # Stagger start

    print("\n✅ All sensors configured. Press Ctrl+C to Stop.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Stopping System...")
        RUNNING = False
        time.sleep(1)
        GPIO.cleanup()
        print("👋 Bye!")

if __name__ == "__main__":
    main()
