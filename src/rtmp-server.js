import NodeMediaServer from "node-media-server";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * RTMP Ingest Server
 * Receives streams from OBS/streaming software and outputs HLS for browser playback
 */
class RTMPIngestServer {
  constructor(config) {
    this.config = config;
    this.nms = null;
    this.activeStreams = new Map(); // Map<streamKey, { startTime, app, name }>
  }

  start() {
    const rtmpConfig = {
      rtmp: {
        port: this.config.rtmpPort || 1935,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
      },
      http: {
        port: this.config.httpPort || 8000,
        allow_origin: "*",
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
            app: "live",
            hls: true,
            hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
            hlsKeep: true, // Keep segments for on-demand viewing
            dash: false,
          },
        ],
      },
    };

    this.nms = new NodeMediaServer(rtmpConfig);

    // Event handlers
    this.nms.on("preConnect", (id, args) => {
      console.log(
        "[NodeEvent on preConnect]",
        `id=${id} args=${JSON.stringify(args)}`
      );
    });

    this.nms.on("postConnect", (id, args) => {
      console.log(
        "[NodeEvent on postConnect]",
        `id=${id} args=${JSON.stringify(args)}`
      );
    });

    this.nms.on("doneConnect", (id, args) => {
      console.log(
        "[NodeEvent on doneConnect]",
        `id=${id} args=${JSON.stringify(args)}`
      );
    });

    this.nms.on("prePublish", (id, StreamPath, args) => {
      console.log(
        "[NodeEvent on prePublish]",
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
      );

      // Extract stream key from path (e.g., /live/streamkey -> streamkey)
      const parts = StreamPath.split("/");
      const app = parts[1]; // "live"
      const streamKey = parts[2]; // stream key

      // Optional: Validate stream key here
      if (this.config.validateStreamKey) {
        const validKeys = this.config.validStreamKeys || [];
        if (validKeys.length > 0 && !validKeys.includes(streamKey)) {
          console.log(`[Rejected] Invalid stream key: ${streamKey}`);
          const session = this.nms.getSession(id);
          session.reject();
          return;
        }
      }

      this.activeStreams.set(streamKey, {
        startTime: new Date(),
        app: app,
        name: args.name || streamKey,
        id: id,
      });

      console.log(`✅ Stream started: ${streamKey} (app: ${app})`);
    });

    this.nms.on("postPublish", (id, StreamPath, args) => {
      console.log(
        "[NodeEvent on postPublish]",
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
      );
    });

    this.nms.on("donePublish", (id, StreamPath, args) => {
      console.log(
        "[NodeEvent on donePublish]",
        `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`
      );

      const parts = StreamPath.split("/");
      const streamKey = parts[2];

      this.activeStreams.delete(streamKey);
      console.log(`⏹️ Stream ended: ${streamKey}`);
    });

    this.nms.run();
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

  stop() {
    if (this.nms) {
      this.nms.stop();
      console.log("🛑 RTMP Ingest Server stopped");
    }
  }

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
