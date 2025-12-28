# RTSP Real-Time Streaming Protocol Integration

## 🎥 Overview

Brandynette's Video Platform now supports **RTSP real-time streaming** using FFmpeg to transcode live camera feeds into browser-compatible HLS streams.

## ✨ Features

- 📹 **Multiple RTSP Streams** - Connect multiple IP cameras simultaneously
- 🔄 **Auto-Reconnection** - Automatically reconnects on stream failure
- 🎬 **HLS Transcoding** - Converts RTSP to HLS for browser playback
- ⚙️ **Configurable Quality** - Adjust resolution, bitrate, codec via environment variables
- 🔒 **Credential Management** - Secure RTSP credentials in environment file
- 📊 **Stream Monitoring** - Real-time status and uptime tracking
- 🎛️ **Dynamic Control** - Start/stop streams via API

## 📋 Prerequisites

### FFmpeg Installation

**Windows:**
```powershell
# Download from https://ffmpeg.org/download.html
# Or use chocolatey:
choco install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Verify Installation:**
```bash
ffmpeg -version
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `dotenv` - Environment variable management
- `fluent-ffmpeg` - FFmpeg wrapper for Node.js

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your RTSP camera streams:

```env
# Enable RTSP feature
RTSP_ENABLED=true

# Add your cameras
RTSP_STREAM_1=rtsp://admin:password@192.168.1.100:554/stream1
RTSP_NAME_1=Front Door Camera

RTSP_STREAM_2=rtsp://admin:password@192.168.1.101:554/stream2
RTSP_NAME_2=Backyard Camera

# FFmpeg path (update based on your OS)
FFMPEG_PATH=ffmpeg  # Or full path: C:/ffmpeg/bin/ffmpeg.exe
```

### 3. Start Server

```bash
npm start
```

The server will automatically start transcoding configured RTSP streams on startup.

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RTSP_ENABLED` | `false` | Enable/disable RTSP streaming |
| `RTSP_STREAM_1` | - | RTSP URL for camera 1 |
| `RTSP_NAME_1` | - | Display name for camera 1 |
| `FFMPEG_PATH` | `ffmpeg` | Path to FFmpeg binary |
| `FFMPEG_PRESET` | `ultrafast` | Encoding preset (ultrafast, fast, medium, slow) |
| `FFMPEG_CRF` | `23` | Constant Rate Factor (0-51, lower = better quality) |
| `STREAM_RESOLUTION` | `1280x720` | Output resolution |
| `STREAM_FRAMERATE` | `30` | Output framerate |
| `STREAM_BITRATE` | `2000k` | Video bitrate |
| `STREAM_AUDIO_BITRATE` | `128k` | Audio bitrate |
| `HLS_TIME` | `2` | HLS segment duration (seconds) |
| `HLS_LIST_SIZE` | `3` | Number of segments in playlist |
| `RTSP_RECONNECT_DELAY` | `5000` | Delay before reconnect (ms) |
| `RTSP_MAX_RECONNECT_ATTEMPTS` | `10` | Max reconnection attempts |
| `DEBUG_RTSP` | `false` | Enable FFmpeg debug output |

### Quality Presets

**Low Latency (Default):**
```env
FFMPEG_PRESET=ultrafast
STREAM_RESOLUTION=1280x720
STREAM_BITRATE=2000k
HLS_TIME=2
```

**Balanced:**
```env
FFMPEG_PRESET=fast
STREAM_RESOLUTION=1920x1080
STREAM_BITRATE=4000k
HLS_TIME=4
```

**High Quality:**
```env
FFMPEG_PRESET=medium
STREAM_RESOLUTION=1920x1080
STREAM_BITRATE=6000k
FFMPEG_CRF=20
HLS_TIME=6
```

## 🌐 API Endpoints

### Get Stream Status

```http
GET /api/streams
```

**Response:**
```json
{
  "streams": [
    {
      "id": "stream1",
      "name": "Front Door Camera",
      "status": "active",
      "url": "rtsp://***:***@192.168.1.100:554/stream1",
      "startedAt": "2025-12-28T10:30:00.000Z",
      "uptime": 3600
    }
  ],
  "count": 1
}
```

### Start Stream

```http
POST /api/streams/:streamId/start
Content-Type: application/json

{
  "url": "rtsp://admin:password@192.168.1.100:554/stream1",
  "name": "Front Door Camera"
}
```

**Response:**
```json
{
  "success": true,
  "streamId": "stream1",
  "playlistUrl": "/streams/stream1.m3u8"
}
```

### Stop Stream

```http
POST /api/streams/:streamId/stop
```

**Response:**
```json
{
  "success": true,
  "streamId": "stream1"
}
```

### Get Playlist URL

```http
GET /api/streams/:streamId/playlist
```

**Response:**
```json
{
  "playlistUrl": "/streams/stream1.m3u8"
}
```

## 📺 Frontend Integration

### HLS.js Player Example

```html
<video id="stream-player" controls></video>

<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script>
  const video = document.getElementById('stream-player');
  const playlistUrl = '/streams/stream1.m3u8';
  
  if (Hls.isSupported()) {
    const hls = new Hls();
    hls.loadSource(playlistUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play();
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS support (Safari)
    video.src = playlistUrl;
  }
</script>
```

## 🔍 Troubleshooting

### Stream Won't Start

**Check FFmpeg:**
```bash
ffmpeg -version
```

**Check RTSP URL:**
```bash
ffmpeg -rtsp_transport tcp -i rtsp://admin:password@192.168.1.100:554/stream1 -frames:v 1 test.jpg
```

**Enable Debug Mode:**
```env
DEBUG_RTSP=true
```

### Poor Stream Quality

**Increase Bitrate:**
```env
STREAM_BITRATE=4000k
STREAM_AUDIO_BITRATE=192k
```

**Better Preset:**
```env
FFMPEG_PRESET=fast  # or medium
```

### High CPU Usage

**Reduce Resolution:**
```env
STREAM_RESOLUTION=854x480  # 480p instead of 720p
```

**Faster Preset:**
```env
FFMPEG_PRESET=ultrafast
```

**Lower Framerate:**
```env
STREAM_FRAMERATE=15  # Half of 30fps
```

### Frequent Disconnections

**Increase Reconnect Attempts:**
```env
RTSP_MAX_RECONNECT_ATTEMPTS=20
RTSP_RECONNECT_DELAY=3000
```

**Use TCP Transport:**
FFmpeg automatically uses `-rtsp_transport tcp` for reliability.

## 🏗️ Architecture

```
RTSP Camera → FFmpeg Transcoding → HLS Segments → Browser Player
     ↓              ↓                    ↓              ↓
192.168.1.100  rtsp-manager.js    public/streams/  HLS.js
               (Node.js)          stream1.m3u8
                                  stream1_001.ts
                                  stream1_002.ts
```

### File Structure

```
js-brandynette-xxx-filehost/
├── src/
│   ├── server.js           # Express server with RTSP endpoints
│   └── rtsp-manager.js     # RTSP stream manager class
├── public/
│   └── streams/            # HLS output directory (auto-generated)
│       ├── stream1.m3u8    # Playlist
│       ├── stream1_001.ts  # Video segments
│       └── stream1_002.ts
├── .env                    # Local configuration (DO NOT COMMIT)
├── .env.example            # Template configuration
└── RTSP-STREAMING.md       # This file
```

## 🔒 Security Best Practices

1. **Never commit `.env`** - Credentials should stay local
2. **Use strong passwords** - For RTSP camera authentication
3. **Firewall rules** - Restrict RTSP port access to local network
4. **HTTPS in production** - Encrypt stream delivery
5. **VPN for remote access** - Don't expose cameras to internet

## 📊 Performance Metrics

**Single Stream (720p30):**
- CPU: ~10-15% (ultrafast preset)
- Memory: ~100-150 MB
- Bandwidth: ~2-3 Mbps

**Multiple Streams (3x 720p30):**
- CPU: ~30-45%
- Memory: ~300-450 MB
- Bandwidth: ~6-9 Mbps

## 🎯 Future Enhancements

- [ ] Frontend UI for stream management
- [ ] Stream recording/archival
- [ ] Motion detection alerts
- [ ] Multi-quality adaptive streaming
- [ ] WebRTC for ultra-low latency
- [ ] PTZ (Pan-Tilt-Zoom) camera control
- [ ] Stream analytics dashboard

## 📝 Notes

- HLS has 6-10 second latency (acceptable for monitoring, not real-time)
- Segments auto-delete after playback (`hls_flags=delete_segments`)
- Browser refreshes lose buffered segments (by design for live streams)
- Mobile devices may limit concurrent streams

## 💖 Credits

Built with cyber goth neon love by **HarleyVader** 🎀✨

FFmpeg - https://ffmpeg.org/  
fluent-ffmpeg - https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
