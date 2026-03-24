-- Smart Municipal Tracker Database Schema

CREATE TABLE IF NOT EXISTS work_zones (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    lat           REAL NOT NULL,
    lon           REAL NOT NULL,
    radius_metres REAL NOT NULL DEFAULT 200,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL CHECK(role IN ('admin', 'worker')),
    phone         TEXT,
    zone_id       INTEGER REFERENCES work_zones(id) ON DELETE SET NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in_time       DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_out_time      DATETIME,
    latitude            REAL NOT NULL,
    longitude           REAL NOT NULL,
    checkout_latitude   REAL,
    checkout_longitude  REAL,
    zone_status         TEXT DEFAULT 'no_zone'
                            CHECK(zone_status IN ('within', 'outside', 'no_zone'))
);

CREATE TABLE IF NOT EXISTS tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    zone_id     INTEGER REFERENCES work_zones(id) ON DELETE SET NULL,
    priority    TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    status      TEXT DEFAULT 'pending'
                    CHECK(status IN ('pending', 'in_progress', 'completed')),
    due_date    DATE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_images (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id     INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename    TEXT NOT NULL,
    image_type  TEXT DEFAULT 'before' CHECK(image_type IN ('before', 'after')),
    latitude    REAL,
    longitude   REAL,
    notes       TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
