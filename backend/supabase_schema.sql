-- Updated Supabase SQL Schema for TraceSpark (Simplified Model)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    category TEXT,
    description TEXT,
    photo_url TEXT,
    ai_verified BOOLEAN,
    ai_severity INT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'rejected')),
    priority_score INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (report_id, user_id)
);

-- 4. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_votes_report_user ON votes(report_id, user_id);

-- =========================================================================
-- TraceSpark / Bharat Patrol v2 Migrations
-- =========================================================================

-- 5. Create councillors table (pre-provisioned ward representatives)
CREATE TABLE IF NOT EXISTS councillors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    ward TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Add resolution columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolution_photo_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES councillors(id);

-- 7. Update status check constraint to include 'resolved'
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
ALTER TABLE reports ADD CONSTRAINT reports_status_check CHECK (status IN ('pending', 'live', 'rejected', 'resolved'));

-- 8. Index for councillor lookup
CREATE INDEX IF NOT EXISTS idx_councillors_phone ON councillors(phone);
CREATE INDEX IF NOT EXISTS idx_reports_resolved_by ON reports(resolved_by);
