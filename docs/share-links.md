# Share Links

## Goals
- Fast, reliable, revocable share links that never leak raw tokens server-side.
- Guests can view immediately; editing requires authenticated membership with role ≥ editor.

## URL + Storage
- Public URL: `/s/<token>`
- Only store `token_hash = sha256(token)` in DB.
- Table: `share_links` (token_hash, resource_type, resource_id, role, expires_at, revoked_at, max_uses, uses).
- Optional audit: `share_link_uses` records ip/ua/user_id per open.

## Token Lifecycle
1. **Create**: owner calls API → backend generates random 32+ byte token, stores hash, returns raw token once.
2. **Open**: client hits Edge Function `validate-share-link` with token.
   - Hash token, lookup share_links.
   - Reject if not found, expired, revoked, or max_uses reached.
   - Increment uses (service role) and return payload: `{resource_type, resource_id, role, expires_at}`.
3. **View**: Next.js route fetches lineup/team data through authenticated API. Guests stay anonymous.
4. **Accept (optional)**: logged-in user posts token to `accept-share-link`; if valid and resource is team-scoped, add membership with `role` (capped at editor) when not present.
5. **Revoke/Expire**: owner updates share_link; further opens fail with friendly message.

## Guest Data Access
- Guests never query Postgres directly.
- Edge Function validates token and returns only projected data (e.g., lineup state) or a signed fallback URL (storage) needed for the view-only screen.

## Security Notes
- Always compare hashes using constant-time check.
- Do not log raw tokens. Log hashed token prefixes for debugging at most.
- Ensure `uses` increment happens inside a transaction with the validation to avoid race conditions.
- Add max age to share tokens if unused (optional auto-expire).

## UX States
- Loading → Valid → Expired → Revoked → Max-uses-reached → Unexpected-error.
- Friendly messaging; never expose whether resource exists when token is invalid.

## Testing
- Valid token returns data.
- Expired token returns 410/403 equivalent.
- Revoked token blocked.
- uses counter increments once per open.
- Token reuse with changed role not allowed (role stored with link).
