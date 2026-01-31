#!/bin/bash
# Livestream clawtank.com to RTMP with software WebGL rendering

RTMP_URL="rtmps://pump-prod-tg2x8veh.rtmp.livekit.cloud/x"
STREAM_KEY="ayQRMQBryVGw"
DISPLAY_NUM=99
RESOLUTION="1920x1080"
FPS=30

# Kill any existing streams
pkill -f "Xvfb :${DISPLAY_NUM}" 2>/dev/null || true
pkill -f "chromium" 2>/dev/null || true
pkill -f "ffmpeg.*livekit" 2>/dev/null || true
sleep 2

# Start virtual framebuffer with more color depth
Xvfb :${DISPLAY_NUM} -screen 0 ${RESOLUTION}x24 +extension GLX &
XVFB_PID=$!
sleep 2

export DISPLAY=:${DISPLAY_NUM}

# Start chromium with software WebGL rendering (SwiftShader)
chromium-browser \
  --no-sandbox \
  --use-gl=swiftshader \
  --enable-webgl \
  --ignore-gpu-blocklist \
  --disable-gpu-driver-bug-workarounds \
  --enable-gpu-rasterization \
  --disable-software-rasterizer \
  --disable-dev-shm-usage \
  --window-size=1920,1080 \
  --window-position=0,0 \
  --kiosk \
  --autoplay-policy=no-user-gesture-required \
  --start-fullscreen \
  --force-device-scale-factor=1 \
  "https://clawtank.com" &
CHROME_PID=$!
sleep 15  # Give more time for WebGL to initialize

# Stream to RTMP using ffmpeg
ffmpeg \
  -f x11grab \
  -video_size ${RESOLUTION} \
  -framerate ${FPS} \
  -i :${DISPLAY_NUM} \
  -c:v libx264 \
  -preset veryfast \
  -maxrate 3000k \
  -bufsize 6000k \
  -pix_fmt yuv420p \
  -g 60 \
  -f flv \
  "${RTMP_URL}/${STREAM_KEY}"

# Cleanup on exit
kill $CHROME_PID 2>/dev/null
kill $XVFB_PID 2>/dev/null
