const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Clients to try for fetching streaming data
const clients = [
    {
        name: 'ANDROID',
        version: '19.09.37',
        headers: {
            'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip',
            'X-YouTube-Client-Name': '3',
            'X-YouTube-Client-Version': '19.09.37',
        }
    },
    {
        name: 'IOS',
        version: '19.09.3',
        headers: {
            'User-Agent': 'com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)',
            'X-YouTube-Client-Name': '5',
            'X-YouTube-Client-Version': '19.09.3',
        }
    },
    {
        name: 'WEB',
        version: '2.20230101.00.00',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'X-YouTube-Client-Name': '1',
            'X-YouTube-Client-Version': '2.20230101.00.00',
        }
    }
];

async function getBestStream(videoId) {
    let bestStream = null;

    for (const client of clients) {
        try {
            const response = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...client.headers
                },
                body: JSON.stringify({
                    context: {
                        client: {
                            clientName: client.name,
                            clientVersion: client.version,
                            hl: 'en',
                            gl: 'US',
                        }
                    },
                    videoId: videoId
                })
            });

            const data = await response.json();

            if (!data.streamingData) continue;

            const formats = data.streamingData.adaptiveFormats || [];
            const audioStreams = formats.filter(f =>
                f.mimeType && f.mimeType.includes('audio') && f.url
            );

            if (audioStreams.length === 0) continue;

            // Sort by bitrate (highest first)
            audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
            bestStream = audioStreams[0];
            break;
        } catch (error) {
            console.error(`Error with ${client.name} client:`, error.message);
            continue;
        }
    }
    return bestStream;
}

// Stream endpoint
router.get('/:videoId', async (req, res) => {
    const { videoId } = req.params;

    try {
        const bestStream = await getBestStream(videoId);

        if (!bestStream || !bestStream.url) {
            return res.status(404).send('Could not find audio stream');
        }

        const range = req.headers.range;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.youtube.com/',
            'Origin': 'https://www.youtube.com',
        };

        if (range) {
            headers['Range'] = range;
        }

        const audioResponse = await fetch(bestStream.url, { headers });

        if (!audioResponse.ok && audioResponse.status !== 206) {
            return res.status(audioResponse.status).send('Failed to fetch audio from YouTube');
        }

        res.status(audioResponse.status);
        res.setHeader('Content-Type', bestStream.mimeType.split(';')[0]);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        const contentLength = audioResponse.headers.get('content-length');
        const contentRange = audioResponse.headers.get('content-range');

        if (contentLength) res.setHeader('Content-Length', contentLength);
        if (contentRange) res.setHeader('Content-Range', contentRange);

        audioResponse.body.pipe(res);

    } catch (error) {
        console.error('Stream error:', error);
        res.status(500).send('Stream error: ' + error.message);
    }
});

module.exports = router;
