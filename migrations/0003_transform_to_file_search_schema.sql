-- Migration number: 0003 	 2025-11-06T18:06:15.000Z
-- Transform database from software license management to employee file search system

-- Drop existing views first
DROP VIEW IF EXISTS v_license_dashboard;
DROP VIEW IF EXISTS v_equipment_health;

-- Drop existing tables in correct dependency order
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS alert_configs;
DROP TABLE IF EXISTS compliance_audits;
DROP TABLE IF EXISTS renewal_events;
DROP TABLE IF EXISTS license_history;
DROP TABLE IF EXISTS support_contracts;
DROP TABLE IF EXISTS hardware_devices;
DROP TABLE IF EXISTS licenses;
DROP TABLE IF EXISTS software_licenses;
DROP TABLE IF EXISTS software_products;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS software_expiration_tracking;
DROP TABLE IF EXISTS expiration_categories;
DROP TABLE IF EXISTS equipment_stacks;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS software_systems;
DROP TABLE IF EXISTS users;

-- Create new employee file search schema
-- Employees directory
CREATE TABLE employees (
  id TEXT PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL, -- e.g., AXV017147
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  status TEXT DEFAULT 'active', -- active, archived, inactive
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- File categories/types
CREATE TABLE file_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, -- e.g., "00", "04"
  name TEXT NOT NULL, -- e.g., "EMPTY", "FILES"
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Main files table - parsed from files.txt
CREATE TABLE employee_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  index_number TEXT NOT NULL, -- e.g., "0001"
  employee_id TEXT NOT NULL REFERENCES employees(employee_id),
  file_name TEXT NOT NULL,
  file_path TEXT,
  category_code TEXT REFERENCES file_categories(code),
  file_type TEXT, -- .txt, .pdf, .doc, etc.
  file_size INTEGER,
  is_empty BOOLEAN DEFAULT FALSE,
  checksum TEXT, -- for file integrity
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
);

-- File content indexing for search
CREATE TABLE file_search_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL REFERENCES employee_files(id),
  content_text TEXT, -- extracted text content
  keywords TEXT, -- JSON array of keywords
  metadata TEXT, -- JSON metadata (creation date, etc.)
  indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES employee_files(id) ON DELETE CASCADE
);

-- File access/preview history
CREATE TABLE file_access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_id INTEGER NOT NULL REFERENCES employee_files(id),
  action TEXT NOT NULL, -- 'view', 'download', 'search'
  user_identifier TEXT, -- IP or session ID
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES employee_files(id) ON DELETE CASCADE
);

-- Search queries for analytics
CREATE TABLE search_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_text TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  user_identifier TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- System configuration
CREATE TABLE system_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_name ON employees(full_name);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employee_files_employee_id ON employee_files(employee_id);
CREATE INDEX idx_employee_files_file_name ON employee_files(file_name);
CREATE INDEX idx_employee_files_category ON employee_files(category_code);
CREATE INDEX idx_employee_files_type ON employee_files(file_type);
CREATE INDEX idx_file_search_content ON file_search_index(content_text);
CREATE INDEX idx_file_access_log_timestamp ON file_access_log(timestamp);
CREATE INDEX idx_search_queries_text ON search_queries(query_text);

-- Views for common queries
CREATE VIEW v_employee_summary AS
SELECT
  e.employee_id,
  e.full_name,
  e.status,
  COUNT(ef.id) as file_count,
  SUM(CASE WHEN ef.is_empty = 0 THEN 1 ELSE 0 END) as content_file_count,
  SUM(CASE WHEN ef.is_empty = 1 THEN 1 ELSE 0 END) as empty_file_count,
  MAX(ef.updated_at) as last_file_update
FROM employees e
LEFT JOIN employee_files ef ON e.employee_id = ef.employee_id
GROUP BY e.employee_id, e.full_name, e.status;

CREATE VIEW v_file_directory AS
SELECT
  ef.id,
  ef.index_number,
  e.full_name as employee_name,
  e.employee_id,
  ef.file_name,
  ef.file_path,
  fc.name as category_name,
  fc.description as category_description,
  ef.file_type,
  ef.file_size,
  ef.is_empty,
  ef.created_at
FROM employee_files ef
JOIN employees e ON ef.employee_id = e.employee_id
LEFT JOIN file_categories fc ON ef.category_code = fc.code;

-- Initialize default file categories based on files.txt format
INSERT INTO file_categories (code, name, description) VALUES
  ('00', 'EMPTY', 'Empty placeholder files'),
  ('04', 'FILES', 'Files with content (PDFs, documents)');

-- Initialize system configuration
INSERT INTO system_config (key, value, description) VALUES
  ('data_source', 'files.txt', 'Source of file data'),
  ('last_import', NULL, 'Timestamp of last data import'),
  ('total_data_size', '32GB', 'Total size of source data'),
  ('search_enabled', 'true', 'Whether search functionality is enabled');

-- Insert sample employee data for development/testing
INSERT INTO employees (id, employee_id, full_name, first_name, last_name, status) VALUES
  ('emp_001', 'AXV017147', 'Carlos F Abdala-Cobos', 'Carlos', 'Abdala-Cobos', 'active'),
  ('emp_002', 'BYW018258', 'Jane M Smith', 'Jane', 'Smith', 'active'),
  ('emp_003', 'CZX019369', 'Robert L Johnson', 'Robert', 'Johnson', 'archived'),
  ('emp_004', 'DWY020470', 'Maria E Rodriguez', 'Maria', 'Rodriguez', 'active');

-- Insert sample files for development/testing
INSERT INTO employee_files (index_number, employee_id, file_name, file_path, category_code, file_type, is_empty) VALUES
  ('0001', 'AXV017147', 'AXV017147 - 1 - Carlos F Abdala-Cobos.txt', '00/EMPTY/AXV017147 - 1 - Carlos F Abdala-Cobos.txt', '00', '.txt', 1),
  ('0002', 'BYW018258', 'BYW018258 - 1 - Jane M Smith.txt', '00/EMPTY/BYW018258 - 1 - Jane M Smith.txt', '00', '.txt', 1),
  ('0003', 'CZX019369', 'CZX019369 - Documents.pdf', '04/FILES/CZX019369 - Documents.pdf', '04', '.pdf', 0),
  ('0004', 'DWY020470', 'DWY020470 - Personnel File.pdf', '04/FILES/DWY020470 - Personnel File.pdf', '04', '.pdf', 0);