-- 6. Member Roadmaps
CREATE TABLE IF NOT EXISTS member_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    tech_skills_score INTEGER CHECK (tech_skills_score >= 1 AND tech_skills_score <= 5),
    soft_skills_score INTEGER CHECK (soft_skills_score >= 1 AND soft_skills_score <= 5),
    learning_score INTEGER CHECK (learning_score >= 1 AND learning_score <= 5),
    admin_notes TEXT,
    goals_30_days TEXT,
    goals_60_days TEXT,
    goals_90_days TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_roadmaps_member ON member_roadmaps(member_id);
ALTER TABLE member_roadmaps ENABLE ROW LEVEL SECURITY;
