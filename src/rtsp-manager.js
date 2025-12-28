import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * RTSP Stream Manager
 * Manages real-time streaming from RTSP sources using FFmpeg
 */
class RTSPStreamManager {
  constructor(config) {
    this.config = config;
    this.streams = new Map(); // Map<streamId, { process, url, name, status }>
    this.reconnectAttempts = new Map();

    // Set FFmpeg binary path if provided
    if (config.ffmpegPath) {
      ffmpeg.setFfmpegPath(config.ffmpegPath);
    }

    // Create output directory if it doesn't exist
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    const outputDir = path.resolve(__dirname, "..", this.config.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created stream output directory: ${outputDir}`);
    }
  }

  /**
   * Parse RTSP streams from environment variables
   */
  static parseStreamsFromEnv() {
    const streams = [];
    let index = 1;

    while (process.env[`RTSP_STREAM_${index}`]) {
      const url = process.env[`RTSP_STREAM_${index}`];
      const name = process.env[`RTSP_NAME_${index}`] || `Stream ${index}`;

      streams.push({
        id: `stream${index}`,
        url,
        name,
        enabled: true,
      });

      index++;
    }

    return streams;
  }

  /**
   * Start streaming from an RTSP source
   */
  startStream(streamId, rtspUrl, streamName) {
    if (this.streams.has(streamId)) {
      console.log(`⚠️ Stream ${streamId} is already running`);
      return false;
    }

    const outputDir = path.resolve(__dirname, "..", this.config.outputDir);
    const playlistPath = path.join(outputDir, `${streamId}.m3u8`);
    const segmentPattern = path.join(outputDir, `${streamId}_%03d.ts`);

    console.log(`🎥 Starting RTSP stream: ${streamName} (${streamId})`);
    console.log(`📡 Source: ${this.sanitizeUrl(rtspUrl)}`);
    console.log(`📺 Output: ${playlistPath}`);

    const ffmpegProcess = ffmpeg(rtspUrl)
      .inputOptions([
        "-rtsp_transport",
        "tcp",
        "-analyzeduration",
        "1000000",
        "-probesize",
        "1000000",
      ])
      .outputOptions([
        "-c:v",
        this.config.videoCodec,
        "-preset",
        this.config.preset,
        "-crf",
        this.config.crf,
        "-c:a",
        this.config.audioCodec,
        "-b:a",
        this.config.audioBitrate,
        "-ac",
        "2",
        "-ar",
        "44100",
        "-s",
        this.config.resolution,
        "-r",
        this.config.framerate,
        "-b:v",
        this.config.bitrate,
        "-f",
        "hls",
        "-hls_time",
        this.config.hlsTime,
        "-hls_list_size",
        this.config.hlsListSize,
        "-hls_flags",
        this.config.hlsFlags,
        "-hls_segment_filename",
        segmentPattern,
      ])
      .output(playlistPath)
      .on("start", (commandLine) => {
        if (this.config.debug) {
          console.log(`🔧 FFmpeg command: ${commandLine}`);
        }
      })
      .on("error", (err, stdout, stderr) => {
        console.error(`❌ Stream ${streamId} error:`, err.message);
        if (this.config.debug) {
          console.error("FFmpeg stderr:", stderr);
        }

        this.handleStreamError(streamId, rtspUrl, streamName);
      })
      .on("end", () => {
        console.log(`⏹️ Stream ${streamId} ended`);
        this.streams.delete(streamId);
      });

    // Start the stream
    ffmpegProcess.run();

    this.streams.set(streamId, {
      process: ffmpegProcess,
      url: rtspUrl,
      name: streamName,
      status: "active",
      startedAt: new Date(),
    });

    this.reconnectAttempts.set(streamId, 0);
    return true;
  }

  /**
   * Handle stream errors and attempt reconnection
   */
  handleStreamError(streamId, rtspUrl, streamName) {
    const attempts = this.reconnectAttempts.get(streamId) || 0;
    const maxAttempts = this.config.maxReconnectAttempts;

    if (attempts < maxAttempts) {
      this.reconnectAttempts.set(streamId, attempts + 1);
      const delay = this.config.reconnectDelay;

      console.log(
        `🔄 Reconnecting ${streamId} in ${delay}ms (attempt ${
          attempts + 1
        }/${maxAttempts})...`
      );

      setTimeout(() => {
        this.streams.delete(streamId);
        this.startStream(streamId, rtspUrl, streamName);
      }, delay);
    } else {
      console.error(
        `💔 Stream ${streamId} failed after ${maxAttempts} attempts`
      );
      this.streams.delete(streamId);
      this.reconnectAttempts.delete(streamId);
    }
  }

  /**
   * Stop a specific stream
   */
  stopStream(streamId) {
    const stream = this.streams.get(streamId);
    if (!stream) {
      console.log(`⚠️ Stream ${streamId} not found`);
      return false;
    }

    console.log(`⏹️ Stopping stream: ${streamId}`);
    stream.process.kill("SIGKILL");
    this.streams.delete(streamId);
    this.reconnectAttempts.delete(streamId);

    // Clean up stream files
    this.cleanupStreamFiles(streamId);
    return true;
  }

  /**
   * Stop all active streams
   */
  stopAllStreams() {
    console.log(`⏹️ Stopping all ${this.streams.size} active streams...`);

    for (const [streamId, stream] of this.streams.entries()) {
      stream.process.kill("SIGKILL");
      this.cleanupStreamFiles(streamId);
    }

    this.streams.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Clean up HLS segment files
   */
  cleanupStreamFiles(streamId) {
    const outputDir = path.resolve(__dirname, "..", this.config.outputDir);
    const files = fs.readdirSync(outputDir);

    files.forEach((file) => {
      if (file.startsWith(streamId)) {
        const filePath = path.join(outputDir, file);
        fs.unlinkSync(filePath);
      }
    });
  }

  /**
   * Get status of all streams
   */
  getStreamStatus() {
    const status = [];

    for (const [streamId, stream] of this.streams.entries()) {
      status.push({
        id: streamId,
        name: stream.name,
        status: stream.status,
        url: this.sanitizeUrl(stream.url),
        startedAt: stream.startedAt,
        uptime: Math.floor((new Date() - stream.startedAt) / 1000),
      });
    }

    return status;
  }

  /**
   * Sanitize RTSP URL for logging (hide credentials)
   */
  sanitizeUrl(url) {
    return url.replace(/:\/\/([^:]+):([^@]+)@/, "://***:***@");
  }

  /**
   * Get stream playlist URL
   */
  getPlaylistUrl(streamId) {
    return `/streams/${streamId}.m3u8`;
  }
}

export default RTSPStreamManager;
