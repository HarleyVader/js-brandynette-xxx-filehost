import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 6969;

// Middleware
app.use(cors());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Helper function to get video files
const getVideoFiles = () => {
    const brandificationPath = path.join(__dirname, '../BRANDIFICATION');
    try {
        const files = fs.readdirSync(brandificationPath);
        return files.filter(file =>
            file.toLowerCase().endsWith('.mp4') ||
            file.toLowerCase().endsWith('.webm') ||
            file.toLowerCase().endsWith('.ogg')
        );
    } catch (error) {
        console.error('Error reading BRANDIFICATION directory:', error);
        return [];
    }
};

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/videos', (req, res) => {
    try {
        const videos = getVideoFiles();
        res.json({ videos, count: videos.length });
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
});

app.get('/api/public', (req, res) => {
    try {
        const publicPath = path.join(__dirname, '../public');
        const files = fs.readdirSync(publicPath);
        const fileList = files.map(file => {
            const filePath = path.join(publicPath, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                size: stats.size,
                isDirectory: stats.isDirectory(),
                modified: stats.mtime
            };
        });
        res.json({ files: fileList, count: fileList.length });
    } catch (error) {
        console.error('Error reading public directory:', error);
        res.status(500).json({ error: 'Failed to read public directory' });
    }
});

app.get('/videos/:filename', (req, res) => {
    const filename = req.params.filename;

    // Basic security: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Invalid filename' });
    }

    const videoPath = path.join(__dirname, '../BRANDIFICATION', filename);

    // Check if file exists
    if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ error: 'Video not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        // Handle range requests for video seeking
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        // Serve entire file
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
            'Cache-Control': 'public, max-age=3600',
        };
        res.writeHead(200, head);
        fs.createReadStream(videoPath).pipe(res);
    }
});

// Serve React app for all other routes (only in production)
app.get('*', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    } else {
        // In development, serve the public index.html directly
        res.sendFile(path.join(__dirname, '../public/index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Serving videos from BRANDIFICATION folder`);
    console.log(`📺 Available videos: ${getVideoFiles().join(', ')}`);
});
