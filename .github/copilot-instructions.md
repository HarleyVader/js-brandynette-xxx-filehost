# GitHub Copilot Instructions - js-brandynette-xxx-filehost

## Project Overview

**Zero-build ES6 video streaming server** with CDN-based React 18 frontend. Cyber goth neon aesthetic (pink/cyan/purple glass morphism). Streams videos from `BRANDIFICATION/` folder with RTSP/RTMP live streaming support.

**Stack**: Node.js ES6 modules (`"type": "module"`), Express 4, React 18 (CDN + Babel browser transpilation), Worker Threads, FFmpeg  
**Port**: 7878 | **Production**: Systemd `filehost.service` (user `zathras`)

## Critical Architecture Patterns

### Zero-Build Frontend
- **No build step**: React/Babel loaded via CDN, transpiled in-browser
- **`React.createElement` pattern**: No JSX preprocessing - all components use `React.createElement()`
- **Modular components**: `public/components/*.js` loaded via `<script type="text/babel">`
- **CSS cascade layers**: Load order matters: `layers.css` → `variables.css` → `reset.css` → `layout.css` → `components.css` → `features.css`

### Streaming Architecture
```
RTSP (pull from cameras) → FFmpeg → HLS (.m3u8) → Browser
RTMP (push from OBS)     → Worker Thread → HLS → Browser  
Video files              → HTTP Range (206) → Browser cache → Unlimited replay
```

- **Download queue**: Max 5 concurrent initial downloads, then unlimited cached playback
- **Worker Thread isolation**: RTMP runs in `rtmp-worker.js` to prevent blocking Express
- **Auto-reconnection**: RTSP streams recover from failures (10 attempts, 5s delay)

### ES6 Module Requirements
```javascript
// ✅ Correct - ES6 imports
import express from "express";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ❌ Wrong - CommonJS will throw ERR_REQUIRE_ESM
const express = require("express");
```

### Key File Patterns

| File | Pattern |
|------|---------|
| `src/server.js` | Express routes, HTTP Range requests, download queue, Worker Thread spawning |
| `src/rtsp-manager.js` | FFmpeg transcoding class with `Map<streamId, ffmpegProcess>` |
| `src/rtmp-worker.js` | `parentPort.postMessage()` / `workerData` communication |
| `public/components/*.js` | `React.createElement()` pattern, hooks via `const { useState } = React;` |
| `public/css/variables.css` | Design tokens: `--glow-pink`, `--glow-cyan`, `--glass-bg`, etc. |

### Security Pattern
```javascript
// Path traversal protection on /videos/:filename
if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
  return res.status(400).json({ error: "Invalid filename" });
}
```

### API Endpoints Summary
- **Videos**: `GET /api/videos`, `GET /videos/:filename?ticket=X` (HTTP Range)
- **RTSP**: `GET /api/streams`, `POST /api/streams/:id/start`, `POST /api/streams/:id/stop`
- **RTMP**: `GET /api/rtmp/streams`, `GET /api/rtmp/worker-status`, `GET /api/rtmp/url/:key`
- **Static**: `/streams/*.m3u8` (HLS), `/images/*`, `/docs/*`

## Developer Workflows

```bash
npm install          # Install dependencies
npm run dev          # Start with nodemon (hot reload)
npm start            # Production start
```

**Add videos**: Drop `.mp4`/`.webm`/`.ogg` into `BRANDIFICATION/` - auto-discovered on request  
**Configure streams**: Copy `.env.example` to `.env`, set `RTSP_ENABLED=true` / `RTMP_ENABLED=true`

## Architectural Debt (TODO)

- **Remove viewing queue**: `viewingQueue` object, `/api/queue/*` endpoints, `QueueModal.js` are not needed (unlimited viewers via browser cache)
- **Add "DING!" notification**: Audio when download slot becomes available
- See `docs/TODO.md` for full roadmap

## Styling Conventions

All UI uses `.glass-bubble` base + `.glow-effect` accents. Colors from CSS variables:
```css
--glow-pink: #ff00ff; --glow-cyan: #00ffff; --glow-purple: #8a2be2;
--glass-bg: rgba(255, 255, 255, 0.08); --glass-border: rgba(255, 255, 255, 0.2);
```
