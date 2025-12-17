const express = require('express');
const router = express.Router();
const { getTrack } = require('../utils/spotify');
const { getYoutubeMatch, getStreamUrl } = require('../utils/ytHelper');
const { dbGet, dbRun } = require('../utils/db');

// Get stream URL for a Spotify track
router.post('/', async (req, res) => {
    try {
        const { spotifyTrackId } = req.body;

        if (!spotifyTrackId) {
            return res.status(400).json({ error: 'spotifyTrackId required' });
        }

        console.log(`🎵 Play request for: ${spotifyTrackId}`);

        // Check cache first (but only if less than 6 hours old)
        const cached = await dbGet(
            'SELECT youtubeVideoId, streamUrl, cachedAt, confidence FROM track_mappings WHERE spotifyId = ?',
            [spotifyTrackId]
        );

        const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);

        if (cached && new Date(cached.cachedAt).getTime() > sixHoursAgo) {
            console.log('✅ Using cached mapping');

            // Update last played
            await dbRun(
                'UPDATE track_mappings SET lastPlayed = ? WHERE spotifyId = ?',
                [new Date().toISOString(), spotifyTrackId]
            );

            // Record play history
            await dbRun(
                'INSERT INTO play_history (spotifyTrackId, playedAt) VALUES (?, ?)',
                [spotifyTrackId, new Date().toISOString()]
            );

            return res.json({
                streamUrl: cached.streamUrl,
                videoId: cached.youtubeVideoId,
                confidence: cached.confidence,
                source: 'cache'
            });
        }

        // Get Spotify track details
        console.log('📡 Fetching from Spotify API...');
        const spotifyTrack = await getTrack(spotifyTrackId);

        // Find YouTube match
        console.log('🔍 Finding YouTube match...');
        const match = await getYoutubeMatch(spotifyTrack);

        if (!match) {
            return res.status(404).json({
                error: 'No YouTube match found',
                track: {
                    name: spotifyTrack.name,
                    artist: spotifyTrack.artists[0].name
                }
            });
        }

        console.log(`✅ Found match: ${match.title} (${match.method})`);

        // Get fresh stream URL
        console.log('🎬 Getting stream URL...');
        const streamUrl = await getStreamUrl(match.videoId);

        // Cache the result
        await dbRun(
            `INSERT OR REPLACE INTO track_mappings 
       (spotifyId, youtubeVideoId, streamUrl, confidence, cachedAt, lastPlayed) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                spotifyTrackId,
                match.videoId,
                streamUrl,
                match.confidence,
                new Date().toISOString(),
                new Date().toISOString()
            ]
        );

        // Record play history
        await dbRun(
            'INSERT INTO play_history (spotifyTrackId, playedAt) VALUES (?, ?)',
            [spotifyTrackId, new Date().toISOString()]
        );

        console.log('✅ Stream ready!');

        res.json({
            streamUrl,
            videoId: match.videoId,
            confidence: match.confidence,
            method: match.method,
            source: 'fresh',
            metadata: {
                title: spotifyTrack.name,
                artist: spotifyTrack.artists[0].name,
                album: spotifyTrack.album.name,
                artwork: spotifyTrack.album.images[0]?.url,
                duration: spotifyTrack.duration_ms / 1000,
                isrc: spotifyTrack.external_ids?.isrc
            }
        });

    } catch (error) {
        console.error('❌ Play error:', error.message);
        res.status(500).json({
            error: 'Failed to get stream',
            details: error.message
        });
    }
});

module.exports = router;