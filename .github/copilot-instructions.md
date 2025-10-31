# GitHub Copilot Instructions - js-brandynette-xxx-filehost

## 🎯 Project Overview

**Brandynette's Video Streaming Server** - Zero-build ES6 Express server with CDN-based embedded React frontend for streaming videos from the `BRANDIFICATION` folder. Cyber goth aesthetic with neon glass morphism.

**Stack**: Node.js ES6 modules, Express 4, React 18 (CDN), Babel (browser transpilation)
**Port**: 6969 (development & production)

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
// React 18 concurrent rendering support
const root = ReactDOM.createRoot(document.getElementById("root"));
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
// Typical component structure
function VideoPlayer({ videoSrc, title }) {
  // 1. State hooks
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = React.useRef(null);

  // 2. Effects for event listeners
  useEffect(() => {
    const video = videoRef.current;
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [videoSrc]);

  // 3. Event handlers
  const togglePlay = () => (video.paused ? video.play() : video.pause());

  // 4. Render with React.createElement
}
```

### Cyber Goth Styling System

**CSS Custom Properties + Glass Morphism** - all colors centralized:

```css
:root {
  /* Cyber goth color palette with 8-digit hex (RGBA) */
  --primary-color: rgb(12, 42, 42, 0.9);      /* Deep teal */
  --secondary-color: rgb(64, 0, 47, 0.9);     /* Dark purple */
  --button-color: rgb(223, 4, 113, 0.9);      /* Neon pink */
  --nav-alt: rgb(23, 219, 216, 0.9);          /* Cyan glow */
}

.glass-bubble {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);                /* Glass morphism */
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glow-effect {
  filter: drop-shadow(0 0 10px var(--glow-cyan)) drop-shadow(
      0 0 20px var(--glow-pink)
    );
  animation: pulse-glow 3s ease-in-out infinite alternate;
}
```

**Pattern**: All UI elements use `.glass-bubble` base + `.glow-effect` accents.

## 🔧 Server Implementation Details

### ES6 Module Pattern

**Requires `"type": "module"` in package.json**:

```javascript
// ✅ CORRECT: ES6 import/export syntax
import express from "express";
import { fileURLToPath } from "url";

// __dirname equivalent in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ❌ WRONG: Don't use require() in this project
const express = require("express"); // Syntax error!
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

### File System Watching Pattern

**Videos auto-discovered on every request** - no database needed:

```javascript
const getVideoFiles = () => {
  const files = fs.readdirSync(path.join(__dirname, "../BRANDIFICATION"));
  return files.filter(
    (file) =>
      file.toLowerCase().endsWith(".mp4") ||
      file.toLowerCase().endsWith(".webm") ||
      file.toLowerCase().endsWith(".ogg")
  );
};

// Called fresh on each /api/videos request
app.get("/api/videos", (req, res) => {
  const videos = getVideoFiles(); // Live file system read
  res.json({ videos, count: videos.length });
});
```

**Why**: Drop-in video files work immediately without server restart.

## 🚀 Development Workflows

### Development Cycle

```bash
npm install                   # Install express, cors, nodemon
npm run dev                   # Start with nodemon auto-restart
# Edit code → Auto-restart → Browser refresh (no HMR)
```

**No hot reload**: Manual browser refresh needed after changes (CDN React limitation).

### Adding New Videos

```bash
# 1. Drop video files into BRANDIFICATION/
cp your-video.mp4 BRANDIFICATION/

# 2. Refresh browser - server auto-detects new files
curl http://localhost:6969/api/videos
# Returns: {"videos": ["du-suchst-ein-girl.mp4", "your-video.mp4"], "count": 2}
```

### Testing Video Streaming

```bash
# Test health endpoint
curl http://localhost:6969/health

# Test video list
curl http://localhost:6969/api/videos

# Test range request streaming (partial content)
curl -H "Range: bytes=0-1023" http://localhost:6969/videos/du-suchst-ein-girl.mp4
# Should return 206 status with 1024 bytes
```

## 📁 Project Structure & File Relationships

```
js-brandynette-xxx-filehost/
├── src/
│   └── server.js              # Express server, API routes, streaming logic
├── public/
│   └── index.html             # Entire React app (576 lines, self-contained)
├── BRANDIFICATION/            # Video storage (fs.readdirSync target)
│   └── du-suchst-ein-girl.mp4
├── package.json               # "type": "module" enables ES6
├── README.md                  # Kawaii pink-themed documentation
├── BUILD-INSTRUCTIONS.md      # Cyber goth upgrade guide (modularization plan)
└── TODO.md                    # Feature roadmap (transcoding, auth, storage)
```

**No dist/ or build/ folders**: CDN React eliminates build artifacts.

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
   - **Cause**: Browser doesn't support `backdrop-filter`
   - **Fix**: Add `-webkit-backdrop-filter` prefix, test in Chrome/Edge

## 📚 Essential Files for AI Understanding

- `src/server.js` (148 lines) - Complete Express server with streaming logic
- `public/index.html` (576 lines) - Entire React frontend embedded in HTML
- `package.json` - ES6 module configuration, dependencies
- `BUILD-INSTRUCTIONS.md` - Modularization roadmap (future expansion plans)
- `TODO.md` - Feature requests (transcoding, auth, analytics)

## 🔑 Key Principles

1. **Zero-Build Philosophy**: CDN React, browser Babel, no webpack/vite/build step
2. **Self-Contained Deployment**: Single HTML file + Node server, no dist artifacts
3. **Live File Discovery**: Videos auto-detected on request, no database
4. **HTTP Standards**: Proper range requests (206), caching headers, CORS
5. **Cyber Goth Aesthetics**: Neon colors, glass morphism, dark backgrounds

---

**Quick Reference**: Port 6969 • ES6 modules • React 18 CDN • Range requests • Glass morphism • Zero build
