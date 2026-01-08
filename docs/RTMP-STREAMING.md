# RTMP Ingest Streaming Guide

## 📡 Overview

The **RTMP Ingest Server** allows you to receive live streams FROM streaming software like OBS Studio, vMix, Streamlabs OBS, and output them as HLS for browser playback.

**Key Difference from RTSP:**

- **RTSP**: PULL model - reads FROM IP cameras (you connect to cameras)
- **RTMP**: PUSH model - receives FROM streaming software (broadcasters connect to you)
- Both output HLS for browser compatibility

## ✨ Features

- 🎥 **OBS Studio Integration** - Stream directly from OBS
- 🔑 **Stream Key Validation** - Optional whitelist security
- 📹 **Auto HLS Conversion** - RTMP → HLS transcoding via FFmpeg
- 🌐 **Dual Server Architecture** - RTMP ingest (1935) + HTTP HLS delivery (8000)
- 💾 **Live Recording** - Saves HLS segments to disk
- 🎬 **Event Tracking** - Monitor stream lifecycle (connect, publish, disconnect)

## 🚀 Quick Start

### 1. Enable RTMP in `.env`

```env
# Enable RTMP Ingest Server
RTMP_ENABLED=true
RTMP_PORT=1935                    # RTMP ingest port (standard)
RTMP_HTTP_PORT=8000              # HLS output HTTP server

# Optional: Stream Key Validation
RTMP_VALIDATE_KEYS=false         # Set to true to require valid keys
RTMP_VALID_KEYS=secret,mystream  # Comma-separated valid keys

# Media Storage
RTMP_MEDIA_ROOT=./BRANDIFICATION

# FFmpeg Path
FFMPEG_PATH=ffmpeg               # Or full path: C:/ffmpeg/bin/ffmpeg.exe
```

### 2. Start the Server

```bash
npm start
```

You'll see:

```
📡 RTMP Ingest Server running on port 1935
🌐 HLS HTTP Server running on port 8000
📺 Stream to: rtmp://localhost:1935/live/{YOUR_STREAM_KEY}
🎬 Watch HLS at: http://localhost:8000/live/{YOUR_STREAM_KEY}/index.m3u8
```

### 3. Configure OBS Studio

#### Settings → Stream

- **Service**: Custom
- **Server**: `rtmp://localhost:1935/live`
- **Stream Key**: `mystreamkey` (any key you want)

#### Settings → Output

- **Output Mode**: Advanced
- **Encoder**: x264 (or hardware encoder)
- **Bitrate**: 2500 Kbps (adjust based on network)
- **Keyframe Interval**: 2 seconds

### 4. Start Streaming!

1. Click **Start Streaming** in OBS
2. Watch at: `http://localhost:8000/live/mystreamkey/index.m3u8`
3. Use in browser with HLS.js or native video player

## 📚 API Reference

### Get Active Streams

```http
GET /api/rtmp/streams
```

**Response:**

```json
{
  "streams": [
    {
      "streamKey": "mystreamkey",
      "app": "live",
      "name": "mystreamkey",
      "startTime": "2025-12-29T10:30:00.000Z",
      "uptime": 3600,
      "playlistUrl": "/live/mystreamkey/index.m3u8"
    }
  ],
  "count": 1
}
```

### Get Stream URLs

```http
GET /api/rtmp/url/:streamKey
```

**Response:**

```json
{
  "streamKey": "mystreamkey",
  "rtmpUrl": "rtmp://localhost:1935/live/mystreamkey",
  "hlsUrl": "http://localhost:8000/live/mystreamkey/index.m3u8",
  "obsSettings": {
    "server": "rtmp://localhost:1935/live",
    "streamKey": "mystreamkey"
  }
}
```

## 🎬 Frontend Integration

### HTML5 Video Player

```html
<video id="live-stream" controls autoplay></video>

<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script>
  const video = document.getElementById("live-stream");
  const streamUrl = "http://localhost:8000/live/mystreamkey/index.m3u8";

  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play();
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    // Native HLS support (Safari)
    video.src = streamUrl;
    video.addEventListener("loadedmetadata", () => {
      video.play();
    });
  }
</script>
```

### React Component (Already Integrated)

The RTMP streams appear automatically in the **Streams tab** of the app:

```javascript
// Already implemented in App.js
const streams = rtmpServer.getActiveStreams();
// Displays with RTMP type badge in UI
```

## 🔒 Stream Key Validation

### Enable Validation

```env
RTMP_VALIDATE_KEYS=true
RTMP_VALID_KEYS=secret123,mystream,brandynette
```

### Usage

- **Valid stream keys**: `secret123`, `mystream`, `brandynette`
- **Invalid keys**: Rejected during `prePublish` event
- **Security**: Prevents unauthorized users from streaming

### API Management (Future Enhancement)

Currently managed via `.env` file. Future version will include:

- Web UI for managing keys
- Dynamic key generation
- Expiring keys with TTL

## 🏗️ Architecture

```
OBS Studio (Broadcaster)
        ↓
   RTMP Push (port 1935)
        ↓
  Node-Media-Server
        ↓
  FFmpeg Transcoding
        ↓
  HLS Segments + Playlist
        ↓
  HTTP Server (port 8000)
        ↓
  Browser (HLS.js Player)
```

### File Structure

```
BRANDIFICATION/
└── live/                        # Auto-generated HLS output
    └── mystreamkey/
        ├── index.m3u8           # Playlist file
        ├── segment_001.ts       # Video segment 1
        ├── segment_002.ts       # Video segment 2
        └── segment_003.ts       # Video segment 3 (rolling window)
```

### HLS Configuration

- **Segment Duration**: 2 seconds (`hls_time=2`)
- **Playlist Size**: 3 segments (`hls_list_size=3`)
- **Auto-cleanup**: Old segments deleted (`hls_flags=delete_segments`)
- **Keep Segments**: Enabled for replay (`hlsKeep=true`)

## 🔍 Troubleshooting

### Stream Won't Start

**Check FFmpeg:**

```bash
ffmpeg -version
```

**Check ports in use:**

```bash
# Windows
netstat -ano | findstr :1935
netstat -ano | findstr :8000

# Linux
lsof -i :1935
lsof -i :8000
```

**Enable debug logging:**

```env
DEBUG_RTMP=true
```

### OBS Connection Failed

1. **Firewall**: Allow ports 1935 and 8000
2. **Server URL**: Must end with `/live` (e.g., `rtmp://localhost:1935/live`)
3. **Stream Key**: Can be anything if validation disabled
4. **Network**: Check if server is reachable (ping localhost)

### Poor Stream Quality

**Increase bitrate in OBS:**

- Settings → Output → Bitrate: 4000-6000 Kbps

**Better encoder:**

- Use hardware encoder (NVENC, QuickSync, AMF)
- Settings → Output → Encoder: NVIDIA NVENC H.264

**Network Issues:**

- Reduce resolution to 720p
- Lower framerate to 30fps
- Check upload bandwidth

### High CPU Usage

**Use hardware encoding:**

- OBS: Enable NVENC/QuickSync/AMF encoder
- Reduces CPU load by 50-70%

**Lower resolution:**

- Stream at 720p instead of 1080p
- Reduces transcoding overhead

### Playback Latency

**Normal latency**: 6-10 seconds (HLS limitation)

**Reduce latency:**

- Decrease segment duration: `hls_time=1`
- Use WebRTC for <1 second latency (future enhancement)

## 🎯 Use Cases

### Live Gaming Streams

- Stream gameplay from OBS directly to your server
- No third-party platform needed
- Full control over content

### Remote Broadcasting

- Accept streams from remote locations
- Multiple broadcasters to same server
- Different stream keys for each broadcaster

### Private Live Events

- Stream private events to select viewers
- Stream key validation for security
- No public platform restrictions

### Security Cameras (Alternative to RTSP)

- Use IP cameras with RTMP output
- Some cameras support both RTSP and RTMP
- Choose based on your needs

## 🚀 Advanced Configuration

### Custom RTMP Application

```javascript
// server.js
const rtmpConfig = {
  trans: {
    tasks: [
      {
        app: "private", // Custom app: rtmp://server/private/key
        hls: true,
        hlsFlags: "[hls_time=4:hls_list_size=5]",
      },
      {
        app: "live", // Public app: rtmp://server/live/key
        hls: true,
        hlsFlags: "[hls_time=2:hls_list_size=3]",
      },
    ],
  },
};
```

### Multiple Quality Outputs

```javascript
tasks: [
  {
    app: "live",
    hls: true,
    hlsFlags: "[hls_time=2:hls_list_size=3]",
    // Add multiple outputs (future enhancement)
  },
];
```

## 📊 Performance

**Single 1080p30 Stream:**

- CPU: ~5-10% (hardware encoding in OBS)
- Memory: ~150-200 MB
- Bandwidth: ~3-5 Mbps upload (from OBS)
- Latency: 6-10 seconds (HLS standard)

**Multiple Streams (3x 720p30):**

- CPU: ~15-25%
- Memory: ~400-600 MB
- Bandwidth: ~6-12 Mbps total
- Concurrent viewers: Unlimited (HLS cached)

## 🌐 Production Deployment - brandynette.xxx

### Real-World Scenario

You're deploying RTMP streaming for **brandynette.xxx** on a VPS. Viewers watch at `https://brandynette.xxx`, while streamers push RTMP to port 1935.

### Server Architecture

```
                                    ┌─────────────────────────────────┐
                                    │        brandynette.xxx VPS      │
                                    │                                 │
┌─────────────┐                     │  ┌───────────────────────────┐  │
│ OBS Studio  │──RTMP:1935──────────┼─►│   Node-Media-Server       │  │
│ (Streamer)  │                     │  │   (RTMP Ingest + FFmpeg)  │  │
└─────────────┘                     │  └───────────┬───────────────┘  │
                                    │              │                  │
                                    │              ▼ HLS segments     │
                                    │  ┌───────────────────────────┐  │
                                    │  │   Express Server :7878    │  │
┌─────────────┐                     │  │   (API + Static files)    │  │
│  Viewers    │◄──HTTPS:443─────────┼──│                           │  │
│ (Browsers)  │                     │  └───────────────────────────┘  │
└─────────────┘                     │              ▲                  │
                                    │  ┌───────────┴───────────────┐  │
                                    │  │   Nginx Reverse Proxy     │  │
                                    │  │   (SSL + port 443/1935)   │  │
                                    │  └───────────────────────────┘  │
                                    └─────────────────────────────────┘
```

### Step 1: Server Setup (Ubuntu/Debian VPS)

```bash
# SSH into your VPS
ssh zathras@brandynette.xxx

# Install dependencies
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx ffmpeg

# Clone repository
cd /home/brandynette/web
git clone https://github.com/HarleyVader/js-brandynette-xxx-filehost.git
cd js-brandynette-xxx-filehost

# Install Node.js 20+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install dependencies
npm install
```

### Step 2: Production `.env` Configuration

```env
# /home/brandynette/web/js-brandynette-xxx-filehost/.env

# Server
PORT=7878
NODE_ENV=production

# RTMP Streaming - PRODUCTION
RTMP_ENABLED=true
RTMP_PORT=1935
RTMP_HTTP_PORT=8000

# SECURITY: Enable stream key validation!
RTMP_VALIDATE_KEYS=true
RTMP_VALID_KEYS=brandynette_secret_2025,vip_streamer_key,backup_stream

# Storage
RTMP_MEDIA_ROOT=./BRANDIFICATION

# FFmpeg (Ubuntu default path)
FFMPEG_PATH=/usr/bin/ffmpeg

# RTSP (optional - for IP cameras)
RTSP_ENABLED=false
```

### Step 3: Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/brandynette.xxx`:

```nginx
# HTTPS for web traffic
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name brandynette.xxx www.brandynette.xxx;

    # SSL certificates (Certbot will manage these)
    ssl_certificate /etc/letsencrypt/live/brandynette.xxx/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/brandynette.xxx/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Main app - Express server
    location / {
        proxy_pass http://127.0.0.1:7878;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # HLS streams - served by node-media-server
    location /live/ {
        proxy_pass http://127.0.0.1:8000/live/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        
        # CORS for HLS.js
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, OPTIONS';
        
        # Cache HLS segments briefly
        proxy_cache_valid 200 1s;
    }

    # Video streaming - large file support
    location /videos/ {
        proxy_pass http://127.0.0.1:7878/videos/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Range $http_range;
        proxy_set_header If-Range $http_if_range;
        proxy_buffering off;
        proxy_request_buffering off;
    }
}

# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name brandynette.xxx www.brandynette.xxx;
    return 301 https://$server_name$request_uri;
}

# RTMP passthrough (stream module - separate config)
# See Step 4 for RTMP stream configuration
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/brandynette.xxx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Nginx RTMP Stream Passthrough

Edit `/etc/nginx/nginx.conf` to add stream module at the END (outside http block):

```nginx
# Add at the BOTTOM of nginx.conf, after the http {} block

stream {
    # RTMP passthrough to Node-Media-Server
    upstream rtmp_backend {
        server 127.0.0.1:1935;
    }

    server {
        listen 1935;
        listen [::]:1935;
        proxy_pass rtmp_backend;
        proxy_timeout 3s;
        proxy_connect_timeout 1s;
    }
}
```

Reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d brandynette.xxx -d www.brandynette.xxx

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### Step 6: Firewall Configuration

```bash
# Allow required ports
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP (redirects to HTTPS)
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 1935/tcp    # RTMP ingest

# Enable firewall
sudo ufw enable
sudo ufw status
```

### Step 7: Systemd Service

The `filehost.service` is already configured. Install it:

```bash
sudo cp filehost.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable filehost
sudo systemctl start filehost

# Check status
sudo systemctl status filehost
journalctl -u filehost -f  # Live logs
```

### Step 8: OBS Studio Configuration (Streamer's PC)

#### Stream Settings

| Setting | Value |
|---------|-------|
| Service | Custom |
| Server | `rtmp://brandynette.xxx/live` |
| Stream Key | `brandynette_secret_2025` |

#### Output Settings (Recommended)

| Setting | Value |
|---------|-------|
| Output Mode | Advanced |
| Encoder | x264 or NVENC |
| Bitrate | 4000-6000 Kbps |
| Keyframe Interval | 2 seconds |
| Profile | high |
| Tune | zerolatency |

#### Video Settings

| Setting | Value |
|---------|-------|
| Base Resolution | 1920x1080 |
| Output Resolution | 1920x1080 or 1280x720 |
| FPS | 30 or 60 |

### Step 9: Viewer Access

**Watch URL:** `https://brandynette.xxx`

The stream appears automatically in the **Streams tab** when active.

**Direct HLS URL:** `https://brandynette.xxx/live/brandynette_secret_2025/index.m3u8`

### Production URLs Summary

| Purpose | URL |
|---------|-----|
| Website | `https://brandynette.xxx` |
| RTMP Ingest (OBS) | `rtmp://brandynette.xxx/live` |
| HLS Playback | `https://brandynette.xxx/live/{stream_key}/index.m3u8` |
| API - Active Streams | `https://brandynette.xxx/api/rtmp/streams` |
| API - Stream URLs | `https://brandynette.xxx/api/rtmp/url/{stream_key}` |

### Security Checklist

- [x] **Stream key validation enabled** (`RTMP_VALIDATE_KEYS=true`)
- [x] **Strong stream keys** (random strings, not guessable)
- [x] **HTTPS enforced** (HTTP redirects to HTTPS)
- [x] **Firewall configured** (only ports 22, 80, 443, 1935 open)
- [x] **SSL certificates** (Let's Encrypt auto-renewal)
- [ ] **VPN for RTMP** (optional - for encrypted RTMP if needed)

### Monitoring & Maintenance

```bash
# Check service status
sudo systemctl status filehost

# View live logs
journalctl -u filehost -f

# Check active streams via API
curl https://brandynette.xxx/api/rtmp/streams

# Check disk usage (HLS segments)
du -sh /home/brandynette/web/js-brandynette-xxx-filehost/BRANDIFICATION/live/

# Restart service
sudo systemctl restart filehost

# Update application
cd /home/brandynette/web/js-brandynette-xxx-filehost
git pull
npm install
sudo systemctl restart filehost
```

### Troubleshooting Production

**OBS can't connect:**
```bash
# Check if RTMP port is listening
sudo netstat -tlnp | grep 1935

# Check firewall
sudo ufw status

# Check nginx stream module
nginx -V 2>&1 | grep stream
```

**Stream not appearing in UI:**
```bash
# Check server logs
journalctl -u filehost -f

# Verify HLS output exists
ls -la BRANDIFICATION/live/
```

**High latency (>15 seconds):**
- Reduce `hls_time` to 1 second in RTMP config
- Check server CPU/bandwidth
- Use hardware encoding in OBS

## 🎛️ HestiaCP Deployment - brandynette.xxx

For servers running **HestiaCP** control panel (recommended for production), follow this guide instead of the raw nginx setup above.

### HestiaCP Architecture

```
                                    ┌─────────────────────────────────┐
                                    │     brandynette.xxx (HestiaCP)  │
                                    │                                 │
┌─────────────┐                     │  ┌───────────────────────────┐  │
│ OBS Studio  │──RTMP:1935──────────┼─►│   Node-Media-Server       │  │
│ (Streamer)  │                     │  │   (Worker Thread)         │  │
└─────────────┘                     │  └───────────┬───────────────┘  │
                                    │              │                  │
                                    │              ▼ HLS :8000        │
                                    │  ┌───────────────────────────┐  │
                                    │  │   Express Server :7878    │  │
┌─────────────┐                     │  │   /home/brandynette/web/  │  │
│  Viewers    │◄──HTTPS:443─────────┼──│   brandynette.xxx/nodeapp │  │
│ (Browsers)  │                     │  └───────────────────────────┘  │
└─────────────┘                     │              ▲                  │
                                    │  ┌───────────┴───────────────┐  │
                                    │  │   HestiaCP Nginx Proxy    │  │
                                    │  │   (nodeapp-rtmp template) │  │
                                    │  └───────────────────────────┘  │
                                    └─────────────────────────────────┘
```

### Step 1: Create Web Domain in HestiaCP

1. Login to HestiaCP: `https://brandynette.xxx:8083`
2. **Web** → **Add Web Domain**
3. Domain: `brandynette.xxx`
4. Enable **SSL Support**
5. Enable **Let's Encrypt Support**
6. Save

```bash
# Or via CLI:
v-add-web-domain brandynette brandynette.xxx
v-add-letsencrypt-domain brandynette brandynette.xxx
```

### Step 2: Open RTMP Port in HestiaCP Firewall

**Via Web Panel:**
1. Click **Server** icon (top right) → **Firewall** → **Add Rule**
2. Action: `ACCEPT`
3. Protocol: `TCP`
4. Port: `1935`
5. IP Address: `0.0.0.0/0`
6. Comment: `RTMP Ingest for live streaming`
7. Save

**Via CLI:**
```bash
v-add-firewall-rule ACCEPT 0.0.0.0/0 1935 TCP "RTMP Ingest for live streaming"
v-update-firewall
```

### Step 3: Create Custom Nginx Proxy Template

HestiaCP templates are in `/usr/local/hestia/data/templates/web/nginx/`

**Create HTTP template** (`nodeapp-rtmp.tpl`):
```bash
sudo nano /usr/local/hestia/data/templates/web/nginx/nodeapp-rtmp.tpl
```

```nginx
server {
    listen      %ip%:%proxy_port%;
    server_name %domain_idn% %alias_idn%;
    
    include %home%/%user%/conf/web/%domain%/nginx.forcessl.conf*;

    location / {
        proxy_pass http://127.0.0.1:7878;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /live/ {
        proxy_pass http://127.0.0.1:8000/live/;
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, OPTIONS';
    }

    location /videos/ {
        proxy_pass http://127.0.0.1:7878/videos/;
        proxy_set_header Range $http_range;
        proxy_set_header If-Range $http_if_range;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    location /error/ {
        alias %home%/%user%/web/%domain%/document_errors/;
    }

    include %home%/%user%/conf/web/%domain%/nginx.conf_*;
}
```

**Create HTTPS template** (`nodeapp-rtmp.stpl`):
```bash
sudo nano /usr/local/hestia/data/templates/web/nginx/nodeapp-rtmp.stpl
```

```nginx
server {
    listen      %ip%:%proxy_ssl_port% ssl;
    server_name %domain_idn% %alias_idn%;

    ssl_certificate     %ssl_pem%;
    ssl_certificate_key %ssl_key%;
    ssl_stapling        on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Main app proxy
    location / {
        proxy_pass http://127.0.0.1:7878;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for streaming
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # HLS streams from RTMP server
    location /live/ {
        proxy_pass http://127.0.0.1:8000/live/;
        proxy_http_version 1.1;
        
        # CORS for HLS.js
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, OPTIONS';
        add_header Cache-Control "no-cache";
    }

    # Video streaming with HTTP Range support
    location /videos/ {
        proxy_pass http://127.0.0.1:7878/videos/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Range $http_range;
        proxy_set_header If-Range $http_if_range;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    location /error/ {
        alias %home%/%user%/web/%domain%/document_errors/;
    }

    include %home%/%user%/conf/web/%domain%/nginx.ssl.conf_*;
}
```

### Step 4: Apply Template to Domain

**Via Web Panel:**
1. **Web** → **brandynette.xxx** → **Edit**
2. Scroll to **Proxy Template**
3. Select: `nodeapp-rtmp`
4. Save

**Via CLI:**
```bash
v-change-web-domain-proxy-tpl brandynette brandynette.xxx nodeapp-rtmp
v-rebuild-user brandynette
```

### Step 5: Deploy Application

```bash
# Navigate to HestiaCP web directory
cd /home/brandynette/web/brandynette.xxx

# Create nodeapp directory (outside public_html)
mkdir -p nodeapp
cd nodeapp

# Clone repository
git clone https://github.com/HarleyVader/js-brandynette-xxx-filehost.git .

# Install dependencies
npm install

# Copy and configure .env
cp .env.example .env
nano .env
```

**Production `.env` for HestiaCP:**
```env
PORT=7878
NODE_ENV=production

RTMP_ENABLED=true
RTMP_PORT=1935
RTMP_HTTP_PORT=8000
RTMP_VALIDATE_KEYS=true
RTMP_VALID_KEYS=brandynette_live_2025,vip_streamer_key

RTMP_MEDIA_ROOT=./BRANDIFICATION/Streams
FFMPEG_PATH=/usr/bin/ffmpeg
```

### Step 6: Setup Systemd Service

```bash
# Edit service file for HestiaCP paths
sudo nano /etc/systemd/system/filehost.service
```

```ini
[Unit]
Description=Brandynette FileHost Streaming Server
After=network.target

[Service]
Type=simple
User=brandynette
WorkingDirectory=/home/brandynette/web/brandynette.xxx/nodeapp
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable filehost
sudo systemctl start filehost

# Check status
sudo systemctl status filehost
```

### Step 7: Verify Deployment

```bash
# Check Express server
curl http://127.0.0.1:7878/health

# Check RTMP port
sudo netstat -tlnp | grep 1935

# Check HLS server
curl http://127.0.0.1:8000/

# Check via domain
curl https://brandynette.xxx/api/rtmp/streams
```

### HestiaCP URLs Summary

| Purpose | URL |
|---------|-----|
| HestiaCP Panel | `https://brandynette.xxx:8083` |
| Website | `https://brandynette.xxx` |
| RTMP Ingest (OBS) | `rtmp://brandynette.xxx/live` |
| HLS Playback | `https://brandynette.xxx/live/{stream_key}/index.m3u8` |
| API Streams | `https://brandynette.xxx/api/rtmp/streams` |

### HestiaCP Monitoring Commands

```bash
# View app logs
journalctl -u filehost -f

# HestiaCP nginx logs
tail -f /var/log/nginx/domains/brandynette.xxx.log
tail -f /var/log/nginx/domains/brandynette.xxx.error.log

# Rebuild domain config
v-rebuild-web-domain brandynette brandynette.xxx

# Check HestiaCP firewall rules
v-list-firewall

# Restart nginx via HestiaCP
v-restart-web
```

## 🔗 External Resources

- [Node-Media-Server Documentation](https://github.com/illuspas/Node-Media-Server)
- [OBS Studio Documentation](https://obsproject.com/wiki/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [HLS.js Player](https://github.com/video-dev/hls.js/)
- [RTMP Specification](https://www.adobe.com/devnet/rtmp.html)
- [Nginx Stream Module](https://nginx.org/en/docs/stream/ngx_stream_core_module.html)
- [Let's Encrypt / Certbot](https://certbot.eff.org/)
- [HestiaCP Documentation](https://hestiacp.com/docs/introduction/getting-started.html)
- [HestiaCP Web Templates](https://hestiacp.com/docs/server-administration/web-templates.html)
- [HestiaCP Firewall](https://hestiacp.com/docs/server-administration/firewall.html)

## 📝 Notes

- **HLS Latency**: 6-10 seconds is normal for HLS protocol
- **RTMP Port**: 1935 is the standard RTMP port
- **Firewall**: Must allow inbound on 1935 and 8000
- **NAT/Router**: Port forwarding required for remote streaming
- **SSL**: RTMPS not supported by node-media-server (use VPN for security)
- **Production**: Always enable `RTMP_VALIDATE_KEYS=true` with strong keys

---

**Last Updated**: December 30, 2025  
**Cyber Goth Neon Edition** 💖✨
