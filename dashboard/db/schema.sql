-- Theme storage for Ghost members
-- Run this on your Railway PostgreSQL instance

CREATE TABLE IF NOT EXISTS member_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ghost_member_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Untitled Theme',
  description TEXT,
  theme_json JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by member
CREATE INDEX IF NOT EXISTS idx_member_themes_ghost_member_id ON member_themes(ghost_member_id);

-- Index for finding active theme
CREATE INDEX IF NOT EXISTS idx_member_themes_active ON member_themes(ghost_member_id, is_active) WHERE is_active = true;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_member_themes_updated_at ON member_themes;
CREATE TRIGGER update_member_themes_updated_at
  BEFORE UPDATE ON member_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
