# GitHub Copilot Instructions - js-brandynette-xxx-filehost

## 🎯 Project Overview

**Brandynette's Video Streaming Server** - Zero-build ES6 Express server with CDN-based embedded React frontend for streaming videos from the `BRANDIFICATION` folder. Cyber goth aesthetic with neon glass morphism.

**Stack**: Node.js ES6 modules, Express 4, React 18 (CDN), Babel (browser transpilation)  
**Port**: 6969 (development & production)  
**Architecture Philosophy**: Self-contained, zero-build, modular-ready

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

### Initial Setup

```powershell
# Clone/navigate to project
cd js-brandynette-xxx-filehost

# Install dependencies (express, cors, nodemon)
npm install

# Start development server with auto-restart
npm run dev

# Server starts on http://localhost:6969
# Edit code → Nodemon auto-restarts → Manual browser refresh
```

**Note**: No hot module replacement - changes require manual browser refresh.

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

### Testing Video Streaming

```powershell
# Test health endpoint
curl http://localhost:6969/health
# Expected: {"status":"ok","timestamp":"2025-11-16T..."}

# Test video list
curl http://localhost:6969/api/videos
# Expected: {"videos":["du-suchst-ein-girl.mp4"],"count":1}

# Test range request streaming (critical for video seeking)
curl -H "Range: bytes=0-1023" http://localhost:6969/videos/du-suchst-ein-girl.mp4
# Expected: 206 Partial Content status with 1024 bytes

# Test public files list
curl http://localhost:6969/api/public
# Expected: {"files":[{"name":"index.html",...}],"count":1}
```

### Debugging Techniques

**Server-side debugging**:
```javascript
// Add console.log in src/server.js
console.log('📹 Streaming video:', filename, 'Range:', range);

// Check terminal output when accessing videos
```

**Client-side debugging**:
```javascript
// Add console.log in public/index.html <script type="text/babel">
console.log('🎬 Videos fetched:', videosData);

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
│   └── server.js              # Express server, API routes, streaming logic (148 lines)
├── public/
│   └── index.html             # Entire React app (576 lines, self-contained)
├── BRANDIFICATION/            # Video storage (fs.readdirSync target)
│   └── du-suchst-ein-girl.mp4 # Example video file
├── .github/
│   └── copilot-instructions.md # This file - AI agent guidance
├── package.json               # "type": "module" enables ES6
├── README.md                  # Kawaii pink-themed documentation (180 lines)
├── BUILD-INSTRUCTIONS.md      # Cyber goth upgrade & modularization roadmap (450 lines)
├── TODO.md                    # Feature requests (transcoding, auth, analytics) (97 lines)
└── cspell.json                # Spell check dictionary
```

**No dist/ or build/ folders**: CDN React eliminates build artifacts.

### Future Modular Structure (from BUILD-INSTRUCTIONS.md)

When implementing modularization, follow this planned structure:

```
src/
├── server.js              # Main entry point (keep exact location)
├── routes/
│   ├── index.js           # Route aggregator
│   ├── health.js          # Health check routes
│   ├── videos.js          # Video serving routes
│   └── api.js             # API endpoints
├── middleware/
│   ├── index.js           # Middleware aggregator
│   ├── cors.js            # CORS configuration
│   ├── security.js        # Security middleware
│   └── static.js          # Static file serving
├── utils/
│   ├── fileUtils.js       # File system utilities
│   ├── videoUtils.js      # Video processing utilities
│   └── pathUtils.js       # Path validation utilities
└── config/
    ├── index.js           # Configuration aggregator
    └── server.js          # Server configuration
```

**Critical**: When refactoring, preserve `src/server.js` location and ES6 module patterns.

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
  --primary-color: #0c2a2aE6;      /* Deep teal - backgrounds */
  --primary-alt: #15aab5E6;        /* Bright teal - highlights */
  --secondary-color: #40002fE6;    /* Dark purple - accents */
  --secondary-alt: #cc0174E6;      /* Hot pink - secondary highlights */
  --tertiary-color: #720241e6;     /* Deep magenta - tertiary accents */
  --tertiary-alt: #02b893E6;       /* Turquoise - tertiary highlights */
  --button-color: #df0471E6;       /* Neon pink - buttons */
  --button-alt: #110000E6;         /* Near black - button text/backgrounds */
  --nav-color: #0a2626E6;          /* Dark teal - navigation */
  --nav-alt: #17dbd8E6;            /* Bright cyan - navigation highlights */
  --transparent: #124141E6;        /* Semi-transparent teal */
  --error: #ff3333E6;              /* Error red */
  
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

### Future Theming (BUILD-INSTRUCTIONS.md)

When implementing modular theme system:

```javascript
// Planned ThemeProvider component
const ThemeContext = React.createContext();

const ThemeProvider = ({ children }) => {
  const theme = {
    colors: {
      primary: 'var(--primary-color)',
      primaryAlt: 'var(--primary-alt)',
      // ... all color variables
    },
    fonts: {
      display: 'Audiowide, sans-serif',
      mono: 'JetBrains Mono, Fira Code, monospace'
    },
    effects: {
      glow: 'drop-shadow(0 0 10px var(--glow-cyan))',
      blur: 'blur(20px)'
    }
  };
  
  return React.createElement(ThemeContext.Provider, { value: theme }, children);
};

// Usage in components
const useTheme = () => React.useContext(ThemeContext);
```

## 📚 Essential Files for AI Understanding

**Core Implementation** (must read for any changes):
- `src/server.js` (148 lines) - Complete Express server with streaming logic
- `public/index.html` (576 lines) - Entire React frontend embedded in HTML
- `package.json` - ES6 module configuration, dependencies

**Architecture & Planning**:
- `BUILD-INSTRUCTIONS.md` (450 lines) - Detailed modularization roadmap with cyber goth theme upgrade
  - Backend modularization structure (`routes/`, `middleware/`, `utils/`, `config/`)
  - Frontend component system (ThemeProvider, CyberVideoPlayer, Navigation, APIStatus)
  - Color palette and styling system (CSS custom properties for cyber goth theme)
  - 4-phase implementation plan (backend → theme → frontend → testing)
- `TODO.md` (97 lines) - Feature requests with priorities
  - High priority: Video transcoding, HLS streaming, authentication, storage backends
  - Medium priority: Playlists, comments, analytics, social features
  - Low priority: Mobile app, CDN integration, monetization

**Documentation**:
- `README.md` (180 lines) - Kawaii-themed user documentation with quick start guide
- `.github/copilot-instructions.md` - This file, AI agent guidance

## 🚧 Planned Features & Roadmap

### From TODO.md - Implementation Priorities

**High Priority** (implement first):
1. **Video Transcoding Pipeline** - FFmpeg integration for multiple quality levels
2. **HLS Streaming** - Adaptive bitrate streaming support
3. **Authentication System** - User login/register with session management
4. **Storage Abstraction** - S3/MinIO/local filesystem backends
5. **Rate Limiting** - Prevent bandwidth abuse

**Medium Priority** (after core features):
- Thumbnail generation, video metadata management
- Progress tracking, playlists, favorites
- Analytics dashboard, view counts
- Search and filtering

**Low Priority** (future enhancements):
- Mobile apps, CDN integration, monetization
- Live streaming, comments system

### From BUILD-INSTRUCTIONS.md - Modularization Strategy

**Phase 1: Backend Modularization**
- Extract routes into separate modules (`routes/videos.js`, `routes/api.js`)
- Create utility modules (`utils/videoUtils.js`, `utils/pathUtils.js`)
- Implement middleware chain (`middleware/cors.js`, `middleware/security.js`)
- Configuration system (`config/index.js`)

**Phase 2: Frontend Theme Upgrade**
- Cyber goth color palette (see BUILD-INSTRUCTIONS.md for exact CSS variables)
- Scanlines animation effect for terminal aesthetic
- Font system: Audiowide, Fira Code, JetBrains Mono
- Neon glow effects and glass morphism enhancements

**Phase 3: Frontend Modularization**
- Component system: `ThemeProvider`, `CyberVideoPlayer`, `CyberNavigation`, `APIStatus`
- Custom hooks: `useAPI`, `useTheme` for state management
- Context-based theming for consistent styling

**Phase 4: Testing & Validation**
- Verify all API endpoints maintain compatibility
- Test video streaming with range requests
- Validate responsive design and browser compatibility

## 🔑 Key Principles

1. **Zero-Build Philosophy**: CDN React, browser Babel, no webpack/vite/build step
   - React/ReactDOM/Babel loaded via unpkg.com CDN
   - JSX transpiled at runtime in browser
   - No `npm run build` needed, instant refresh during dev
2. **Self-Contained Deployment**: Single HTML file + Node server, no dist artifacts
   - Entire frontend in `public/index.html` (576 lines)
   - Backend in `src/server.js` (148 lines)
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
   - Planned modularization path in BUILD-INSTRUCTIONS.md

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

**Quick Reference**: Port 6969 • ES6 modules • React 18 CDN • Range requests • Glass morphism • Zero build

**Modularization Roadmap**: See BUILD-INSTRUCTIONS.md for detailed 4-phase implementation plan  
**Feature Roadmap**: See TODO.md for prioritized feature requests (transcoding, auth, storage)

**Last Updated**: November 16, 2025 (Enhanced with BUILD-INSTRUCTIONS.md and TODO.md roadmaps)
