# 🎬 Brandynette Video Player - Enhanced with Gravatar

A modern ES6 Express HTTP file server for video streaming with **comprehensive Gravatar integration** including user profiles, avatars, and social commenting features.

## 🚀 New Features (v2.0.0)

### 👤 Gravatar Integration

- **User Avatars**: Automatic avatar display using email addresses
- **Profile Cards**: Rich user profiles with Gravatar data
- **QR Codes**: Generate QR codes for user profiles
- **Comment System**: Social commenting with avatar integration
- **Profile Discovery**: Click avatars to view detailed user profiles

### 🎯 Enhanced User Experience

- **Email-based Authentication**: Simple email input for user identification
- **Interactive Profile Cards**: Hover and click for user details
- **Real-time Comments**: Add, view, and delete comments on videos
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Social Features**: See who's commenting with their Gravatar profiles

## 📋 Prerequisites

- Node.js (v14 or higher)
- NPM or Yarn
- Video files in `.mp4`, `.webm`, or `.ogg` format

## 🛠️ Installation

1. **Clone or download the project**

   ```bash
   git clone <repository-url>
   cd js-brandynette-xxx-filehost
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables** (Optional)

   ```bash
   cp .env.example .env
   # Edit .env and add your Gravatar API key for enhanced features
   ```

4. **Add your video files**

   Place your video files in the `BRANDIFICATION/` folder.

5. **Start the server**

   ```bash
   npm start          # Production mode
   npm run dev        # Development mode with auto-restart
   ```

6. **Open your browser**

   Navigate to `http://localhost:6969`

## 🎮 Usage

### Basic Video Streaming

- Videos are automatically discovered from the `BRANDIFICATION` folder
- Click on video names to switch between different videos
- Full video controls (play, pause, seek, volume)
- HTTP range request support for smooth video seeking

### Gravatar Features

1. **Enter your email** to enable commenting and profile features
2. **View avatars** automatically loaded from Gravatar
3. **Add comments** to any video with your avatar displayed
4. **Click on avatars** to view detailed user profiles
5. **Manage comments** - delete your own comments

### Profile System

- **Automatic Profile Detection**: Enter email to fetch Gravatar profile
- **Rich Profile Data**: Display name, location, bio, verified accounts
- **Fallback Support**: Basic profiles for emails without Gravatar
- **Interactive UI**: Click avatars to toggle profile cards

## 🔧 Configuration

### Environment Variables (.env)

```env
# Gravatar API Configuration
GRAVATAR_API_KEY=your_gravatar_api_key_here

# Server Configuration
PORT=6969
NODE_ENV=development

# Optional: Custom Gravatar domain
GRAVATAR_BASE_URL=https://secure.gravatar.com
```

### Getting a Gravatar API Key

1. Visit [Gravatar Developer Dashboard](https://gravatar.com/developers)
2. Create a new application
3. Copy your API key to `.env` file
4. Enhanced profile data and rate limits with authenticated requests

## 📡 API Endpoints

### Core Video API

- `GET /` - Serve the React application
- `GET /api/videos` - List available videos
- `GET /api/public` - List public folder contents
- `GET /videos/:filename` - Stream video with range support
- `GET /health` - Server health check

### Gravatar API Integration

- `GET /api/gravatar/avatar/:email` - Get avatar URL and hash
- `GET /api/gravatar/profile/:email` - Fetch complete user profile
- `GET /api/gravatar/qr/:email` - Generate profile QR code URL

### Comment System API

- `GET /api/comments/:videoName` - Get comments for a video
- `POST /api/comments/:videoName` - Add new comment
- `DELETE /api/comments/:videoName/:commentId` - Delete comment (own only)

### Example API Usage

```javascript
// Get user avatar
fetch('/api/gravatar/avatar/user@example.com?size=200')
  .then(res => res.json())
  .then(data => console.log(data.avatar_url));

// Fetch user profile
fetch('/api/gravatar/profile/user@example.com')
  .then(res => res.json())
  .then(profile => console.log(profile));

// Add a comment
fetch('/api/comments/video.mp4', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    comment: 'Great video!'
  })
});
```

## 🏗️ Project Structure

```text
js-brandynette-xxx-filehost/
├── .github/
│   └── copilot-instructions.md    # AI development instructions
├── BRANDIFICATION/                # Video files directory
│   └── du-suchst-ein-girl.mp4    # Example video file
├── public/
│   └── index.html                 # Complete React app with Gravatar
├── src/
│   └── server.js                  # Express server with Gravatar API
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git ignore rules
├── package.json                   # Project dependencies
└── README.md                      # This file
```

## 🎨 Features in Detail

### Video Player

- **Custom Controls**: Play, pause, seek, volume control
- **Range Requests**: Efficient video seeking and loading
- **Responsive Design**: Adapts to different screen sizes
- **Loading States**: Visual feedback during video loading
- **Error Handling**: Graceful error messages

### Gravatar Integration

- **SHA256 Hashing**: Proper email hashing per Gravatar v3.0.0 API
- **Avatar Fallbacks**: Default avatars when Gravatar not found
- **Profile Enrichment**: Display names, locations, bios
- **Verified Accounts**: Show verified social media accounts
- **QR Code Generation**: Profile QR codes for easy sharing

### Comment System

- **Real-time Updates**: Comments update immediately
- **User Identification**: Email-based user system
- **Avatar Integration**: Comments show user avatars
- **Moderation**: Users can delete their own comments
- **Character Limits**: 500 character limit with counter
- **Timestamps**: Relative time display (e.g., "2h ago")

### UI/UX Enhancements

- **Glassmorphism**: Backdrop blur effects
- **Smooth Animations**: CSS transitions and hover effects
- **Mobile Responsive**: Touch-friendly interface
- **Dark Theme**: Modern dark gradient background
- **Loading States**: Spinners and skeleton screens
- **Error Boundaries**: Graceful error handling

## 🔒 Security Features

- **Path Traversal Protection**: Secure file serving
- **Input Validation**: Comment length and email validation
- **CORS Support**: Configurable cross-origin requests
- **Rate Limiting**: Built-in API rate limiting
- **XSS Prevention**: Proper input sanitization

## 📱 Mobile Support

- **Responsive Design**: Works on all screen sizes
- **Touch Controls**: Mobile-friendly video controls
- **Optimized Layout**: Stack layout on small screens
- **Fast Loading**: Optimized for mobile networks

## 🚀 Performance

- **HTTP/2 Ready**: Modern protocol support
- **Range Requests**: Efficient video streaming
- **CDN Ready**: Static asset optimization
- **Caching Headers**: Proper cache control
- **Lightweight**: Minimal dependencies

## 🔧 Development

```bash
# Development with auto-restart
npm run dev

# Production build
npm start

# View logs
npm start | tee server.log
```

## 🎯 Deployment

1. **Environment Setup**
   - Set production environment variables
   - Configure reverse proxy (Nginx/Apache)
   - Set up SSL certificates

2. **Process Management**
   - Use PM2 for production process management
   - Configure auto-restart and logging
   - Set up monitoring and alerts

3. **Security**
   - Configure firewall rules
   - Set up rate limiting
   - Enable HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your enhancements
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **Gravatar API v3.0.0** - Profile and avatar services
- **Express.js** - Fast, minimalist web framework
- **React 18** - Frontend library via CDN
- **Babel Standalone** - In-browser JSX compilation

## 📞 Support

For issues and questions:

1. Check the existing issues
2. Create a new issue with detailed description
3. Include browser/environment information
4. Provide steps to reproduce

---

**Built with ❤️ using Express, React & Gravatar API**

*Version 2.0.0 - Enhanced with comprehensive Gravatar integration*
