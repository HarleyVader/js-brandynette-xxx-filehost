# 🚀 Getting Started

Welcome to the **Brandynette Documentation System**! This is a comprehensive guide to help you understand and use this video streaming platform.

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🔗 API Endpoints](#-api-endpoints)
- [🛠️ Troubleshooting](#️-troubleshooting)

## 🎯 Overview

Brandynette is a modern ES6 Express HTTP file server that serves a single-page HTML application with embedded React for video streaming. The system features:

- **ES6 Express Server** - Modern JavaScript with import/export syntax
- **Embedded React Frontend** - No build process required
- **Video Streaming** - HTTP range request support for smooth playback
- **Documentation System** - Markdown-based documentation with live rendering
- **Cyber Goth Theme** - 2030 neon aesthetic with scanline animations

## ✨ Features

### Backend Features

- ✅ Express.js HTTP server with ES6 modules
- ✅ Static file serving for video content
- ✅ CORS support for frontend access
- ✅ Proper MIME type handling for media files
- ✅ HTTP range requests for video seeking
- ✅ RESTful API endpoints
- ✅ Documentation API for markdown rendering

### Frontend Features

- ✅ React 18+ via CDN with Babel transpiler
- ✅ Responsive video player component
- ✅ Video controls (play, pause, volume, seeking)
- ✅ Loading states and error handling
- ✅ Cyber Goth theme with neon effects
- ✅ Mobile-friendly responsive design
- ✅ Documentation viewer with markdown rendering

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Videos in the `BRANDIFICATION` folder

### Installation

1. Clone or download the project
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   - **Main App**: <http://localhost:6969>
   - **Documentation**: <http://localhost:6969/docs>

### Adding Videos

Place your video files (`.mp4`, `.webm`, `.ogg`) in the `BRANDIFICATION` folder. The server will automatically detect and serve them.

### Adding Documentation

Add markdown files (`.md` or `.markdown`) to the `Docs` folder. They will automatically appear in the documentation sidebar.

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main video player application |
| `/docs` | GET | Documentation system |
| `/api/videos` | GET | List available videos |
| `/api/public` | GET | List public folder contents |
| `/api/docs/files` | GET | List available documentation files |
| `/api/docs/content/:filename` | GET | Get content of specific documentation file |
| `/videos/:filename` | GET | Stream video files |
| `/health` | GET | Health check endpoint |

## 🛠️ Troubleshooting

### Common Issues

#### Videos not loading

- ✅ Check that video files are in the `BRANDIFICATION` folder
- ✅ Ensure video files have supported extensions (`.mp4`, `.webm`, `.ogg`)
- ✅ Verify file permissions allow reading

#### Documentation not appearing

- ✅ Check that markdown files are in the `Docs` folder
- ✅ Ensure files have `.md` or `.markdown` extensions
- ✅ Verify file permissions allow reading

#### Server not starting

- ✅ Check that port 6969 is not already in use
- ✅ Verify Node.js version is 16 or higher
- ✅ Run `npm install` to ensure dependencies are installed

### Getting Help

If you encounter issues not covered here:

1. Check the browser console for error messages
2. Check the server terminal output for errors
3. Verify all files are in the correct directories
4. Ensure all dependencies are installed

---

## Happy streaming! 🎬✨
