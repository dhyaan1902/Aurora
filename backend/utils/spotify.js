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

    try {
        const response = await axios.get(`https://api.spotify.com/v1${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params
        });
        return response.data;
    } catch (error) {
        console.error('Spotify API error:', error.response?.data || error.message);
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

// Get recommendations
async function getRecommendations(seedTracks, limit = 20) {
    return await spotifyRequest('/recommendations', {
        seed_tracks: seedTracks.join(','),
        limit
    });
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