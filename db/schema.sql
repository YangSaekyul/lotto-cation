-- PostgreSQL / Supabase Database Schema for LottoCation


-- 1. Stores Table
CREATE TABLE IF NOT EXISTS stores (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    normalized_address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    geocode_status VARCHAR(50) NOT NULL DEFAULT 'unverified', -- 'official_verified', 'geocoded', 'pending'
    geocoded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for stores
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stores_normalized ON stores(normalized_name, normalized_address);
CREATE INDEX IF NOT EXISTS idx_stores_online ON stores(is_online);

-- 2. Winning Store Records Table
CREATE TABLE IF NOT EXISTS winning_store_records (
    id SERIAL PRIMARY KEY,
    draw_no INT NOT NULL,
    prize_rank INT NOT NULL CHECK (prize_rank BETWEEN 1 AND 5),
    store_id VARCHAR(100) REFERENCES stores(id) ON DELETE CASCADE,
    raw_name VARCHAR(255) NOT NULL,
    raw_address TEXT NOT NULL,
    source_url TEXT,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_winning_record UNIQUE (draw_no, prize_rank, raw_name, raw_address)
);

-- Indexes for winning store records
CREATE INDEX IF NOT EXISTS idx_winning_records_store ON winning_store_records(store_id);
CREATE INDEX IF NOT EXISTS idx_winning_records_draw ON winning_store_records(draw_no);
CREATE INDEX IF NOT EXISTS idx_winning_records_rank ON winning_store_records(prize_rank);

-- 3. Draw Results Table
CREATE TABLE IF NOT EXISTS draw_results (
    draw_no INT PRIMARY KEY,
    draw_date VARCHAR(20) NOT NULL,
    winning_numbers INT[] NOT NULL,
    bonus_number INT NOT NULL,
    winner_counts JSONB NOT NULL,
    source_url TEXT NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for draw date
CREATE INDEX IF NOT EXISTS idx_draw_results_date ON draw_results(draw_date);

-- 4. Store Reports Table
CREATE TABLE IF NOT EXISTS store_reports (
    id SERIAL PRIMARY KEY,
    store_id VARCHAR(100) NOT NULL, -- validated against the bundled normalized dataset by the API
    report_type VARCHAR(50) NOT NULL, -- 'closed', 'moved', 'address_error', 'location_error', 'other'
    detail TEXT NOT NULL,
    reporter_email VARCHAR(255),
    ip_hash VARCHAR(64),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for store reports status
CREATE INDEX IF NOT EXISTS idx_store_reports_status ON store_reports(status);
CREATE INDEX IF NOT EXISTS idx_store_reports_rate_limit ON store_reports(ip_hash, created_at DESC);

-- Browser clients must not read or write reports directly. The server route uses
-- the service-role key after validation and rate limiting.
ALTER TABLE store_reports ENABLE ROW LEVEL SECURITY;

-- Atomically enforce the per-IP hourly limit and insert the report. The
-- advisory transaction lock prevents concurrent requests for the same hash
-- from all passing a separate count-then-insert check.
CREATE OR REPLACE FUNCTION submit_store_report(
    p_store_id VARCHAR,
    p_report_type VARCHAR,
    p_detail TEXT,
    p_reporter_email VARCHAR,
    p_ip_hash VARCHAR
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));

    IF (
        SELECT COUNT(*)
        FROM store_reports
        WHERE ip_hash = p_ip_hash
          AND created_at >= NOW() - INTERVAL '1 hour'
    ) >= 5 THEN
        RETURN 'rate_limited';
    END IF;

    INSERT INTO store_reports (store_id, report_type, detail, reporter_email, ip_hash, status)
    VALUES (p_store_id, p_report_type, p_detail, NULLIF(p_reporter_email, ''), p_ip_hash, 'pending');
    RETURN 'inserted';
END;
$$;

REVOKE ALL ON FUNCTION submit_store_report(VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_store_report(VARCHAR, VARCHAR, TEXT, VARCHAR, VARCHAR) TO service_role;
