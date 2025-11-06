-- Migration number: 0002 	 2025-10-16T02:34:37.609Z
-- [LEGACY] Add detailed license management tables (replaced in 0003)

-- Vendors table for managing software vendors
CREATE TABLE vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    contact_info TEXT,
    website TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Software products catalog
CREATE TABLE software_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    vendor_id INTEGER,
    category TEXT, -- e.g., 'Operating System', 'Database', 'Security', 'Virtualization'
    version TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

-- Individual licenses table - the core detailed inventory
CREATE TABLE licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    software_system_id INTEGER NOT NULL, -- Which system this license belongs to
    software_product_id INTEGER,
    part_number TEXT, -- e.g., P007189-008
    license_key TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    purchase_date DATE,
    install_date DATE,
    activation_date DATE,
    expiry_date DATE,
    license_duration_years INTEGER,
    renewal_required BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active', -- 'active', 'expired', 'expiring', 'inactive'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (software_system_id) REFERENCES software_systems(id) ON DELETE CASCADE,
    FOREIGN KEY (software_product_id) REFERENCES software_products(id) ON DELETE SET NULL
);

-- License history for tracking renewals and changes
CREATE TABLE license_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_id INTEGER NOT NULL,
    action TEXT NOT NULL, -- 'created', 'renewed', 'expired', 'updated', 'deactivated'
    old_expiry_date DATE,
    new_expiry_date DATE,
    cost DECIMAL(10,2),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (license_id) REFERENCES licenses(id) ON DELETE CASCADE
);

-- Support contracts table
CREATE TABLE support_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id INTEGER,
    contract_number TEXT,
    start_date DATE,
    end_date DATE,
    annual_cost DECIMAL(10,2),
    coverage_description TEXT,
    contact_info TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

-- Hardware devices table (for SonicWall and other hardware)
CREATE TABLE hardware_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    software_system_id INTEGER,
    serial_number TEXT UNIQUE,
    model TEXT,
    manufacturer TEXT,
    firmware_version TEXT,
    registration_date DATE,
    last_ping_date DATE,
    location TEXT,
    status TEXT DEFAULT 'active',
    support_expiry_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (software_system_id) REFERENCES software_systems(id) ON DELETE SET NULL
);

-- Insert common vendors based on the Excel data
INSERT INTO vendors (name) VALUES
    ('Microsoft'),
    ('VMware'),
    ('Red Hat'),
    ('Oracle'),
    ('Adobe'),
    ('Splunk'),
    ('Broadcom'),
    ('Citrix'),
    ('McAfee'),
    ('SonicWall'),
    ('Horizon'),
    ('Twistlock'),
    ('JFrog'),
    ('Trellix'),
    ('Nessus'),
    ('Policy Auditor');

-- Create indexes for better performance
CREATE INDEX idx_licenses_software_system_id ON licenses(software_system_id);
CREATE INDEX idx_licenses_part_number ON licenses(part_number);
CREATE INDEX idx_licenses_expiry_date ON licenses(expiry_date);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_software_products_vendor_id ON software_products(vendor_id);
CREATE INDEX idx_hardware_devices_serial_number ON hardware_devices(serial_number);
CREATE INDEX idx_hardware_devices_software_system_id ON hardware_devices(software_system_id);
CREATE INDEX idx_license_history_license_id ON license_history(license_id);
CREATE INDEX idx_support_contracts_vendor_id ON support_contracts(vendor_id);
