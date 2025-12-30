/**
 * RTMP Worker Thread
 *
 * Dedicated worker thread for handling RTMP stream ingest and HLS transcoding.
 * Runs in isolation from the main Express server to prevent blocking.
 *
 * @module rtmp-worker
 * @description This worker handles all RTMP streaming operations including:
 * - Accepting streams from OBS/vMix/streaming software
 * - FFmpeg transcoding to HLS format
 * - Stream lifecycle management (start/stop/monitoring)
 * - Event reporting back to main thread
 *
 * @see {@link https://nodejs.org/api/worker_threads.html} Node.js Worker Threads
 */

import { parentPort, workerData } from "worker_threads";
import RTMPIngestServer from "./rtmp-server.js";

/**
 * Worker initialization
 * Receives configuration from main thread via workerData
 */
const config = workerData;
let rtmpServer = null;

/**
 * Send message to main thread
 * @param {string} type - Message type (status, error, stream_event)
 * @param {Object} data - Message payload
 */
function sendToMainThread(type, data) {
  if (parentPort) {
    parentPort.postMessage({ type, data, timestamp: new Date().toISOString() });
  }
}

/**
 * Initialize and start RTMP server in worker thread
 */
try {
  console.log("[RTMP Worker] Initializing RTMP server...");
  sendToMainThread("status", { state: "initializing", config });

  rtmpServer = new RTMPIngestServer(config);

  // Wrap the start method to capture events
  const originalStart = rtmpServer.start.bind(rtmpServer);
  rtmpServer.start = function () {
    try {
      originalStart();
      sendToMainThread("status", {
        state: "running",
        rtmpPort: config.rtmpPort,
        httpPort: config.httpPort,
        message: "RTMP Ingest Server started successfully",
      });
    } catch (error) {
      sendToMainThread("error", {
        message: "Failed to start RTMP server",
        error: error.message,
        stack: error.stack,
      });
    }
  };

  // Start the server
  rtmpServer.start();

  // Set up periodic stream status reporting (every 10 seconds)
  setInterval(() => {
    if (rtmpServer) {
      const streams = rtmpServer.getActiveStreams();
      sendToMainThread("stream_status", {
        streams,
        count: streams.length,
        uptime: process.uptime(),
      });
    }
  }, 10000);
} catch (error) {
  console.error("[RTMP Worker] Initialization error:", error);
  sendToMainThread("error", {
    message: "Worker initialization failed",
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
}

/**
 * Handle messages from main thread
 * Commands: status, get_streams, get_url, shutdown
 */
if (parentPort) {
  parentPort.on("message", (message) => {
    const { command, data } = message;

    try {
      switch (command) {
        case "status":
          // Return current server status
          sendToMainThread("status", {
            state: rtmpServer ? "running" : "stopped",
            activeStreams: rtmpServer
              ? rtmpServer.getActiveStreams().length
              : 0,
            workerUptime: process.uptime(),
          });
          break;

        case "get_streams":
          // Return list of active streams
          if (rtmpServer) {
            const streams = rtmpServer.getActiveStreams();
            sendToMainThread("streams_list", {
              streams,
              count: streams.length,
            });
          } else {
            sendToMainThread("error", {
              message: "RTMP server not initialized",
            });
          }
          break;

        case "get_url":
          // Get stream URLs for a specific stream key
          if (rtmpServer && data?.streamKey) {
            const urls = rtmpServer.getStreamUrl(data.streamKey);
            sendToMainThread("stream_url", { streamKey: data.streamKey, urls });
          } else {
            sendToMainThread("error", {
              message: "Invalid stream key or server not initialized",
            });
          }
          break;

        case "shutdown":
          // Graceful shutdown
          console.log("[RTMP Worker] Shutdown requested");
          if (rtmpServer) {
            rtmpServer.stop();
          }
          sendToMainThread("status", {
            state: "stopped",
            message: "Worker shutting down",
          });
          process.exit(0);
          break;

        default:
          sendToMainThread("error", { message: `Unknown command: ${command}` });
      }
    } catch (error) {
      sendToMainThread("error", {
        message: `Error handling command: ${command}`,
        error: error.message,
        stack: error.stack,
      });
    }
  });
}

/**
 * Graceful shutdown on worker termination
 */
process.on("SIGINT", () => {
  console.log("[RTMP Worker] SIGINT received, shutting down...");
  if (rtmpServer) {
    rtmpServer.stop();
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("[RTMP Worker] SIGTERM received, shutting down...");
  if (rtmpServer) {
    rtmpServer.stop();
  }
  process.exit(0);
});

// Keep worker alive
console.log("[RTMP Worker] Worker thread running, PID:", process.pid);
