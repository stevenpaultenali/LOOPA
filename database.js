const Database = require("better-sqlite3");

// Create / open LOOPA database
const db = new Database("loopa.db");

// Improve SQLite performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create all LOOPA tables
db.exec(`
    -- USERS
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- ITEMS
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        price REAL DEFAULT 0,
        available INTEGER DEFAULT 1,
        photo TEXT,
        pickup_area TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (owner_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );

    -- REQUESTS
    CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        requester_id INTEGER NOT NULL,
        owner_id INTEGER NOT NULL,
        days INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        pickup_spot TEXT,
        due_at DATETIME,
        handed_over INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (item_id)
            REFERENCES items(id)
            ON DELETE CASCADE,

        FOREIGN KEY (requester_id)
            REFERENCES users(id)
            ON DELETE CASCADE,

        FOREIGN KEY (owner_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );

    -- MESSAGES
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (request_id)
            REFERENCES requests(id)
            ON DELETE CASCADE,

        FOREIGN KEY (sender_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );

    -- REVIEWS
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        reviewer_id INTEGER NOT NULL,
        reviewed_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (request_id)
            REFERENCES requests(id)
            ON DELETE CASCADE,

        FOREIGN KEY (reviewer_id)
            REFERENCES users(id)
            ON DELETE CASCADE,

        FOREIGN KEY (reviewed_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );

    -- REPORTS
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_id INTEGER NOT NULL,
        reported_user_id INTEGER,
        reported_item_id INTEGER,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (reporter_id)
            REFERENCES users(id)
            ON DELETE CASCADE,

        FOREIGN KEY (reported_user_id)
            REFERENCES users(id)
            ON DELETE SET NULL,

        FOREIGN KEY (reported_item_id)
            REFERENCES items(id)
            ON DELETE SET NULL
    );
`);

console.log("=================================");
console.log("LOOPA DATABASE");
console.log("=================================");
console.log("Database connected successfully.");
console.log("All tables are ready.");
console.log("=================================");

module.exports = db;