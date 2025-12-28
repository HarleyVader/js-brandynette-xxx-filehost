# GitHub Copilot Instructions - js-brandynette-xxx-filehost

## 🎯 Project Overview

**Brandynette's Video Streaming Server** - Zero-build ES6 Express server with CDN-based embedded React frontend for streaming videos from the `BRANDIFICATION` folder. Cyber goth aesthetic with neon glass morphism.

**Stack**: Node.js ES6 modules, Express 4, React 18 (CDN), Babel (browser transpilation), Modern CSS Architecture  
**Port**: 6969  
**Architecture Philosophy**: Self-contained, zero-build, modular CSS, single-file HTML deployment, browser-cached streaming

**Production**: Systemd service (`filehost.service`) runs as user `zathras`  
**Working Directory**: `/home/brandynette/web/bambisleep.chat/nodeapp/js-bambisleep-chat/src/server`  
**Live URL**: https://brandynette.xxx (if deployed)

**Streaming Model**: Unlimited concurrent viewers using browser cache, downloads queued (3-5 concurrent) for initial buffering. Frontend notification ("DING!" sound) when videos become viewable.

## 🏗️ Architecture & Critical Patterns

### Modern CSS Architecture

**Modular CSS with cascade layers** (based on js-bambisleep-chat template):

```html
<!-- public/index.html - Modern CSS loading order -->
<link rel="stylesheet" href="/css/layers.css" />
<!-- 1. Define cascade layers -->
<link rel="stylesheet" href="/css/variables.css" />
<!-- 2. Design tokens -->
<link rel="stylesheet" href="/css/reset.css" />
<!-- 3. CSS reset + base -->
<link rel="stylesheet" href="/css/layout.css" />
<!-- 4. App layout -->
<link rel="stylesheet" href="/css/components.css" />
<!-- 5. UI components -->
<link rel="stylesheet" href="/css/features.css" />
<!-- 6. Feature styles -->
```

**CSS Cascade Layers**: reset, base, layout, components, features, utilities  
**Design Token System** (`variables.css`): Color system, glassmorphism, typography (fonts, sizes), spacing (4px grid), borders, shadows, transitions, z-index scale

### Zero-Build CDN-Based Architecture

**Intentionally avoids build tools** - React/Babel loaded via CDN, transpiled in-browser:

```html
<!-- public/index.html - Entire frontend in single HTML file -->
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script type="text/babel">
  const { useState, useEffect } = React;
  function VideoPlayer({ videoSrc, title }) {
    /* ... */
  }
</script>
```

**Why**: Self-contained deployment, works without Node.js build tooling.

### Data Flow Architecture

```
User Browser → Express (port 6969) → /api/videos → Video list (unlimited viewers)
     ↓
Select video → /videos/:filename → Download Queue Check
     ↓                                    ↓
If queue full (>5) → Wait → "DING!" → HTTP Range Request (206) → Browser buffer/cache
     ↓                                    ↓
Once buffered → Unlimited replays from browser cache (no server load)
```

**Critical Flow**:

1. **Initial Download**: First 3-5 concurrent downloads buffer videos to browser cache
2. **Queue Management**: Additional requests wait until download slot frees
3. **Frontend Notification**: "DING!" sound plays when video becomes available for buffering
4. **Browser Caching**: Once buffered, video plays from cache indefinitely (no re-download)
5. **No Sessions**: Users can close/reopen browser - cached videos remain playable

### HTTP Range Request Pattern (Video Seeking)

**Critical for video player scrubbing** - implements byte-range requests:

```javascript
// src/server.js - Enables video seeking without full download
app.get("/videos/:filename", (req, res) => {
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const file = fs.createReadStream(videoPath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
    });
    file.pipe(res);
  }
});
```

**Without this**: Video would need full download before playback, no scrubbing support.

### Download Queue System (Critical Production Feature)

**Limits concurrent downloads for initial buffering** - 3-5 concurrent downloads max:

```javascript
// src/server.js - Download queue manager
const MAX_CONCURRENT_DOWNLOADS = 5; // Configurable: 3-5 recommended
const downloadQueue = {
  active: new Map(), // Map<sessionId, { filename, startTime, ip }>
  waiting: [], // Array<{ sessionId, filename, ip, queuedAt }>

  addToQueue(sessionId, filename, ip) {
    if (this.active.size < MAX_CONCURRENT_DOWNLOADS) {
      this.active.set(sessionId, { filename, startTime: new Date(), ip });
      return { status: "active", position: 0 };
    } else {
      this.waiting.push({ sessionId, filename, ip, queuedAt: new Date() });
      return { status: "queued", position: this.waiting.length };
    }
  },

  removeFromActive(sessionId) {
    this.active.delete(sessionId);
    this.processQueue(); // Auto-promote next in queue
  },
};

// Automatic cleanup on download finish/error/abort
res.on("finish", cleanupDownload);
res.on("close", cleanupDownload);
res.on("error", cleanupDownload);
```

**Why**: Prevents bandwidth exhaustion during initial video buffering. Once buffered to browser cache, unlimited viewers can watch without server load.

**Key Differences from Viewing**:

- **Downloads**: Queued (max 3-5 concurrent) - only for initial buffer to browser cache
- **Viewing**: Unlimited - plays from browser cache after initial download
- **No Sessions**: Browser cache persists across page refreshes, no time limits

**Frontend Integration**:

- `DownloadStatus` component shows active downloads and queue position
- **Audio notification**: "DING!" sound plays when video becomes available (download slot freed)
- Browser caches video using standard HTTP caching headers

## 🎨 Frontend Architecture

### React 18 CreateRoot Pattern

**Uses modern React 18 API** - not legacy ReactDOM.render:

```javascript
// React 18 concurrent rendering support
const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App));
```

### Component Architecture (React.createElement Pattern)

**No JSX preprocessing** - uses createElement for zero-build compatibility:

```javascript
// All components use React.createElement instead of JSX
return React.createElement(
  "div",
  { className: "glass-bubble" },
  React.createElement("video", { ref: videoRef, src: videoSrc }),
  React.createElement(
    "button",
    { onClick: togglePlay },
    isPlaying ? "⏸️" : "▶️"
  )
);
```

**Main Components** (in `public/index.html`):

- `DownloadStatus()` - Real-time download queue monitoring with polling
  - Shows active downloads (max 5) and waiting queue
  - Polls `/api/download-status` every 3 seconds
  - **TODO**: Add "DING!" sound notification when download slot becomes available
- `VideoPlayer({ videoSrc, title })` - Custom video player with controls
  - Leverages browser cache for replay (no re-download)
  - HTTP Range requests for seeking/scrubbing
- `App()` - Root component managing video list and player state
  - **TODO**: Add connection status indicator (online/offline detection)
  - **TODO**: Implement audio notification system for download availability

**State Management Pattern**:

```javascript
function VideoPlayer({ videoSrc, title }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = React.useRef(null);

  useEffect(() => {
    // Setup video event listeners (loadedmetadata, timeupdate, play, pause, ended, error)
    // Cleanup on unmount
  }, [videoSrc]);

  const togglePlay = () => (video.paused ? video.play() : video.pause());
  // ... event handlers
}
```

### Cyber Goth Styling System

**CSS Custom Properties + Glass Morphism** - all colors centralized in `variables.css`:

```css
:root {
  --primary-color: #0c2a2ae6;
  --primary-alt: #15aab5e6;
  --secondary-color: #40002fe6;
  --secondary-alt: #cc0174e6;
  --button-color: #df0471e6;
  --nav-alt: #17dbd8e6;
  --glow-pink: #ff00ff;
  --glow-cyan: #00ffff;
  --glow-purple: #8a2be2;
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.2);
}

.glass-bubble {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

**Pattern**: All UI elements use `.glass-bubble` base + `.glow-effect` accents.

## 🔧 Server Implementation Details

### ES6 Module Pattern

**Requires `"type": "module"` in package.json**:

```javascript
// src/server.js - ES6 import pattern
import express from "express";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ❌ WRONG: Don't use require() - will throw ERR_REQUIRE_ESM
```

### Security Pattern - Path Traversal Protection

```javascript
// Prevents "../../../etc/passwd" attacks
if (
  filename.includes("..") ||
  filename.includes("/") ||
  filename.includes("\\")
) {
  return res.status(400).json({ error: "Invalid filename" });
}
```

### Live File Discovery Pattern

**Videos auto-discovered on every request** - no database, no file watchers:

```javascript
const getVideoFiles = () => {
  const brandificationPath = path.join(__dirname, "../BRANDIFICATION");
  try {
    const files = fs.readdirSync(brandificationPath);
    return files.filter(
      (file) =>
        file.toLowerCase().endsWith(".mp4") ||
        file.toLowerCase().endsWith(".webm") ||
        file.toLowerCase().endsWith(".ogg")
    );
  } catch (error) {
    return []; // Graceful degradation if folder missing
  }
};
```

**Why**: Drop-in video files work immediately without server restart.

## Project Structure & File Relationships

```
js-brandynette-xxx-filehost/
├── src/
│   └── server.js              # Express server, API routes, streaming logic, download queue (456 lines)
├── public/
│   ├── index.html             # React app with DownloadStatus, VideoPlayer (1338 lines)
│   └── css/                   # Modern CSS Architecture
│       ├── layers.css         # Cascade layer definitions
│       ├── variables.css      # Design tokens (colors, spacing, typography)
│       ├── reset.css          # Modern CSS reset + base styles
│       ├── layout.css         # Page structure and containers
│       ├── components.css     # UI components (buttons, cards, controls)
│       └── features.css       # Feature-specific styles (video player, queue)
├── BRANDIFICATION/            # Video storage (fs.readdirSync target)
├── .github/
│   ├── copilot-instructions.md # This file
│   └── TODO.md                # Feature roadmap
├── filehost.service           # Systemd service file (runs as user zathras)
├── package.json               # "type": "module" enables ES6
└── README.md                  # Kawaii pink-themed user documentation
```

**No dist/ or build/ folders**: CDN React eliminates build artifacts.  
**Modular CSS**: 6 CSS files (~766 lines total) following cascade layer architecture.

### Routes & Endpoints

**Current implementation** (all in `src/server.js`):

- `GET /health` - Health check endpoint
- `GET /api/videos` - Lists video files from BRANDIFICATION/ with file sizes and metadata (unlimited concurrent access)
- `GET /api/public` - Lists files in public/ directory with stats
- `GET /api/download-status` - Returns download queue status (active downloads + waiting queue)
- `GET /videos/:filename` - Streams video with HTTP range request support + download queue management
  - Returns 503 with queue position if all download slots full (>5 concurrent)
  - Streams 206 Partial Content with Range headers for seeking
  - Sets `Cache-Control: public, max-age=3600` for browser caching
- `GET *` - Wildcard route serves `public/index.html` (checks NODE_ENV for production)
- Static middleware serves `/css/*` and other public files via `express.static()`

**Security**: Path traversal protection on `/videos/:filename` (checks for `..`, `/`, `\` in filename)

**Queue Management**:

- **Download queue only**: Max 3-5 concurrent downloads for initial buffering
- **No viewing limits**: Unlimited concurrent viewers using browser cache
- **No sessions**: Videos cached indefinitely in browser, no expiration

**NOTE**: Current code has viewing queue system (`viewingQueue`, `/api/queue/*` endpoints, `QueueModal` component) - **should be REMOVED** per architecture requirements

## 📚 Essential Files for AI Understanding

**Core Implementation** (must read for any changes):

- [../src/server.js](../src/server.js) (456 lines) - Express server with streaming logic, HTTP range requests, path security, download queue
- [../public/index.html](../public/index.html) (1338 lines) - React 18 frontend with CDN-based React/Babel, DownloadStatus, VideoPlayer
- [../public/css/\*.css](../public/css/) (766 lines total) - Modular CSS cascade layers
- [../package.json](../package.json) - ES6 module configuration (`"type": "module"`)

**Production Deployment**:

- [../filehost.service](../filehost.service) - Systemd service file for Linux production deployment
  - Runs as `zathras` user
  - Working directory: `/home/brandynette/web/bambisleep.chat/nodeapp/js-bambisleep-chat/src/server`
  - Auto-restart with 10-second delay

**Documentation**:

- [../README.md](../README.md) (195 lines) - Kawaii/bambi-themed user documentation with emojis
- [TODO.md](TODO.md) - Feature roadmap (transcoding, HLS, auth, storage, analytics)
- [copilot-instructions.md](copilot-instructions.md) - This file

## 📊 Project Stats

- **Backend**: 456 lines (src/server.js) - includes download queue (**NOTE**: viewing queue code exists but should be removed)
- **Frontend**: 1338 lines (public/index.html - single-file React app)
- **CSS**: 766 lines across 6 modular files
- **Total LOC**: ~2560 lines excluding dependencies
- **Dependencies**: 2 runtime (express, cors), 1 dev (nodemon)
- **API Endpoints**: 5 routes (health, videos, public, download-status, video stream, wildcard) - **NOTE**: 3 queue endpoints exist but should be removed
- **Supported Formats**: `.mp4`, `.webm`, `.ogg`
- **Concurrent Viewers**: **UNLIMITED** (browser-cached playback)
- **Concurrent Downloads**: Limited to 3-5 for initial buffering

**Quick Reference**: Port 6969 • ES6 modules • React 18 CDN • HTTP Range requests • Browser caching • Download queue (3-5 concurrent) • Unlimited viewers • "DING!" notification (TODO) • Modern CSS Architecture • Zero build • Systemd production

**Architecture Corrections Needed**:

1. **Remove** viewing queue system (`viewingQueue` object, `/api/queue/*` endpoints, `QueueModal` component)
2. **Add** "DING!" audio notification when download slots become available
3. **Add** connection status indicator (frontend online/offline detection)
4. **Keep** download queue only (3-5 concurrent max)

**Feature Roadmap**: See `.github/TODO.md` for prioritized features (transcoding, HLS, auth, storage, analytics)

**Last Updated**: December 28, 2025 (Corrected architecture: unlimited viewers with browser caching, downloads-only queue, audio notifications)
