const express = require('express');
const router = express.Router();
const { getTrack } = require('../utils/spotify');
const { getYoutubeMatch, downloadTrack } = require('../utils/ytHelper');
const { dbGet, dbRun } = require('../utils/db');

// Download a track
router.post('/', async (req, res) => {
    try {
        const { spotifyTrackId } = req.body;

        if (!spotifyTrackId) {
            return res.status(400).json({ error: 'spotifyTrackId required' });
        }

        console.log(`⬇️  Download request for: ${spotifyTrackId}`);

        // Check if already downloaded
        const existing = await dbGet(
            'SELECT filePath FROM downloads WHERE spotifyId = ?',
            [spotifyTrackId]
        );

        if (existing) {
            return res.json({
                message: 'Already downloaded',
                filePath: existing.filePath,
                status: 'exists'
            });
        }

        // Get Spotify track details
        const spotifyTrack = await getTrack(spotifyTrackId);

        // Find YouTube match
        const match = await getYoutubeMatch(spotifyTrack);

        if (!match) {
            return res.status(404).json({ error: 'No YouTube match found' });
        }

        console.log(`📥 Downloading: ${match.title}`);

        // Download the track
        const fileName = await downloadTrack(match.videoId, spotifyTrack);

        // Save to database
        await dbRun(
            `INSERT INTO downloads (spotifyId, youtubeVideoId, filePath, name, artist, image, duration, downloadedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                spotifyTrackId,
                match.videoId,
                fileName,
                spotifyTrack.name,
                spotifyTrack.artists[0].name,
                spotifyTrack.album.images[0]?.url || '',
                spotifyTrack.duration_ms,
                new Date().toISOString()
            ]
        );

        console.log('✅ Download complete!');

        res.json({
            message: 'Download complete',
            filePath: fileName,
            status: 'downloaded',
            track: {
                name: spotifyTrack.name,
                artist: spotifyTrack.artists[0].name
            }
        });

    } catch (error) {
        console.error('❌ Download error:', error.message);
        res.status(500).json({
            error: 'Download failed',
            details: error.message
        });
    }
});

// Get all downloads
router.get('/', async (req, res) => {
    try {
        const { dbAll } = require('../utils/db');
        const downloads = await dbAll('SELECT * FROM downloads ORDER BY downloadedAt DESC');
        res.json({ downloads });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch downloads' });
    }
});

// Serve downloaded file
router.get('/serve/:filename', (req, res) => {
    const { filename } = req.params;
    const path = require('path');
    const fs = require('fs');

    // Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../downloads', safeFilename);

    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Delete a download
router.delete('/:spotifyId', async (req, res) => {
    try {
        const { spotifyId } = req.params;
        const { dbGet, dbRun } = require('../utils/db');
        const fs = require('fs');
        const path = require('path');

        console.log(`🗑️  Deleting download: ${spotifyId}`);

        // Get file path
        const file = await dbGet('SELECT filePath FROM downloads WHERE spotifyId = ?', [spotifyId]);

        if (!file) {
            return res.status(404).json({ error: 'Download not found' });
        }

        const filePath = path.join(__dirname, '../downloads', file.filePath);

        // Delete from DB
        await dbRun('DELETE FROM downloads WHERE spotifyId = ?', [spotifyId]);

        // Delete file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'Deleted successfully' });

    } catch (error) {
        console.error('❌ Delete error:', error.message);
        res.status(500).json({ error: 'Failed to delete' });
    }
});

module.exports = router;