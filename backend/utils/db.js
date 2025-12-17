const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/music.db');
const db = new sqlite3.Database(dbPath);

// Initialize tables
db.serialize(() => {
    // Track mappings: Spotify ID → YouTube video ID
    db.run(`
    CREATE TABLE IF NOT EXISTS track_mappings (
      spotifyId TEXT PRIMARY KEY,
      youtubeVideoId TEXT NOT NULL,
      streamUrl TEXT,
      confidence TEXT,
      cachedAt TEXT,
      lastPlayed TEXT
    )
  `);

    // Play history for recommendations
    db.run(`
    CREATE TABLE IF NOT EXISTS play_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spotifyTrackId TEXT NOT NULL,
      playedAt TEXT NOT NULL
    )
  `);

    // Downloaded tracks
    db.run(`
    CREATE TABLE IF NOT EXISTS downloads (
      spotifyId TEXT PRIMARY KEY,
      youtubeVideoId TEXT,
      filePath TEXT,
      downloadedAt TEXT
    )
  `);

    console.log('✅ Database initialized');
});

// Promisify database methods
const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

db.run(`
  CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    trackIds TEXT,
    createdAt TEXT
  )
`);
const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

module.exports = {
    db,
    dbGet,
    dbAll,
    dbRun
};