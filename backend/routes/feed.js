const express = require('express');
const router = express.Router();
const { getRecommendations, getNewReleases, spotifyRequest } = require('../utils/spotify');
const { dbAll } = require('../utils/db');

// Helper: Get random items from array
function shuffle(array, limit) {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return limit ? shuffled.slice(0, limit) : shuffled;
}

// Get personalized feed
router.get('/', async (req, res) => {
    try {
        const feed = [];

        // 1. Get user's recent play history
        const recentPlays = await dbAll(`
            SELECT DISTINCT spotifyTrackId 
            FROM play_history 
            ORDER BY playedAt DESC 
            LIMIT 5
        `);

        const hasHistory = recentPlays.length > 0;
        // 2. PERSONALIZED RECOMMENDATIONS (if user has history)
        if (hasHistory) {
            try {
                const seedTracks = recentPlays.map(p => p.spotifyTrackId).slice(0, 5);
                const recommendations = await getRecommendations(seedTracks, 20);

                feed.push({
                    section: 'Based on Your Listening',
                    tracks: recommendations.tracks.map(track => ({
                        id: track.id,
                        name: track.name,
                        artists: track.artists,
                        album: track.album,
                        duration_ms: track.duration_ms,
                        external_ids: track.external_ids
                    }))
                });
            } catch (error) {
                console.log('Recommendations failed:', error.message);
            }
        }

        // 3. NEW RELEASES (Albums)
        try {
            const newReleases = await getNewReleases(20);

            feed.push({
                section: 'New Releases',
                items: shuffle(newReleases.albums.items, 10).map(album => ({
                    id: album.id,
                    name: album.name,
                    artists: album.artists,
                    images: album.images,
                    release_date: album.release_date,
                    type: 'album'
                }))
            });
        } catch (error) {
            console.log('New releases failed:', error.message);
        }

        // 4. TRENDING TRACKS (Using search for popular playlists instead of deprecated featured-playlists)
        try {
            // Search for "Top Global" or "Today's Top Hits" style playlists
            const searchPlaylists = await spotifyRequest('/search', { q: 'Top Global', type: 'playlist', limit: 1 });

            if (searchPlaylists.playlists.items.length > 0) {
                const playlistId = searchPlaylists.playlists.items[0].id;
                const playlistTracks = await spotifyRequest(`/playlists/${playlistId}/tracks`, { limit: 20 });

                const tracks = playlistTracks.items
                    .filter(item => item.track && item.track.id)
                    .map(item => ({
                        id: item.track.id,
                        name: item.track.name,
                        artists: item.track.artists,
                        album: item.track.album,
                        duration_ms: item.track.duration_ms,
                        external_ids: item.track.external_ids
                    }));

                feed.push({
                    section: 'Trending Now',
                    tracks: shuffle(tracks, 15)
                });
            }
        } catch (error) {
            console.log('Trending tracks failed (via search):', error.message);
        }

        // 5. DISCOVER (Random genre-based recommendations)
        try {
            const genres = ['pop', 'rock', 'hip-hop', 'indie', 'electronic'];
            const randomGenre = genres[Math.floor(Math.random() * genres.length)];

            // Search for tracks in that genre
            const genreTracks = await spotifyRequest('/search', {
                q: `genre:${randomGenre}`,
                type: 'track',
                limit: 20
            });

            if (genreTracks.tracks.items.length > 0) {
                feed.push({
                    section: `Discover ${randomGenre.charAt(0).toUpperCase() + randomGenre.slice(1)}`,
                    tracks: shuffle(genreTracks.tracks.items, 15).map(track => ({
                        id: track.id,
                        name: track.name,
                        artists: track.artists,
                        album: track.album,
                        duration_ms: track.duration_ms,
                        external_ids: track.external_ids
                    }))
                });
            }
        } catch (error) {
            console.log('Genre discovery failed:', error.message);
        }

        // 6. CHILL VIBES (Low energy recommendations)
        if (hasHistory) {
            try {
                const seedTracks = recentPlays.map(p => p.spotifyTrackId).slice(0, 2);
                try {
                    const chillTracks = await getRecommendations(seedTracks, 15);

                    feed.push({
                        section: 'Chill Vibes',
                        tracks: chillTracks.tracks.map(track => ({
                            id: track.id,
                            name: track.name,
                            artists: track.artists,
                            album: track.album,
                            duration_ms: track.duration_ms,
                            external_ids: track.external_ids
                        }))
                    });
                } catch (recError) {
                    console.log('Chill vibes recommendation specifically failed:', recError.message);
                }
            } catch (error) {
                console.log('Chill vibes failed:', error.message);
            }
        }

        // 7. ENERGETIC HITS (High energy recommendations)
        if (hasHistory) {
            try {
                const seedTracks = recentPlays.map(p => p.spotifyTrackId).slice(0, 2);
                try {
                    const energeticTracks = await getRecommendations(seedTracks, 15);

                    feed.push({
                        section: 'Energy Boost',
                        tracks: energeticTracks.tracks.map(track => ({
                            id: track.id,
                            name: track.name,
                            artists: track.artists,
                            album: track.album,
                            duration_ms: track.duration_ms,
                            external_ids: track.external_ids
                        }))
                    });
                } catch (recError) {
                    console.log('Energy boost recommendation specifically failed:', recError.message);
                }
            } catch (error) {
                console.log('Energy boost failed:', error.message);
            }
        }

        // 8. THROWBACK (Old releases)
        try {
            const currentYear = new Date().getFullYear();
            const throwbackYear = currentYear - Math.floor(Math.random() * 20 + 10); // 10-30 years ago

            const throwbackTracks = await spotifyRequest('/search', {
                q: `year:${throwbackYear}`,
                type: 'track',
                limit: 20
            });

            if (throwbackTracks.tracks.items.length > 0) {
                feed.push({
                    section: `Throwback ${throwbackYear}`,
                    tracks: shuffle(throwbackTracks.tracks.items, 15).map(track => ({
                        id: track.id,
                        name: track.name,
                        artists: track.artists,
                        album: track.album,
                        duration_ms: track.duration_ms,
                        external_ids: track.external_ids
                    }))
                });
            }
        } catch (error) {
            console.log('Throwback failed:', error.message);
        }

        // 9. FIRST-TIME USER MESSAGE
        if (!hasHistory) {
            feed.unshift({
                section: 'Welcome! 👋',
                message: 'Start listening to get personalized recommendations. Explore what\'s new below!',
                tracks: []
            });
        }

        // Shuffle the order of sections (except first one if it's personalized)
        if (feed.length > 2) {
            const [first, ...rest] = feed;
            const shuffledRest = shuffle(rest);
            res.json({ feed: [first, ...shuffledRest] });
        } else {
            res.json({ feed });
        }

    } catch (error) {
        console.error('Feed error:', error.message);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});

module.exports = router;