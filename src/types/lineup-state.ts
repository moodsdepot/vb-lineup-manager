// V2 Lineup State Types
// Normalized state structure with athlete references and optimistic locking

// ============================================
// Enums
// ============================================

export type TeamRole = 'owner' | 'editor' | 'viewer';
export type ShareLinkRole = 'editor' | 'viewer';
export type ResourceType = 'team' | 'lineup';
export type VolleyballPosition = 'OH' | 'MB' | 'S' | 'OPP' | 'L' | 'DS';

// ============================================
// Athletes
// ============================================

export interface Athlete {
  id: string;
  team_id: string;
  jersey_number: string;
  display_name: string | null;
  position: VolleyballPosition | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AthleteCreate {
  team_id: string;
  jersey_number: string;
  display_name?: string;
  position?: VolleyballPosition;
  is_active?: boolean;
}

export interface AthleteUpdate {
  jersey_number?: string;
  display_name?: string | null;
  position?: VolleyballPosition | null;
  is_active?: boolean;
}

// ============================================
// Lineup State (stored as JSONB in lineups.state)
// ============================================

export interface LineupSlot {
  slot: number;          // Position on court (1-6 for starters, 7+ for bench)
  athlete_id: string | null;  // Reference to athletes table, null if empty slot
  label?: string;        // Optional override label (e.g., "Sub")
  x: number;             // X position on court (0-100 percentage)
  y: number;             // Y position on court (0-100 percentage)
}

export interface LineupRotation {
  order: string[];       // Array of athlete_ids in rotation order
  current: number;       // Current position in rotation (0-based index)
}

export interface LineupDrawingPoint {
  x: number;
  y: number;
}

export interface LineupDrawing {
  id: string;
  color: string;
  width?: number;
  points: LineupDrawingPoint[];
}

export interface LineupMeta {
  formation?: string;    // e.g., "5-1", "6-2"
  notes?: string;
}

export interface LineupState {
  slots: LineupSlot[];
  rotation?: LineupRotation;
  drawings?: LineupDrawing[];
  meta?: LineupMeta;
}

// ============================================
// Lineup (full database record)
// ============================================

export interface Lineup {
  id: string;
  team_id: string;
  name: string;
  players: unknown;      // Legacy JSON field (deprecated)
  state: LineupState;
  state_version: number;
  created_at: string;
  updated_at: string;
}

export interface LineupCreate {
  team_id: string;
  name?: string;
  state?: LineupState;
}

export interface LineupUpdate {
  name?: string;
  state?: LineupState;
  state_version: number; // Required for optimistic locking
}

// ============================================
// Share Links
// ============================================

export interface ShareLink {
  id: string;
  token_hash: string;    // SHA-256 hash of the token (never stored raw)
  resource_type: ResourceType;
  resource_id: string;
  role: ShareLinkRole;
  created_by: string;
  expires_at: string | null;
  revoked_at: string | null;
  max_uses: number | null;
  use_count: number;
  created_at: string;
}

export interface ShareLinkCreate {
  resource_type: ResourceType;
  resource_id: string;
  role?: ShareLinkRole;
  expires_at?: string;
  max_uses?: number;
}

// Response when creating a share link (includes raw token only at creation time)
export interface ShareLinkCreateResponse {
  id: string;
  token: string;        // Raw token - only returned at creation time
  share_url: string;    // Full URL for sharing
  role: ShareLinkRole;
  expires_at: string | null;
  max_uses: number | null;
}

export interface ShareLinkValidation {
  valid: boolean;
  resource_type?: ResourceType;
  resource_id?: string;
  role?: ShareLinkRole;
  error?: string;
}

// ============================================
// Teams (V2)
// ============================================

export interface Team {
  id: string;
  name: string;
  code: string | null;
  sport_type: string;
  created_by: string | null;
  archived_at: string | null;
  created_at: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
}

export interface TeamWithRole extends Team {
  role: TeamRole;
}

// ============================================
// Profiles
// ============================================

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface VersionConflictError extends ApiError {
  code: 'VERSION_CONFLICT';
  current_version: number;
  attempted_version: number;
}

// Default lineup state for new lineups
export const DEFAULT_LINEUP_STATE: LineupState = {
  slots: [
    { slot: 1, athlete_id: null, x: 20, y: 70 },
    { slot: 2, athlete_id: null, x: 50, y: 70 },
    { slot: 3, athlete_id: null, x: 80, y: 70 },
    { slot: 4, athlete_id: null, x: 80, y: 30 },
    { slot: 5, athlete_id: null, x: 50, y: 30 },
    { slot: 6, athlete_id: null, x: 20, y: 30 },
  ],
  rotation: {
    order: [],
    current: 0,
  },
  drawings: [],
  meta: {},
};
