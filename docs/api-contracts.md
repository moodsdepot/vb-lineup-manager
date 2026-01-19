# API Contracts (Next.js App Router)

All requests are JSON over HTTPS. Auth via Supabase JWT (cookie-based session).

## Teams

### GET /api/teams
- Auth: required
- Returns: `{ teams: TeamWithRole[] }`
- Lists all teams the user is a member of (excludes archived)

### POST /api/teams
- Auth: required
- Body: `{ name: string, sport_type?: string }`
- Creates team; creator becomes owner
- 201 → `{ team: TeamWithRole }`

### GET /api/teams/:teamId
- Auth: team member
- Returns: `{ team: TeamWithRole }`

### PATCH /api/teams/:teamId
- Auth: team owner
- Body: `{ name?: string, sport_type?: string, archived_at?: string | null }`
- 200 → `{ team: TeamWithRole }`

### DELETE /api/teams/:teamId
- Auth: team owner
- Soft deletes (sets archived_at)
- 200 → `{ success: true }`

## Athletes

### GET /api/teams/:teamId/athletes
- Auth: team member
- Returns: `{ athletes: Athlete[] }`

### POST /api/teams/:teamId/athletes
- Auth: team editor+
- Body: `{ jersey_number: string, display_name?: string, position?: 'OH'|'MB'|'S'|'OPP'|'L'|'DS', is_active?: boolean }`
- 201 → `{ athlete: Athlete }`

### PATCH /api/teams/:teamId/athletes/:athleteId
- Auth: team editor+
- Body: same as POST (partial)
- 200 → `{ athlete: Athlete }`

### DELETE /api/teams/:teamId/athletes/:athleteId
- Auth: team editor+
- 200 → `{ success: true }`

## Lineups

### GET /api/teams/:teamId/lineups
- Auth: team member
- Returns: `{ lineups: LineupSummary[] }` (without full state)

### POST /api/teams/:teamId/lineups
- Auth: team editor+
- Body: `{ name?: string, state?: LineupState }`
- 201 → `{ lineup: Lineup }`

### GET /api/lineups/:lineupId
- Auth: team member
- Returns: `{ lineup: Lineup, can_edit: boolean }`

### PATCH /api/lineups/:lineupId
- Auth: team editor+
- Body: `{ name?: string, state?: LineupState, state_version: number }`
- Rejects with 409 if `state_version` != current (optimistic locking)
- 200 → `{ lineup: Lineup }`

### DELETE /api/lineups/:lineupId
- Auth: team editor+
- 200 → `{ success: true }`

## Share Links

### GET /api/teams/:teamId/share-links
- Auth: team owner
- Returns: `{ share_links: ShareLinkInfo[] }`

### POST /api/teams/:teamId/share-links
- Auth: team owner
- Body: `{ role?: 'viewer'|'editor', expires_at?: string, max_uses?: number }`
- Generates token, stores hash, returns raw token once
- 201 → `{ id, token, share_url, role, expires_at, max_uses }`

### POST /api/share-links/validate
- Auth: none (public)
- Body: `{ token: string }`
- Validates token (checks hash, expiry, revocation, uses)
- 200 → `{ valid: boolean, resource_type?, resource_id?, role?, error? }`

### POST /api/share-links/accept
- Auth: required
- Body: `{ token: string }`
- Validates token and adds user as team member with share link role
- 200 → `{ success: true, team_id, role, already_member: boolean }`

## Error Codes

| Code | Description |
|------|-------------|
| 400  | VALIDATION_ERROR - Invalid request body |
| 401  | UNAUTHORIZED - Not authenticated |
| 403  | FORBIDDEN - Not authorized for this action |
| 404  | NOT_FOUND - Resource not found |
| 409  | VERSION_CONFLICT - Optimistic lock failure |
| 500  | SERVER_ERROR - Internal error |

## LineupState Schema

```typescript
interface LineupState {
  slots: LineupSlot[];
  rotation?: { order: string[], current: number };
  drawings?: LineupDrawing[];
  meta?: { formation?: string, notes?: string };
}

interface LineupSlot {
  slot: number;
  athlete_id: string | null;
  label?: string;
  x: number;  // 0-100 percentage
  y: number;  // 0-100 percentage
}

interface LineupDrawing {
  id: string;
  color: string;
  width?: number;
  points: { x: number, y: number }[];
}
```

## Version Conflict Response

When a version conflict occurs on lineup update:

```json
{
  "error": "Version conflict - resource has been modified",
  "code": "VERSION_CONFLICT",
  "current_version": 5,
  "attempted_version": 4
}
```

Client should either reload and merge, or prompt user to resolve.
