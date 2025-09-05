# 🛠️ API Reference

Complete API documentation for the Brandynette video streaming platform.

## 📋 Base Information

- **Base URL**: `http://localhost:6969`
- **Content-Type**: `application/json`
- **Authentication**: None required

## 🎯 Core Endpoints

### Health Check

Check server status and availability.

**Endpoint**: `GET /health`

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2025-09-05T12:34:56.789Z"
}
```

---

## 📺 Video Endpoints

### List Videos

Retrieve all available video files from the BRANDIFICATION folder.

**Endpoint**: `GET /api/videos`

**Response**:

```json
{
  "videos": [
    "du-suchst-ein-girl.mp4",
    "another-video.mp4"
  ],
  "count": 2
}
```

**Error Response**:

```json
{
  "error": "Failed to read BRANDIFICATION directory"
}
```

### Stream Video

Stream a specific video file with support for HTTP range requests.

**Endpoint**: `GET /videos/:filename`

**Parameters**:

- `filename` (string): Name of the video file

**Headers**:

- `Range` (optional): Byte range for partial content requests

**Example**:

```bash
GET /videos/du-suchst-ein-girl.mp4
Range: bytes=0-1023
```

**Response Headers**:

```http
Content-Type: video/mp4
Content-Length: 1024
Accept-Ranges: bytes
Cache-Control: public, max-age=3600
```

**Range Response** (HTTP 206):

```http
Content-Range: bytes 0-1023/52428800
Content-Length: 1024
```

---

## 📁 Public File Endpoints

### List Public Files

Get information about files in the public directory.

**Endpoint**: `GET /api/public`

**Response**:

```json
{
  "files": [
    {
      "name": "index.html",
      "size": 15420,
      "isDirectory": false,
      "modified": "2025-09-05T10:30:00.000Z"
    },
    {
      "name": "docs.html",
      "size": 8750,
      "isDirectory": false,
      "modified": "2025-09-05T11:15:00.000Z"
    }
  ],
  "count": 2
}
```

---

## 📚 Documentation Endpoints

### List Documentation Files

Retrieve all markdown files from the Docs folder.

**Endpoint**: `GET /api/docs/files`

**Response**:

```json
{
  "files": [
    "getting-started.md",
    "api-reference.md",
    "video-streaming.md"
  ],
  "count": 3
}
```

**Empty Response**:

```json
{
  "files": [],
  "count": 0
}
```

### Get Documentation Content

Retrieve the content of a specific markdown file.

**Endpoint**: `GET /api/docs/content/:filename`

**Parameters**:

- `filename` (string): Name of the markdown file

**Example**:

```bash
GET /api/docs/content/getting-started.md
```

**Response**:

```json
{
  "filename": "getting-started.md",
  "content": "# Getting Started\n\nWelcome to...",
  "size": 2048
}
```

**Error Responses**:

```json
{
  "error": "Invalid filename"
}
```

```json
{
  "error": "Documentation file not found"
}
```

---

## 🌐 Frontend Routes

### Main Application

Access the main video streaming application.

**Endpoint**: `GET /`

**Response**: HTML page with embedded React application

### Documentation System

Access the documentation viewer.

**Endpoint**: `GET /docs`

**Response**: HTML page with markdown rendering system

---

## 🔒 Security Features

### Path Traversal Protection

All file endpoints implement security measures:

- Filename validation prevents `../` patterns
- Directory traversal protection
- Whitelist-based file access
- Proper error handling for security violations

### CORS Configuration

Cross-Origin Resource Sharing is enabled for:

- All origins in development
- API endpoints
- Static file serving

---

## 📊 Error Handling

### Standard Error Response

All API endpoints return consistent error responses:

```json
{
  "error": "Description of the error"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 206 | Partial Content (range requests) |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found (file doesn't exist) |
| 500 | Internal Server Error |

---

## 🚀 Usage Examples

### JavaScript Fetch Examples

**Get video list**:

```javascript
const response = await fetch('/api/videos');
const data = await response.json();
console.log(data.videos);
```

**Get documentation files**:

```javascript
const response = await fetch('/api/docs/files');
const data = await response.json();
console.log(data.files);
```

**Read documentation content**:

```javascript
const filename = 'getting-started.md';
const response = await fetch(`/api/docs/content/${filename}`);
const data = await response.json();
console.log(data.content);
```

### cURL Examples

**Health check**:

```bash
curl http://localhost:6969/health
```

**Stream video with range**:

```bash
curl -H "Range: bytes=0-1023" http://localhost:6969/videos/video.mp4
```

**Get documentation**:

```bash
curl http://localhost:6969/api/docs/content/api-reference.md
```

---

## 📈 Rate Limiting

Currently, there are no rate limits implemented. For production use, consider:

- Request rate limiting per IP
- Bandwidth throttling for video streaming
- API key authentication for programmatic access
- Monitoring and analytics integration

---

## API ready for integration! 🚀
