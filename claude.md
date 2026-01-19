# Claude Code Guidelines
- Keep changes in branch `v2-rebuild` unless told otherwise; target base is `main`.
- Favor `rg` for search; keep edits minimal and well-commented only where needed.
- Treat Supabase as source of truth; never bypass RLS in code or tests.
- Do not store raw share tokens—always hash before DB writes; verify via edge function.
- Mobile-first: test layouts at 375px width; one primary action per screen.
- Autosave must be conflict-safe using `state_version`; reject stale writes with clear UX.
- Always run lint/tests before pushing (`npm run lint`, `npm test` when configured).
- Update docs (`codex.md`, `docs/*.md`, `TESTING.md`) when behavior or APIs change.
