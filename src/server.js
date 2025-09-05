import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 6969;

// Middleware
app.use(cors());
app.use(express.json()); // Add JSON parsing for API requests

// Gravatar Configuration
const GRAVATAR_API_KEY = process.env.GRAVATAR_API_KEY;
const GRAVATAR_BASE_URL = process.env.GRAVATAR_BASE_URL || 'https://secure.gravatar.com';

// Social Media Platforms Configuration
const SOCIAL_PLATFORMS = {
    twitter: {
        name: 'Twitter/X',
        icon: '🐦',
        baseUrl: 'https://twitter.com/',
        apiUrl: 'https://api.twitter.com/2/',
        loginUrl: 'https://twitter.com/i/oauth2/authorize',
        color: '#1da1f2'
    },
    instagram: {
        name: 'Instagram',
        icon: '📸',
        baseUrl: 'https://instagram.com/',
        apiUrl: 'https://graph.instagram.com/',
        loginUrl: 'https://api.instagram.com/oauth/authorize',
        color: '#e4405f'
    },
    youtube: {
        name: 'YouTube',
        icon: '📺',
        baseUrl: 'https://youtube.com/',
        apiUrl: 'https://www.googleapis.com/youtube/v3/',
        loginUrl: 'https://accounts.google.com/oauth2/auth',
        color: '#ff0000'
    },
    twitch: {
        name: 'Twitch',
        icon: '🎮',
        baseUrl: 'https://twitch.tv/',
        apiUrl: 'https://api.twitch.tv/helix/',
        loginUrl: 'https://id.twitch.tv/oauth2/authorize',
        color: '#9146ff'
    },
    github: {
        name: 'GitHub',
        icon: '🐙',
        baseUrl: 'https://github.com/',
        apiUrl: 'https://api.github.com/',
        loginUrl: 'https://github.com/login/oauth/authorize',
        color: '#333333'
    },
    linkedin: {
        name: 'LinkedIn',
        icon: '💼',
        baseUrl: 'https://linkedin.com/in/',
        apiUrl: 'https://api.linkedin.com/v2/',
        loginUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        color: '#0077b5'
    },
    tiktok: {
        name: 'TikTok',
        icon: '🎵',
        baseUrl: 'https://tiktok.com/@',
        apiUrl: 'https://open-api.tiktok.com/',
        loginUrl: 'https://www.tiktok.com/auth/authorize/',
        color: '#ff0050'
    },
    discord: {
        name: 'Discord',
        icon: '🎯',
        baseUrl: 'https://discord.com/users/',
        apiUrl: 'https://discord.com/api/v10/',
        loginUrl: 'https://discord.com/api/oauth2/authorize',
        color: '#5865f2'
    },
    spotify: {
        name: 'Spotify',
        icon: '🎶',
        baseUrl: 'https://open.spotify.com/user/',
        apiUrl: 'https://api.spotify.com/v1/',
        loginUrl: 'https://accounts.spotify.com/authorize',
        color: '#1db954'
    },
    facebook: {
        name: 'Facebook',
        icon: '📘',
        baseUrl: 'https://facebook.com/',
        apiUrl: 'https://graph.facebook.com/',
        loginUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        color: '#1877f2'
    },
    reddit: {
        name: 'Reddit',
        icon: '🔴',
        baseUrl: 'https://reddit.com/u/',
        apiUrl: 'https://oauth.reddit.com/',
        loginUrl: 'https://www.reddit.com/api/v1/authorize',
        color: '#ff4500'
    }
};

// In-memory storage for user sessions and social connections
const userSessions = new Map();
const socialConnections = new Map();

// Gravatar helper functions
const createGravatarHash = (email) => {
    // Process the email properly (trim and lowercase)
    const processedEmail = email.trim().toLowerCase();
    // Create SHA256 hash as per Gravatar v3 API
    return crypto.createHash('sha256').update(processedEmail).digest('hex');
};

const getGravatarAvatarUrl = (email, size = 200, defaultImg = 'mp') => {
    const hash = createGravatarHash(email);
    return `${GRAVATAR_BASE_URL}/avatar/${hash}?s=${size}&d=${defaultImg}`;
};

const getGravatarProfileUrl = (email) => {
    const hash = createGravatarHash(email);
    return `https://api.gravatar.com/v3/profiles/${hash}`;
};

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

// Gravatar API endpoints
app.get('/api/gravatar/avatar/:email', (req, res) => {
    try {
        const { email } = req.params;
        const { size = 200, d = 'mp' } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const avatarUrl = getGravatarAvatarUrl(email, size, d);
        const hash = createGravatarHash(email);

        res.json({
            email: email,
            hash: hash,
            avatar_url: avatarUrl,
            size: parseInt(size),
            default: d
        });
    } catch (error) {
        console.error('Error generating avatar URL:', error);
        res.status(500).json({ error: 'Failed to generate avatar URL' });
    }
});

app.get('/api/gravatar/profile/:email', async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const hash = createGravatarHash(email);
        const profileUrl = getGravatarProfileUrl(email);

        // Headers for authenticated requests (if API key is available)
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Brandynette-VideoHost/1.0.0'
        };

        if (GRAVATAR_API_KEY) {
            headers['Authorization'] = `Bearer ${GRAVATAR_API_KEY}`;
        }

        try {
            const response = await fetch(profileUrl, { headers });

            if (response.ok) {
                const profileData = await response.json();
                res.json({
                    success: true,
                    profile: profileData,
                    avatar_url: getGravatarAvatarUrl(email)
                });
            } else if (response.status === 404) {
                // Profile not found, return basic info with avatar
                res.json({
                    success: false,
                    message: 'Profile not found',
                    email: email,
                    hash: hash,
                    avatar_url: getGravatarAvatarUrl(email),
                    basic_profile: {
                        display_name: email.split('@')[0],
                        avatar_url: getGravatarAvatarUrl(email)
                    }
                });
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (fetchError) {
            console.error('Gravatar API error:', fetchError);
            // Fallback to basic profile
            res.json({
                success: false,
                message: 'Could not fetch profile, showing basic info',
                email: email,
                hash: hash,
                avatar_url: getGravatarAvatarUrl(email),
                basic_profile: {
                    display_name: email.split('@')[0],
                    avatar_url: getGravatarAvatarUrl(email)
                }
            });
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

app.get('/api/gravatar/qr/:email', (req, res) => {
    try {
        const { email } = req.params;
        const { size = 200, version = 3, type = 'user' } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const hash = createGravatarHash(email);
        const qrUrl = `https://api.gravatar.com/v3/qr-code/${hash}?size=${size}&version=${version}&type=${type}`;

        res.json({
            email: email,
            hash: hash,
            qr_url: qrUrl,
            size: parseInt(size),
            version: version,
            type: type
        });
    } catch (error) {
        console.error('Error generating QR code URL:', error);
        res.status(500).json({ error: 'Failed to generate QR code URL' });
    }
});

// Simple user comments storage (in-memory for demo)
let videoComments = {};

// Comment system endpoints
app.get('/api/comments/:videoName', (req, res) => {
    try {
        const { videoName } = req.params;
        const comments = videoComments[videoName] || [];
        res.json({
            video: videoName,
            comments: comments,
            count: comments.length
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

app.post('/api/comments/:videoName', (req, res) => {
    try {
        const { videoName } = req.params;
        const { email, comment, username } = req.body;

        if (!email || !comment) {
            return res.status(400).json({ error: 'Email and comment are required' });
        }

        if (!videoComments[videoName]) {
            videoComments[videoName] = [];
        }

        const newComment = {
            id: Date.now().toString(),
            email: email,
            username: username || email.split('@')[0],
            comment: comment.substring(0, 500), // Limit comment length
            avatar_url: getGravatarAvatarUrl(email, 80),
            timestamp: new Date().toISOString(),
            hash: createGravatarHash(email)
        };

        videoComments[videoName].push(newComment);

        res.status(201).json({
            success: true,
            comment: newComment,
            total_comments: videoComments[videoName].length
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

app.delete('/api/comments/:videoName/:commentId', (req, res) => {
    try {
        const { videoName, commentId } = req.params;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required for comment deletion' });
        }

        if (!videoComments[videoName]) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const commentIndex = videoComments[videoName].findIndex(
            comment => comment.id === commentId && comment.email === email
        );

        if (commentIndex === -1) {
            return res.status(404).json({ error: 'Comment not found or not authorized' });
        }

        videoComments[videoName].splice(commentIndex, 1);

        res.json({
            success: true,
            message: 'Comment deleted',
            total_comments: videoComments[videoName].length
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
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

// Social Media Integration Endpoints

// Get available social platforms
app.get('/api/social/platforms', (req, res) => {
    try {
        const platforms = Object.entries(SOCIAL_PLATFORMS).map(([key, platform]) => ({
            id: key,
            name: platform.name,
            icon: platform.icon,
            color: platform.color,
            baseUrl: platform.baseUrl
        }));

        res.json({
            platforms: platforms,
            count: platforms.length,
            message: 'Available social media platforms for Gravatar integration'
        });
    } catch (error) {
        console.error('Error fetching social platforms:', error);
        res.status(500).json({ error: 'Failed to fetch social platforms' });
    }
});

// Generate OAuth URLs for social media platforms
app.post('/api/social/auth/:platform', (req, res) => {
    try {
        const { platform } = req.params;
        const { email, redirectUri } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required for social authentication' });
        }

        if (!SOCIAL_PLATFORMS[platform]) {
            return res.status(400).json({ error: 'Invalid social platform' });
        }

        const platformConfig = SOCIAL_PLATFORMS[platform];
        const userHash = createGravatarHash(email);
        const sessionId = crypto.randomUUID();

        // Store session for OAuth callback
        userSessions.set(sessionId, {
            email: email,
            platform: platform,
            userHash: userHash,
            timestamp: Date.now(),
            redirectUri: redirectUri || `http://localhost:${PORT}/social/callback`
        });

        // Generate platform-specific OAuth URL
        let authUrl;
        const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`];

        if (!clientId) {
            return res.status(500).json({ error: `${platform.toUpperCase()}_CLIENT_ID not configured` });
        }

        if (platform === 'reddit') {
            authUrl = new URL(platformConfig.loginUrl);
            authUrl.searchParams.append('client_id', clientId);
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('state', sessionId);
            authUrl.searchParams.append('redirect_uri', `http://localhost:${PORT}/api/social/callback/${platform}`);
            authUrl.searchParams.append('duration', 'temporary');
            authUrl.searchParams.append('scope', 'identity read subscribe history');
        } else {
            // Generic OAuth2 flow for other platforms
            authUrl = new URL(platformConfig.loginUrl);
            authUrl.searchParams.append('client_id', clientId);
            authUrl.searchParams.append('redirect_uri', `http://localhost:${PORT}/api/social/callback/${platform}`);
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('scope', 'read');
            authUrl.searchParams.append('state', sessionId);
        }

        res.json({
            platform: platform,
            auth_url: authUrl.toString(),
            session_id: sessionId,
            expires_in: 3600,
            message: `OAuth URL generated for ${platformConfig.name}`
        });
    } catch (error) {
        console.error('Error generating OAuth URL:', error);
        res.status(500).json({ error: 'Failed to generate OAuth URL' });
    }
});

// OAuth callback handler
app.get('/api/social/callback/:platform', async (req, res) => {
    try {
        const { platform } = req.params;
        const { code, state, error } = req.query;

        if (error) {
            return res.status(400).json({ error: `OAuth error: ${error}` });
        }

        if (!state || !userSessions.has(state)) {
            return res.status(400).json({ error: 'Invalid or expired session' });
        }

        const session = userSessions.get(state);
        const platformConfig = SOCIAL_PLATFORMS[platform];

        if (!platformConfig) {
            return res.status(400).json({ error: 'Invalid platform' });
        }

        // In a real implementation, exchange code for access token
        // For demo purposes, we'll simulate a successful connection
        const connectionId = crypto.randomUUID();
        const connection = {
            id: connectionId,
            platform: platform,
            email: session.email,
            userHash: session.userHash,
            connected_at: new Date().toISOString(),
            profile: {
                platform_id: `demo_${platform}_${Date.now()}`,
                username: `${session.email.split('@')[0]}_${platform}`,
                display_name: session.email.split('@')[0],
                profile_url: `${platformConfig.baseUrl}${session.email.split('@')[0]}_${platform}`,
                avatar_url: getGravatarAvatarUrl(session.email),
                verified: true
            },
            permissions: ['read', 'profile'],
            status: 'active'
        };

        // Store connection
        if (!socialConnections.has(session.email)) {
            socialConnections.set(session.email, new Map());
        }
        socialConnections.get(session.email).set(platform, connection);

        // Clean up session
        userSessions.delete(state);

        // Redirect to success page with connection info
        const successUrl = new URL(`http://localhost:${PORT}/`);
        successUrl.searchParams.append('social_connected', platform);
        successUrl.searchParams.append('connection_id', connectionId);

        res.redirect(successUrl.toString());
    } catch (error) {
        console.error('Error handling OAuth callback:', error);
        res.status(500).json({ error: 'OAuth callback failed' });
    }
});

// Get user's social media connections
app.get('/api/social/connections/:email', (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const userConnections = socialConnections.get(email);
        const connections = [];

        if (userConnections) {
            for (const [platform, connection] of userConnections) {
                connections.push({
                    platform: platform,
                    ...connection,
                    platform_info: {
                        name: SOCIAL_PLATFORMS[platform].name,
                        icon: SOCIAL_PLATFORMS[platform].icon,
                        color: SOCIAL_PLATFORMS[platform].color
                    }
                });
            }
        }

        res.json({
            email: email,
            connections: connections,
            count: connections.length,
            gravatar_hash: createGravatarHash(email)
        });
    } catch (error) {
        console.error('Error fetching social connections:', error);
        res.status(500).json({ error: 'Failed to fetch social connections' });
    }
});

// Disconnect from social media platform
app.delete('/api/social/connections/:email/:platform', (req, res) => {
    try {
        const { email, platform } = req.params;

        if (!email || !platform) {
            return res.status(400).json({ error: 'Email and platform are required' });
        }

        const userConnections = socialConnections.get(email);

        if (!userConnections || !userConnections.has(platform)) {
            return res.status(404).json({ error: 'Connection not found' });
        }

        userConnections.delete(platform);

        // If no connections left, remove user entirely
        if (userConnections.size === 0) {
            socialConnections.delete(email);
        }

        res.json({
            success: true,
            message: `Disconnected from ${SOCIAL_PLATFORMS[platform]?.name || platform}`,
            email: email,
            platform: platform
        });
    } catch (error) {
        console.error('Error disconnecting social platform:', error);
        res.status(500).json({ error: 'Failed to disconnect social platform' });
    }
});

// Get user's social media profile aggregation
app.get('/api/social/profile/:email', async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Get Gravatar profile
        const gravatarHash = createGravatarHash(email);
        const profileUrl = getGravatarProfileUrl(email);

        let gravatarProfile = null;
        try {
            const headers = { 'User-Agent': 'js-brandynette-xxx-filehost/2.0.0' };
            if (GRAVATAR_API_KEY) {
                headers['Authorization'] = `Bearer ${GRAVATAR_API_KEY}`;
            }

            const response = await fetch(profileUrl, { headers });
            if (response.ok) {
                gravatarProfile = await response.json();
            }
        } catch (fetchError) {
            console.log('Gravatar profile not available:', fetchError.message);
        }

        // Get social connections
        const userConnections = socialConnections.get(email) || new Map();
        const connections = [];

        for (const [platform, connection] of userConnections) {
            connections.push({
                platform: platform,
                ...connection,
                platform_info: SOCIAL_PLATFORMS[platform]
            });
        }

        // Aggregate profile data
        const aggregatedProfile = {
            email: email,
            gravatar_hash: gravatarHash,
            avatar_url: getGravatarAvatarUrl(email),
            gravatar_profile: gravatarProfile,
            social_connections: connections,
            connection_count: connections.length,
            platforms_available: Object.keys(SOCIAL_PLATFORMS),
            last_updated: new Date().toISOString()
        };

        res.json(aggregatedProfile);
    } catch (error) {
        console.error('Error fetching aggregated profile:', error);
        res.status(500).json({ error: 'Failed to fetch aggregated profile' });
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

// Documentation API endpoints
app.get('/api/docs/files', (req, res) => {
    try {
        const docsPath = path.join(__dirname, '../Docs');

        // Check if Docs directory exists
        if (!fs.existsSync(docsPath)) {
            return res.json({ files: [], count: 0 });
        }

        const files = fs.readdirSync(docsPath);
        const markdownFiles = files.filter(file =>
            file.toLowerCase().endsWith('.md') || file.toLowerCase().endsWith('.markdown')
        );

        res.json({
            files: markdownFiles.sort(),
            count: markdownFiles.length
        });
    } catch (error) {
        console.error('Error reading Docs directory:', error);
        res.status(500).json({ error: 'Failed to read documentation files' });
    }
});

app.get('/api/docs/content/:filename', (req, res) => {
    try {
        const filename = req.params.filename;

        // Basic security: prevent path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(__dirname, '../Docs', filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Documentation file not found' });
        }

        // Read the markdown file
        const content = fs.readFileSync(filePath, 'utf8');

        res.json({
            filename: filename,
            content: content,
            size: content.length
        });
    } catch (error) {
        console.error('Error reading documentation file:', error);
        res.status(500).json({ error: 'Failed to read documentation file' });
    }
});

// Serve docs.html at /docs route
app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/docs.html'));
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
