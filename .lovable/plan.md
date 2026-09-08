# Make nyakandachido@gmail.com and levimurombo@gmail.com both admins

## Current state (verified)
- Only one auth user exists: `levimurombo@gmail.com` (id 9572beb3-…) with role `admin`.
- `nyakandachido@gmail.com` has no auth account, so it cannot sign in at all.
- The `handle_new_user()` trigger auto-creates a profile and assigns new sign-ups the `viewer` role (admin only when the roles table is empty).

## Steps

1. **Create the nyakandachido account**
   - Sign up `nyakandachido@gmail.com` with password `m@n@n@5` through the app's auth (driven via the preview signup call). The trigger creates its profile with the default `viewer` role.

2. **Grant admin to both accounts** (single SQL data update)
   - Upsert `admin` into `public.user_roles` for both `nyakandachido@gmail.com` and `levimurombo@gmail.com` (Levi already has it — kept for idempotency).
   - Verify with a select that both users hold the `admin` role.

3. **Update project memory**
   - Record both admin emails; note the password is only the initial credential for the new account and roles now live in `user_roles`.

## Notes
- No schema changes — this is account creation + one data update, no migration needed.
- No frontend changes; the Team view will show both admins once they exist.
