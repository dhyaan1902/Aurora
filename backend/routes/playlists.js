const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../utils/db');

// Get all playlists
router.get('/', async (req, res) => {
    try {
        const playlists = await dbAll('SELECT * FROM playlists ORDER BY createdAt DESC');

        // Parse trackIds JSON (which now contains full track objects)
        const parsed = playlists.map(p => ({
            ...p,
            tracks: JSON.parse(p.trackIds || '[]')
        }));

        res.json({ playlists: parsed });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch playlists' });
    }
});

// Create playlist
router.post('/', async (req, res) => {
    try {
        const { name, tracks = [] } = req.body;
        const id = Date.now().toString();

        await dbRun(
            'INSERT INTO playlists (id, name, trackIds, createdAt) VALUES (?, ?, ?, ?)',
            [id, name, JSON.stringify(tracks), new Date().toISOString()]
        );

        res.json({ id, name, tracks, createdAt: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create playlist' });
    }
});

// Update playlist (add/remove tracks)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, tracks } = req.body;

        await dbRun(
            'UPDATE playlists SET name = ?, trackIds = ? WHERE id = ?',
            [name, JSON.stringify(tracks), id]
        );

        res.json({ id, name, tracks });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update playlist' });
    }
});

// Delete playlist
router.delete('/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM playlists WHERE id = ?', [req.params.id]);
        res.json({ message: 'Playlist deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete playlist' });
    }
});
// NEW: Get streaming URLs for all tracks in a playlist
router.get('/:id/streams', async (req, res) => {
    try {
        const { id } = req.params;

        const playlist = await dbGet('SELECT trackIds FROM playlists WHERE id = ?', [id]);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const tracks = JSON.parse(playlist.trackIds || '[]');
        if (tracks.length === 0) {
            return res.json({ playlistId: id, streams: [] });
        }

        const { getStreamingUrl } = require('../utils/ytHelper');

        const streamPromises = tracks.map(async (track) => {
            try {
                const url = await getStreamingUrl(track);
                return {
                    trackId: track.id,
                    name: track.name,
                    streamingUrl: url
                };
            } catch (err) {
                console.error(`Failed stream for ${track.name}:`, err);
                return {
                    trackId: track.id,
                    streamingUrl: null,
                    error: 'Failed'
                };
            }
        });

        const streams = await Promise.all(streamPromises);

        res.json({
            playlistId: id,
            trackCount: tracks.length,
            streams
        });
    } catch (error) {
        console.error('Prefetch streams error:', error);
        res.status(500).json({ error: 'Failed to prefetch streams' });
    }
});

// NEW: Persist reordered tracks
router.post('/:id/reorder', async (req, res) => {
    try {
        const { id } = req.params;
        const { orderedTrackIds } = req.body;

        if (!Array.isArray(orderedTrackIds)) {
            return res.status(400).json({ error: 'orderedTrackIds must be array' });
        }

        const playlist = await dbGet('SELECT trackIds FROM playlists WHERE id = ?', [id]);
        if (!playlist) {
            return res.status(404).json({ error: 'Playlist not found' });
        }

        const currentTracks = JSON.parse(playlist.trackIds || '[]');
        const trackMap = new Map(currentTracks.map(t => [t.id, t]));

        const reorderedTracks = orderedTrackIds
            .map(tid => trackMap.get(tid))
            .filter(t => t !== undefined);

        await dbRun(
            'UPDATE playlists SET trackIds = ? WHERE id = ?',
            [JSON.stringify(reorderedTracks), id]
        );

        res.json({ success: true, tracks: reorderedTracks });
    } catch (error) {
        console.error('Reorder error:', error);
        res.status(500).json({ error: 'Failed to reorder' });
    }
});
module.exports = router;