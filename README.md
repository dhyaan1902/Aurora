# 🎵 Aurora Music Player

<div align="center">

![Aurora Banner](https://img.shields.io/badge/Aurora-Music%20Player-214dbd?style=for-the-badge)
[![Electron](https://img.shields.io/badge/Electron-App-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

**A beautiful, modern music streaming application built with Electron, React, and Node.js**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Architecture](#-architecture) • [Development](#-development)

</div>

---

## 📖 Overview

Aurora is a full-featured music streaming application that provides a **premium listening experience** with a sleek, macOS-inspired interface. Built as an Electron desktop app, it combines the power of Spotify's metadata with YouTube Music streaming to give you **free, unlimited music** with all the features you'd expect from a modern music player.

### ✨ Key Highlights

- 🎨 **Beautiful UI** - Polished, professional interface with smooth animations
- 🎵 **Unlimited Music** - Stream millions of songs for free
- 📝 **Live Lyrics** - Synced lyrics that scroll automatically with the music
- 📱 **Desktop App** - Native Electron application for Linux/Windows/macOS
- 🎯 **Smart Features** - Playlists, favorites, queue management, and more
- ⚡ **Fast & Smooth** - Hardware-accelerated, optimized performance

---

## 🚀 Features

### 🎵 Music Playback

- **High-Quality Streaming** - YouTube Music integration via yt-dlp
- **Instant Playback** - Prefetching for zero-delay track switching
- **Gapless Playback** - Smooth transitions between tracks
- **Repeat Modes** - Off, Repeat All, Repeat One
- **Shuffle** - Randomize your listening experience
- **Volume Control** - Precise volume slider with mute toggle

### 🎼 Library & Organization

- **Playlists** - Create, edit, delete, and organize your custom playlists
- **Favorites** - Star your favorite tracks and albums for quick access
- **Play History** - Track your listening history
- **Downloads** - Save tracks offline for later playback
- **Queue Management** - Full control over your play queue with drag-and-drop

### 🔍 Discovery & Browse

- **Search** - Powerful search for tracks, albums, and artists
- **Browse Feed** - Personalized music recommendations
- **Album View** - Browse full albums with complete track listings
- **Smart Recommendations** - Based on your listening history
- **Featured Sections** - Curated playlists and new releases

### 📝 Lyrics Experience

- **Live Synced Lyrics** - Auto-scrolling, time-synchronized lyrics
- **Manual Seek** - Click any lyric line to jump to that moment
- **Smooth Animations** - Hardware-accelerated, butter-smooth scrolling
- **Fallback Support** - Auto-generated lyrics when synced lyrics unavailable

### 🎨 Interface & UX

- **Fullscreen Player** - Immersive fullscreen experience with ambient background
- **Drag & Drop** - Rearrange playlists and queue with smooth animations
- **Clickable Navigation** - Click album art to view album details
- **Tooltips** - Helpful hints on all interactive elements
- **Responsive Design** - Works great on any screen size
- **Dark Theme** - Easy on the eyes, perfect for long listening sessions

### 🔧 Advanced Features

- **Prefetching** - Next 5 songs pre-loaded for instant playback
- **Toast Notifications** - Non-intrusive feedback for all actions
- **Keyboard Shortcuts** - Coming soon
- **Mini Player Mode** - Compact player bar always visible
- **Multiple Views** - Browse, Search, Library, Favorites, Playlists

---

## 🛠 Tech Stack

### Frontend

- **React 18** - Modern UI framework with hooks
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Lucide Icons** - Beautiful, consistent icon set

### Backend

- **Node.js** - JavaScript runtime
- **Express** - Web framework for APIs
- **SQLite3** - Local database for playlists, favorites, and history
- **yt-dlp** - YouTube Music streaming integration
- **Spotify Web API** - Metadata, search, and recommendations

### Desktop

- **Electron** - Cross-platform desktop application framework
- **electron-builder** - Package and build for distribution

---

## 📦 Installation

### Prerequisites

- **Node.js** 16.x or higher
- **npm** or **yarn**
- **yt-dlp** (installed automatically via npm)
- **Spotify API Credentials** (for enhanced features)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/aurora-music-player.git
   cd aurora-music-player
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Configure Spotify API** (Optional but recommended)
   
   Create `backend/.env`:
   ```env
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```
   
   Get your credentials from [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

4. **Run in development mode**
   ```bash
   # Terminal 1 - Start backend
   cd backend
   npm run dev
   
   # Terminal 2 - Start frontend
   cd frontend
   npm run dev
   
   # Terminal 3 - Start Electron (optional)
   npm start
   ```

5. **Build for production**
   ```bash
   # Build frontend
   cd frontend
   npm run build
   cd ..
   
   # Package Electron app
   npm run dist
   ```

---

## 🎮 Usage

### Basic Controls

- **Play/Pause** - Click the play button or press Space (when implemented)
- **Next/Previous** - Skip tracks with arrow buttons
- **Volume** - Drag the volume slider or click mute icon
- **Seek** - Click anywhere on the progress bar
- **Shuffle** - Click shuffle icon to randomize playback
- **Repeat** - Cycle through Off → All → One

### Navigation

- **Browse** - Discover new music and recommendations
- **Search** - Find specific tracks, albums, or artists
- **Library** - Access your playlists
- **Favorites** - View starred tracks and albums
- **Playlist** - Click any playlist to view its contents

### Creating Playlists

1. Click **"+ New Playlist"** in the sidebar
2. Enter a name for your playlist
3. Click **"Create"**
4. Add tracks by clicking the "+" icon on any track

### Managing Queue

1. Click the **queue icon** (list) in the player bar
2. View upcoming tracks
3. **Drag tracks** to reorder
4. **Remove tracks** by clicking X
5. **Clear queue** with "Clear Next" button

### Using Lyrics

1. Play a track
2. Click **fullscreen** (expand icon)
3. Click **lyrics** (mic icon)
4. Lyrics auto-scroll as song plays
5. **Click any line** to seek to that moment

### Downloading Tracks

1. Play a track or find it in search
2. Click the **download icon**
3. Track is saved locally
4. Access from **Library → Downloads**

---

## 🏗 Architecture

### Project Structure

```
aurora-music-player/
├── backend/                    # Node.js Express server
│   ├── routes/                # API routes
│   │   ├── browse.js         # Browse/recommendations
│   │   ├── download.js       # Download management
│   │   ├── favorites.js      # Favorites system
│   │   ├── feed.js           # Feed generation
│   │   ├── lyrics.js         # Lyrics fetching
│   │   ├── play.js           # Playback URLs
│   │   ├── playlists.js      # Playlist CRUD
│   │   ├── queue.js          # Queue prefetch
│   │   ├── search.js         # Search functionality
│   │   └── stream.js         # Audio streaming
│   ├── utils/                # Utilities
│   │   ├── db.js            # SQLite database
│   │   ├── spotify.js       # Spotify API client
│   │   └── ytHelper.js      # YouTube integration
│   ├── downloads/           # Downloaded tracks
│   ├── server.js            # Express server
│   └── package.json
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ConfirmationModal.jsx
│   │   │   ├── CreatePlaylistModal.jsx
│   │   │   ├── FullScreenPlayer.jsx
│   │   │   ├── PlayerBar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── UI.jsx        # Reusable UI components
│   │   ├── App.jsx           # Main application
│   │   ├── App.css           # Component styles
│   │   ├── index.css         # Global styles
│   │   └── main.jsx          # Entry point
│   ├── public/               # Static assets
│   └── package.json
├── dist/                      # Production build
├── dist-electron/            # Packaged Electron app
├── main.js                   # Electron main process
├── package.json              # Root package
└── README.md                 # This file
```

### Data Flow

1. **User Interface (React)** → User interactions
2. **Frontend State** → React hooks manage application state
3. **API Requests** → Fetch data from backend
4. **Express Routes** → Route API calls
5. **Spotify API** → Fetch metadata, search, recommendations
6. **yt-dlp** → Stream audio from YouTube Music
7. **SQLite Database** → Store playlists, favorites, history
8. **Audio Element** → HTML5 audio for playback

### Database Schema

**Playlists**
```sql
CREATE TABLE playlists (
  id TEXT PRIMARY KEY,
  name TEXT,
  tracks TEXT, -- JSON array
  createdAt DATETIME
);
```

**Favorites**
```sql
CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  type TEXT, -- 'track' or 'album'
  data TEXT, -- JSON object
  createdAt DATETIME
);
```

**Play History**
```sql
CREATE TABLE play_history (
  id INTEGER PRIMARY KEY,
  spotifyTrackId TEXT,
  playedAt DATETIME
);
```

**Downloads**
```sql
CREATE TABLE downloads (
  spotifyId TEXT PRIMARY KEY,
  name TEXT,
  artist TEXT,
  image TEXT,
  filePath TEXT,
  duration INTEGER,
  downloadedAt DATETIME
);
```

---

## 👨‍💻 Development

### Running Locally

```bash
# Development with hot reload
npm run dev:backend    # Backend on :4000
npm run dev:frontend   # Frontend on :5173
npm start              # Electron app
```

### Building

```bash
# Build frontend only
cd frontend && npm run build

# Build Electron app
npm run dist           # Linux AppImage
npm run dist:win       # Windows installer
npm run dist:mac       # macOS DMG
```

### Code Style

- **ESLint** - Linting JavaScript (configured in frontend)
- **Prettier** - Code formatting (recommended)
- Follow existing patterns in the codebase

### Adding Features

1. **Backend Route** - Create in `backend/routes/`
2. **Database Migration** - Update schema in `backend/utils/db.js`
3. **Frontend Component** - Add to `frontend/src/components/`
4. **State Management** - Use React hooks in `App.jsx`
5. **Styling** - Use Tailwind classes + custom CSS variables

---

## 🐛 Troubleshooting

### Common Issues

**Build fails**
- Make sure all dependencies are installed
- Try deleting `node_modules` and reinstalling
- Check Node.js version (16.x+ required)

**No audio playback**
- Ensure yt-dlp is installed
- Check backend logs for errors
- Verify YouTube Music is accessible in your region

**Spotify features not working**
- Check `.env` file has correct credentials
- Verify Spotify API keys are active
- Check backend console for authentication errors

**Lyrics not showing**
- Not all songs have lyrics
- Try a different track
- Check backend logs for errors

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Spotify** - For the amazing Web API providing metadata
- **yt-dlp** - For YouTube Music streaming capabilities
- **Electron** - For making desktop apps with web technologies
- **React** - For the powerful UI framework
- **Tailwind CSS** - For the utility-first CSS framework

---

## 📧 Contact

For questions, suggestions, or issues, please open an issue on GitHub.

---

<div align="center">

**Made with ❤️ and lots of ☕**

[⬆ Back to Top](#-aurora-music-player)

</div>
