# GitHub Copilot Instructions - js-brandynette-xxx-filehost

## 🎯 Project Overview

**Brandynette's Video Streaming Server** - Zero-build ES6 Express server with CDN-based embedded React frontend for streaming videos from the `BRANDIFICATION` folder. Cyber goth aesthetic with neon glass morphism.

**Stack**: Node.js ES6 modules, Express 4, React 18 (CDN), Babel (browser transpilation)  
**Port**: 6969 (development & production)  
**Architecture Philosophy**: Self-contained, zero-build, single-file deployment

**Production**: Systemd service (`brandynette.service`) runs as root on `/opt/brandynette`

## 🏗️ Architecture & Critical Patterns

### Zero-Build CDN-Based Architecture

**This project intentionally avoids build tools** - React/Babel loaded via CDN, transpiled in-browser:

```html
<!-- public/index.html - Entire frontend in single HTML file -->
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script type="text/babel">
  // JSX transpiled at runtime, no webpack/vite needed
  const { useState, useEffect } = React;
  function VideoPlayer({ videoSrc, title }) {
    /* ... */
  }
</script>
```

**Why**: Self-contained deployment, works without Node.js build tooling, instant refresh during development.

### Data Flow Architecture

```
User Browser → Express (port 6969) → fs.readdirSync('BRANDIFICATION/') → JSON
     ↓              ↓                          ↓
React App ← /api/videos endpoint ← getVideoFiles() filter
     ↓
/videos/:filename → HTTP Range Requests (206 Partial Content) → Video streaming
```

### HTTP Range Request Pattern (Video Seeking)

**Critical for video player scrubbing** - implements byte-range requests:

```javascript
// src/server.js - Enables video seeking without full download
app.get("/videos/:filename", (req, res) => {
  const range = req.headers.range;
  if (range) {
    // Parse "bytes=0-1023" format
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    // Stream partial content with 206 status
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

## 🎨 Frontend Architecture

### React 18 CreateRoot Pattern

**Uses modern React 18 API** - not legacy ReactDOM.render:

```javascript
// React 18 concurrent rendering support (public/index.html line 565)
const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App));
```

**Enables**: Automatic batching, concurrent features, Suspense support.

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

**State Management Pattern**:

```javascript
// Actual VideoPlayer component from public/index.html (line 146-340)
function VideoPlayer({ videoSrc, title }) {
  // 1. State hooks for playback controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = React.useRef(null);

  // 2. Effects for video event listeners (loadedmetadata, timeupdate, play/pause, ended)
  useEffect(() => {
    const video = videoRef.current;
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    // ... plus play, pause, ended, error handlers
    return () => {
      /* cleanup all listeners */
    };
  }, [videoSrc]);

  // 3. Event handlers
  const togglePlay = () => (video.paused ? video.play() : video.pause());
  const handleSeek = (e) => {
    /* click position on progress bar */
  };
  const handleVolumeChange = (e) => {
    /* slider value */
  };

  // 4. Render with React.createElement (video, controls, progress bar, volume)
}
```

### Cyber Goth Styling System

**CSS Custom Properties + Glass Morphism** - all colors centralized:

```css
/* public/index.html lines 8-30 - Complete cyber goth color system */
:root {
  --primary-color: #0c2a2ae6; /* Deep teal - backgrounds */
  --primary-alt: #15aab5e6; /* Bright teal - highlights */
  --secondary-color: #40002fe6; /* Dark purple - accents */
  --secondary-alt: #cc0174e6; /* Hot pink - secondary highlights */
  --tertiary-color: #720241e6; /* Deep magenta */
  --tertiary-alt: #02b893e6; /* Turquoise */
  --button-color: #df0471e6; /* Neon pink - primary CTA */
  --button-alt: #110000e6; /* Near black */
  --nav-color: #0a2626e6; /* Dark teal - navigation */
  --nav-alt: #17dbd8e6; /* Bright cyan - nav highlights */
  --glow-pink: #ff00ff;
  --glow-cyan: #00ffff;
  --glow-purple: #8a2be2;
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.2);
  --bubble-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.glass-bubble {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px); /* Safari support */
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow: var(--bubble-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glow-effect {
  filter: drop-shadow(0 0 10px var(--glow-cyan)) drop-shadow(
      0 0 20px var(--glow-pink)
    )
    drop-shadow(0 0 30px var(--glow-purple));
  animation: pulse-glow 3s ease-in-out infinite alternate;
}
```

**Pattern**: All UI elements use `.glass-bubble` base + `.glow-effect` accents.

## 🔧 Server Implementation Details

### ES6 Module Pattern

**Requires `"type": "module"` in package.json** (line 4):

```javascript
// src/server.js lines 1-8 - ES6 import pattern
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// __dirname equivalent in ES6 modules (required for path resolution)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ❌ WRONG: Don't use require() - will throw ERR_REQUIRE_ESM
const express = require("express"); // SyntaxError!
```

### Security Pattern - Path Traversal Protection

**Critical for file serving endpoints**:

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
// src/server.js lines 19-33 - Helper function with error handling
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
    console.error("Error reading BRANDIFICATION directory:", error);
    return []; // Graceful degradation if folder missing
  }
};

// src/server.js lines 40-48 - Called fresh on each request
app.get("/api/videos", (req, res) => {
  try {
    const videos = getVideoFiles(); // Synchronous directory read
    res.json({ videos, count: videos.length });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});
```

**Why**: Drop-in video files work immediately without server restart.

## 🚀 Development Workflows

### Initial Setup

```powershell
# Clone/navigate to project
cd js-brandynette-xxx-filehost

# Install dependencies (express@^4.18.2, cors@^2.8.5, nodemon@^3.0.1 dev)
npm install

# Start development server with auto-restart
npm run dev           # Uses nodemon src/server.js

# OR start production server (no auto-restart)
npm start             # Uses node src/server.js

# Server starts on http://localhost:6969
# Edit code → Nodemon auto-restarts → Manual browser refresh
```

**Note**: No hot module replacement - changes require manual browser refresh (F5).

### Development Cycle

```powershell
npm run dev           # Start with nodemon auto-restart
# 1. Edit src/server.js or public/index.html
# 2. Nodemon detects change and restarts server automatically
# 3. Refresh browser manually to see changes (F5)
# 4. Check terminal for console output
```

**Production**: `npm start` runs `node src/server.js` without auto-restart.

### Adding New Videos

```powershell
# 1. Drop video files into BRANDIFICATION/ folder
cp your-video.mp4 BRANDIFICATION/

# 2. Refresh browser - server auto-detects new files
# No server restart needed! Files discovered on next /api/videos request
```

**Supported formats**: `.mp4`, `.webm`, `.ogg` (case-insensitive)

### Production Deployment (Linux Systemd)

```bash
# Install service file (brandynette.service)
sudo cp brandynette.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable brandynette
sudo systemctl start brandynette

# Check status
sudo systemctl status brandynette

# View logs
sudo journalctl -u brandynette -f
```

**Service Configuration** (`brandynette.service`):

- Runs as `root` user (change if needed for security)
- Working directory: `/opt/brandynette`
- Environment: `PORT=6969`, `NODE_ENV=production`
- Auto-restart: `RestartSec=10`
- Logs to systemd journal (`journalctl`)

### Testing Video Streaming

```powershell
# Test health endpoint
curl http://localhost:6969/health
# Expected: {"status":"ok","timestamp":"2025-12-23T..."}

# Test video list
curl http://localhost:6969/api/videos
# Expected: {"videos":["du-suchst-ein-girl.mp4"],"count":1}

# Test range request streaming (critical for video seeking)
curl -H "Range: bytes=0-1023" http://localhost:6969/videos/du-suchst-ein-girl.mp4
# Expected: 206 Partial Content with Content-Range header

# Test public files list
curl http://localhost:6969/api/public
# Expected: {"files":[{"name":"index.html","size":...,"isDirectory":false}],"count":1}
```

### Debugging Techniques

**Server-side debugging**:

```javascript
// Add console.log in src/server.js
console.log("📹 Streaming video:", filename, "Range:", range);

// Check terminal output when accessing videos
```

**Client-side debugging**:

```javascript
// Add console.log in public/index.html <script type="text/babel">
console.log("🎬 Videos fetched:", videosData);

// Open browser DevTools Console (F12)
```

**Network debugging**:

- Open DevTools → Network tab → Filter by Media
- Check status codes (200 for full, 206 for range requests)
- Verify `Content-Range` headers for video seeking
- Monitor `Accept-Ranges: bytes` in response headers

## 📁 Project Structure & File Relationships

```
js-brandynette-xxx-filehost/
├── src/
│   └── server.js              # Express server, API routes, streaming logic (138 lines)
├── public/
│   └── index.html             # Entire React app (576 lines, self-contained)
├── BRANDIFICATION/            # Video storage (fs.readdirSync target)
│   └── du-suchst-ein-girl.mp4 # Example video file
├── .github/
│   ├── copilot-instructions.md # This file - AI agent guidance (653 lines)
│   ├── TODO.md                # Feature roadmap (100 lines)
│   └── FUNDING.yml            # GitHub Sponsors configuration
├── package.json               # "type": "module" enables ES6
├── package-lock.json          # Dependency lock file
├── README.md                  # Kawaii pink-themed user documentation (180 lines)
├── brandynette.service        # Systemd service file for production
├── cspell.json                # Spell check dictionary
└── .gitignore                 # Git ignore patterns
```

**No dist/ or build/ folders**: CDN React eliminates build artifacts.
**No BUILD-INSTRUCTIONS.md**: Architecture details are in this file and TODO.md.

### Routes & Endpoints

**Current implementation** (all in `src/server.js`):

- `GET /` - Serves `public/index.html` (wildcard route)
- `GET /health` - Health check (lines 35-37)
- `GET /api/videos` - Lists video files from BRANDIFICATION/ (lines 40-48)
- `GET /api/public` - Lists files in public/ directory (lines 50-67)
- `GET /videos/:filename` - Streams video with range request support (lines 69-118)
- Error handling middleware (lines 121-125)

**Security**: Path traversal protection on `/videos/:filename` (line 73-75)

## 🎯 Common Tasks & Patterns

### Adding New API Endpoint

```javascript
// src/server.js - Add before wildcard route
app.get("/api/metadata/:filename", (req, res) => {
  const filename = req.params.filename;

  // 1. Security check
  if (filename.includes("..")) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  // 2. File operations
  const videoPath = path.join(__dirname, "../BRANDIFICATION", filename);
  const stats = fs.statSync(videoPath);

  // 3. JSON response
  res.json({
    filename: filename,
    size: stats.size,
    created: stats.birthtime,
    duration: null, // Would need ffprobe for actual duration
  });
});
```

### Adding New React Component

```javascript
// In public/index.html <script type="text/babel"> section
function ThumbnailGrid({ videos, onVideoSelect }) {
  return React.createElement(
    "div",
    {
      className: "glass-bubble",
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      },
    },
    videos.map((video) =>
      React.createElement(
        "button",
        {
          key: video,
          onClick: () => onVideoSelect(video),
          className: "bubble-button glow-effect",
        },
        video
      )
    )
  );
}
```

## 🐛 Common Pitfalls & Solutions

1. **❌ Using require() instead of import**

   - **Cause**: `"type": "module"` in package.json enforces ES6 syntax
   - **Fix**: Always use `import/export`, never `require/module.exports`

2. **❌ Video seeking not working**

   - **Cause**: Missing range request handling or incorrect content-length
   - **Fix**: Ensure 206 status with proper `Content-Range` headers

3. **❌ React state not updating**

   - **Cause**: Babel transpilation issues or missing hooks dependencies
   - **Fix**: Check useEffect dependency arrays, verify CDN loads in Network tab

4. **❌ Videos not appearing after adding to BRANDIFICATION/**

   - **Cause**: File extension filter in `getVideoFiles()`
   - **Fix**: Ensure lowercase `.mp4/.webm/.ogg` extensions match filter

5. **❌ Glass morphism not rendering**

   - **Cause**: Browser doesn't support `backdrop-filter` (Safari/Edge compatibility)
   - **Fix**: Add `-webkit-backdrop-filter` prefix, test in Chrome/Edge
   - **Fallback**: Provide solid background for unsupported browsers

6. **❌ CORS errors when embedding in other sites**

   - **Cause**: Default CORS middleware may be too restrictive
   - **Fix**: Configure CORS origin in `src/server.js` (currently allows all origins)
   - **Security note**: Restrict origins in production environments

7. **❌ Video files not streaming on mobile devices**
   - **Cause**: Mobile browsers may not support specific codecs or require different MIME types
   - **Fix**: Ensure proper `Content-Type` headers, test H.264 encoding for maximum compatibility

## 🎨 Styling System Details

### Cyber Goth Color Palette

All colors defined as CSS custom properties in `public/index.html`:

```css
:root {
  --primary-color: #0c2a2ae6; /* Deep teal - backgrounds */
  --primary-alt: #15aab5e6; /* Bright teal - highlights */
  --secondary-color: #40002fe6; /* Dark purple - accents */
  --secondary-alt: #cc0174e6; /* Hot pink - secondary highlights */
  --tertiary-color: #720241e6; /* Deep magenta - tertiary accents */
  --tertiary-alt: #02b893e6; /* Turquoise - tertiary highlights */
  --button-color: #df0471e6; /* Neon pink - buttons */
  --button-alt: #110000e6; /* Near black - button text/backgrounds */
  --nav-color: #0a2626e6; /* Dark teal - navigation */
  --nav-alt: #17dbd8e6; /* Bright cyan - navigation highlights */
  --transparent: #124141e6; /* Semi-transparent teal */
  --error: #ff3333e6; /* Error red */

  /* Glow effects */
  --glow-pink: #ff00ff;
  --glow-cyan: #00ffff;
  --glow-purple: #8a2be2;

  /* Glass morphism */
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.2);
  --bubble-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

**Usage pattern**: Always reference CSS variables, never hardcode colors.

### Component Styling Classes

- `.glass-bubble` - Base glass morphism effect (backdrop-filter blur)
- `.glow-effect` - Animated neon glow with pulse animation
- `.bubble-button` - Interactive button with gradient and hover effects
- `.bubble-button.selected` - Active state for selected items
- `.compact-container` - Minimal spacing container
- `.no-spacing` - Zero margin/padding reset

### Future Theming (TODO.md)

When implementing modular theme system:

```javascript
// Planned ThemeProvider component
const ThemeContext = React.createContext();

const ThemeProvider = ({ children }) => {
  const theme = {
    colors: {
      primary: "var(--primary-color)",
      primaryAlt: "var(--primary-alt)",
      // ... all color variables
    },
    fonts: {
      display: "Audiowide, sans-serif",
      mono: "JetBrains Mono, Fira Code, monospace",
    },
    effects: {
      glow: "drop-shadow(0 0 10px var(--glow-cyan))",
      blur: "blur(20px)",
    },
  };

  return React.createElement(ThemeContext.Provider, { value: theme }, children);
};

// Usage in components
const useTheme = () => React.useContext(ThemeContext);
```

```javascript
// Planned ThemeProvider component
const ThemeContext = React.createContext();

const ThemeProvider = ({ children }) => {
  const theme = {
    colors: {
      primary: "var(--primary-color)",
      primaryAlt: "var(--primary-alt)",
      // ... all color variables
    },
    fonts: {
      display: "Audiowide, sans-serif",
      mono: "JetBrains Mono, Fira Code, monospace",
    },
    effects: {
      glow: "drop-shadow(0 0 10px var(--glow-cyan))",
      blur: "blur(20px)",
    },
  };

  return React.createElement(ThemeContext.Provider, { value: theme }, children);
};

// Usage in components
const useTheme = () => React.useContext(ThemeContext);
```

## 📚 Essential Files for AI Understanding

**Core Implementation** (must read for any changes):

- [src/server.js](src/server.js) (138 lines) - Complete Express server with streaming logic, HTTP range requests, path security
- [public/index.html](public/index.html) (576 lines) - Entire React 18 frontend with CDN-based React/Babel, cyber goth styling
- [package.json](package.json) - ES6 module configuration (`"type": "module"`), dependencies (express, cors, nodemon)

**Production Deployment**:

- [brandynette.service](brandynette.service) - Systemd service file for Linux production deployment (`/opt/brandynette`)
  - Runs as root user on port 6969
  - Auto-restart with 10-second delay
  - Logs to systemd journal

**Planning & Roadmap**:

- [.github/TODO.md](.github/TODO.md) (~100 lines) - Feature roadmap with priorities
  - High priority: Video transcoding (FFmpeg), HLS streaming, authentication (JWT), storage abstraction (S3/MinIO)
  - Medium priority: Thumbnails, metadata, playlists, analytics dashboard
  - Low priority: Upload testing, load testing, API docs, deployment guides

**Documentation**:

- [README.md](README.md) (180 lines) - Kawaii/bambi-themed user documentation with emojis and playful language
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - This file, comprehensive AI agent guidance

## 🚧 Planned Features & Roadmap

### From .github/TODO.md - Implementation Priorities

**High Priority** (implement first):

1. **Video Transcoding Pipeline** - FFmpeg integration for multiple quality levels (`.mp4`, `.webm`, adaptive bitrate)
2. **HLS Streaming** - HTTP Live Streaming with `.m3u8` playlists for adaptive quality
3. **Authentication System** - User login/register, session management, JWT tokens
4. **Storage Abstraction** - Support S3, MinIO, or local filesystem with unified API
5. **Rate Limiting** - Prevent bandwidth abuse (Express rate-limiter middleware)
6. **Thumbnail Generation** - Auto-generate preview images from video frames (FFmpeg)

**Medium Priority** (after core features):

- Video metadata (title, description, tags, categories) - PostgreSQL/SQLite schema
- Progress tracking - Save playback position per user/video
- Playlists & favorites - User-curated collections
- Analytics dashboard - View counts, bandwidth usage, popular videos
- Search & filtering - Full-text search on video metadata
- Responsive design - Mobile-friendly layout overhaul
- Dark mode toggle - Alternative to cyber goth theme

**Low Priority** (future enhancements):

- Upload testing - Large file upload validation
- Load testing - Concurrent stream capacity benchmarks
- API documentation - OpenAPI/Swagger spec
- Deployment guide - Docker, LXC, VM setup instructions

## 🔑 Key Principles

1. **Zero-Build Philosophy**: CDN React, browser Babel, no webpack/vite/build step
   - React/ReactDOM/Babel loaded via unpkg.com CDN
   - JSX transpiled at runtime in browser
   - No `npm run build` needed, instant refresh during dev
2. **Self-Contained Deployment**: Single HTML file + Node server, no dist artifacts
   - Entire frontend in `public/index.html` (576 lines)
   - Backend in `src/server.js` (138 lines)
   - Drop videos in `BRANDIFICATION/` and they appear automatically
3. **Live File Discovery**: Videos auto-detected on request, no database
   - `fs.readdirSync()` called fresh on each `/api/videos` request
   - Supports `.mp4`, `.webm`, `.ogg` formats
4. **HTTP Standards**: Proper range requests (206), caching headers, CORS
   - Critical for video seeking/scrubbing functionality
   - Enables partial content downloads
5. **Cyber Goth Aesthetics**: Neon colors, glass morphism, dark backgrounds
   - CSS custom properties for centralized theming
   - Backdrop-filter for glass morphism effects
   - Glow animations and pulse effects
6. **Modular-Ready Architecture**: Designed for future expansion without breaking changes
   - ES6 modules enable clean refactoring
   - Clear separation concerns (routes, middleware, utils)
   - Planned modularization path in TODO.md

## 🏗️ Architectural Decisions & Trade-offs

### Why Zero-Build?

**Decision**: Use CDN-based React instead of build tools like Vite/Webpack

**Trade-offs**:

- ✅ **Pros**: No build step, instant refresh, self-contained HTML, works without Node build tools
- ✅ **Pros**: Easy to understand for beginners, single-file deployment
- ❌ **Cons**: No tree-shaking, larger initial load, no TypeScript support
- ❌ **Cons**: No hot module replacement (HMR), manual browser refresh needed

**When to reconsider**: If app grows beyond ~1000 lines or needs TypeScript/advanced features

### Why Live File Discovery?

**Decision**: `fs.readdirSync()` on every request instead of file watching or database

**Trade-offs**:

- ✅ **Pros**: Drop-in video support, no restart needed, zero setup
- ✅ **Pros**: No database complexity, no sync issues
- ❌ **Cons**: Slower for large directories (100+ files)
- ❌ **Cons**: No metadata storage (duration, thumbnails, descriptions)

**When to reconsider**: When BRANDIFICATION/ has 50+ videos or needs metadata/search

### Why Port 6969?

**Decision**: Hardcoded port 6969 (configurable via `process.env.PORT`)

**Rationale**: Thematic alignment with adult content hosting (69 reference), memorable, unlikely to conflict with common services

---

## 📊 Project Stats

- **Backend**: 138 lines (src/server.js)
- **Frontend**: 576 lines (public/index.html)
- **Total LOC**: ~714 lines excluding dependencies
- **Dependencies**: 2 runtime (express, cors), 1 dev (nodemon)
- **API Endpoints**: 5 routes (health, videos, public, video stream, wildcard)
- **Supported Formats**: `.mp4`, `.webm`, `.ogg`

**Quick Reference**: Port 6969 • ES6 modules • React 18 CDN • HTTP Range requests • Glass morphism • Zero build • Systemd production

**Feature Roadmap**: See `.github/TODO.md` for prioritized features (transcoding, HLS, auth, storage, analytics)

**Last Updated**: December 23, 2025 (Removed BUILD-INSTRUCTIONS.md references, updated to current codebase)
