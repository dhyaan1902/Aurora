const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || './database/music.db'; // CORRECT
const db = new sqlite3.Database(
  dbPath,
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) console.error('SQLite open error:', err.message);
    else console.log('SQLite connected in READWRITE mode');
  }
);

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
      name TEXT,
      artist TEXT,
      image TEXT,
      duration INTEGER,
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

db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL, -- 'track' or 'album'
      data TEXT NOT NULL, -- JSON stringified track/album object
      createdAt TEXT NOT NULL
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
