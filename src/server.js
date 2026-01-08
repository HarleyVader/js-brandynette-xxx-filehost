import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";
import dotenv from "dotenv";
import RTSPStreamManager from "./rtsp-manager.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT;

// Initialize RTMP Ingest Server in Worker Thread
let rtmpWorker = null;
let rtmpWorkerStatus = {
  state: "stopped",
  activeStreams: 0,
  lastUpdate: null,
  error: null,
};

if (process.env.RTMP_ENABLED === "true") {
  const rtmpConfig = {s
    rtmpPort: parseInt(process.env.RTMP_PORT),
    httpPort: parseInt(process.env.RTMP_HTTP_PORT),
    ffmpegPath: process.env.FFMPEG_PATH || "ffmpeg",
    mediaRoot: process.env.RTMP_MEDIA_ROOT || "./BRANDIFICATION",
    validateStreamKey: process.env.RTMP_VALIDATE_KEYS === "true",
    validStreamKeys: process.env.RTMP_VALID_KEYS
      ? process.env.RTMP_VALID_KEYS.split(",")
      : [],
  };

  try {
    console.log("🧵 Starting RTMP Worker Thread...");
    rtmpWorker = new Worker(path.join(__dirname, "rtmp-worker.js"), {
      workerData: rtmpConfig,
    });

    // Handle messages from RTMP worker
    rtmpWorker.on("message", (message) => {
      const { type, data, timestamp } = message;

      switch (type) {
        case "status":
          rtmpWorkerStatus.state = data.state;
          rtmpWorkerStatus.lastUpdate = timestamp;
          if (data.state === "running") {
            console.log(`✅ RTMP Worker: ${data.message}`);
            console.log(`   📡 RTMP Port: ${data.rtmpPort}`);
            console.log(`   🌐 HTTP Port: ${data.httpPort}`);
          }
          break;

        case "stream_status":
          rtmpWorkerStatus.activeStreams = data.count;
          rtmpWorkerStatus.lastUpdate = timestamp;
          break;

        case "error":
          rtmpWorkerStatus.error = data;
          console.error(`❌ RTMP Worker Error: ${data.message}`);
          if (data.stack) console.error(data.stack);
          break;

        default:
          console.log(`[RTMP Worker] ${type}:`, data);
      }
    });

    // Handle worker errors
    rtmpWorker.on("error", (error) => {
      console.error("❌ RTMP Worker error:", error);
      rtmpWorkerStatus.state = "error";
      rtmpWorkerStatus.error = { message: error.message, stack: error.stack };
    });

    // Handle worker exit
    rtmpWorker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`❌ RTMP Worker stopped with exit code ${code}`);
        rtmpWorkerStatus.state = "stopped";
      } else {
        console.log("✅ RTMP Worker exited gracefully");
        rtmpWorkerStatus.state = "stopped";
      }
      rtmpWorker = null;
    });
  } catch (error) {
    console.error("❌ Failed to start RTMP Worker:", error);
    rtmpWorkerStatus.state = "error";
    rtmpWorkerStatus.error = { message: error.message };
  }
} else {
  console.log(
    "⏸️ RTMP Ingest Server disabled (set RTMP_ENABLED=true to enable)"
  );
}

// Initialize RTSP Stream Manager
let rtspManager = null;
if (process.env.RTSP_ENABLED === "true") {
  const rtspConfig = {
    ffmpegPath: process.env.FFMPEG_PATH || "ffmpeg",
    outputDir: process.env.STREAM_OUTPUT_DIR || "./BRANDIFICATION/streams",
    videoCodec: process.env.STREAM_VIDEO_CODEC || "libx264",
    audioCodec: process.env.STREAM_AUDIO_CODEC || "aac",
    preset: process.env.FFMPEG_PRESET || "ultrafast",
    crf: process.env.FFMPEG_CRF || "23",
    resolution: process.env.STREAM_RESOLUTION || "1280x720",
    framerate: process.env.STREAM_FRAMERATE || "30",
    bitrate: process.env.STREAM_BITRATE || "2000k",
    audioBitrate: process.env.STREAM_AUDIO_BITRATE || "128k",
    hlsTime: process.env.HLS_TIME || "2",
    hlsListSize: process.env.HLS_LIST_SIZE || "3",
    hlsFlags: process.env.HLS_FLAGS || "delete_segments",
    reconnectDelay: parseInt(process.env.RTSP_RECONNECT_DELAY) || 5000,
    maxReconnectAttempts:
      parseInt(process.env.RTSP_MAX_RECONNECT_ATTEMPTS) || 10,
    debug: process.env.DEBUG_RTSP === "true",
  };

  rtspManager = new RTSPStreamManager(rtspConfig);

  // Auto-start configured streams
  const configuredStreams = RTSPStreamManager.parseStreamsFromEnv();
  configuredStreams.forEach((stream) => {
    rtspManager.startStream(stream.id, stream.url, stream.name);
  });

  console.log(
    `📡 RTSP Streaming enabled with ${configuredStreams.length} streams`
  );
}

// Download Queue Manager
// Viewing Queue System (Modal Blocking)
const CONCURRENT_VIEWERS = 3; // Max concurrent viewers
const BASE_WAIT_TIME = 2; // Base wait time in seconds
const PER_USER_DELAY = 1; // Additional delay per queued user
const MIN_WAIT_TIME = 1; // Minimum wait time in seconds

const viewingQueue = {
  active: new Map(), // Map<ticketId, { ip, joinedAt, expiresAt }>
  waiting: [], // Array<{ ticketId, ip, queuedAt, estimatedWait }>
  ticketCounter: 1000,

  generateTicket(ip) {
    const ticketId = `TICKET-${this.ticketCounter++}-${Date.now()}`;
    const position = this.waiting.length + 1;
    const estimatedWait = Math.max(
      MIN_WAIT_TIME,
      BASE_WAIT_TIME + this.waiting.length * PER_USER_DELAY
    );

    const ticket = {
      ticketId,
      ip,
      queuedAt: new Date(),
      position,
      estimatedWait,
    };

    if (this.active.size < CONCURRENT_VIEWERS) {
      // Add directly to active viewers
      this.active.set(ticketId, {
        ip,
        joinedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min session
      });
      return { status: "granted", ticketId, position: 0, waitTime: 0 };
    } else {
      // Add to waiting queue
      this.waiting.push(ticket);
      return { status: "queued", ticketId, position, waitTime: estimatedWait };
    }
  },

  checkTicket(ticketId) {
    // Check if in active viewers
    if (this.active.has(ticketId)) {
      const viewer = this.active.get(ticketId);
      const remaining = Math.floor((viewer.expiresAt - new Date()) / 1000);
      return { status: "active", ticketId, remainingTime: remaining };
    }

    // Check if in waiting queue
    const waitingIndex = this.waiting.findIndex((t) => t.ticketId === ticketId);
    if (waitingIndex !== -1) {
      const ticket = this.waiting[waitingIndex];
      const position = waitingIndex + 1;
      const estimatedWait = Math.max(
        MIN_WAIT_TIME,
        BASE_WAIT_TIME + waitingIndex * PER_USER_DELAY
      );
      return { status: "queued", ticketId, position, waitTime: estimatedWait };
    }

    return { status: "expired", ticketId };
  },

  processQueue() {
    // Remove expired active viewers
    const now = new Date();
    for (const [ticketId, viewer] of this.active.entries()) {
      if (viewer.expiresAt < now) {
        this.active.delete(ticketId);
        console.log(`⏱️ Viewer expired: ${ticketId}`);
      }
    }

    // Promote waiting users to active
    while (this.active.size < CONCURRENT_VIEWERS && this.waiting.length > 0) {
      const next = this.waiting.shift();
      this.active.set(next.ticketId, {
        ip: next.ip,
        joinedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });
      console.log(
        `✅ Viewer granted access: ${next.ticketId} (position ${next.position})`
      );
    }
  },

  getQueueStatus() {
    return {
      active: this.active.size,
      waiting: this.waiting.length,
      maxConcurrent: CONCURRENT_VIEWERS,
      waitingTickets: this.waiting.map((t, i) => ({
        position: i + 1,
        ticketId: t.ticketId.substring(0, 15) + "...",
        estimatedWait: Math.max(
          MIN_WAIT_TIME,
          BASE_WAIT_TIME + i * PER_USER_DELAY
        ),
      })),
    };
  },
};

// Process queue every 5 seconds
setInterval(() => viewingQueue.processQueue(), 5000);

const MAX_CONCURRENT_DOWNLOADS = 5;
const downloadQueue = {
  active: new Map(), // Map<sessionId, { filename, startTime, ip }>
  waiting: [], // Array<{ sessionId, filename, ip, queuedAt }>

  addToQueue(sessionId, filename, ip) {
    if (this.active.size < MAX_CONCURRENT_DOWNLOADS) {
      this.active.set(sessionId, {
        filename,
        startTime: new Date(),
        ip,
      });
      return { status: "active", position: 0 };
    } else {
      const queueItem = { sessionId, filename, ip, queuedAt: new Date() };
      this.waiting.push(queueItem);
      return { status: "queued", position: this.waiting.length };
    }
  },

  removeFromActive(sessionId) {
    this.active.delete(sessionId);
    this.processQueue();
  },

  processQueue() {
    while (
      this.active.size < MAX_CONCURRENT_DOWNLOADS &&
      this.waiting.length > 0
    ) {
      const next = this.waiting.shift();
      this.active.set(next.sessionId, {
        filename: next.filename,
        startTime: new Date(),
        ip: next.ip,
      });
    }
  },

  getStatus() {
    return {
      active: Array.from(this.active.entries()).map(([sessionId, data]) => ({
        sessionId: sessionId.substring(0, 8) + "...",
        filename: data.filename,
        duration: Math.floor((new Date() - data.startTime) / 1000),
        ip: data.ip,
      })),
      waiting: this.waiting.map((item, index) => ({
        position: index + 1,
        sessionId: item.sessionId.substring(0, 8) + "...",
        filename: item.filename,
        waitTime: Math.floor((new Date() - item.queuedAt) / 1000),
      })),
      stats: {
        activeCount: this.active.size,
        waitingCount: this.waiting.length,
        maxConcurrent: MAX_CONCURRENT_DOWNLOADS,
      },
    };
  },
};

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// Serve media from BRANDIFICATION subfolders
app.use(
  "/streams",
  express.static(path.join(__dirname, "../BRANDIFICATION/streams"))
);
app.use(
  "/images",
  express.static(path.join(__dirname, "../BRANDIFICATION/Images"))
);
app.use(
  "/videos-dir",
  express.static(path.join(__dirname, "../BRANDIFICATION/Videos"))
);

// Helper function to get video files
const getVideoFiles = () => {
  const brandificationPath = path.join(__dirname, "../BRANDIFICATION");
  const videosPath = path.join(__dirname, "../BRANDIFICATION/Videos");
  const videoExtensions = [".mp4", ".webm", ".ogg"];

  const videos = [];

  try {
    // Scan root BRANDIFICATION folder
    const rootFiles = fs.readdirSync(brandificationPath);
    rootFiles.forEach((file) => {
      const filePath = path.join(brandificationPath, file);
      const stat = fs.statSync(filePath);
      if (
        stat.isFile() &&
        videoExtensions.some((ext) => file.toLowerCase().endsWith(ext))
      ) {
        videos.push({ filename: file, location: "root" });
      }
    });

    // Scan Videos subfolder
    if (fs.existsSync(videosPath)) {
      const videoFiles = fs.readdirSync(videosPath);
      videoFiles.forEach((file) => {
        if (videoExtensions.some((ext) => file.toLowerCase().endsWith(ext))) {
          videos.push({ filename: file, location: "Videos" });
        }
      });
    }
  } catch (error) {
    console.error("Error reading video directories:", error);
  }

  return videos;
};

// Helper function to get image files
const getImageFiles = () => {
  const imagesPath = path.join(__dirname, "../BRANDIFICATION/Images");
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

  try {
    if (!fs.existsSync(imagesPath)) {
      return [];
    }

    const files = fs.readdirSync(imagesPath);
    return files.filter((file) =>
      imageExtensions.some((ext) => file.toLowerCase().endsWith(ext))
    );
  } catch (error) {
    console.error("Error reading Images directory:", error);
    return [];
  }
};

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// RTSP Stream Management Endpoints
app.get("/api/streams", (req, res) => {
  if (!rtspManager) {
    return res.json({ streams: [], message: "RTSP streaming disabled" });
  }

  const status = rtspManager.getStreamStatus();
  res.json({ streams: status, count: status.length });
});

app.post("/api/streams/:streamId/start", (req, res) => {
  if (!rtspManager) {
    return res.status(503).json({ error: "RTSP streaming disabled" });
  }

  const { streamId } = req.params;
  const { url, name } = req.body;

  if (!url || !name) {
    return res.status(400).json({ error: "URL and name required" });
  }

  const started = rtspManager.startStream(streamId, url, name);
  if (started) {
    res.json({
      success: true,
      streamId,
      playlistUrl: rtspManager.getPlaylistUrl(streamId),
    });
  } else {
    res.status(409).json({ error: "Stream already running" });
  }
});

app.post("/api/streams/:streamId/stop", (req, res) => {
  if (!rtspManager) {
    return res.status(503).json({ error: "RTSP streaming disabled" });
  }

  const { streamId } = req.params;
  const stopped = rtspManager.stopStream(streamId);

  if (stopped) {
    res.json({ success: true, streamId });
  } else {
    res.status(404).json({ error: "Stream not found" });
  }
});

app.get("/api/streams/:streamId/playlist", (req, res) => {
  if (!rtspManager) {
    return res.status(503).json({ error: "RTSP streaming disabled" });
  }

  const { streamId } = req.params;
  res.json({ playlistUrl: rtspManager.getPlaylistUrl(streamId) });
});

// RTMP Worker Thread Endpoints
app.get("/api/rtmp/streams", async (req, res) => {
  if (!rtmpWorker) {
    return res.json({
      streams: [],
      message: "RTMP ingest disabled",
      workerStatus: rtmpWorkerStatus,
    });
  }

  // Request streams from worker thread
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(
        res.status(503).json({
          error: "Worker timeout",
          workerStatus: rtmpWorkerStatus,
        })
      );
    }, 5000);

    const messageHandler = (message) => {
      if (message.type === "streams_list") {
        clearTimeout(timeout);
        rtmpWorker.off("message", messageHandler);
        resolve(
          res.json({
            streams: message.data.streams,
            count: message.data.count,
            workerStatus: rtmpWorkerStatus,
          })
        );
      }
    };

    rtmpWorker.on("message", messageHandler);
    rtmpWorker.postMessage({ command: "get_streams" });
  });
});

app.get("/api/rtmp/url/:streamKey", async (req, res) => {
  if (!rtmpWorker) {
    return res.status(503).json({
      error: "RTMP ingest disabled",
      workerStatus: rtmpWorkerStatus,
    });
  }

  const { streamKey } = req.params;

  // Request stream URL from worker thread
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(res.status(503).json({ error: "Worker timeout" }));
    }, 5000);

    const messageHandler = (message) => {
      if (
        message.type === "stream_url" &&
        message.data.streamKey === streamKey
      ) {
        clearTimeout(timeout);
        rtmpWorker.off("message", messageHandler);
        const urls = message.data.urls;
        resolve(
          res.json({
            streamKey,
            rtmpUrl: urls.rtmp,
            hlsUrl: urls.hls,
            obsSettings: {
              server: urls.rtmp.split("/").slice(0, -1).join("/"),
              streamKey: streamKey,
            },
            workerStatus: rtmpWorkerStatus,
          })
        );
      }
    };

    rtmpWorker.on("message", messageHandler);
    rtmpWorker.postMessage({ command: "get_url", data: { streamKey } });
  });
});

// Worker status endpoint
app.get("/api/rtmp/worker-status", (req, res) => {
  res.json({
    enabled: rtmpWorker !== null,
    status: rtmpWorkerStatus,
    threadId: rtmpWorker ? rtmpWorker.threadId : null,
  });
});

// Documentation endpoints
app.get("/api/docs", (req, res) => {
  const docsPath = path.join(__dirname, "../docs");
  try {
    const files = fs.readdirSync(docsPath);
    const mdFiles = files
      .filter((file) => file.endsWith(".md"))
      .map((file) => ({
        name: file,
        title: file.replace(".md", "").replace(/-/g, " "),
        url: `/docs/${file}`,
      }));
    res.json({ docs: mdFiles, count: mdFiles.length });
  } catch (error) {
    console.error("Error reading docs directory:", error);
    res.status(500).json({ error: "Failed to read documentation" });
  }
});

// Serve markdown files from docs folder
app.use("/docs", express.static(path.join(__dirname, "../docs")));

app.get("/api/videos", (req, res) => {
  try {
    const videos = getVideoFiles();
    const brandificationPath = path.join(__dirname, "../BRANDIFICATION");

    // Get file sizes for each video
    const videosWithSize = videos.map((videoInfo) => {
      try {
        const filePath =
          videoInfo.location === "root"
            ? path.join(brandificationPath, videoInfo.filename)
            : path.join(
                brandificationPath,
                videoInfo.location,
                videoInfo.filename
              );
        const stats = fs.statSync(filePath);
        return {
          filename: videoInfo.filename,
          location: videoInfo.location,
          size: stats.size,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        };
      } catch (error) {
        console.error(`Error getting stats for ${videoInfo.filename}:`, error);
        return {
          filename: videoInfo.filename,
          location: videoInfo.location,
          size: 0,
          sizeMB: "0.00",
        };
      }
    });

    res.json({ videos: videosWithSize, count: videosWithSize.length });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

app.get("/api/images", (req, res) => {
  try {
    const images = getImageFiles();
    const imagesPath = path.join(__dirname, "../BRANDIFICATION/Images");

    // Get file sizes for each image
    const imagesWithSize = images.map((filename) => {
      try {
        const filePath = path.join(imagesPath, filename);
        const stats = fs.statSync(filePath);
        return {
          filename: filename,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2),
          url: `/images/${filename}`,
        };
      } catch (error) {
        console.error(`Error getting stats for ${filename}:`, error);
        return {
          filename: filename,
          size: 0,
          sizeKB: "0.00",
          url: `/images/${filename}`,
        };
      }
    });

    res.json({ images: imagesWithSize, count: imagesWithSize.length });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

app.get("/api/public", (req, res) => {
  try {
    const publicPath = path.join(__dirname, "../public");
    const files = fs.readdirSync(publicPath);
    const fileList = files.map((file) => {
      const filePath = path.join(publicPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        isDirectory: stats.isDirectory(),
        modified: stats.mtime,
      };
    });
    res.json({ files: fileList, count: fileList.length });
  } catch (error) {
    console.error("Error reading public directory:", error);
    res.status(500).json({ error: "Failed to read public directory" });
  }
});

// Viewing Queue Endpoints
app.post("/api/queue/join", (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress;
    const result = viewingQueue.generateTicket(clientIp);
    console.log(
      `🎫 New ticket issued: ${result.ticketId} - Status: ${result.status}`
    );
    res.json(result);
  } catch (error) {
    console.error("Error joining queue:", error);
    res.status(500).json({ error: "Failed to join queue" });
  }
});

app.get("/api/queue/check/:ticketId", (req, res) => {
  try {
    const { ticketId } = req.params;
    const result = viewingQueue.checkTicket(ticketId);
    res.json(result);
  } catch (error) {
    console.error("Error checking ticket:", error);
    res.status(500).json({ error: "Failed to check ticket" });
  }
});

app.get("/api/queue/status", (req, res) => {
  try {
    const status = viewingQueue.getQueueStatus();
    res.json(status);
  } catch (error) {
    console.error("Error fetching queue status:", error);
    res.status(500).json({ error: "Failed to fetch queue status" });
  }
});

// Get download queue status
app.get("/api/download-status", (req, res) => {
  try {
    const status = downloadQueue.getStatus();
    res.json(status);
  } catch (error) {
    console.error("Error fetching download status:", error);
    res.status(500).json({ error: "Failed to fetch download status" });
  }
});

app.get("/videos/:filename", (req, res) => {
  const filename = req.params.filename;

  // Check if ticket is provided and valid
  const ticketId = req.query.ticket;
  if (!ticketId) {
    return res
      .status(403)
      .json({ error: "Access denied", message: "Valid ticket required" });
  }

  const ticketStatus = viewingQueue.checkTicket(ticketId);
  if (ticketStatus.status !== "active") {
    return res.status(403).json({
      error: "Access denied",
      message:
        ticketStatus.status === "queued"
          ? `Please wait in queue. Position: ${ticketStatus.position}`
          : "Ticket expired or invalid",
    });
  }

  // Block direct downloads - only allow streaming (range requests)
  const userAgent = req.headers["user-agent"] || "";
  const isDownloadAttempt =
    req.headers["content-disposition"] ||
    userAgent.includes("wget") ||
    userAgent.includes("curl") ||
    (!req.headers.range && !userAgent.includes("Mozilla"));

  if (isDownloadAttempt) {
    return res
      .status(403)
      .json({ error: "Downloads not allowed", message: "Streaming only" });
  }

  // Basic security: prevent path traversal
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  const videoPath = path.join(__dirname, "../BRANDIFICATION", filename);

  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: "Video not found" });
  }

  // Generate session ID for this download
  const sessionId = `${req.ip}-${filename}-${Date.now()}`;
  const clientIp = req.ip || req.connection.remoteAddress;

  // Add to queue
  const queueStatus = downloadQueue.addToQueue(sessionId, filename, clientIp);

  // If queued, return 503 with queue position
  if (queueStatus.status === "queued") {
    return res.status(503).json({
      error: "Download queue full",
      message: `You are in queue position ${queueStatus.position}`,
      position: queueStatus.position,
      queueStatus: downloadQueue.getStatus(),
    });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Track when download completes or connection closes
  const cleanupDownload = () => {
    downloadQueue.removeFromActive(sessionId);
    console.log(
      `📤 Download completed/closed: ${filename} (${sessionId.substring(
        0,
        12
      )}...)`
    );
  };

  res.on("finish", cleanupDownload);
  res.on("close", cleanupDownload);
  res.on("error", cleanupDownload);

  console.log(
    `📥 Download started: ${filename} (${sessionId.substring(
      0,
      12
    )}...) - Active: ${downloadQueue.active.size}/${MAX_CONCURRENT_DOWNLOADS}`
  );

  if (range) {
    // Handle range requests for video seeking
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Serve entire file
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Cache-Control": "public, max-age=3600",
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Serve React app for all other routes - always use public/index.html (zero-build architecture)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving videos from BRANDIFICATION folder`);
  const videos = getVideoFiles();
  console.log(`📺 Available videos (${videos.length}):`);
  videos.forEach((v) => {
    console.log(
      `   📹 ${v.location === "root" ? "" : v.location + "/"}${v.filename}`
    );
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");

  if (rtspManager) {
    rtspManager.stopAllStreams();
  }

  if (rtmpWorker) {
    console.log("🧵 Terminating RTMP Worker...");
    rtmpWorker.postMessage({ command: "shutdown" });
    setTimeout(() => {
      rtmpWorker.terminate();
    }, 2000);
  }

  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, shutting down...");

  if (rtspManager) {
    rtspManager.stopAllStreams();
  }

  if (rtmpWorker) {
    console.log("🧵 Terminating RTMP Worker...");
    rtmpWorker.postMessage({ command: "shutdown" });
    setTimeout(() => {
      rtmpWorker.terminate();
    }, 2000);
  }

  process.exit(0);
});
