# Production Server Fix Instructions

## Problems Detected
1. **ENOENT Error**: Server looking for `/dist/index.html` (doesn't exist - zero-build project)
2. **EADDRINUSE Error**: Port 6969 already in use by zombie process

## Quick Fix (Run on Server)

### Option 1: Automated Fix Script
```bash
# On the production server (xxx.bambisleep.church)
cd /home/brandynette/web/brandynette.xxx/nodeapp/js-brandynette-xxx-filehost
git pull origin css
chmod +x fix-production.sh
sudo ./fix-production.sh
```

### Option 2: Manual Steps

```bash
# 1. Kill zombie process on port 6969
sudo lsof -ti:6969 | xargs kill -9

# 2. Stop the service
sudo systemctl stop filehost

# 3. Navigate to project
cd /home/brandynette/web/brandynette.xxx/nodeapp/js-brandynette-xxx-filehost

# 4. Pull fixed code
git pull origin css

# 5. Verify public/index.html exists
ls -la public/index.html

# 6. Start service
sudo systemctl start filehost

# 7. Check status
sudo systemctl status filehost
sudo journalctl -u filehost -f
```

## What Was Fixed

### server.js Changes
**Before** (BROKEN):
```javascript
app.get("*", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.sendFile(path.join(__dirname, "../dist/index.html")); // ❌ ENOENT
  } else {
    res.sendFile(path.join(__dirname, "../public/index.html"));
  }
});
```

**After** (FIXED):
```javascript
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html")); // ✅ Always public
});
```

**Why**: This is a zero-build project - React/Babel transpile in browser, no dist folder needed.

## Verification

After running the fix, you should see:
```
🚀 Server running on http://localhost:6969
📁 Serving videos from BRANDIFICATION folder
📺 Available videos: [your videos]
```

## Troubleshooting

### If port still in use:
```bash
# Nuclear option - kill ALL node processes
sudo pkill -9 node

# Then restart service
sudo systemctl start filehost
```

### If public/index.html missing:
```bash
# Verify you're on css branch
git branch
git checkout css
git pull origin css
ls -la public/
```

### Check firewall allows port 6969:
```bash
sudo ufw status
sudo ufw allow 6969/tcp
```

## Production URL
After fix, the site should be accessible at:
- https://brandynette.xxx
- http://brandynette.xxx:6969 (if no reverse proxy)
