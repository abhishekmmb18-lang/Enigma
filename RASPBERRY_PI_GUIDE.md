# 🍓 I-SARTHI: Fresh Start Guide (Raspberry Pi)

Follow these steps exactly to get your system up and running from scratch.

---

## ✅ Step 1: Preparation (Hardware)

1.  **Flash OS:** Use Raspberry Pi Imager to install **Raspberry Pi OS (64-bit)**.
2.  **Enable Interfaces:**
    *   Run `sudo raspi-config`
    *   Enable **SSH, I2C, Serial Port**.
3.  **Configure `config.txt`:**
    *   Run: `sudo nano /boot/firmware/config.txt`
    *   Add at bottom:
        ```ini
        dtoverlay=uart5
        dtparam=i2c_arm=on
        ```
4.  **Disable Console on UART0:**
    *   Run: `sudo nano /boot/firmware/cmdline.txt`
    *   Delete the text part: `console=serial0,115200`
    *   Save & Reboot (`sudo reboot`).

---

## ✅ Step 2: Automated Installation (Software)

The files I generated are on your **Laptop**. We need to get them to your **Raspberry Pi**. The easiest way is to copy-paste the code.

1.  **Create the Setup Script (On Raspberry Pi):**
    *   Open your Raspberry Pi terminal (SSH or Desktop).
    *   You are already in the "Home" folder (`/home/pi`).
    *   Run: `nano setup_pi.sh`
    *   **Open `setup_pi.sh` on your Laptop**, copy all the code, and **Paste** it into the Pi terminal.
    *   Save & Exit: Press `Ctrl+X`, then `Y`, then `Enter`.

2.  **Create the Sensor Code (On Raspberry Pi):**
    *   Run: `nano unified_sensors.py`
    *   **Open `unified_sensors.py` on your Laptop**, copy all the code, and **Paste** it into the Pi terminal.
    *   Save & Exit: `Ctrl+X`, then `Y`, then `Enter`.

3.  **Create the Vibration Test Script (Optional, for debugging):**
    *   Run: `nano test_vibration.py`
    *   **Open `test_vibration.py` on your Laptop**, copy the code, and **Paste** it into the Pi.
    *   Save & Exit.

4.  **Create the GSM Test Script (Optional):**
    *   Run: `nano test_gsm.py`
    *   **Paste code** from your laptop.
    *   Save & Exit.

5.  **Run the Setup Script:**
    *   Run:
    ```bash
    chmod +x setup_pi.sh
    ./setup_pi.sh
    ```
    *This will automatically install all system updates, build tools, and Python libraries for you.*

---

## ✅ Step 3: Run the System

1.  **Start the Server [ON YOUR LAPTOP]:**
    *   Open terminal in `server/` folder.
    *   Run: `npm run dev`

2.  **Start Sensors [ON RASPBERRY PI]:**
    *   Open terminal on Pi.
    *   Run:
    ```bash
    source isarthi_env/bin/activate
    python unified_sensors.py
    ```

You should see: `✅ All sensors configured`.

---

## 🛠️ Troubleshooting

*   **"Address already in use"**: The script is already running. Press `Ctrl+C` to stop it.
*   **"Connection refused"**: Check `SERVER_IP` in `unified_sensors.py`   matches your laptop's IP.
*   **"No module named..."**: Run `./setup_pi.sh` again to fix missing libraries.
*   **"File is unwritable"**: This means you created the file with `sudo`. To fix:
    1.  Exit nano (`Ctrl+X`).
    2.  Run: `sudo rm setup_pi.sh`
    3.  Run: `nano setup_pi.sh` (Without sudo!)

---

## 🛠️ Detailed Troubleshooting (For Errors in Logs)

### 1. ❌ `Error: Read timed out` or `ConnectionPool`
*   **Cause:** The Raspberry Pi is trying to send data to the wrong IP address (`10.137.73.214`).
*   **Fix:**
    1.  Run `ipconfig` on your **Laptop** to get your Wi-Fi IPv4 Address.
    2.  Edit the script on Pi: `nano unified_sensors.py`
    3.  Change `SERVER_IP` to your Laptop's IP.
    4.  Save and restart.

### 2. ❌ `[GPS] No such file or directory: '/dev/ttyAMA5'`
*   **Cause:** The UART5 port is not enabled.
*   **Fix:**
    1.  Open config: `sudo nano /boot/firmware/config.txt`
    2.  Make sure this line is at the bottom: `dtoverlay=uart5`
    3.  **REBOOT IS REQUIRED:** Run `sudo reboot`.

### 3. ❌ `[Radar] No I2C device at address: 0x29`
*   **Cause:** The LiDAR sensor is not connected correctly or I2C is disabled.
*   **Fix:**
    1.  Check Wiring: `SDA` to Pin 3, `SCL` to Pin 5, `VCC` to 3.3V/5V, `GND` to GND.
    2.  Run `i2cdetect -y 1`. You should see a number like `29` in the grid. If the grid is empty, check your wires!

### 4. ❌ `[GSM] Module not responding`
*   **Cause:** Wiring is swapped or module is off.
*   **Fix:**
    1.  Check Wiring: Module `TX` -> Pi `RX` (Pin 10), Module `RX` -> Pi `TX` (Pin 8).
    2.  Make sure the GSM module has a separate power supply if needed.
