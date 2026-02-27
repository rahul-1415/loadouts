# Loadouts

Loadouts is a Next.js + Supabase app for sharing creator/product loadouts, organized under a fixed A-Z category system.

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth (email/password + OAuth)
- Supabase SSR sessions (`@supabase/ssr`)

## Current Features
- Supabase-only auth flow (signup/login/logout)
- Username/profile onboarding gate for incomplete users
- Public profile pages with followers/following
- Follow/unfollow APIs and profile lists (cursor pagination)
- Fixed 100 category model (`cat-001` to `cat-100`)
- Loadout create/edit/delete with category assignment
- Product management inside loadouts
- Likes and comments persisted in Supabase
- Notification center + unread state + pagination
- Following feed with pagination
- Search across content types

## Project Structure
- `app/` routes and API handlers
- `components/` reusable UI
- `lib/` data/auth/supabase helpers
- `supabase/` SQL schema, migrations, and seed docs
- `scripts/` utility scripts (image fetch + social seed)

## Local Setup
1. Install dependencies:
```bash
npm install
```

2. Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Optional (needed for admin seed script only):
```bash
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

3. Start dev server:
```bash
npm run dev
```

4. Build check:
```bash
npm run build
```

## Supabase Setup Order
Run these in Supabase SQL editor, in this order:

1. Core schema: see `supabase/content-schema.md`
2. Profile onboarding + follows: `supabase/add-profile-onboarding-and-follows.sql`
3. Notifications table/policies: `supabase/add-notifications.sql`
4. Notification dedupe + analytics milestones: `supabase/add-notification-guards-and-analytics.sql`
5. Fixed categories: `supabase/seed-100-categories.sql`
6. Category images (optional starter): `supabase/seed-100-category-images.sql`
7. Seed content/products/loadouts: `supabase/seed-content.sql`

Verification helpers:
- `supabase/verify-profile-onboarding-and-follows.sql`
- `supabase/verify-category-images.sql`
- `supabase/verify-notifications-and-analytics.sql`

## Auth Provider Configuration (Supabase Dashboard)
Enable providers you need and add redirect URLs:
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/confirm`

For production, add your deployed domain equivalents.

## Utility Scripts
- Fetch category images from Pexels:
```bash
node scripts/fetch-pexels-category-images.mjs
```

- Seed social test flow (requires service role key):
```bash
node scripts/seed-test-social-flow.mjs --seed=demo1
```

More details: `supabase/test-social-flow.md`

## Important Notes
- Like/comment writes require an authenticated user with a complete profile.
- The Save API (`app/api/saved/route.ts`) is still scaffolded and not fully implemented.
- Categories are intentionally fixed to the 100 seeded slugs.
