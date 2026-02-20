#!/bin/bash

echo "🍓 I-SARTHI: Automated Setup Script"
echo "-------------------------------------"

# 1. Update System
echo "🔄 Updating System..."
sudo apt update

# 2. Install System Dependencies (including build tools for lgpio)
echo "📦 Installing System Dependencies..."
sudo apt install python3-pip python3-venv python3-dev python3-smbus i2c-tools swig python3-lgpio -y

# 3. Create Virtual Environment
echo "🐍 Setting up Python Virtual Environment..."
if [ ! -d "isarthi_env" ]; then
    python3 -m venv isarthi_env
    echo "   - Virtual Environment Created."
else
    echo "   - Virtual Environment already exists."
fi
# 4. Install Python Libraries
echo "📚 Installing Python Libraries..."
source isarthi_env/bin/activate

# install basic tools first
pip install --upgrade pip

# install sensor libs
pip install requests pyserial smbus spidev RPi.GPIO gpiozero adafruit-circuitpython-vl53l0x pynmea2 rpi-lgpio adafruit-blinka

echo "-------------------------------------"
echo "✅ Setup Complete!"
echo ""
echo "To run the sensors, use this command:"
echo "source isarthi_env/bin/activate && python unified_sensors.py"
echo ""
