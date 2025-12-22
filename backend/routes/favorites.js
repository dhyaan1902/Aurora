const express = require('express');
const router = express.Router();
const { dbAll, dbRun } = require('../utils/db');

// Get all favorites
router.get('/', async (req, res) => {
    try {
        const favorites = await dbAll('SELECT * FROM favorites ORDER BY createdAt DESC');
        const parsed = favorites.map(f => ({
            ...f,
            data: JSON.parse(f.data)
        }));
        res.json({ favorites: parsed });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch favorites' });
    }
});

// Add to favorites
router.post('/', async (req, res) => {
    try {
        const { id, type, data } = req.body;
        if (!id || !type || !data) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await dbRun(
            'INSERT OR REPLACE INTO favorites (id, type, data, createdAt) VALUES (?, ?, ?, ?)',
            [id, type, JSON.stringify(data), new Date().toISOString()]
        );

        res.json({ success: true, id, type, data });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ error: 'Failed to add favorite' });
    }
});

// Remove from favorites
router.delete('/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM favorites WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Removed from favorites' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove favorite' });
    }
});

module.exports = router;
