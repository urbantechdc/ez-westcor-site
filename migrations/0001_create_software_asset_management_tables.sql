-- Migration number: 0001 	 2025-10-16T01:50:57.466Z
-- [LEGACY] Create software asset management tables (replaced in 0003)

-- Software systems master table
CREATE TABLE software_systems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    vendor_info TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Expiration timeline categories
CREATE TABLE expiration_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    days_threshold INTEGER,
    sort_order INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Software expiration tracking (counts by category)
CREATE TABLE software_expiration_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    software_system_id INTEGER NOT NULL,
    expiration_category_id INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (software_system_id) REFERENCES software_systems(id) ON DELETE CASCADE,
    FOREIGN KEY (expiration_category_id) REFERENCES expiration_categories(id) ON DELETE CASCADE,
    UNIQUE(software_system_id, expiration_category_id)
);

-- Insert default expiration categories based on Excel data
INSERT INTO expiration_categories (name, days_threshold, sort_order) VALUES
    ('270+ Days', 271, 1),
    ('<=270 Days', 270, 2),
    ('<=180 Days', 180, 3),
    ('<=120 Days', 120, 4),
    ('<=90 Days', 90, 5),
    ('<=60 Days', 60, 6),
    ('<=30 Days', 30, 7),
    ('Expired', 0, 8);

-- Create indexes for better performance
CREATE INDEX idx_software_expiration_tracking_software_id ON software_expiration_tracking(software_system_id);
CREATE INDEX idx_software_expiration_tracking_category_id ON software_expiration_tracking(expiration_category_id);
CREATE INDEX idx_software_systems_name ON software_systems(name);
