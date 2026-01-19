# Lineupman V2 Codex

## Goal
Rebuild Lineupman with a mobile-first experience, reliable share links, and a scalable Supabase-backed backend. Guests can open a share link and view immediately; editing always requires login plus editor/owner role.

## Principles
- Mobile-first: one primary action per screen; 44x44 tap targets; direct manipulation (tap/drag/swap) instead of modal-heavy flows.
- Offline-tolerant: optimistic UI, clear saving state, retry paths.
- Share-first: links must open fast, never leak raw tokens, and respect expiry/revocation.
- Least privilege: RLS enabled everywhere; guests never touch tables directly; editors/owners only.
- Versioned state: lineup state stored as JSON with `state_version` for conflict detection.

## Stack
- Next.js App Router (server + client split, route handlers for APIs).
- Supabase Postgres with Row Level Security for DB + auth.
- Supabase Edge Functions for share-link validation/acceptance and guest data access.

## Core Flows
1) Open share link → view lineup immediately (guest view-only).
2) Logged-in editor opens share link → can edit lineup and save.
3) Create team → invite members → manage roster + lineups.
4) Rotation/drawing tools → autosave; conflict-safe via `state_version`.

## Roles
- owner: full control, can create/revoke share links, manage members, edit everything.
- editor: edit lineups and roster, cannot manage owners.
- viewer: read-only (member-based access), no writes.
- guest via share link: view-only; role elevated to editor/owner only via authenticated membership.

## Data Model (high-level)
- `teams` (sport_type, created_by, archived_at, optional code).
- `team_members` (team_id, user_id, role: owner/editor/viewer).
- `athletes` (roster entries per team).
- `lineups` (team_id, state jsonb, state_version int, created_by).
- `lineup_snapshots` (optional history/audit per lineup).
- `play_diagrams` (optional rich drawings per team/lineup).
- `share_links` (token_hash, resource_type, resource_id, role, expires_at, revoked_at, uses).
- `share_link_uses` (optional audit per open).

Lineup state JSON shape:
```json
{
  "slots": [{ "slot": 1, "athlete_id": "uuid", "label": "OPP", "x": 67, "y": 75 }],
  "rotation": { "order": [1,2,3,4,5,6], "current": 0 },
  "drawings": [{ "id": "uuid", "color": "#fff", "points": [[0.1,0.2],[0.2,0.3]] }],
  "meta": { "court": "volleyball", "units": "percent" }
}
```

## URLs
- Public share: `/s/<token>` → fetch via edge function; raw token never stored, only `token_hash`.
- Authenticated app: standard Next.js routes under `/` (teams, lineups, roster, settings).

## Edge Functions
- `validate-share-link`: input `{ token }`, output sanitized share-link data + role + expiry; handles revocation/expiry.
- `accept-share-link`: input `{ token, user_id }`, optionally adds membership; always re-checks validity server-side.

## Quality Bar
- Unit tests for rotations, swaps, state transforms, token validation.
- Integration tests for share link validation + lineup save.
- Manual mobile QA: open share link → view; login → edit; save → reload.
- Pre-merge: tests green, RLS policies validated, docs updated.

## Non-Goals (for V2)
- Rich analytics; keep to basic usage metrics.
- Complex role hierarchies beyond owner/editor/viewer.
- Offline-first storage; just tolerant with retries.

## Open Questions
- Sport-specific defaults beyond volleyball? (capture in future schema migration)
- Snapshot retention policy (time-based vs count-based)
- Drawing tool formats (vector export?)
