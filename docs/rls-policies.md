# RLS Policies (Supabase)
All tables have `enable row level security`. Guests never hit tables directly; share-link traffic goes through Edge Functions using service-role key and re-validates token hash + expiry + revocation.

## Helper functions
Create small SQL helpers (examples):
```sql
create function is_team_member(p_team uuid, min_role text)
returns boolean as $$
  select exists (
    select 1 from team_members tm
    where tm.team_id = p_team
      and tm.user_id = auth.uid()
      and tm.role in ('owner','editor','viewer')
      and (min_role = 'viewer'
        or (min_role = 'editor' and tm.role in ('owner','editor'))
        or (min_role = 'owner' and tm.role = 'owner'))
  );
$$ language sql stable;
```

## teams
- `select`: members only (`is_team_member(id, 'viewer')`).
- `insert`: authenticated users allowed; creator becomes owner via trigger into `team_members`.
- `update/delete`: owners only.

## team_members
- `select`: members of the team.
- `insert`: owners only; cannot downgrade last owner.
- `update`: owners only (role changes).
- `delete`: owners only (and protect last owner via check in trigger/policy predicate).

## athletes
- `select`: members (`is_team_member(team_id, 'viewer')`).
- `insert/update/delete`: editors or owners (`is_team_member(team_id, 'editor')`).

## lineups
- `select`: members (`is_team_member(team_id, 'viewer')`).
- `insert`: editors/owners (`is_team_member(team_id, 'editor')`).
- `update/delete`: editors/owners AND check `state_version` matches predicate.
  ```sql
  using (is_team_member(team_id,'editor'))
  with check (
    is_team_member(team_id,'editor')
    and state_version = old.state_version + 1 -- ensure increment happens in code
  );
  ```

## lineup_snapshots
- `select`: members.
- `insert`: server-side only (via RPC) to avoid bloat; policy allows owner/editor or service role.

## play_diagrams (optional)
- Same as `lineups` but without version guard (or add if stateful).

## share_links
- `select`: owners only (`resource` owner via team membership).
- `insert`: owners only.
- `update` (revoke/expiry): owners only.
- `delete`: owners only.
- `uses` increment: via service role in edge function; policy permits `auth.jwt()->>'role' = 'service_role'`.

## share_link_uses
- `select`: owners only.
- `insert`: service role only (edge function writes audit rows).

## Hard blocks
- Add `policy deny guests` that returns false when `auth.uid()` is null on all tables to prevent anonymous leakage.
- For any RPC used by guests (via edge), require service-role key + input token validation that reads `share_links` by hash, checks expiry/revocation, then returns only projected data needed for view.
