# Schema V2 (Supabase/Postgres)

## Conventions
- UUID primary keys (`uuid_generate_v4()`), snake_case, `created_at`/`updated_at` timestamptz.
- Enum types: `member_role` = owner|editor|viewer; `share_role` = viewer|editor; `resource_type` = team|lineup|play_diagram.
- All tables have RLS enabled.

## profiles (optional)
- `id uuid pk references auth.users not null`
- `display_name text`
- `avatar_url text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

## teams
- `id uuid pk`
- `name text not null`
- `sport_type text not null` (e.g., volleyball, basketball)
- `created_by uuid references auth.users not null`
- `archived_at timestamptz`
- `code text` (optional invite code)
- Timestamps
- Index: `idx_teams_created_by` on created_by

## team_members
- `id uuid pk`
- `team_id uuid references teams not null`
- `user_id uuid references auth.users not null`
- `role member_role not null`
- `added_by uuid references auth.users`
- Timestamps
- Unique: `(team_id, user_id)`
- Index: `idx_team_members_role` on (team_id, role)

## athletes
- `id uuid pk`
- `team_id uuid references teams not null`
- `name text not null`
- `number text` (jersey)
- `position text`
- `notes text`
- Timestamps
- Index: `idx_athletes_team` on team_id

## lineups
- `id uuid pk`
- `team_id uuid references teams not null`
- `state jsonb not null`
- `state_version int not null default 1`
- `created_by uuid references auth.users`
- `updated_by uuid references auth.users`
- Timestamps
- Index: `idx_lineups_team` on team_id

## lineup_snapshots (optional history)
- `id uuid pk`
- `lineup_id uuid references lineups not null`
- `state jsonb not null`
- `state_version int not null`
- `created_by uuid references auth.users`
- `created_at timestamptz default now()`
- Index: `(lineup_id, state_version desc)`

## play_diagrams (optional)
- `id uuid pk`
- `team_id uuid references teams not null`
- `data jsonb not null`
- `created_by uuid references auth.users`
- Timestamps

## share_links
- `id uuid pk`
- `token_hash text not null unique` (store hash only)
- `resource_type resource_type not null`
- `resource_id uuid not null`
- `role share_role not null default 'viewer'`
- `expires_at timestamptz`
- `revoked_at timestamptz`
- `max_uses int` (optional)
- `uses int not null default 0`
- `created_by uuid references auth.users`
- Timestamps
- Index: `(resource_type, resource_id)`

## share_link_uses (optional audit)
- `id uuid pk`
- `share_link_id uuid references share_links not null`
- `used_by uuid references auth.users` (nullable for guests)
- `request_ip inet`
- `user_agent text`
- `used_at timestamptz default now()`
- Index: `(share_link_id, used_at desc)`

## Lineup State JSON
See `codex.md` for canonical shape. Stored as percent-based coordinates to stay device-agnostic.
