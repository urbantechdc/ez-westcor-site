-- Migration number: 0004 	 2025-11-10T19:21:20.505Z
-- Add secure download system with one-time codes and audit logging

-- Download codes table - stores one-time use download codes
CREATE TABLE download_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    file_name TEXT NOT NULL,
    file_key TEXT NOT NULL,  -- R2 object key/path
    file_size INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_used BOOLEAN DEFAULT FALSE,
    used_at DATETIME,
    max_downloads INTEGER DEFAULT 1,
    download_count INTEGER DEFAULT 0,
    created_by TEXT,  -- Who created the code
    notes TEXT  -- Optional notes about the download
);

-- Download access log - tracks all download attempts
CREATE TABLE download_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_id INTEGER,
    code_attempted TEXT,  -- Store the code even if invalid
    user_email TEXT,  -- From Cloudflare Zero Trust
    user_agent TEXT,
    ip_address TEXT,
    location_data TEXT,  -- JSON with geolocation info
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER,
    download_duration_ms INTEGER,  -- How long download took

    FOREIGN KEY (code_id) REFERENCES download_codes(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_download_codes_code ON download_codes(code);
CREATE INDEX idx_download_codes_used ON download_codes(is_used);
CREATE INDEX idx_download_codes_expires ON download_codes(expires_at);
CREATE INDEX idx_download_log_timestamp ON download_log(timestamp);
CREATE INDEX idx_download_log_user_email ON download_log(user_email);
CREATE INDEX idx_download_log_success ON download_log(success);

-- View for download analytics
CREATE VIEW v_download_analytics AS
SELECT
    dc.code,
    dc.file_name,
    dc.created_at as code_created,
    dc.is_used,
    dc.used_at,
    dc.download_count,
    COUNT(dl.id) as total_attempts,
    COUNT(CASE WHEN dl.success = 1 THEN 1 END) as successful_attempts,
    COUNT(CASE WHEN dl.success = 0 THEN 1 END) as failed_attempts,
    MAX(dl.timestamp) as last_attempt
FROM download_codes dc
LEFT JOIN download_log dl ON dc.id = dl.code_id
GROUP BY dc.id, dc.code, dc.file_name, dc.created_at, dc.is_used, dc.used_at, dc.download_count;

-- View for recent download activity
CREATE VIEW v_recent_downloads AS
SELECT
    dl.timestamp,
    dl.user_email,
    dl.success,
    dl.error_message,
    dl.location_data,
    dl.ip_address,
    dc.file_name,
    dc.code,
    dl.file_size
FROM download_log dl
LEFT JOIN download_codes dc ON dl.code_id = dc.id
ORDER BY dl.timestamp DESC;
