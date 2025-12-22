const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database/music.db');
console.log(`Openning DB at ${dbPath}`);
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Dropping old downloads table...");
    db.run("DROP TABLE IF EXISTS downloads", (err) => {
        if (err) {
            console.error("Error dropping table:", err);
            return;
        }
        console.log("Dropped downloads table.");

        console.log("Recreating downloads table with new schema...");
        db.run(`
            CREATE TABLE IF NOT EXISTS downloads (
              spotifyId TEXT PRIMARY KEY,
              youtubeVideoId TEXT,
              filePath TEXT,
              name TEXT,
              artist TEXT,
              image TEXT,
              duration INTEGER,
              downloadedAt TEXT
            )
        `, (err) => {
            if (err) {
                console.error("Error creating table:", err);
            } else {
                console.log("✅ Successfully recreated downloads table with new schema.");
                console.log("You can now retry the download.");
            }
        });
    });
});
