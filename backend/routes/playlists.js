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

module.exports = router;