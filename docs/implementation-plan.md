# Implementation Plan (V2 Rebuild)

## Phase 0: Setup
- Create branch `v2-rebuild`; add Supabase project configs.
- Add env scaffolding (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).
- Install testing/lint tooling (vitest/jest, testing-library, eslint).

## Phase 1: Database
- Define enums (`member_role`, `share_role`, `resource_type`).
- Create tables: teams, team_members, athletes, lineups, lineup_snapshots, play_diagrams, share_links, share_link_uses, profiles.
- Add triggers: auto-owner on team insert; bump `updated_at`; protect last owner.
- Enable RLS everywhere; add policies per `docs/rls-policies.md`.

## Phase 2: Edge Functions
- `validate-share-link`: hash token, validate, increment uses, return payload.
- `accept-share-link`: validate token, add membership (capped at editor), log use.
- Unit tests for both functions.

## Phase 3: API Routes (Next.js)
- `/api/teams` create.
- `/api/teams/:teamId/share-links` create (owner only).
- `/api/share-links/accept` proxy to edge function.
- `/api/lineups` create/read/update with `state_version` conflict handling.

## Phase 4: Frontend (mobile-first)
- Public share route `/s/[token]` that calls edge validate and shows read-only lineup.
- Authenticated views for teams, roster, lineup editor with direct manipulation and autosave.
- Clear save states (saving/saved/error + retry), percent-based positioning.

## Phase 5: Quality
- Tests: unit (state transforms, rotation), integration (API + edge), lint/type.
- Manual mobile QA script (see `TESTING.md`).
- Observability: minimal logging around share-link validation and save conflicts.

## Phase 6: Launch Hardening
- Expiry/revocation UI, link regeneration.
- Max-uses support (optional) with tests.
- Snapshot pruning/retention decision.
- Review docs (`codex.md`, share-links, schema, RLS, testing) for completeness.
