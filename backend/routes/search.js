const express = require('express');
const router = express.Router();
const { searchTracks, getAlbum } = require('../utils/spotify');

// Search for tracks and albums with structured sections
router.get('/', async (req, res) => {
    try {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 20;

        if (!query) {
            return res.status(400).json({ error: 'Query parameter required' });
        }

        const data = await searchTracks(query, limit);

        // Separate tracks and albums
        const tracks = data.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artists: track.artists,
            album: track.album,
            duration_ms: track.duration_ms,
            external_ids: track.external_ids,
            preview_url: track.preview_url,
            popularity: track.popularity,
            type: 'track'
        }));

        const albums = (data.albums?.items || []).map(album => ({
            id: album.id,
            name: album.name,
            artists: album.artists,
            images: album.images,
            release_date: album.release_date,
            total_tracks: album.total_tracks,
            popularity: album.popularity,
            type: 'album'
        }));

        // Get top track and its album details
        let albumContext = null;
        let albumTracks = [];

        if (tracks.length > 0) {
            const topTrack = tracks[0];
            const albumId = topTrack.album.id;

            try {
                // Fetch full album details including all tracks
                const albumData = await getAlbum(albumId);
                
                albumContext = {
                    id: albumData.id,
                    name: albumData.name,
                    artists: albumData.artists,
                    images: albumData.images,
                    release_date: albumData.release_date,
                    total_tracks: albumData.total_tracks,
                    type: 'album'
                };

                // Map album tracks
                albumTracks = albumData.tracks.items.map(track => ({
                    id: track.id,
                    name: track.name,
                    artists: track.artists,
                    album: {
                        id: albumData.id,
                        name: albumData.name,
                        images: albumData.images
                    },
                    duration_ms: track.duration_ms,
                    track_number: track.track_number,
                    type: 'track'
                }));

                console.log(`🎵 Album context: ${albumContext.name} with ${albumTracks.length} tracks`);
            } catch (err) {
                console.warn('Could not fetch album context:', err.message);
            }
        }

        res.json({
            albumContext,      // Top track's album
            albumTracks,       // All tracks from that album
            tracks,            // All matching tracks
            albums,            // All matching albums
            query
        });

    } catch (error) {
        console.error('Search error:', error.message);
        res.status(500).json({ error: 'Search failed' });
    }
});

module.exports = router;