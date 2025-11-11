-- Migration number: 0005 	 2025-11-10T21:37:58.067Z

-- Create admin_log table for tracking administrative actions
CREATE TABLE admin_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    location_data TEXT,
    success BOOLEAN NOT NULL DEFAULT true,
    details TEXT,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_admin_log_timestamp ON admin_log(timestamp DESC);
CREATE INDEX idx_admin_log_admin_email ON admin_log(admin_email);
CREATE INDEX idx_admin_log_action ON admin_log(action);
