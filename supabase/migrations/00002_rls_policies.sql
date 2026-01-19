-- RLS Policies for V2 Schema
-- Security-first approach: deny by default, explicit grants

-- ============================================
-- Enable RLS on all tables
-- ============================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TEAMS POLICIES
-- ============================================

-- Members can view their teams
CREATE POLICY "team_members_can_view_teams"
  ON teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
    )
  );

-- Only owners can update teams
CREATE POLICY "team_owners_can_update_teams"
  ON teams FOR UPDATE
  USING (
    is_team_owner(id, auth.uid())
  );

-- Only owners can delete teams
CREATE POLICY "team_owners_can_delete_teams"
  ON teams FOR DELETE
  USING (
    is_team_owner(id, auth.uid())
  );

-- Authenticated users can create teams (creator becomes owner via trigger/function)
CREATE POLICY "authenticated_users_can_create_teams"
  ON teams FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- ============================================
-- TEAM_MEMBERS POLICIES
-- ============================================

-- Members can see other members in their teams
CREATE POLICY "team_members_can_view_members"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
    )
  );

-- Only owners can add members
CREATE POLICY "team_owners_can_add_members"
  ON team_members FOR INSERT
  WITH CHECK (
    is_team_owner(team_id, auth.uid())
  );

-- Only owners can update member roles
CREATE POLICY "team_owners_can_update_members"
  ON team_members FOR UPDATE
  USING (
    is_team_owner(team_id, auth.uid())
  )
  WITH CHECK (
    is_team_owner(team_id, auth.uid())
  );

-- Only owners can remove members (or member can remove themselves)
CREATE POLICY "team_owners_or_self_can_delete_members"
  ON team_members FOR DELETE
  USING (
    is_team_owner(team_id, auth.uid())
    OR user_id = auth.uid()
  );

-- ============================================
-- ATHLETES POLICIES
-- ============================================

-- Team members can view athletes
CREATE POLICY "team_members_can_view_athletes"
  ON athletes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = athletes.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- Editors and owners can create athletes
CREATE POLICY "team_editors_can_create_athletes"
  ON athletes FOR INSERT
  WITH CHECK (
    can_write_to_team(team_id, auth.uid())
  );

-- Editors and owners can update athletes
CREATE POLICY "team_editors_can_update_athletes"
  ON athletes FOR UPDATE
  USING (
    can_write_to_team(team_id, auth.uid())
  );

-- Editors and owners can delete athletes
CREATE POLICY "team_editors_can_delete_athletes"
  ON athletes FOR DELETE
  USING (
    can_write_to_team(team_id, auth.uid())
  );

-- ============================================
-- LINEUPS POLICIES
-- ============================================

-- Team members can view lineups
CREATE POLICY "team_members_can_view_lineups"
  ON lineups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = lineups.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- Editors and owners can create lineups
CREATE POLICY "team_editors_can_create_lineups"
  ON lineups FOR INSERT
  WITH CHECK (
    can_write_to_team(team_id, auth.uid())
  );

-- Editors and owners can update lineups
CREATE POLICY "team_editors_can_update_lineups"
  ON lineups FOR UPDATE
  USING (
    can_write_to_team(team_id, auth.uid())
  );

-- Editors and owners can delete lineups
CREATE POLICY "team_editors_can_delete_lineups"
  ON lineups FOR DELETE
  USING (
    can_write_to_team(team_id, auth.uid())
  );

-- ============================================
-- SHARE_LINKS POLICIES
-- ============================================

-- Only owners can view share links for their teams/lineups
CREATE POLICY "resource_owners_can_view_share_links"
  ON share_links FOR SELECT
  USING (
    CASE
      WHEN resource_type = 'team' THEN is_team_owner(resource_id, auth.uid())
      WHEN resource_type = 'lineup' THEN is_team_owner(get_lineup_team_id(resource_id), auth.uid())
      ELSE false
    END
  );

-- Only owners can create share links
CREATE POLICY "resource_owners_can_create_share_links"
  ON share_links FOR INSERT
  WITH CHECK (
    CASE
      WHEN resource_type = 'team' THEN is_team_owner(resource_id, auth.uid())
      WHEN resource_type = 'lineup' THEN is_team_owner(get_lineup_team_id(resource_id), auth.uid())
      ELSE false
    END
    AND created_by = auth.uid()
  );

-- Only owners can update (revoke) share links
CREATE POLICY "resource_owners_can_update_share_links"
  ON share_links FOR UPDATE
  USING (
    CASE
      WHEN resource_type = 'team' THEN is_team_owner(resource_id, auth.uid())
      WHEN resource_type = 'lineup' THEN is_team_owner(get_lineup_team_id(resource_id), auth.uid())
      ELSE false
    END
  );

-- Only owners can delete share links
CREATE POLICY "resource_owners_can_delete_share_links"
  ON share_links FOR DELETE
  USING (
    CASE
      WHEN resource_type = 'team' THEN is_team_owner(resource_id, auth.uid())
      WHEN resource_type = 'lineup' THEN is_team_owner(get_lineup_team_id(resource_id), auth.uid())
      ELSE false
    END
  );

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Anyone authenticated can view profiles
CREATE POLICY "authenticated_users_can_view_profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- Users can only update their own profile
CREATE POLICY "users_can_update_own_profile"
  ON profiles FOR UPDATE
  USING (
    id = auth.uid()
  );

-- Profile creation is handled by trigger, but allow self-insert as fallback
CREATE POLICY "users_can_insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (
    id = auth.uid()
  );

-- ============================================
-- SERVICE ROLE BYPASS (for Edge Functions)
-- ============================================

-- Note: Service role bypasses RLS by default
-- Edge functions use service role for share link validation

-- ============================================
-- Public access for share link validation
-- ============================================

-- Create a function that can be called without auth to validate share links
-- This is used by the public share page before user is authenticated
CREATE OR REPLACE FUNCTION validate_share_token(p_token_hash TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  resource_type resource_type,
  resource_id UUID,
  role share_link_role
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN sl.id IS NULL THEN false
      WHEN sl.revoked_at IS NOT NULL THEN false
      WHEN sl.expires_at IS NOT NULL AND sl.expires_at < NOW() THEN false
      WHEN sl.max_uses IS NOT NULL AND sl.use_count >= sl.max_uses THEN false
      ELSE true
    END AS valid,
    sl.resource_type,
    sl.resource_id,
    sl.role
  FROM share_links sl
  WHERE sl.token_hash = p_token_hash
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon for public share link validation
GRANT EXECUTE ON FUNCTION validate_share_token(TEXT) TO anon;
