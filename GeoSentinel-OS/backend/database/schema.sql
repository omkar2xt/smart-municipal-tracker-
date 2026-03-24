-- GeoSentinel OS PostgreSQL + PostGIS schema
-- Ready to run with: psql -d <db_name> -f schema.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('state_admin', 'district_admin', 'taluka_admin', 'worker')),
    district VARCHAR(120),
    taluka VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, latitude, longitude, timestamp)
);

CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    assigned_to BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    image_proof VARCHAR(300),
    before_image_proof VARCHAR(300),
    after_image_proof VARCHAR(300),
    expected_latitude DOUBLE PRECISION,
    expected_longitude DOUBLE PRECISION,
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ) STORED,
    accelerometer_magnitude DOUBLE PRECISION,
    anomaly_detected BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_reason VARCHAR(200),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, latitude, longitude, timestamp)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(120) NOT NULL,
    status VARCHAR(32) NOT NULL,
    detail VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Operational indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_district_taluka ON users(district, taluka);

CREATE INDEX IF NOT EXISTS idx_attendance_user_time ON attendance(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_geom ON attendance USING GIST(geom);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_status ON tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Location query indexes (time + spatial lookups)
CREATE INDEX IF NOT EXISTS idx_location_logs_user_time ON location_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_location_logs_geom ON location_logs USING GIST(geom);
CREATE INDEX IF NOT EXISTS idx_location_logs_anomaly ON location_logs(anomaly_detected, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_time ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, created_at DESC);

COMMIT;
