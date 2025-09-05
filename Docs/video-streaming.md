# 📺 Video Streaming Guide

This guide covers everything you need to know about the video streaming functionality in Brandynette.

## 🎬 Video Player Features

The embedded React video player provides a rich streaming experience with the following features:

- **Responsive Design**: Adapts to any screen size
- **Video Controls**: Play, pause, volume control, and seeking
- **Multiple Format Support**: MP4, WebM, and OGG videos
- **HTTP Range Requests**: Enables smooth seeking and progressive loading
- **Auto-Selection**: Automatically selects the first available video
- **Error Handling**: Graceful error handling with user feedback

## 📁 Video File Management

### Supported Formats

The server supports the following video formats:

- `.mp4` (recommended)
- `.webm`
- `.ogg`

### File Organization

All video files should be placed in the `BRANDIFICATION` folder at the root of the project:

```text
js-brandynette-xxx-filehost/
├── BRANDIFICATION/
│   ├── du-suchst-ein-girl.mp4
│   ├── another-video.mp4
│   └── more-videos.webm
└── ...
```

### File Security

The server implements basic security measures:

- Path traversal protection prevents access to files outside the BRANDIFICATION folder
- Filename validation prevents directory traversal attacks
- Only video files are served through the video streaming endpoint

## 🔧 Technical Implementation

### HTTP Range Request Support

The server supports HTTP range requests, which enables:

- **Video Seeking**: Users can jump to any point in the video
- **Progressive Loading**: Videos load progressively as needed
- **Bandwidth Optimization**: Only requested portions are transmitted

### MIME Type Handling

Proper MIME types are set for optimal browser compatibility:

- `.mp4` files: `video/mp4`
- `.webm` files: `video/webm`
- `.ogg` files: `video/ogg`

### Caching Strategy

Videos are served with appropriate cache headers:

- `Cache-Control: public, max-age=3600` for efficient caching
- ETag support for conditional requests
- Last-Modified headers for cache validation

## 🎯 API Usage

### List Available Videos

```bash
GET /api/videos
```

Response:

```json
{
  "videos": ["du-suchst-ein-girl.mp4", "another-video.mp4"],
  "count": 2
}
```

### Stream Video

```bash
GET /videos/du-suchst-ein-girl.mp4
```

The endpoint supports:

- Full file streaming
- Partial content requests (HTTP 206)
- Range header support for seeking

## 🎨 Player Customization

The video player is built with React and can be customized through the following CSS variables:

```css
:root {
  --neon-cyan: #00ffff;
  --neon-pink: #ff0080;
  --cyber-dark: #111118;
  /* ... more variables */
}
```

### Player Styling

The player features:

- Cyber Goth theme integration
- Neon glow effects on controls
- Responsive design for mobile devices
- Smooth animations and transitions

## 🔍 Troubleshooting

### Common Video Issues

**Video won't play:**

- Check file format compatibility
- Verify file is not corrupted
- Ensure proper file permissions

**Seeking doesn't work:**

- Verify HTTP range request support
- Check server configuration
- Test with different video files

**Poor streaming performance:**

- Check network connection
- Verify server resources
- Consider video file size and bitrate

### Browser Compatibility

The video player is compatible with:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

For older browsers, consider providing fallback video formats or upgrade recommendations.

## 🚀 Performance Optimization

### Video Encoding Recommendations

For optimal streaming performance:

- Use H.264 codec for MP4 files
- Keep bitrate under 5 Mbps for web streaming
- Use progressive encoding for faster startup
- Consider multiple quality options for adaptive streaming

### Server Optimization

- Enable gzip compression for text content
- Use CDN for video delivery in production
- Implement video transcoding for multiple formats
- Monitor server resources and scaling needs

---

## Ready to stream! 🎬✨
