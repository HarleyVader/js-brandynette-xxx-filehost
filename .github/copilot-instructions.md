### COPILOT INSTRUCTIONS

## Project Overview
**Brandynette's Video Streaming Server** - A self-contained ES6 Express file server with embedded React frontend for streaming videos from the `BRANDIFICATION` folder. Features a cyber goth aesthetic with neon colors and glass morphism effects.

## Architecture Understanding

### Core Design Pattern: **CDN-Based Embedded React**
- **No build process** - React loaded via CDN with Babel transpiler in browser
- **Single HTML file** (`public/index.html`) contains entire frontend application  
- **Self-contained deployment** - works without Node.js build tools or webpack
- **ES6 modules throughout** - `"type": "module"` in package.json enables native import/export

### Critical File Relationships
```
src/server.js ←→ public/index.html ←→ BRANDIFICATION/*.mp4
     ↑                    ↑                    ↑
 API endpoints      React components      Video assets
```

## Implementation Specifics

### 1. Express Server (`src/server.js`)
**Key Pattern**: HTTP Range Request handling for video seeking
```javascript
// This pattern enables video scrubbing/seeking:
if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    // ... pipe file stream with 206 status
}
```

**Security Pattern**: Path traversal protection
```javascript
if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
}
```

### 2. Frontend Architecture (`public/index.html`)
**Key Pattern**: Inline React with Babel transpilation
```html
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script type="text/babel">
    const { useState, useEffect } = React;
    // Components defined directly in HTML
</script>
```

**React 18 Implementation**: Uses modern createRoot API
```javascript
// React 18 createRoot pattern (not legacy ReactDOM.render)
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App));
```
- Enables automatic batching for better performance
- Supports concurrent rendering features
- Future-ready for React 18+ features like Suspense and transitions

**Styling System**: CSS Custom Properties + Glass Morphism
- Uses `--primary-color`, `--secondary-color` etc. for cyber goth theme
- `backdrop-filter: blur()` for glass effects
- Responsive design with mobile-first approach

### 3. API Design Patterns
**RESTful endpoints with JSON responses:**
- `GET /api/videos` - Returns `{videos: [...], count: n}` for video list
- `GET /videos/:filename` - Streams video with range request support  
- `GET /api/public` - File system introspection (dev utility)
- `GET /health` - Simple health check returning timestamp

## Development Workflows

### Local Development
```bash
npm run dev  # Uses nodemon for auto-restart on file changes
```
**Key**: Server serves `public/index.html` directly (no dist folder in dev)
**React 18**: Uses createRoot API for optimal performance and concurrent features

### Production Deployment  
```bash
npm start    # Production server on port 6969
```
**Key**: Fallback route serves production build if `NODE_ENV=production`

### Adding New Videos
1. Drop `.mp4/.webm/.ogg` files into `BRANDIFICATION/` folder
2. Server automatically detects via `fs.readdirSync()` in `getVideoFiles()`
3. Frontend fetches list via `/api/videos` endpoint

## Project-Specific Conventions

### Styling Architecture
- **Cyber Goth Theme**: Dark backgrounds with neon accent colors
- **CSS Custom Properties**: All colors defined in `:root` for consistency
- **Glass Morphism**: `backdrop-filter: blur()` for UI elements
- **Responsive Breakpoints**: Mobile-first design patterns

### React Patterns Used
- **Functional components only** - no class components
- **Hooks-based state management** - useState, useEffect, useRef
- **Direct DOM manipulation** for video controls (not controlled components)
- **Error boundaries via state** - loading/error states in components

### File Organization Logic
- `src/` - Server-side code only
- `public/` - Static assets served directly  
- `BRANDIFICATION/` - Video assets (business logic folder name)
- No `build/` or `dist/` folders - CDN-based frontend

## Quick Commands
```bash
npm install && npm run dev    # Full setup + development
npm start                     # Production server  
curl localhost:6969/health    # Test server is running
curl localhost:6969/api/videos # List available videos
```
