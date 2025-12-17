const express = require('express');
const router = express.Router();
const { getNewReleases, getFeaturedPlaylists, getRecommendations, getAlbum } = require('../utils/spotify');
const { dbAll } = require('../utils/db');

// Get listening history
router.get('/history', async (req, res) => {
    try {
        // Get the last 5 distinct tracks played
        const history = await dbAll(`
            SELECT DISTINCT spotifyTrackId 
            FROM play_history 
            ORDER BY playedAt DESC 
            LIMIT 5
        `);

        // We only have IDs in history, play.js caches mappings but we need Spotify IDs to seed recommendations
        // The endpoint returns { spotifyTrackId: '...' }
        res.json({ history });
    } catch (error) {
        console.error('History error:', error.message);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Get album details
router.get('/album/:id', async (req, res) => {
    try {
        const album = await getAlbum(req.params.id);
        res.json(album);
    } catch (error) {
        console.error('Album fetch error:', error.message);
        res.status(500).json({ error: 'Failed to fetch album' });
    }
});
// Get recommendations
router.get('/recommendations', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const seed_tracks = req.query.seed_tracks ? req.query.seed_tracks.split(',').slice(0, 5) : []; // ✅ ADD .slice(0, 5)

        if (seed_tracks.length === 0) {
            return res.status(400).json({ error: 'seed_tracks parameter required' });
        }

        const data = await getRecommendations(seed_tracks, limit);
        res.json({ tracks: data.tracks });
    } catch (error) {
        console.error('Recommendations error:', error.message);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// Get new releases
router.get('/new-releases', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const data = await getNewReleases(limit);

        // Extract tracks from albums
        const tracks = [];
        for (const album of data.albums.items) {
            // Get first track from each album as preview
            if (album.total_tracks > 0) {
                tracks.push({
                    id: album.id,
                    name: album.name,
                    artists: album.artists,
                    images: album.images,
                    release_date: album.release_date,
                    type: 'album'
                });
            }
        }

        res.json({ items: tracks });
    } catch (error) {
        console.error('Browse error:', error.message);
        res.status(500).json({ error: 'Failed to fetch new releases' });
    }
});

// Get featured playlists
router.get('/featured-playlists', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const data = await getFeaturedPlaylists(limit);

        res.json({
            message: data.message,
            playlists: data.playlists.items
        });
    } catch (error) {
        console.error('Featured playlists error:', error.message);
        res.status(500).json({ error: 'Failed to fetch playlists' });
    }
});

module.exports = router;