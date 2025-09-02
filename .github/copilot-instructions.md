### COPILOT INSTRUCTIONS

## Project Overview
Build an ES6 Express HTTP file server that serves a single-page HTML application with embedded React for video streaming from the "BRANDIFICATION" folder.

## Current Codebase Analysis
- **Workspace Root**: `f:\js-brandynette-xxx-filehost`
- **Video Assets**: `BRANDIFICATION/du-suchst-ein-girl.mp4`
- **Status**: Complete Express file server with embedded React frontend

## Implementation Requirements

### 1. Backend - Express Server (ES6)
- **File**: `src/server.js`
- **Features**:
  - ES6 modules with import/export syntax
  - Express.js HTTP server
  - Static file serving for video content from BRANDIFICATION folder
  - CORS support for frontend access
  - Proper MIME type handling for .mp4 files
  - Error handling and logging
- **Port**: Use environment variable or default to 6969
- **Routes**:
  - `GET /` - Serve HTML application from public folder
  - `GET /api/videos` - List available videos
  - `GET /api/public` - Serve public folder contents for client
  - `GET /videos/:filename` - Stream video files
  - `GET /health` - Health check endpoint

### 2. Frontend - Embedded React Application
- **Framework**: React 18+ via CDN with Babel transpiler
- **File Structure**:
  - `public/index.html` - Complete HTML application with embedded React
- **Features**:
  - Responsive video player component
  - Video controls (play, pause, volume, seeking)
  - Loading states and error handling
  - Modern CSS styling with gradients
  - Mobile-friendly responsive design
  - API integration with Express backend

### 3. Package Configuration
- **File**: `package.json`
- **Dependencies**:
  - express (HTTP server)
  - cors (Cross-origin resource sharing)
- **DevDependencies**:
  - nodemon (Development auto-restart)
- **Scripts**:
  - `"start"`: Run production server
  - `"dev"`: Run development server with auto-restart

### 4. Video Streaming Requirements
- **MIME Type**: Ensure proper `video/mp4` content-type headers
- **Range Requests**: Support HTTP range requests for video seeking
- **Caching**: Implement appropriate cache headers
- **Security**: Basic path traversal protection

### 5. Deployment Structure
```
js-brandynette-xxx-filehost/
├── .github/
│   └── copilot-instructions.md
├── BRANDIFICATION/
│   └── du-suchst-ein-girl.mp4
├── public/
│   └── index.html (Complete React app)
├── src/
│   └── server.js (Express server)
├── package.json
└── .gitignore
```

### 6. Key Implementation Notes
- **Single Express server** serves everything on port 6969
- **No build process** required - HTML with embedded React via CDN
- **Self-contained** - works without external build tools
- **ES6 modules** throughout (type: "module" in package.json)
- **Direct API integration** between frontend and backend
- **Cross-browser compatibility** with webkit prefixes

### 7. Testing & Validation
- Verify video loads and plays correctly
- Test responsive design on mobile devices
- Validate proper MIME types are served
- Check CORS headers allow frontend access
- Ensure video seeking/scrubbing works smoothly
- Test API endpoints return correct data

## Quick Start Commands
1. `npm install` - Install dependencies
2. `npm start` - Start production server
3. `npm run dev` - Start development server with auto-restart
4. Navigate to http://localhost:6969 to view application
