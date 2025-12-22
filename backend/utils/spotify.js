const axios = require('axios');
require('dotenv').config();

let accessToken = null;
let tokenExpiry = null;

// Get Spotify access token (Client Credentials flow)
async function getAccessToken() {
    // Return cached token if still valid
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            'grant_type=client_credentials',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(
                        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
                    ).toString('base64')
                }
            }
        );

        accessToken = response.data.access_token;
        tokenExpiry = Date.now() + (response.data.expires_in * 1000);

        console.log('✅ Spotify token refreshed');
        return accessToken;
    } catch (error) {
        console.error('❌ Spotify auth error:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Spotify');
    }
}

// Make authenticated Spotify API request
async function spotifyRequest(endpoint, params = {}) {
    const token = await getAccessToken();

    // Default market to US if not specified
    if (!params.market) {
        params.market = 'US';
    }

    const url = `https://api.spotify.com/v1${endpoint}`;
    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params
        });
        return response.data;
    } catch (error) {
        console.error(`Spotify API error for ${url}:`, error.response?.data || error.message);
        throw error;
    }
}

// Get track details
async function getTrack(trackId) {
    return await spotifyRequest(`/tracks/${trackId}`);
}

// Search tracks
async function searchTracks(query, limit = 20) {
    return await spotifyRequest('/search', {
        q: query,
        type: 'track,album',
        limit
    });
}

// Get recommendations (with fallback for deprecated endpoint)
async function getRecommendations(seedTracks, limit = 20) {
    // Spotify API limit: Seed tracks must be between 1 and 5
    const seeds = Array.isArray(seedTracks) ? seedTracks.slice(0, 5) : [];
    if (seeds.length === 0) throw new Error('At least one seed track is required');

    try {
        const data = await spotifyRequest('/recommendations', {
            seed_tracks: seeds.join(','),
            limit
        });
        return data;
    } catch (error) {
        if (error.response?.status === 404 || error.response?.status === 403) {
            console.log('⚠️  Recommendations API restricted/deprecated. Using search-based fallback...');

            // Fallback: Use the first seed track to find related music
            try {
                const track = await getTrack(seeds[0]);
                const artistName = track.artists[0]?.name;

                if (artistName) {
                    // Search for more tracks by the same artist as a simple recommendation fallback
                    const searchResult = await searchTracks(`artist:"${artistName}"`, limit);
                    // Filter out the seed track itself if it's in the results
                    const filteredTracks = searchResult.tracks.items.filter(t => t.id !== seeds[0]);
                    return { tracks: filteredTracks.length > 0 ? filteredTracks : searchResult.tracks.items };
                }
            } catch (fallbackError) {
                console.error('Fallback recommendation failed:', fallbackError.message);
            }
        }
        throw error;
    }
}

// Browse new releases
async function getNewReleases(limit = 20) {
    return await spotifyRequest('/browse/new-releases', { limit });
}

// Get album details
async function getAlbum(albumId) {
    return await spotifyRequest(`/albums/${albumId}`);
}

module.exports = {
    getTrack,
    getAlbum,
    searchTracks,
    getRecommendations,
    getNewReleases,
    spotifyRequest
};