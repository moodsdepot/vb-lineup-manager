# Testing

## Pyramid
- Unit: pure functions (rotations, swaps, state transforms, token hashing/validation).
- Integration: API routes + edge functions (share-link validation, accept flow, lineup save with state_version).
- E2E/manual: mobile open share link → view; login → edit; save → reload; revoke link → 403.

## Commands
- Install deps: `npm install`
- Run unit/integration: `npm test` (add vitest/jest config)
- Lint/type: `npm run lint` and `npm run typecheck` (if configured)

## Checklist per PR
- [ ] New logic covered by unit tests.
- [ ] Share-link happy path covered (valid token returns view data).
- [ ] Expired/revoked token returns correct status (no DB leak).
- [ ] Lineup save tests include stale `state_version` conflict.
- [ ] RLS policies validated (policy scripts or supabase tests).
- [ ] Manual mobile QA ran for primary flow.
- [ ] Docs updated (codex, API/contracts, RLS) when behavior changes.

## Manual QA Script (mobile-first)
1. Open `/s/<token>` in private window → lineup visible, read-only.
2. Sign in (editor) and reopen link → edit controls enabled; autosave fires.
3. Rotate/swap players, draw, tap elsewhere → state_version increments; refresh shows changes.
4. Revoke link → private window refresh → blocked.
5. Expired link (set past expiry) → blocked with friendly message.
6. Network drop during save → UI shows retry; after reconnect, data consistent.
