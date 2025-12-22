const { getLyrics } = require('./utils/ytHelper');

async function test() {
    const videoId = 'kJQP7kiw5Fk'; // Rick Astley - Never Gonna Give You Up
    console.log(`Testing lyrics for ${videoId}...`);
    const lyrics = await getLyrics(videoId);

    if (lyrics) {
        console.log(`Success! Found ${lyrics.length} lines.`);
        console.log('First 5 lines:');
        console.log(JSON.stringify(lyrics.slice(0, 5), null, 2));
    } else {
        console.log('Failed to fetch lyrics.');
    }
}

test();
