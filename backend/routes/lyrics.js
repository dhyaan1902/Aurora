const express = require('express');
const router = express.Router();
const { getTrack } = require('../utils/spotify');
const fetch = require('node-fetch');

// Parse LRC format to timestamped array
function parseLRC(lrcString) {
    const lines = lrcString.split('\n');
    const lyrics = [];
    
    for (const line of lines) {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const centiseconds = parseInt(match[3].padEnd(2, '0').substring(0, 2));
            const text = match[4].trim();
            
            if (text) {
                lyrics.push({
                    start: Math.round((minutes * 60 + seconds + centiseconds / 100) * 100) / 100,
                    text: text
                });
            }
        }
    }
    
    return lyrics;
}

// Try LRCLIB (has timestamps)
async function getLyricsFromLRCLIB(trackName, artistName) {
    try {
        const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artistName)}&track_name=${encodeURIComponent(trackName)}`;
        console.log(`🔍 LRCLIB: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) return null;
        
        const data = await response.json();
        if (data.syncedLyrics) {
            console.log('✅ Found synced lyrics on LRCLIB');
            return parseLRC(data.syncedLyrics);
        }
        if (data.plainLyrics) {
            console.log('⚠️  Found plain lyrics on LRCLIB (no timestamps)');
            return data.plainLyrics.split('\n').map(text => ({ text: text.trim() }));
        }
    } catch (err) {
        console.log('❌ LRCLIB failed:', err.message);
    }
    return null;
}

// Try Lyrics.ovh (plain text only)
async function getLyricsFromOvh(trackName, artistName) {
    try {
        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(trackName)}`;
        console.log(`🔍 Lyrics.ovh: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) return null;
        
        const data = await response.json();
        if (data.lyrics) {
            console.log('✅ Found lyrics on Lyrics.ovh (no timestamps)');
            return data.lyrics.split('\n')
                .map(text => text.trim())
                .filter(text => text)
                .map(text => ({ text }));
        }
    } catch (err) {
        console.log('❌ Lyrics.ovh failed:', err.message);
    }
    return null;
}

router.get('/:spotifyTrackId', async (req, res) => {
    try {
        const { spotifyTrackId } = req.params;
        const track = await getTrack(spotifyTrackId);
        
        const trackName = track.name
            .replace(/\s*[-–—]\s*\d{4}\s*remaster(ed)?/i, '')
            .replace(/\s*[-–—]\s*remaster(ed)?\s*\d{4}/i, '')
            .replace(/\s*\((remaster(ed)?|version|edit|mix)(\s+\d{4})?\)/gi, '')
            .trim();
        const artistName = track.artists[0].name;
        
        console.log(`\n📜 Lyrics request: "${trackName}" by ${artistName}`);
        
        // Try LRCLIB first (has timestamps)
        let lyrics = await getLyricsFromLRCLIB(trackName, artistName);
        
        // Fallback to Lyrics.ovh
        if (!lyrics) {
            lyrics = await getLyricsFromOvh(trackName, artistName);
        }
        
        if (!lyrics || lyrics.length === 0) {
            return res.status(404).json({ error: 'No lyrics found' });
        }
        
        res.json({ lyrics });

    } catch (err) {
        console.error('❌ Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;