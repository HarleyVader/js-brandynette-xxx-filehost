## 📡 RTSP Real-Time Streaming Setup

### Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure RTSP streams in `.env`:**
   ```env
   RTSP_ENABLED=true
   RTSP_STREAM_1=rtsp://admin:password@192.168.1.100:554/stream1
   RTSP_NAME_1=Front Door Camera
   ```

3. **Start server:**
   ```bash
   npm start
   ```

4. **Access streams:**
   - Status: `GET /api/streams`
   - Playlist: `/streams/stream1.m3u8`

**Full documentation:** [RTSP-STREAMING.md](./RTSP-STREAMING.md)

### Requirements

- **FFmpeg** installed and in PATH
- **RTSP camera** accessible on network
- **2-3 Mbps** bandwidth per 720p stream
