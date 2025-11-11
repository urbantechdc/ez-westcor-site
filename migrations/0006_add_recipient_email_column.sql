-- Migration number: 0006 	 2025-11-10T22:37:24.719Z

-- Add recipient_email column to download_codes table for proper user validation
ALTER TABLE download_codes ADD COLUMN recipient_email TEXT;

-- Create index for performance
CREATE INDEX idx_download_codes_recipient ON download_codes(recipient_email);
