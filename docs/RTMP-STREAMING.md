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

## 🔗 External Resources

- [Node-Media-Server Documentation](https://github.com/illuspas/Node-Media-Server)
- [OBS Studio Documentation](https://obsproject.com/wiki/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [HLS.js Player](https://github.com/video-dev/hls.js/)
- [RTMP Specification](https://www.adobe.com/devnet/rtmp.html)

## 📝 Notes

- **HLS Latency**: 6-10 seconds is normal for HLS protocol
- **RTMP Port**: 1935 is the standard RTMP port
- **Firewall**: Must allow inbound on 1935 and 8000
- **NAT/Router**: Port forwarding required for remote streaming
- **SSL**: RTMPS not supported by node-media-server (use VPN for security)

---

**Last Updated**: December 29, 2025  
**Cyber Goth Neon Edition** 💖✨
