const express = require('express');
const router = express.Router();
const { getTrack } = require('../utils/spotify');
const { getYoutubeMatch, getStreamUrl } = require('../utils/ytHelper');
const { dbGet, dbRun } = require('../utils/db');

// Batch prepare stream URLs for queue
router.post('/prepare', async (req, res) => {
    try {
        const { trackIds } = req.body; // Array of Spotify track IDs

        if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
            return res.status(400).json({ error: 'trackIds array required' });
        }

        console.log(`🎵 Queue prepare request for ${trackIds.length} tracks`);

        const results = [];
        const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);

        // Process tracks in parallel with limit
        const processTrack = async (spotifyTrackId) => {
            try {
                // Check cache first
                const cached = await dbGet(
                    'SELECT youtubeVideoId, streamUrl, cachedAt, confidence FROM track_mappings WHERE spotifyId = ?',
                    [spotifyTrackId]
                );

                if (cached && new Date(cached.cachedAt).getTime() > sixHoursAgo) {
                    console.log(`✅ Cache hit: ${spotifyTrackId}`);
                    return {
                        trackId: spotifyTrackId,
                        streamUrl: cached.streamUrl,
                        videoId: cached.youtubeVideoId,
                        confidence: cached.confidence,
                        source: 'cache'
                    };
                }

                // Fetch from Spotify and YouTube
                console.log(`📡 Resolving: ${spotifyTrackId}`);
                const spotifyTrack = await getTrack(spotifyTrackId);
                const match = await getYoutubeMatch(spotifyTrack);

                if (!match) {
                    console.warn(`❌ No match found: ${spotifyTrackId}`);
                    return {
                        trackId: spotifyTrackId,
                        error: 'No YouTube match found',
                        source: 'failed'
                    };
                }

                const streamUrl = await getStreamUrl(match.videoId);

                // Cache result
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
                        null
                    ]
                );

                console.log(`✅ Resolved: ${spotifyTrack.name}`);

                return {
                    trackId: spotifyTrackId,
                    streamUrl,
                    videoId: match.videoId,
                    confidence: match.confidence,
                    source: 'fresh',
                    metadata: {
                        title: spotifyTrack.name,
                        artist: spotifyTrack.artists[0].name,
                        album: spotifyTrack.album.name,
                        artwork: spotifyTrack.album.images[0]?.url,
                        duration: spotifyTrack.duration_ms / 1000
                    }
                };
            } catch (err) {
                console.error(`❌ Error processing ${spotifyTrackId}:`, err.message);
                return {
                    trackId: spotifyTrackId,
                    error: err.message,
                    source: 'failed'
                };
            }
        };

        // Process tracks with concurrency limit (3 at a time)
        const CONCURRENCY = 3;
        for (let i = 0; i < trackIds.length; i += CONCURRENCY) {
            const batch = trackIds.slice(i, i + CONCURRENCY);
            const batchResults = await Promise.all(batch.map(processTrack));
            results.push(...batchResults);
        }

        const successful = results.filter(r => r.streamUrl).length;
        console.log(`✅ Queue prepared: ${successful}/${trackIds.length} tracks`);

        res.json({
            results,
            summary: {
                total: trackIds.length,
                successful,
                failed: trackIds.length - successful
            }
        });

    } catch (error) {
        console.error('❌ Queue prepare error:', error.message);
        res.status(500).json({
            error: 'Failed to prepare queue',
            details: error.message
        });
    }
});

module.exports = router;