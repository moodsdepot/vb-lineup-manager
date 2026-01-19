-- Data Migration for V2 Schema
-- Extracts players from embedded JSON and creates normalized athlete records
-- Converts lineup.players to new lineup.state format

-- ============================================
-- Step 1: Extract athletes from existing lineups
-- ============================================

-- Create athletes from existing lineup players JSON
-- Deduplicate by team_id + jersey_number
INSERT INTO athletes (team_id, jersey_number, display_name, position, is_active)
SELECT DISTINCT ON (l.team_id, player->>'number')
  l.team_id,
  player->>'number' AS jersey_number,
  player->>'name' AS display_name,
  CASE
    WHEN player->>'position' IN ('OH', 'MB', 'S', 'OPP', 'L', 'DS')
    THEN player->>'position'
    ELSE NULL
  END AS position,
  true AS is_active
FROM lineups l,
LATERAL jsonb_array_elements(
  CASE
    WHEN jsonb_typeof(l.players) = 'array' THEN l.players
    ELSE '[]'::jsonb
  END
) AS player
WHERE player->>'number' IS NOT NULL
  AND player->>'number' != ''
ON CONFLICT (team_id, jersey_number) DO NOTHING;

-- ============================================
-- Step 2: Convert lineup.players to lineup.state
-- ============================================

-- Create a function to convert old players format to new state format
CREATE OR REPLACE FUNCTION migrate_lineup_to_v2_state(p_lineup_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_team_id UUID;
  v_players JSONB;
  v_slots JSONB := '[]'::jsonb;
  v_player RECORD;
  v_athlete_id UUID;
  v_slot_num INT := 1;
BEGIN
  -- Get the lineup data
  SELECT team_id, players INTO v_team_id, v_players
  FROM lineups
  WHERE id = p_lineup_id;

  -- If players is not an array, return default state
  IF jsonb_typeof(v_players) != 'array' THEN
    RETURN jsonb_build_object(
      'slots', '[]'::jsonb,
      'rotation', jsonb_build_object('order', '[]'::jsonb, 'current', 0),
      'drawings', '[]'::jsonb,
      'meta', '{}'::jsonb
    );
  END IF;

  -- Convert each player to a slot
  FOR v_player IN
    SELECT value AS player FROM jsonb_array_elements(v_players)
  LOOP
    -- Find the athlete by jersey number
    SELECT id INTO v_athlete_id
    FROM athletes
    WHERE team_id = v_team_id
      AND jersey_number = v_player.player->>'number'
    LIMIT 1;

    -- Build the slot
    v_slots := v_slots || jsonb_build_object(
      'slot', v_slot_num,
      'athlete_id', v_athlete_id,
      'x', COALESCE((v_player.player->>'x')::numeric, (v_slot_num - 1) * 15 + 20),
      'y', COALESCE((v_player.player->>'y')::numeric, CASE WHEN v_slot_num <= 3 THEN 70 ELSE 30 END)
    );

    v_slot_num := v_slot_num + 1;
  END LOOP;

  -- Build and return the full state object
  RETURN jsonb_build_object(
    'slots', v_slots,
    'rotation', jsonb_build_object(
      'order', (
        SELECT jsonb_agg(a.id)
        FROM athletes a
        WHERE a.team_id = v_team_id
          AND a.id IN (SELECT (elem->>'athlete_id')::uuid FROM jsonb_array_elements(v_slots) AS elem WHERE elem->>'athlete_id' IS NOT NULL)
      ),
      'current', 0
    ),
    'drawings', '[]'::jsonb,
    'meta', '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql;

-- Update all lineups with the new state format
UPDATE lineups
SET
  state = migrate_lineup_to_v2_state(id),
  state_version = 1
WHERE state = '{}'::jsonb OR state IS NULL;

-- Drop the migration function (no longer needed)
DROP FUNCTION IF EXISTS migrate_lineup_to_v2_state(UUID);

-- ============================================
-- Step 3: Backfill state_version for any remaining records
-- ============================================

UPDATE lineups
SET state_version = 1
WHERE state_version IS NULL OR state_version = 0;

-- ============================================
-- Step 4: Create profiles for existing users
-- ============================================

-- Insert profiles for existing users who don't have one
INSERT INTO profiles (id, display_name)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'display_name', au.email)
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = au.id
);

-- ============================================
-- Verification queries (run manually to check)
-- ============================================

-- Check athletes were created
-- SELECT team_id, COUNT(*) as athlete_count FROM athletes GROUP BY team_id;

-- Check lineups have state populated
-- SELECT id, name, state IS NOT NULL as has_state, state_version FROM lineups;

-- Check all team members have valid roles
-- SELECT team_id, role, COUNT(*) FROM team_members GROUP BY team_id, role;
