-- Supabase SQL Schema for Bharat Patrol

-- Enable uuid-ossp if not already enabled (though gen_random_uuid() is built-in)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- Maps to Supabase auth.users.id
    phone TEXT,
    name TEXT,
    ward TEXT,
    role TEXT CHECK (role IN ('citizen', 'official')),
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
    ai_issue_type TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'live', 'in_progress', 'resolved_pending_confirmation', 'resolved', 'reopened', 'rejected')),
    priority_score INT DEFAULT 0,
    ward TEXT,
    resolution_photo_url TEXT,
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
    type TEXT,
    recipient TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create status_history table
CREATE TABLE IF NOT EXISTS status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT,
    changed_by UUID, -- Can reference users(id) but might be system or deleted users, so keep it UUID
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority_score);
CREATE INDEX IF NOT EXISTS idx_votes_report ON votes(report_id);
