-- ================================
-- NAMA BANK - Schema Updates
-- Run this SQL in your Supabase SQL Editor
-- ================================

-- 1. Add profile_photo to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- 2. Add description and moderator tracking to nama_accounts
ALTER TABLE nama_accounts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE nama_accounts ADD COLUMN IF NOT EXISTS created_by_moderator UUID;

-- 3. Create moderators table
CREATE TABLE IF NOT EXISTS moderators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on moderators table
ALTER TABLE moderators ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for moderators
CREATE POLICY "Allow public read access to moderators" ON moderators
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to moderators" ON moderators
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to moderators" ON moderators
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete from moderators" ON moderators
  FOR DELETE USING (true);

-- 6. Insert sample moderator (optional - for testing)
-- Username: moderator, Password: namamod2024
INSERT INTO moderators (name, username, password_hash, is_active) VALUES
  ('Default Moderator', 'moderator', 'namamod2024', true)
ON CONFLICT (username) DO NOTHING;

-- 7. Add 5 admin accounts support (stored in app, not DB)
-- Note: Admin credentials are hard-coded in the application
-- This comment is for documentation purposes

-- ================================
-- VERIFICATION QUERIES
-- ================================
-- SELECT * FROM moderators;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'nama_accounts';
