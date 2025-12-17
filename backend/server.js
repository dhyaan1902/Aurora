const express = require('express');
const cors = require('cors');
require('dotenv').config();

const browseRoutes = require('./routes/browse');
const searchRoutes = require('./routes/search');
const playRoutes = require('./routes/play');
const downloadRoutes = require('./routes/download');
const feedRoutes = require('./routes/feed');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/browse', browseRoutes);
app.use('/search', searchRoutes);
app.use('/play', playRoutes);
app.use('/download', downloadRoutes);
app.use('/feed', feedRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Music backend running' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🎵 Server running on http://localhost:${PORT}`);
});

const playlistRoutes = require('./routes/playlists');
app.use('/playlists', playlistRoutes);