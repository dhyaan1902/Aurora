const express = require('express');
const router = express.Router();
const { searchTracks } = require('../utils/spotify');

// Search for tracks
router.get('/', async (req, res) => {
    try {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 20;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter required' });
        }

        const data = await searchTracks(query, limit);


        res.json({
            tracks: [
                // TRACKS FIRST ✅
                ...data.tracks.items.map(track => ({
                    id: track.id,
                    name: track.name,
                    artists: track.artists,
                    album: track.album,
                    duration_ms: track.duration_ms,
                    external_ids: track.external_ids,
                    preview_url: track.preview_url,
                    type: 'track'
                })),
                // ALBUMS LAST ✅
                ...(data.albums?.items.map(album => ({
                    id: album.id,
                    name: album.name,
                    artists: album.artists,
                    album: { images: album.images },
                    duration_ms: 0, // Add this to avoid NaN
                    type: 'album'
                })) || [])
            ],
            total: (data.tracks?.total || 0) + (data.albums?.total || 0),
            limit: limit
        });
    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

module.exports = router;