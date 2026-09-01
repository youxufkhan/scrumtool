-- ==============================================================================
-- ScrumTool Database Schema (Supabase PostgreSQL)
-- ==============================================================================

-- 1. Team Members
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'Engineer',
    avatar_color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    passcode_hash TEXT DEFAULT '93369f4b5512e84a0d5b1cbd8c54e0aaec37b40a8753fd03c156dd712ce45d50',
    has_custom_passcode BOOLEAN DEFAULT false,
    joined_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Projects / Categories
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366F1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Daily Submissions (Status and lock tracker per member and date)
CREATE TABLE IF NOT EXISTS daily_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    is_on_leave BOOLEAN DEFAULT false,
    leave_reason TEXT,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(member_id, date)
);

-- 4. Daily Tasks
CREATE TABLE IF NOT EXISTS daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    title TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('planned', 'in_progress', 'done', 'blocked')) DEFAULT 'in_progress',
    hours_spent NUMERIC(4, 2), -- NULL in morning planning; 0.00 to 24.00 in evening
    blocker_note TEXT,
    is_ad_hoc BOOLEAN DEFAULT false,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Holidays & Calendar Exceptions
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_daily_tasks_member_date ON daily_tasks(member_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_project ON daily_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_submissions_member_date ON daily_submissions(member_id, date);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Allow public / anon read & write policies (app logic is enforced via server actions and API)
CREATE POLICY "Allow anon all on members" ON members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on projects" ON projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on daily_submissions" ON daily_submissions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on daily_tasks" ON daily_tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on holidays" ON holidays FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- Initial Seed Data (Safe Upserts)
-- ==============================================================================

INSERT INTO members (name, role, avatar_color) VALUES
    ('Alex Rivera', 'Frontend Lead', '#3B82F6'),
    ('Sam Chen', 'Backend Engineer', '#10B981'),
    ('Jordan Taylor', 'Fullstack Dev', '#8B5CF6'),
    ('Morgan Riley', 'QA Engineer', '#F59E0B')
ON CONFLICT (name) DO NOTHING;

INSERT INTO projects (name, color) VALUES
    ('Core App', '#3B82F6'),
    ('Mobile MVP', '#10B981'),
    ('Infrastructure', '#8B5CF6'),
    ('Bug Fixes', '#EF4444')
ON CONFLICT (name) DO NOTHING;
