#!/bin/bash
# Production Fix Script for brandynette.xxx filehost
# Fixes: ENOENT dist/index.html + EADDRINUSE port 6969

echo "🔧 Fixing brandynette.xxx filehost issues..."

# Step 1: Kill zombie process on port 6969
echo "📍 Finding process on port 6969..."
ZOMBIE_PID=$(lsof -ti:6969)
if [ ! -z "$ZOMBIE_PID" ]; then
  echo "⚠️  Found zombie process: $ZOMBIE_PID"
  kill -9 $ZOMBIE_PID
  echo "✅ Killed zombie process"
else
  echo "✅ Port 6969 is free"
fi

# Step 2: Stop the service completely
echo "🛑 Stopping filehost service..."
systemctl stop filehost

# Wait for cleanup
sleep 2

# Step 3: Verify port is free
if lsof -ti:6969 > /dev/null; then
  echo "❌ Port still in use! Force killing..."
  pkill -9 -f "node.*server.js"
  sleep 2
fi

# Step 4: Navigate to project directory
cd /home/brandynette/web/brandynette.xxx/nodeapp/js-brandynette-xxx-filehost

# Step 5: Pull latest changes (server.js fix)
echo "📥 Pulling latest code..."
git pull origin css

# Step 6: Verify public/index.html exists
if [ -f "public/index.html" ]; then
  echo "✅ public/index.html found"
else
  echo "❌ ERROR: public/index.html missing!"
  exit 1
fi

# Step 7: Start service
echo "🚀 Starting filehost service..."
systemctl start filehost

# Step 8: Check status
sleep 2
systemctl status filehost --no-pager

echo ""
echo "📊 Checking logs..."
journalctl -u filehost -n 20 --no-pager

echo ""
echo "✅ Fix complete! Service should be running on port 6969"
