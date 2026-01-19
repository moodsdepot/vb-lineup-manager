-- V2 Schema Migration for Lineupman
-- Adds normalized athletes, share links, and optimistic locking

-- Create team_role enum
CREATE TYPE team_role AS ENUM ('owner', 'editor', 'viewer');

-- Create share_link_role enum (subset of team roles for share links)
CREATE TYPE share_link_role AS ENUM ('editor', 'viewer');

-- Create resource_type enum for share links
CREATE TYPE resource_type AS ENUM ('team', 'lineup');

-- ============================================
-- Modify existing tables
-- ============================================

-- Add sport_type and archived_at to teams, make code nullable
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS sport_type TEXT DEFAULT 'volleyball',
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE teams
  ALTER COLUMN code DROP NOT NULL;

-- Migrate team_members role to enum (requires temp column)
ALTER TABLE team_members ADD COLUMN role_new team_role;

UPDATE team_members
SET role_new = CASE
  WHEN role = 'owner' THEN 'owner'::team_role
  WHEN role = 'editor' THEN 'editor'::team_role
  ELSE 'viewer'::team_role
END;

ALTER TABLE team_members DROP COLUMN role;
ALTER TABLE team_members RENAME COLUMN role_new TO role;
ALTER TABLE team_members ALTER COLUMN role SET NOT NULL;
ALTER TABLE team_members ALTER COLUMN role SET DEFAULT 'viewer';

-- Add state and state_version to lineups for optimistic locking
ALTER TABLE lineups
  ADD COLUMN IF NOT EXISTS state JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS state_version INTEGER DEFAULT 1 NOT NULL;

-- ============================================
-- Create new tables
-- ============================================

-- Athletes table (normalized roster)
CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  jersey_number TEXT NOT NULL,
  display_name TEXT,
  position TEXT CHECK (position IN ('OH', 'MB', 'S', 'OPP', 'L', 'DS', NULL)),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, jersey_number)
);

-- Create index for team lookups
CREATE INDEX IF NOT EXISTS idx_athletes_team_id ON athletes(team_id);

-- Share links table
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  resource_type resource_type NOT NULL,
  resource_id UUID NOT NULL,
  role share_link_role NOT NULL DEFAULT 'viewer',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for token lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_share_links_token_hash ON share_links(token_hash);
-- Index for resource lookup
CREATE INDEX IF NOT EXISTS idx_share_links_resource ON share_links(resource_type, resource_id);

-- Profiles table (optional user display names)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- Helper functions
-- ============================================

-- Get user's role in a team
CREATE OR REPLACE FUNCTION get_user_team_role(p_team_id UUID, p_user_id UUID)
RETURNS team_role AS $$
  SELECT role FROM team_members
  WHERE team_id = p_team_id AND user_id = p_user_id
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user can write to team (owner or editor)
CREATE OR REPLACE FUNCTION can_write_to_team(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = p_user_id
      AND role IN ('owner', 'editor')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is team owner
CREATE OR REPLACE FUNCTION is_team_owner(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = p_user_id
      AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get team_id from lineup
CREATE OR REPLACE FUNCTION get_lineup_team_id(p_lineup_id UUID)
RETURNS UUID AS $$
  SELECT team_id FROM lineups WHERE id = p_lineup_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- Updated timestamp triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_athletes_updated_at
  BEFORE UPDATE ON athletes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lineups_updated_at
  BEFORE UPDATE ON lineups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Auto-create profile on user signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
