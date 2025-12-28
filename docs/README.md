# 📚 Brandynette Video Platform Documentation

**Complete documentation for the video streaming platform running on port 7878** 🎀✨

---

## 🎯 Quick Navigation

### 🚀 Getting Started

- [Main README](../README.md) - Project overview and kawaii introduction
- [Quick Start Guide](#quick-start) - Get running in 30 seconds

### 📡 RTSP Live Streaming

- **[RTSP Quick Start](./RTSP-QUICKSTART.md)** - 2-minute setup guide
- **[RTSP Streaming Guide](./RTSP-STREAMING.md)** - Complete RTSP integration documentation
  - FFmpeg configuration
  - Camera setup
  - API reference
  - Troubleshooting

### 🔧 Production & Deployment

- **[Production Fix Guide](./PRODUCTION-FIX.md)** - Troubleshooting production errors
  - ENOENT error fixes
  - Port conflict resolution
  - Deployment scripts

### 🏗️ Architecture

- **[Copilot Instructions](../.github/copilot-instructions.md)** - AI agent codebase guide
  - Architecture patterns
  - CSS system
  - Queue management
  - HTTP streaming

---

## 🌸 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server with auto-restart
npm run dev

# Server runs on http://localhost:7878
```

### Add Videos

Drop `.mp4`, `.webm`, or `.ogg` files into the `BRANDIFICATION/` folder - they appear automatically!

### Enable RTSP Streaming

1. Install FFmpeg: `choco install ffmpeg` (Windows) or `apt install ffmpeg` (Linux)
2. Copy `.env.example` to `.env`
3. Add camera URLs:
   ```env
   RTSP_ENABLED=true
   RTSP_STREAM_1=rtsp://admin:password@192.168.1.100:554/stream1
   RTSP_NAME_1=Front Door Camera
   ```
4. Restart server

---

## 📖 Documentation Index

### Core Features

#### 🎥 Video Streaming

- **File-based hosting** - Videos from `BRANDIFICATION/` folder
- **HTTP Range requests** - Seek/scrub support
- **Browser caching** - Instant replay without re-download
- **Download queue** - 3-5 concurrent downloads max
- **Unlimited viewers** - Cached playback has no concurrency limit

#### 📡 RTSP Live Streaming (NEW)

- **Multiple cameras** - Connect unlimited RTSP sources
- **HLS transcoding** - FFmpeg converts RTSP → HLS for browsers
- **Auto-reconnection** - Automatic recovery from stream failures
- **Quality control** - Configurable resolution, bitrate, codec
- **API management** - Start/stop streams via REST API

#### 🎨 Frontend

- **Zero-build architecture** - React 18 via CDN, Babel browser transpilation
- **Cyber goth aesthetic** - Neon pink/cyan/purple glass morphism
- **Modern CSS** - Cascade layers, design tokens, modular structure
- **Custom video player** - Full controls with seeking support
- **Download status** - Real-time queue monitoring

#### 🔒 Backend

- **Express 4** - ES6 module architecture
- **CORS enabled** - Cross-origin resource sharing
- **Path security** - Traversal attack protection
- **Live file discovery** - No database, reads folder on request
- **Graceful shutdown** - Cleans up RTSP streams on exit

---

## 🏗️ Architecture Overview

```
Client Browser
    ↓
Express Server (port 7878)
    ↓
┌─────────────────┬──────────────────┐
│  File Hosting   │  RTSP Streaming  │
│  (on-demand)    │  (live)          │
└─────────────────┴──────────────────┘
    ↓                    ↓
BRANDIFICATION/      FFmpeg → HLS
    ↓                    ↓
HTTP Range Req      public/streams/
    ↓                    ↓
Browser Cache       HLS.js Player
```

---

## 📁 Project Structure

```
js-brandynette-xxx-filehost/
├── 📄 README.md                    # Kawaii project introduction
├── 📄 package.json                 # Dependencies & scripts
├── 📄 .env.example                 # Configuration template
├── 📚 docs/                        # Documentation (YOU ARE HERE)
│   ├── README.md                   # This file
│   ├── RTSP-STREAMING.md          # RTSP integration guide
│   ├── RTSP-QUICKSTART.md         # Quick RTSP setup
│   └── PRODUCTION-FIX.md          # Production troubleshooting
├── 🎬 BRANDIFICATION/              # Video file storage
├── 🌐 public/                      # Frontend assets
│   ├── index.html                  # React 18 single-file app
│   ├── css/                        # Modular CSS architecture
│   │   ├── layers.css              # Cascade layer definitions
│   │   ├── variables.css           # Design tokens
│   │   ├── reset.css               # CSS reset + base
│   │   ├── layout.css              # Page structure
│   │   ├── components.css          # UI components
│   │   └── features.css            # Feature styles
│   └── streams/                    # RTSP HLS output (auto-generated)
├── 🖥️ src/                         # Backend source
│   ├── server.js                   # Express server
│   └── rtsp-manager.js             # RTSP stream manager
├── ⚙️ .github/                     # GitHub configuration
│   ├── copilot-instructions.md     # AI agent guide
│   └── TODO.md                     # Feature roadmap
└── 🚀 filehost.service             # Systemd service file
```

---

## 🔌 API Reference

### Video Hosting

| Endpoint               | Method | Description                            |
| ---------------------- | ------ | -------------------------------------- |
| `/api/videos`          | GET    | List all videos with metadata          |
| `/videos/:filename`    | GET    | Stream video file (HTTP Range support) |
| `/api/download-status` | GET    | Download queue status                  |
| `/health`              | GET    | Server health check                    |

### RTSP Streaming

| Endpoint                    | Method | Description              |
| --------------------------- | ------ | ------------------------ |
| `/api/streams`              | GET    | List active RTSP streams |
| `/api/streams/:id/start`    | POST   | Start RTSP stream        |
| `/api/streams/:id/stop`     | POST   | Stop RTSP stream         |
| `/api/streams/:id/playlist` | GET    | Get HLS playlist URL     |
| `/streams/:id.m3u8`         | GET    | HLS playlist file        |

---

## 🎨 Styling System

### Color Palette (Cyber Goth)

- **Primary**: `#0c2a2ae6` / `#15aab5e6`
- **Secondary**: `#40002fe6` / `#cc0174e6`
- **Accent**: `#df0471e6` (button color)
- **Neon Glows**: Pink `#ff00ff`, Cyan `#00ffff`, Purple `#8a2be2`

### CSS Architecture

- **Cascade Layers**: reset → base → layout → components → features → utilities
- **Design Tokens**: `variables.css` centralizes all values
- **Glass Morphism**: `backdrop-filter: blur(20px)` with rgba backgrounds

---

## 🔧 Configuration

### Environment Variables

**Server:**

- `PORT` - Server port (default: 7878)
- `NODE_ENV` - Environment mode (development/production)

**RTSP Streaming:**

- `RTSP_ENABLED` - Enable RTSP feature (true/false)
- `RTSP_STREAM_X` - Camera RTSP URL
- `RTSP_NAME_X` - Camera display name
- `FFMPEG_PATH` - FFmpeg binary path
- `STREAM_RESOLUTION` - Output resolution (default: 1280x720)
- `STREAM_BITRATE` - Video bitrate (default: 2000k)

**See [.env.example](../.env.example) for full list**

---

## 🐛 Troubleshooting

### Common Issues

**Server won't start:**

- Check if port 7878 is already in use
- See [PRODUCTION-FIX.md](./PRODUCTION-FIX.md)

**Videos not appearing:**

- Ensure files are in `BRANDIFICATION/` folder
- Check file extensions (mp4, webm, ogg)
- Server auto-discovers files - refresh browser

**RTSP streams not working:**

- Verify FFmpeg installation: `ffmpeg -version`
- Check camera URL accessibility
- Enable debug mode: `DEBUG_RTSP=true`
- See [RTSP-STREAMING.md](./RTSP-STREAMING.md#troubleshooting)

---

## 💖 Contributing

Want to make this even cuter? See [TODO.md](../.github/TODO.md) for planned features:

- Video transcoding
- User authentication
- Storage backends (S3/MinIO)
- Analytics dashboard
- Playlist support

---

## 📜 License

MIT License - Free as in freedom, pink as in perfect! 💕

---

<div align="center">

### 🦌 Made with Love, Sparkles, and Empty Thoughts 🦌

**By [HarleyVader](https://github.com/HarleyVader)** 🎀✨

_"Think pink, think simple, think bambi!"_ 💖

</div>
