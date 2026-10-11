#!/bin/bash
set -e

echo ""
echo "=========================================================="
echo "  Installing Native 80mm ESC/POS Thermal Driver (POS-80)  "
echo "=========================================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/pos80-driver"

echo "[1/4] Installing CUPS development libraries..."
sudo apt-get update -qq
sudo apt-get install -y build-essential cmake libcups2-dev libcupsimage2-dev

echo ""
echo "[2/4] Compiling rastertozj filter for your CPU architecture..."
BUILD_DIR="/tmp/pos80-driver-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

if [ -d "$SOURCE_DIR" ]; then
  cp -r "$SOURCE_DIR"/* "$BUILD_DIR/"
else
  git clone --depth 1 https://github.com/klirichek/zj-58.git "$BUILD_DIR"
fi

cd "$BUILD_DIR"
mkdir -p build && cd build
cmake ..
cmake --build .

echo ""
echo "[3/4] Installing CUPS raster filter and 80mm PPD profile..."
sudo cp rastertozj /usr/lib/cups/filter/
sudo chmod 755 /usr/lib/cups/filter/rastertozj
sudo chown root:root /usr/lib/cups/filter/rastertozj

sudo mkdir -p /usr/share/cups/model/zjiang
sudo cp ../zj80.ppd /usr/share/cups/model/zjiang/
sudo chmod 644 /usr/share/cups/model/zjiang/zj80.ppd

echo ""
echo "[4/4] Activating POS-80 printer in CUPS..."
PRINTER_URI=$(lpstat -v 2>/dev/null | grep -i "POS-80" | head -n 1 | awk '{print $NF}')
if [ -z "$PRINTER_URI" ]; then
  PRINTER_URI="usb://Printer/POS-80?serial=429D76783430"
fi

echo "Connecting to device: $PRINTER_URI"
sudo lpadmin -p POS-80 -E -v "$PRINTER_URI" -P /usr/share/cups/model/zjiang/zj80.ppd -o PageSize=X70MMY297MM -o CutMedia=AfterJob
sudo cupsenable POS-80
sudo cupsaccept POS-80
sudo systemctl restart cups

echo ""
echo "=========================================================="
echo "  SUCCESS! POS-80 Driver Installed & Configured!         "
echo "=========================================================="
echo "The printer is now configured with the proper ESC/POS driver."
echo "You can now click 'Print Receipt Now' in your browser!"
echo "=========================================================="

