# Test Accounts + Social Flow Seed

This script creates 5 test accounts, upserts profiles, and seeds follow/like/comment activity.

## Prerequisites

1. `public.categories` is seeded (must include `cat-013`).
2. `public.products` has at least 3 rows.
3. Run these migrations first:
- `supabase/add-profile-onboarding-and-follows.sql`
- `supabase/add-notifications.sql`
- `supabase/add-notification-guards-and-analytics.sql`

## Required env vars

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Run

```bash
node scripts/seed-test-social-flow.mjs --seed=demo1
```

Optional:

```bash
node scripts/seed-test-social-flow.mjs --seed=demo1 --password='Loadouts!12345'
```

The script prints:
- created/reused user emails
- handles
- shared password
- demo loadout slug
