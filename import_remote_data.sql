INSERT OR IGNORE INTO software_systems (name, vendor_info) VALUES ('SCARS OPE SOFTWARE', 'VMware Contract # 3108150343');
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=180 Days'),
    1.5
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=30 Days'),
    3.75
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = 'Expired'),
    0.75
);
INSERT OR IGNORE INTO software_systems (name, vendor_info) VALUES ('JSE OPE SOFTWARE', 'VMware Account# 900295543');
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'JSE OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=270 Days'),
    1.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'JSE OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=180 Days'),
    0.333333333
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'JSE OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=30 Days'),
    2.333333333
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'JSE OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = 'Expired'),
    0.666666667
);
INSERT OR IGNORE INTO software_systems (name, vendor_info) VALUES ('DSO PHASE II OPE SOFTWARE', NULL);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'DSO PHASE II OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=270 Days'),
    6.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'DSO PHASE II OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=180 Days'),
    3.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'DSO PHASE II OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=30 Days'),
    1.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'DSO PHASE II OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = 'Expired'),
    1.0
);
INSERT OR IGNORE INTO software_systems (name, vendor_info) VALUES ('ARL SCARS LAB OPE SOFTWARE', NULL);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'ARL SCARS LAB OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=180 Days'),
    2.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'ARL SCARS LAB OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=90 Days'),
    1.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'ARL SCARS LAB OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=30 Days'),
    4.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'ARL SCARS LAB OPE SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = 'Expired'),
    1.0
);
INSERT OR IGNORE INTO software_systems (name, vendor_info) VALUES ('SCARS uSOC SOFTWARE', NULL);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS uSOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=270 Days'),
    1.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS uSOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=180 Days'),
    2.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS uSOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=120 Days'),
    1.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS uSOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=30 Days'),
    7.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS uSOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = 'Expired'),
    2.0
);
INSERT OR IGNORE INTO software_systems (name, vendor_info) VALUES ('SCARS sSOC SOFTWARE', NULL);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS sSOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=270 Days'),
    1.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS sSOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=180 Days'),
    2.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS sSOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=60 Days'),
    1.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS sSOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=30 Days'),
    7.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SCARS sSOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = 'Expired'),
    3.0
);
INSERT OR IGNORE INTO software_systems (name, vendor_info) VALUES ('ARL SCARS LAB SOC SOFTWARE', NULL);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'ARL SCARS LAB SOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=180 Days'),
    2.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'ARL SCARS LAB SOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = '<=30 Days'),
    6.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'ARL SCARS LAB SOC SOFTWARE'),
    (SELECT id FROM expiration_categories WHERE name = 'Expired'),
    1.0
);
INSERT OR IGNORE INTO software_systems (name, vendor_info) VALUES ('GDR', NULL);
INSERT OR IGNORE INTO software_systems (name, vendor_info) VALUES ('ORL SIL SOC', NULL);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'ORL SIL SOC'),
    (SELECT id FROM expiration_categories WHERE name = '<=180 Days'),
    2.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'ORL SIL SOC'),
    (SELECT id FROM expiration_categories WHERE name = '<=120 Days'),
    1.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'ORL SIL SOC'),
    (SELECT id FROM expiration_categories WHERE name = '<=90 Days'),
    2.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'ORL SIL SOC'),
    (SELECT id FROM expiration_categories WHERE name = '<=30 Days'),
    4.0
);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'ORL SIL SOC'),
    (SELECT id FROM expiration_categories WHERE name = 'Expired'),
    1.0
);
INSERT OR IGNORE INTO software_systems (name, vendor_info) VALUES ('SiSOC', NULL);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'SiSOC'),
    (SELECT id FROM expiration_categories WHERE name = '<=270 Days'),
    16.0
);
INSERT OR IGNORE INTO software_systems (name, vendor_info) VALUES ('V4 OPE', NULL);
INSERT OR REPLACE INTO software_expiration_tracking
(software_system_id, expiration_category_id, count)
VALUES (
    (SELECT id FROM software_systems WHERE name = 'V4 OPE'),
    (SELECT id FROM expiration_categories WHERE name = '<=270 Days'),
    16.0
);