import NodeMediaServer from "node-media-server";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * RTMP Ingest Server
 *
 * Receives live streams FROM external streaming software (OBS Studio, vMix, etc.)
 * and automatically transcodes them to HLS format for browser playback.
 *
 * @class RTMPIngestServer
 * @description This is a PUSH model server - it RECEIVES streams from broadcasting
 * software, unlike RTSP which PULLS from IP cameras. Both output HLS for browsers.
 *
 * @example
 * // Basic usage in server.js:
 * const rtmpServer = new RTMPIngestServer({
 *   rtmpPort: 1935,              // RTMP ingest port (OBS streams here)
 *   httpPort: 8000,              // HLS HTTP server port
 *   ffmpegPath: 'ffmpeg',        // Path to FFmpeg binary
 *   mediaRoot: './BRANDIFICATION', // Where to save HLS files
 *   validateStreamKey: false,    // Optional stream key validation
 *   validStreamKeys: []          // Allowed stream keys (if validation enabled)
 * });
 * rtmpServer.start();
 *
 * @example
 * // OBS Studio Configuration:
 * // Server: rtmp://localhost:1935/live
 * // Stream Key: mystreamkey
 * // Output URL: http://localhost:8000/live/mystreamkey/index.m3u8
 *
 * @see {@link https://github.com/illuspas/Node-Media-Server} Node-Media-Server
 * @see {@link https://obsproject.com/} OBS Studio
 */
class RTMPIngestServer {
  /**
   * Creates an RTMP Ingest Server instance
   *
   * @constructor
   * @param {Object} config - Server configuration object
   * @param {number} [config.rtmpPort=1935] - RTMP ingest port (standard is 1935)
   * @param {number} [config.httpPort=8000] - HLS HTTP server port
   * @param {string} [config.ffmpegPath='ffmpeg'] - Path to FFmpeg binary
   * @param {string} [config.mediaRoot='./public'] - Root directory for HLS output
   * @param {boolean} [config.validateStreamKey=false] - Enable stream key validation
   * @param {string[]} [config.validStreamKeys=[]] - Array of valid stream keys
   *
   * @property {Object} config - Stored configuration
   * @property {NodeMediaServer|null} nms - Node-Media-Server instance
   * @property {Map<string, Object>} activeStreams - Map of active stream keys to metadata
   */
  constructor(config) {
    this.config = config;
    this.nms = null; // Node-Media-Server instance (initialized in start())

    /**
     * Map of active streams
     * @type {Map<string, {startTime: Date, app: string, name: string, id: string}>}
     */
    this.activeStreams = new Map();
  }

  /**
   * Starts the RTMP ingest server and HLS HTTP server
   *
   * @method start
   * @description Initializes and starts both the RTMP ingest server (for receiving
   * streams) and the HTTP server (for serving HLS playlists/segments). Sets up event
   * handlers for stream lifecycle management.
   *
   * @fires preConnect - Client connects to RTMP server
   * @fires postConnect - Client connection established
   * @fires doneConnect - Client connection completed
   * @fires prePublish - Stream publish begins (validates stream key here)
   * @fires postPublish - Stream publish started
   * @fires donePublish - Stream publish ended
   *
   * @throws {Error} If FFmpeg binary not found or ports already in use
   *
   * @example
   * rtmpServer.start();
   * // Console output:
   * // 📡 RTMP Ingest Server running on port 1935
   * // 🌐 HLS HTTP Server running on port 8000
   * // 📺 Stream to: rtmp://localhost:1935/live/{YOUR_STREAM_KEY}
   * // 🎬 Watch HLS at: http://localhost:8000/live/{YOUR_STREAM_KEY}/index.m3u8
   */
  start() {
    // Configure Node-Media-Server for RTMP → HLS transcoding
    const rtmpConfig = {
      rtmp: {
        port: this.config.rtmpPort || 1935,
        chunk_size: 60000, // RTMP chunk size (bytes)
        gop_cache: true, // Cache GOP (Group of Pictures) for faster startup
        ping: 30, // Ping interval (seconds)
        ping_timeout: 60, // Ping timeout (seconds)
      },
      http: {
        port: this.config.httpPort || 8000,
        allow_origin: "*", // CORS - allow all origins for HLS playback
        mediaroot: path.resolve(
          __dirname,
          "..",
          this.config.mediaRoot || "./public"
        ),
      },
      trans: {
        ffmpeg: this.config.ffmpegPath || "ffmpeg",
        tasks: [
          {
            app: "live", // RTMP application name (rtmp://server/live/key)
            hls: true, // Enable HLS transcoding
            hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
            hlsKeep: true, // Keep segments for on-demand viewing
            dash: false, // Disable MPEG-DASH (we only need HLS)
          },
        ],
      },
    };

    this.nms = new NodeMediaServer(rtmpConfig);

    /**
     * Event: preConnect
     * Fired when a client attempts to connect to the RTMP server
     * @param {string} id - Connection session ID
     * @param {Object} args - Connection arguments
     */
    this.nms.on("preConnect", (id, args) => {
      console.log(
        "[NodeEvent on preConnect]",
        `id=${id} args=${JSON.stringify(args)}`
      );
    });

    /**
     * Event: postConnect
     * Fired after successful RTMP connection establishment
     * @param {string} id - Connection session ID
     * @param {Object} args - Connection arguments
     */
    this.nms.on("postConnect", (id, args) => {
      console.log(
        "[NodeEvent on postConnect]",
        `id=${id} args=${JSON.stringify(args)}`
      );
    });

    /**
     * Event: doneConnect
     * Fired when RTMP connection is fully established
     * @param {string} id - Connection session ID
     * @param {Object} args - Connection arguments
     */
    this.nms.on("doneConnect", (id, args) => {
      console.log(
        "[NodeEvent on doneConnect]",
        `id=${id} args=${JSON.stringify(args)}`
      );
    });

    /**
     * Event: prePublish
     * Fired when a client attempts to publish a stream
     * This is where stream key validation occurs
     * @param {string} id - Session ID
     * @param {string} StreamPath - Stream path (e.g., /live/mystreamkey)
     * @param {Object} args - Publish arguments
     */
    this.nms.on("prePublish", (id, StreamPath, args) => {
      console.log(
        "[NodeEvent on prePublish]",
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
      );

      // Extract stream key from path (e.g., /live/streamkey -> streamkey)
      const parts = StreamPath.split("/");
      const app = parts[1]; // "live"
      const streamKey = parts[2]; // stream key

      // Optional: Validate stream key against whitelist
      if (this.config.validateStreamKey) {
        const validKeys = this.config.validStreamKeys || [];
        if (validKeys.length > 0 && !validKeys.includes(streamKey)) {
          console.log(`[Rejected] Invalid stream key: ${streamKey}`);
          const session = this.nms.getSession(id);
          session.reject(); // Reject unauthorized stream
          return;
        }
      }

      // Track active stream
      this.activeStreams.set(streamKey, {
        startTime: new Date(),
        app: app,
        name: args.name || streamKey,
        id: id,
      });

      console.log(`✅ Stream started: ${streamKey} (app: ${app})`);
    });

    /**
     * Event: postPublish
     * Fired after stream publishing has started
     * @param {string} id - Session ID
     * @param {string} StreamPath - Stream path
     * @param {Object} args - Publish arguments
     */
    this.nms.on("postPublish", (id, StreamPath, args) => {
      console.log(
        "[NodeEvent on postPublish]",
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
      );
    });

    /**
     * Event: donePublish
     * Fired when stream publishing ends (broadcaster disconnects)
     * @param {string} id - Session ID
     * @param {string} StreamPath - Stream path
     * @param {Object} args - Publish arguments
     */
    this.nms.on("donePublish", (id, StreamPath, args) => {
      console.log(
        "[NodeEvent on donePublish]",
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
      );

      // Extract stream key and remove from active streams
      const parts = StreamPath.split("/");
      const streamKey = parts[2];

      this.activeStreams.delete(streamKey);
      console.log(`⏹️ Stream ended: ${streamKey}`);
    });

    // Start the Node-Media-Server
    this.nms.run();

    // Log server URLs for easy reference
    console.log(
      `📡 RTMP Ingest Server running on port ${rtmpConfig.rtmp.port}`
    );
    console.log(`🌐 HLS HTTP Server running on port ${rtmpConfig.http.port}`);
    console.log(
      `📺 Stream to: rtmp://localhost:${rtmpConfig.rtmp.port}/live/{YOUR_STREAM_KEY}`
    );
    console.log(
      `🎬 Watch HLS at: http://localhost:${rtmpConfig.http.port}/live/{YOUR_STREAM_KEY}/index.m3u8`
    );
  }

  /**
   * Stops the RTMP ingest server and HLS HTTP server
   *
   * @method stop
   * @description Gracefully shuts down the Node-Media-Server instance,
   * disconnecting all active streams and stopping the HTTP server.
   *
   * @example
   * rtmpServer.stop();
   * // Console output: 🛑 RTMP Ingest Server stopped
   */
  stop() {
    if (this.nms) {
      this.nms.stop();
      console.log("🛑 RTMP Ingest Server stopped");
    }
  }

  /**
   * Gets list of all currently active RTMP streams
   *
   * @method getActiveStreams
   * @returns {Array<Object>} Array of active stream objects
   * @returns {string} returns[].streamKey - Stream key identifier
   * @returns {string} returns[].app - RTMP application name (e.g., "live")
   * @returns {string} returns[].name - Stream display name
   * @returns {Date} returns[].startTime - Stream start timestamp
   * @returns {number} returns[].uptime - Stream uptime in seconds
   * @returns {string} returns[].playlistUrl - HLS playlist URL path
   *
   * @example
   * const streams = rtmpServer.getActiveStreams();
   * // [
   * //   {
   * //     streamKey: "mystreamkey",
   * //     app: "live",
   * //     name: "mystreamkey",
   * //     startTime: 2025-12-29T10:30:00.000Z,
   * //     uptime: 3600,
   * //     playlistUrl: "/live/mystreamkey/index.m3u8"
   * //   }
   * // ]
   */
  getActiveStreams() {
    return Array.from(this.activeStreams.entries()).map(([key, data]) => ({
      streamKey: key,
      app: data.app,
      name: data.name,
      startTime: data.startTime,
      uptime: Math.floor((new Date() - data.startTime) / 1000),
      playlistUrl: `/live/${key}/index.m3u8`,
    }));
  }

  /**
   * Gets RTMP and HLS URLs for a specific stream key
   *
   * @method getStreamUrl
   * @param {string} streamKey - The stream key identifier
   * @returns {Object} Object containing RTMP ingest URL and HLS playback URL
   * @returns {string} returns.rtmp - RTMP URL for OBS/streaming software
   * @returns {string} returns.hls - HLS URL for browser playback
   *
   * @example
   * const urls = rtmpServer.getStreamUrl("mystreamkey");
   * // {
   * //   rtmp: "rtmp://localhost:1935/live/mystreamkey",
   * //   hls: "http://localhost:8000/live/mystreamkey/index.m3u8"
   * // }
   *
   * @example
   * // Use in OBS Studio:
   * // Server: rtmp://localhost:1935/live
   * // Stream Key: mystreamkey
   *
   * @example
   * // Play in browser with HLS.js:
   * // const hls = new Hls();
   * // hls.loadSource('http://localhost:8000/live/mystreamkey/index.m3u8');
   */
  getStreamUrl(streamKey) {
    return {
      rtmp: `rtmp://localhost:${
        this.config.rtmpPort || 1935
      }/live/${streamKey}`,
      hls: `http://localhost:${
        this.config.httpPort || 8000
      }/live/${streamKey}/index.m3u8`,
    };
  }
}

export default RTMPIngestServer;
