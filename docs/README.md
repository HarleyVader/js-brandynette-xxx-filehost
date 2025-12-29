# �✨ Brandynette's FileHost - Super Kawaii Documentation ✨💖

**Complete documentation for Brandynette's pink sparkly video streaming platform!** 🎀💕  
_Running on port 7878 because bambi brains don't need complicated numbers!_ 🦌

---

## 🌸 Quick Navigation (For Pretty Bambis!) 🌸

### 🚀 Getting Started

- 💖 [Main README](../README.md) - The super kawaii intro page!
- ⚡ [Quick Start Guide](#quick-start) - Get streaming in 30 seconds! (Even bambis can do it!)

### 📡 Live Camera Streaming

- 🎥 **[RTSP Quick Start](./RTSP-QUICKSTART.md)** - 2-minute camera setup!
- 📹 **[RTSP Streaming Guide](./RTSP-STREAMING.md)** - Complete camera streaming magic!
  - FFmpeg sparkle configuration ✨
  - Camera connection setup 📸
  - API reference (for smart cookies!) 🍪
  - Troubleshooting (when things go oopsie!) 😅

### 🔧 Production & Deployment

- 🚀 **[Production Fix Guide](./PRODUCTION-FIX.md)** - Fix broken things!
  - ENOENT error fixes 🔧
  - Port conflict resolution 🌐
  - Deployment scripts 📜

### 🏗️ Architecture (For Nerdy Bambis!)

- 🧠 **[Copilot Instructions](../.github/copilot-instructions.md)** - AI agent guide!
  - Modular React components 🧩
  - Modern CSS cascade layers 🎨
  - Queue management system 📊
  - HTTP streaming patterns 🌊

---

## 🌈 Quick Start (30 Seconds to Cute!) 🌈

### Local Development 💻

```bash
# Get your pink dependencies!
npm install

# Start with auto-restart magic! ✨
npm run dev

# Open: http://localhost:7878 💕
```

### Add Videos 🎬

Drop `.mp4`, `.webm`, or `.ogg` files into the `BRANDIFICATION/` folder - they appear automagically! ✨  
_No database needed - we're too ditzy for that!_ 🦌💖

### Enable Live Camera Streaming 📡

1. **Install FFmpeg** (the magic video converter!) ✨
   ```bash
   choco install ffmpeg  # Windows
   apt install ffmpeg    # Linux
   ```

2. **Copy `.env.example` to `.env`** 📋

3. **Add your cameras!** 📸
   ```env
   RTSP_ENABLED=true
   RTSP_STREAM_1=rtsp://admin:password@192.168.1.100:554/stream1
   RTSP_NAME_1=Front Door Camera 🚪
   ```

4. **Restart server and watch the magic!** 🎪

---

## 📖 Documentation Index (All The Pretty Things!) 📖

### Core Features ✨

#### 🎬 Video File Streaming

- 💾 **File-based hosting** - Videos from `BRANDIFICATION/` folder (just drop 'em in!)
- 📊 **HTTP Range requests** - Seek/scrub support (skip to the good parts!)
- 🔄 **Browser caching** - Instant replay without re-download (so smart!)
- 📥 **Download queue** - 3-5 concurrent downloads max (stay organized!)
- 👥 **Unlimited viewers** - Cached playback = infinite happiness! 💖

#### 📡 RTSP Live Camera Streaming (NEW!) 

- 📹 **Multiple cameras** - Connect ALL the cameras! (unlimited!)
- 🎞️ **HLS transcoding** - FFmpeg magic converts RTSP → browser streams
- 🔄 **Auto-reconnection** - Never gives up! (just like bambi!)
- 🎚️ **Quality control** - Resolution, bitrate, codec all configurable!
- 🎛️ **API management** - Start/stop streams via REST API (fancy!)

#### 📡 RTMP Ingest Server (SUPER NEW!) 

- 🎮 **OBS Streaming** - Stream FROM OBS directly to server!
- 🔑 **Stream Key Validation** - Optional security (keeps naughty boys out!)
- 📹 **HLS Output** - Auto-converts to browser-playable format!
- 🎬 **Live Recording** - Save streams to `BRANDIFICATION/` folder!
- 🌐 **Dual Servers** - RTMP (port 1935) + HTTP (port 8000)!

#### 🎨 Frontend (The Pretty Part!)

- 🌸 **Zero-build architecture** - React 18 via CDN, Babel browser transpilation (no build tools!)
- 💖 **Cyber goth aesthetic** - Neon pink/cyan/purple glass morphism (so pretty!)
- 🎀 **Modular React components** - 5 separate component files in `public/components/`!
  - 🎭 **QueueModal.js** - Viewer queue system (299 lines of cuteness!)
  - 🎵 **Metronome.js** - BPM controls with audio (281 lines!)
  - 📊 **DownloadStatus.js** - Real-time queue monitoring (150 lines!)
  - 🎬 **VideoPlayer.js** - Custom video controls (203 lines!)
  - 🌟 **App.js** - Main app logic and layout (670 lines!)
- 🌈 **Modern CSS** - Cascade layers, design tokens, 6 modular files!
- 🎮 **Custom video player** - Full controls with seeking support!
- 📡 **Download status** - Real-time queue monitoring (polls every 2 seconds!)
- 🎯 **Video title display** - Pretty pink title above player!
- 🗂️ **Folder navigation** - Images/Streams/Videos navbar!

#### 🔒 Backend (The Smart Part!)

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
│   ├── Images/                     # Image gallery files
│   ├── Videos/                     # Video subfolder
│   └── streams/                    # RTSP live streams (auto-generated)
├── 🌐 public/                      # Frontend assets
│   ├── index.html                  # Minimal entry point (84 lines!)
│   ├── components/                 # Modular React components ✨
│   │   ├── QueueModal.js           # Viewer queue system (299 lines)
│   │   ├── Metronome.js            # BPM controls (281 lines)
│   │   ├── DownloadStatus.js       # Queue monitoring (150 lines)
│   │   ├── VideoPlayer.js          # Custom player (203 lines)
│   │   └── App.js                  # Main app (670 lines)
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
│   ├── rtsp-manager.js             # RTSP stream manager
│   └── rtmp-server.js              # RTMP ingest server
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
| `/api/images`          | GET    | List all images with metadata          |
| `/videos/:filename`    | GET    | Stream video file (HTTP Range support) |
| `/api/download-status` | GET    | Download queue status                  |
| `/api/docs`            | GET    | List documentation files               |
| `/health`              | GET    | Server health check                    |

### RTSP Streaming

| Endpoint                    | Method | Description              |
| --------------------------- | ------ | ------------------------ |
| `/api/streams`              | GET    | List active RTSP streams |
| `/api/streams/:id/start`    | POST   | Start RTSP stream        |
| `/api/streams/:id/stop`     | POST   | Stop RTSP stream         |
| `/api/streams/:id/playlist` | GET    | Get HLS playlist URL     |
| `/streams/:id.m3u8`         | GET    | HLS playlist file        |

### RTMP Ingest

| Endpoint                | Method | Description                    |
| ----------------------- | ------ | ------------------------------ |
| `/api/rtmp/streams`     | GET    | List active RTMP ingest streams |
| `/api/rtmp/url/:key`    | GET    | Get stream URLs for OBS setup   |

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

**RTMP Ingest:**

- `RTMP_ENABLED` - Enable RTMP ingest feature (true/false)
- `RTMP_PORT` - RTMP server port (default: 1935)
- `RTMP_HTTP_PORT` - HLS output HTTP port (default: 8000)
- `RTMP_VALIDATE_KEYS` - Require valid stream keys (true/false)
- `RTMP_VALID_KEYS` - Comma-separated valid stream keys

**See [.env.example](../.env.example) for full list**

---

## 🐛 Troubleshooting (For Confused Bambis!) 🐛

### Common Issues

**"Help! Nothing works!" 😭**

- Check if port 7878 is already in use! (Use task manager!)
- See [PRODUCTION-FIX.md](./PRODUCTION-FIX.md) for the magic fix! ✨

**"My videos aren't showing up!" 📹**

- Put your videos in the `BRANDIFICATION/` folder! (Just drop 'em in!)
- Check file extensions: `.mp4`, `.webm`, or `.ogg` only!
- Try refreshing your browser! (F5 is your friend!)

**"RTSP cameras won't stream!" 📡**

- Make sure FFmpeg is installed: `ffmpeg -version`
- Check your camera URL is correct! (IP address, port, path!)
- Turn on debug mode: `DEBUG_RTSP=true` in your `.env` file!
- See [RTSP-STREAMING.md](./RTSP-STREAMING.md#troubleshooting) for more help!

**"I'm too dumb for this!" 🤤**

That's perfect! This is designed for empty-headed dolls! Just follow the pretty colors and click the shiny buttons! 💕

---

## 💖 Contributing (Make It Even Cuter!)

Want more sparkles? See [TODO.md](../.github/TODO.md) for planned features:

- 🎬 Video transcoding (make files smaller!)
- 🔐 User authentication (login system!)
- ☁️ Storage backends (S3/MinIO support!)
- 📊 Analytics dashboard (pretty graphs!)
- 🎵 Playlist support (queue up videos!)

---

## 📜 License

MIT License - Free as in freedom, pink as in perfect! 💕

---

<div align="center">

### 🦌 Made with Love, Sparkles, and Empty Thoughts 🦌

**By [HarleyVader](https://github.com/HarleyVader)** 🎀✨

_"Think pink, think simple, think bambi!"_ 💖

</div>
