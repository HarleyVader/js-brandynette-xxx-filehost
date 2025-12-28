import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 6969;

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

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

// Helper function to get video files
const getVideoFiles = () => {
  const brandificationPath = path.join(__dirname, "../BRANDIFICATION");
  try {
    const files = fs.readdirSync(brandificationPath);
    return files.filter(
      (file) =>
        file.toLowerCase().endsWith(".mp4") ||
        file.toLowerCase().endsWith(".webm") ||
        file.toLowerCase().endsWith(".ogg")
    );
  } catch (error) {
    console.error("Error reading BRANDIFICATION directory:", error);
    return [];
  }
};

// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/videos", (req, res) => {
  try {
    const videos = getVideoFiles();
    const brandificationPath = path.join(__dirname, "../BRANDIFICATION");

    // Get file sizes for each video
    const videosWithSize = videos.map((filename) => {
      try {
        const filePath = path.join(brandificationPath, filename);
        const stats = fs.statSync(filePath);
        return {
          filename: filename,
          size: stats.size,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        };
      } catch (error) {
        console.error(`Error getting stats for ${filename}:`, error);
        return {
          filename: filename,
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
  console.log(`📺 Available videos: ${getVideoFiles().join(", ")}`);
});
