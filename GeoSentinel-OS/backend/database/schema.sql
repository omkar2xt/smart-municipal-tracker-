-- GeoSentinel OS PostgreSQL schema
-- Run with: psql -d geosentinel_db -f schema.sql

BEGIN;

-- Optional but useful for UUID/correlation IDs in reports/audit pipelines.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================
-- TABLE 1: USERS
-- =============================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'sub_admin', 'taluka_admin', 'worker')),
    state VARCHAR(100),
    district VARCHAR(100),
    taluka VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Hierarchy integrity:
    -- admin: state-level, sub_admin: district-level, taluka_admin/worker: taluka-level.
    CONSTRAINT users_hierarchy_scope_chk CHECK (
        (role = 'admin' AND state IS NOT NULL)
        OR (role = 'sub_admin' AND state IS NOT NULL AND district IS NOT NULL)
        OR (role = 'taluka_admin' AND state IS NOT NULL AND district IS NOT NULL AND taluka IS NOT NULL)
        OR (role = 'worker' AND state IS NOT NULL AND district IS NOT NULL AND taluka IS NOT NULL)
    )
);

-- =============================
-- TABLE 2: ATTENDANCE
-- =============================
CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude NUMERIC(10,8) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(11,8) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late'))
);

-- =============================
-- TABLE 3: TASKS (WITH FUND)
-- =============================
CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    fund_allocated NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (fund_allocated >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    before_image TEXT,
    after_image TEXT,
    latitude NUMERIC(10,8) CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(11,8) CHECK (longitude BETWEEN -180 AND 180),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    CONSTRAINT tasks_completed_at_consistency_chk CHECK (
        (status <> 'completed' AND completed_at IS NULL)
        OR (status = 'completed' AND completed_at IS NOT NULL)
    )
);

-- =============================
-- TABLE 4: LOCATION LOGS (TRACKING)
-- =============================
CREATE TABLE IF NOT EXISTS location_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude NUMERIC(10,8) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(11,8) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    speed DOUBLE PRECISION CHECK (speed >= 0),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- TABLE 5: REPORTS
-- =============================
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    generated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- TABLE 6: FUND TRACKING
-- =============================
CREATE TABLE IF NOT EXISTS fund_usage (
    id BIGSERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    amount_used NUMERIC(12,2) NOT NULL CHECK (amount_used >= 0),
    remarks TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- TABLE 7: AUDIT LOGS
-- =============================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================
-- ROLE/RELATIONSHIP ENFORCEMENT
-- =============================
-- Ensure tasks are assigned to workers and assigned by managerial roles.
CREATE OR REPLACE FUNCTION validate_task_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    assigned_to_role VARCHAR(50);
    assigned_by_role VARCHAR(50);
    v_manager_state VARCHAR(100);
    v_manager_district VARCHAR(100);
    v_manager_taluka VARCHAR(100);
    v_worker_state VARCHAR(100);
    v_worker_district VARCHAR(100);
    v_worker_taluka VARCHAR(100);
BEGIN
    SELECT role, state, district, taluka
    INTO assigned_to_role, v_worker_state, v_worker_district, v_worker_taluka
    FROM users
    WHERE id = NEW.assigned_to;

    SELECT role, state, district, taluka
    INTO assigned_by_role, v_manager_state, v_manager_district, v_manager_taluka
    FROM users
    WHERE id = NEW.assigned_by;

    IF assigned_to_role IS NULL OR assigned_by_role IS NULL THEN
        RAISE EXCEPTION 'Task assignment references unknown users';
    END IF;

    IF assigned_to_role <> 'worker' THEN
        RAISE EXCEPTION 'assigned_to must be role=worker, got=%', assigned_to_role;
    END IF;

    IF assigned_by_role NOT IN ('admin', 'sub_admin', 'taluka_admin') THEN
        RAISE EXCEPTION 'assigned_by must be managerial role, got=%', assigned_by_role;
    END IF;

    IF assigned_by_role = 'taluka_admin' THEN
        IF v_manager_state IS DISTINCT FROM v_worker_state
           OR v_manager_district IS DISTINCT FROM v_worker_district
           OR v_manager_taluka IS DISTINCT FROM v_worker_taluka THEN
            RAISE EXCEPTION
                'taluka_admin can assign only within same state/district/taluka (manager: %, %, %; worker: %, %, %)',
                v_manager_state, v_manager_district, v_manager_taluka,
                v_worker_state, v_worker_district, v_worker_taluka;
        END IF;
    ELSIF assigned_by_role = 'sub_admin' THEN
        IF v_manager_state IS DISTINCT FROM v_worker_state
           OR v_manager_district IS DISTINCT FROM v_worker_district THEN
            RAISE EXCEPTION
                'sub_admin can assign only within same state/district (manager: %, %; worker: %, %)',
                v_manager_state, v_manager_district,
                v_worker_state, v_worker_district;
        END IF;
    ELSIF assigned_by_role = 'admin' THEN
        IF v_manager_state IS DISTINCT FROM v_worker_state THEN
            RAISE EXCEPTION
                'admin can assign only within same state (manager: %; worker: %)',
                v_manager_state, v_worker_state;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_task_role_assignment ON tasks;
CREATE TRIGGER trg_validate_task_role_assignment
BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION validate_task_role_assignment();

-- =============================
-- INDEXES (PERFORMANCE)
-- =============================
CREATE INDEX IF NOT EXISTS idx_user_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_hierarchy ON users(state, district, taluka);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_time ON attendance(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_location_user ON location_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_location_user_time ON location_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_fund_usage_task ON fund_usage(task_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_time ON audit_logs(user_id, timestamp DESC);

-- =============================
-- REPORTING VIEW
-- =============================
CREATE OR REPLACE VIEW vw_task_fund_summary AS
SELECT
    t.id AS task_id,
    t.title,
    t.status,
    t.fund_allocated,
    COALESCE(SUM(fu.amount_used), 0) AS fund_used,
    (t.fund_allocated - COALESCE(SUM(fu.amount_used), 0)) AS fund_balance
FROM tasks t
LEFT JOIN fund_usage fu ON fu.task_id = t.id
GROUP BY t.id;

-- =============================
-- DATA CLEANUP LOGIC (60 DAYS)
-- =============================
CREATE OR REPLACE FUNCTION cleanup_old_geosentinel_data()
RETURNS TABLE (deleted_tasks BIGINT, deleted_location_logs BIGINT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_deleted_tasks BIGINT := 0;
    v_deleted_logs BIGINT := 0;
BEGIN
    DELETE FROM tasks
    WHERE status = 'completed'
      AND completed_at < NOW() - INTERVAL '60 days';
    GET DIAGNOSTICS v_deleted_tasks = ROW_COUNT;

    DELETE FROM location_logs
    WHERE timestamp < NOW() - INTERVAL '60 days';
    GET DIAGNOSTICS v_deleted_logs = ROW_COUNT;

    RETURN QUERY SELECT v_deleted_tasks, v_deleted_logs;
END;
$$;

-- Manual cleanup commands (if scheduler is not enabled):
-- DELETE FROM tasks
-- WHERE status = 'completed'
-- AND completed_at < NOW() - INTERVAL '60 days';
--
-- DELETE FROM location_logs
-- WHERE timestamp < NOW() - INTERVAL '60 days';

-- Optional scheduling with pg_cron (if installed):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('geosentinel_cleanup_daily', '0 2 * * *',
-- $$SELECT * FROM cleanup_old_geosentinel_data();$$);

COMMIT;
