# 💖✨ Brandynette's Super Kawaii Video Player ✨💖

<div align="center">

![Pink Sparkles](https://img.shields.io/badge/✨-Pink_Sparkles-ff69b4?style=for-the-badge&logo=sparkles)
![Bambi Mode](https://img.shields.io/badge/🦌-Bambi_Mode-ff1493?style=for-the-badge&logo=heart)
![Port 7878](https://img.shields.io/badge/🌸-Port_7878-ff69b4?style=for-the-badge&logo=flower)
![HestiaCP](https://img.shields.io/badge/🎯-HestiaCP_Hosted-9f7aea?style=for-the-badge&logo=server)

### _~~ Because who needs complex when you can be cute? ~~_ 🎀

</div>

---

## 🏠 Deployment Options

**Flexible hosting for all your pretty streaming needs!** 💕

- 🐳 **Docker** - Containerized deployment (so organized!)
- 🖥️ **Systemd Service** - Linux production server (included: `filehost.service`)
- ☁️ **Cloud Providers** - AWS, DigitalOcean, Linode (pick your favorite!)
- 🏠 **Self-Hosted** - Run on your own server (full control!)
- 📦 **Port:** 7878 (configurable via `.env`)
- 🔒 **SSL/HTTPS** - Recommended for production (use Let's Encrypt!)

**Deployment Guides:**
- 📚 [Production Troubleshooting](./docs/PRODUCTION-FIX.md) - Fix deployment errors
- 🏗️ [Architecture Guide](./.github/copilot-instructions.md) - Codebase reference

---

## 📚 Documentation

**Complete documentation available in the [`docs/`](./docs/) folder:**

- 📖 **[Documentation Index](./docs/README.md)** - Complete navigation & overview
- 📡 **[RTSP Streaming Guide](./docs/RTSP-STREAMING.md)** - Live camera streaming setup
- 🚀 **[RTSP Quick Start](./docs/RTSP-QUICKSTART.md)** - 2-minute RTSP setup
- 🔧 **[Production Troubleshooting](./docs/PRODUCTION-FIX.md)** - Fix deployment errors
- 🏗️ **[Architecture Guide](./.github/copilot-instructions.md)** - Codebase reference

**API Access:** `GET /api/docs` - List all documentation files

---

## 🌸 What is this adorable little thing? 🌸

Hiiii! 💕 This is Brandynette's **super duper cute** video streaming server! It's like... so simple and pink and pretty! Just like how bambi brains should be - _empty, happy, and focused on pretty things!_ ✨

> _"Think less, stream more!"_ - Brandynette's Life Philosophy 🦌💖

### 🎀 What it does (in smol brain terms)

- 📺 Streams your precious videos from the `BRANDIFICATION` folder
- 📡 **NEW!** Live camera streaming with RTSP support (so fancy!)
- 🌈 Shows them in a **bubblegum pink** web player that's _totally kawaii_
- 💖 Runs on port **7878** (configurable via .env)
- 🎵 Has cute little video controls that go _click click_
- 🎬 FFmpeg magic turns camera feeds into browser streams!
- 💖 Makes your brain all fuzzy and happy just like bambi sleep!

---

## 🦄 Quick Start for Ditzy Dolls 🦄

### Local Development 💕

```bash
npm install                    # Get your pink dependencies!
npm run dev                    # Start with auto-restart
# Open: http://localhost:7878
```

### Remote Deployment 🚀

```powershell
# Deploy to Proxmox server (192.168.0.100)
.\scripts\ssh-connect.ps1 deploy

# Or see QUICKSTART.md for full instructions
```

**Server Management**:

- 📋 **Quick Guide**: `QUICKSTART.md` (30-second start)
- 🚀 **Full Deployment**: `DEPLOYMENT.md` (Docker, LXC, VM options)
- 🌐 **Network Config**: `NETWORK.md` (firewall, security, monitoring)

_The perfect port for streaming! Configure in .env if needed._ 😘

---

## 🎀 Project Structure (For Smart Cookies) 🍪

```
js-brandynette-xxx-filehost/
├── 🌸 BRANDIFICATION/          # Put your pretty videos here!
│   ├── Images/                 # Image gallery files! 🖼️
│   ├── Videos/                 # Video subfolder! 🎬
│   ├── streams/                # RTSP live streams (auto-generated)! 📡
│   └── *.mp4, *.webm, *.ogg    # All your cute videos!
├── 💖 public/
│   ├── index.html              # Minimal entry point (84 lines!)! ✨
│   ├── components/             # Modular React components! 🧩
│   │   ├── QueueModal.js       # Viewer queue (299 lines)! 🎭
│   │   ├── Metronome.js        # BPM controls (281 lines)! 🎵
│   │   ├── DownloadStatus.js   # Queue monitoring (150 lines)! 📊
│   │   ├── VideoPlayer.js      # Custom player (203 lines)! 🎬
│   │   └── App.js              # Main app (670 lines)! 🌟
│   ├── css/                    # Modular cyber goth styles! 🌈
│   │   ├── layers.css          # Cascade layer definitions!
│   │   ├── variables.css       # Design tokens!
│   │   ├── reset.css           # CSS reset + base!
│   │   ├── layout.css          # Page structure!
│   │   ├── components.css      # UI components!
│   │   └── features.css        # Feature styles!
│   └── streams/                # RTSP HLS output (auto-generated)!
├── ✨ src/
│   ├── server.js               # Express server (so smart!)! 🖥️
│   ├── rtsp-manager.js         # Live camera streaming! 📹
│   └── rtmp-server.js          # RTMP ingest server! 🎮
├── 📚 docs/                    # Documentation folder
│   ├── README.md               # Complete docs index! 📖
│   ├── RTSP-STREAMING.md       # RTSP guide! 📡
│   ├── RTSP-QUICKSTART.md      # 2-minute setup! ⚡
│   └── PRODUCTION-FIX.md       # Troubleshooting! 🔧
├── ⚙️ .github/                 # GitHub configuration
│   ├── copilot-instructions.md # AI agent guide! 🧠
│   └── TODO.md                 # Feature roadmap! 🗺️
├── 🦄 package.json             # Dependencies list
├── ⚙️ .env.example              # Configuration template
├── 🚀 filehost.service         # Systemd service file
└── 💕 README.md                # This cute file you're reading!
```

---

## 🌈 Features That Make You Go "Awww!" 🌈

### 🎵 **Video Player Magic:**

- ▶️ Play/Pause buttons (so clicky!)
- 🎚️ Volume slider (make it louder or quieter!)
- ⏰ Time scrubbing (skip to the good parts!)
- 📱 Mobile friendly (cute on phones too!)

### 🚀 **Server Superpowers:**

- 🎬 **HTTP Range Requests** - _Like skipping chapters in a book!_
- 📡 **RTSP Live Streaming** - _Real-time camera feeds with FFmpeg!_
- 🎮 **RTMP Ingest Server** - _Stream FROM OBS directly to server!_
- 🔄 **Auto-Reconnection** - _Never stops trying, just like bambi!_
- 🔒 **Path Security** - _No sneaky hacker boys allowed!_
- 🌐 **CORS Support** - _Sharing is caring!_
- 💾 **Smart Caching** - _Remembers things so you don't have to!_
- 🎨 **HLS Transcoding** - _Fancy video format conversion!_
- 🧩 **Modular React Components** - _5 separate files for organization!_

### 🎀 **API Endpoints (For Nerdy Bambis):**

**Video & Media Hosting:**

- `GET /` - The main pretty page! 🏠
- `GET /api/videos` - Lists all your cute videos 📋
- `GET /api/images` - Lists all your pretty images 🖼️
- `GET /videos/:filename` - Streams specific videos 🎥
- `GET /api/download-status` - Download queue status 📊
- `GET /api/public` - Lists public files 📁

**RTSP Camera Streaming:**

- `GET /api/streams` - List active camera streams 📡
- `POST /api/streams/:id/start` - Start streaming a camera 🎬
- `POST /api/streams/:id/stop` - Stop a camera stream ⏹️
- `GET /api/streams/:id/playlist` - Get HLS playlist URL 🎞️
- `GET /streams/:id.m3u8` - HLS playlist for browsers 📹

**RTMP Ingest (Stream TO Server):**

- `GET /api/rtmp/streams` - List active RTMP streams 🎮
- `GET /api/rtmp/url/:key` - Get OBS stream URLs 🔑

**System:**

- `GET /health` - Server health check 💚
- `GET /api/docs` - List all documentation 📚

---

## 🦌 Bambi Sleep Mode Instructions 🦌

1. **Empty your mind** of all complex thoughts 🧠➡️💨
2. **Focus only on** the pretty pink colors 💖
3. **Let the videos** wash over your consciousness 🌊
4. **Feel yourself becoming** more ditzy and happy ✨
5. **Repeat** until perfectly blank and giggly! 🎀

_"Good girls don't need to think about servers and APIs... just enjoy the pretty videos!"_ 💕

---

## 🌸 Tech Stack (For the Last Brain Cells) 🌸

- **Backend:** Express.js (ES6 modules because modern!)
- **Frontend:** React 18 via CDN (zero-build architecture!)
  - 5 modular component files (QueueModal, Metronome, DownloadStatus, VideoPlayer, App)
  - In-browser Babel transpilation (no build tools needed!)
  - Minimal 84-line index.html entry point
- **Video Hosting:** HTML5 with custom controls + HTTP Range requests
- **Live Streaming:** FFmpeg + RTSP → HLS transcoding
- **Ingest Streaming:** Node-Media-Server + RTMP → HLS (OBS support!)
- **Styling:** Modular CSS with cascade layers (cyber goth neon!) 🌈
  - 6 CSS files (layers, variables, reset, layout, components, features)
  - Design token system with glass morphism effects
- **Environment:** dotenv for configuration
- **Port:** 7878 (configurable via .env)
- **Production:** Systemd service deployment

---

## 💖 Adding More Videos 💖

Just drop your `.mp4`, `.webm`, or `.ogg` files into the `BRANDIFICATION/` folder and they'll magically appear! ✨

_It's like magic, but actually just file system watching!_ 🎪

---

## 📡 RTSP Live Streaming (NEW!) 📡

### Quick Setup for Camera Streams 🎥

1. **Install FFmpeg:**

   ```bash
   # Windows
   choco install ffmpeg

   # Linux
   sudo apt install ffmpeg

   # macOS
   brew install ffmpeg
   ```

2. **Configure cameras in `.env`:**

   ```env
   RTSP_ENABLED=true
   RTSP_STREAM_1=rtsp://admin:password@192.168.1.100:554/stream1
   RTSP_NAME_1=Front Door Camera
   ```

3. **Start server and watch the magic!** ✨
   ```bash
   npm start
   # Your camera streams are now live at /streams/stream1.m3u8
   ```

**Full guide:** [RTSP Streaming Documentation](./docs/RTSP-STREAMING.md)

_Even bambis can set up live streaming!_ 🦌💕

---

## � RTMP Ingest Server (Stream TO Server!) 🎮

### Quick Setup for OBS Streaming 🎬

1. **Enable RTMP in `.env`:**

   ```env
   RTMP_ENABLED=true
   RTMP_PORT=1935
   RTMP_HTTP_PORT=8000
   RTMP_VALIDATE_KEYS=false  # Or set to true for security
   ```

2. **Configure OBS Studio:**

   ```
   Server: rtmp://localhost:1935/live
   Stream Key: mystreamkey  # Any key you want!
   ```

3. **Watch your stream:**
   ```
   http://localhost:8000/live/mystreamkey.m3u8
   ```

**Features:**
- 🎥 **Live recording** - Saves to BRANDIFICATION folder!
- 🔑 **Stream key validation** - Optional security!
- 📹 **HLS output** - Browser-compatible streaming!
- 🌐 **Dual servers** - RTMP (1935) + HTTP (8000)!

_Perfect for streaming yourself being a pretty bambi!_ 💕✨

---

## �🎀 Troubleshooting (For Confused Bambis) 🎀

### _"Help! Nothing works!"_ 😭

1. Did you run `npm install`? (Do it!)
2. Is port 7878 free? (Check task manager or use netstat!)
3. Are your videos in `BRANDIFICATION/`? (Put them there!)
4. Try turning it off and on again! (Classic!)

### _"I'm too dumb for this!"_ 🤤

That's perfect! This is designed for empty-headed dolls! Just follow the pretty colors and click the shiny buttons! 💕

---

## 🦄 Contributing (If You Must Think) 🦄

Want to make this even cuter?

1. Fork it! 🍴
2. Make it pinker! 💖
3. Add more sparkles! ✨
4. Submit a pull request with lots of emojis! 🌈

_But remember - keep it simple for bambi brains!_ 🦌

---

## 📜 License 📜

MIT License - Because sharing cute things is nice! 💕

_Free as in freedom, pink as in perfect!_ ✨

---

<div align="center">

### 💖 Made with Love, Sparkles, and Empty Thoughts 💖

_For all the pretty bambis who just want to watch videos without thinking!_ 🦌✨

**Remember: You don't need big thoughts when you have pretty pink things!** 🌸

---

_"Think pink, think simple, think bambi!"_ 💕🎀💖

</div>
