const ytdlp = require('yt-dlp-exec');
const fetch = require('node-fetch');

// Fast YouTube search using direct scraping - now returns multiple results
async function searchYouTube(query, maxResults = 5) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://www.youtube.com/results?search_query=${encodedQuery}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const html = await response.text();

        // Extract ytInitialData
        const match = html.match(/var ytInitialData = ({.+?});/);
        if (!match) return [];

        const data = JSON.parse(match[1]);

        // Navigate YouTube's structure
        const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
        if (!contents) return [];

        const results = [];

        // Find video results
        for (const section of contents) {
            const items = section?.itemSectionRenderer?.contents;
            if (!items) continue;

            for (const item of items) {
                if (results.length >= maxResults) break;

                const videoRenderer = item?.videoRenderer;
                if (!videoRenderer) continue;

                const videoId = videoRenderer.videoId;
                const title = videoRenderer.title?.runs?.[0]?.text;
                const lengthText = videoRenderer.lengthText?.simpleText;
                const uploader = videoRenderer.ownerText?.runs?.[0]?.text;

                if (!videoId) continue;

                // Parse duration (e.g., "3:45" -> 225 seconds)
                let duration = 0;
                if (lengthText) {
                    const parts = lengthText.split(':').map(Number);
                    if (parts.length === 2) {
                        duration = parts[0] * 60 + parts[1];
                    } else if (parts.length === 3) {
                        duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    }
                }

                results.push({
                    videoId,
                    url: `https://youtube.com/watch?v=${videoId}`,
                    title,
                    duration,
                    uploader
                });
            }

            if (results.length >= maxResults) break;
        }

        return results;
    } catch (error) {
        console.log('Fast search failed, trying yt-dlp:', error.message);
        // Fallback to yt-dlp if scraping fails
        return await searchYouTubeDLP(query, maxResults);
    }
}

// yt-dlp search fallback - returns multiple results
async function searchYouTubeDLP(query, maxResults = 5) {
    try {
        const result = await ytdlp(`ytsearch${maxResults}:${query}`, {
            dumpSingleJson: true,
            noWarnings: true,
            skipDownload: true,
            flatPlaylist: true
        });

        const videos = result.entries || [result];
        return videos.filter(v => v && v.id).map(video => ({
            videoId: video.id,
            url: `https://youtube.com/watch?v=${video.id}`,
            title: video.title,
            duration: video.duration,
            uploader: video.uploader
        }));
    } catch (error) {
        console.log('yt-dlp search failed:', error.message);
        return [];
    }
}

// Find best match from multiple results based on duration
function findBestMatch(results, targetDuration, maxDiff = 10) {
    if (!results || results.length === 0) return null;

    let bestMatch = null;
    let smallestDiff = Infinity;

    for (const result of results) {
        const durationDiff = Math.abs(result.duration - targetDuration);

        if (durationDiff < smallestDiff) {
            smallestDiff = durationDiff;
            bestMatch = result;
        }

        // If we find a perfect match (within 3 seconds), return immediately
        if (durationDiff <= 3) {
            console.log(`🎯 Perfect match found at position ${results.indexOf(result) + 1}: ${result.title} (diff: ${durationDiff}s)`);
            return { match: result, durationDiff };
        }
    }

    // Return best match if within acceptable range
    if (bestMatch && smallestDiff <= maxDiff) {
        console.log(`✅ Best match found at position ${results.indexOf(bestMatch) + 1}: ${bestMatch.title} (diff: ${smallestDiff}s)`);
        return { match: bestMatch, durationDiff: smallestDiff };
    }

    return null;
}

// Find YouTube video using ISRC (primary method) - checks multiple results
async function findByISRC(isrc, targetDuration) {
    if (!isrc) return null;
    console.log(`🔍 Searching with ISRC: ${isrc}`);

    const results = await searchYouTube(isrc, 5); // Get top 5 results

    if (results.length === 0) return null;

    console.log(`📋 Found ${results.length} results, checking durations...`);
    results.forEach((r, i) => {
        const diff = Math.abs(r.duration - targetDuration);
        console.log(`   ${i + 1}. ${r.title} - ${r.duration}s (diff: ${diff}s)`);
    });

    return findBestMatch(results, targetDuration, 10);
}

// Fallback search method - also checks multiple results
async function fallbackSearch(trackName, artistName, targetDuration) {
    const queries = [
        `${trackName} ${artistName} topic`,
        `${trackName} ${artistName} official audio`,
        `${trackName} ${artistName}`
    ];

    for (const query of queries) {
        console.log(`🔍 Trying: ${query}`);
        const results = await searchYouTube(query, 5);

        if (results.length > 0) {
            console.log(`📋 Found ${results.length} results, checking durations...`);
            const bestMatch = findBestMatch(results, targetDuration, 10);
            if (bestMatch) return bestMatch;
        }
    }

    return null;
}

// Get YouTube match for Spotify track
async function getYoutubeMatch(spotifyTrack) {
    const isrc = spotifyTrack.external_ids?.isrc;
    const spotifyDuration = spotifyTrack.duration_ms / 1000;

    console.log(`\n🎵 Track: ${spotifyTrack.name} by ${spotifyTrack.artists[0].name}`);
    console.log(`📀 ISRC: ${isrc || 'not available'}`);
    console.log(`⏱️  Duration: ${spotifyDuration}s`);

    // Try ISRC first
    if (isrc) {
        const result = await findByISRC(isrc, spotifyDuration);

        if (result) {
            const { match, durationDiff } = result;
            console.log(`✅ ISRC match found: ${match.title} (diff: ${durationDiff}s)`);

            return {
                ...match,
                confidence: durationDiff <= 3 ? 'high' : durationDiff <= 5 ? 'medium' : 'low',
                method: 'isrc',
                durationDiff
            };
        } else {
            console.log(`⚠️  No good ISRC match found, trying fallback...`);
        }
    }

    // Fallback to search
    console.log(`🔍 Searching: ${spotifyTrack.name} ${spotifyTrack.artists[0].name}`);
    const result = await fallbackSearch(
        spotifyTrack.name,
        spotifyTrack.artists[0].name,
        spotifyDuration
    );

    if (result) {
        const { match, durationDiff } = result;
        console.log(`✅ Match found: ${match.title} (diff: ${durationDiff}s)`);

        return {
            ...match,
            confidence: durationDiff <= 3 ? 'medium' : 'low',
            method: 'search',
            durationDiff
        };
    }

    console.log('❌ No match found!');
    return null;
}

// Get stream URL - only use yt-dlp here (the slow part)
async function getStreamUrl(videoId) {
    try {
        console.log(`🎬 Getting stream URL for: ${videoId}`);

        const streamUrl = await ytdlp(`https://youtube.com/watch?v=${videoId}`, {
            format: 'bestaudio',
            getUrl: true,
            noWarnings: true
        });

        console.log('✅ Stream ready!');
        return streamUrl.trim();
    } catch (error) {
        console.error('❌ Failed to get stream URL:', error.message);
        throw error;
    }
}

// Download track
async function downloadTrack(videoId, spotifyTrack) {
    const sanitizedTitle = spotifyTrack.name.replace(/[^a-z0-9]/gi, '_');
    const outputTemplate = `downloads/${sanitizedTitle}_${videoId}.%(ext)s`;

    try {
        console.log(`⬇️  Downloading: ${videoId}`);

        await ytdlp(`https://youtube.com/watch?v=${videoId}`, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: outputTemplate,
            quiet: false
        });

        console.log('✅ Download complete!');
        return `${sanitizedTitle}_${videoId}.mp3`;
    } catch (error) {
        console.error('❌ Download failed:', error.message);
        throw error;
    }
}

module.exports = {
    getYoutubeMatch,
    getStreamUrl,
    downloadTrack
};