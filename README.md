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
- Draft / published / archived loadout states with a publish checklist
- Cover-image and avatar uploads via Supabase Storage
- Inline product management during loadout creation and editing
- Product catalog page with brand and product-category filters
- Save/bookmark system with a dedicated saved-items page
- Studio workspace for creator-owned loadouts and operational insights
- Likes and comments persisted in Supabase
- Notification center + unread state + pagination + live refresh
- Related loadout recommendations on detail pages
- Profile and loadout share/report actions
- Admin moderation dashboard for reports, missing covers, and failures
- Following feed with pagination
- Search across content types
- Vitest integration coverage for auth, onboarding, saves, notifications, and interaction validation

## Project Structure
- `app/` routes and API handlers
- `components/` reusable UI
- `lib/` data/auth/supabase helpers
- `data/` curated product catalog manifest used for taxonomy and imports
- `supabase/` SQL schema, migrations, and seed docs
- `scripts/` utility scripts (image fetch + social seed + product catalog import)

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
LOADOUTS_ADMIN_EMAILS=you@example.com,other-admin@example.com
```

3. Start dev server:
```bash
npm run dev
```

4. Test suite:
```bash
npm test
```

5. Build check:
```bash
npm run build
```

## Supabase Setup Order
Run these in Supabase SQL editor, in this order:

1. Core schema: see `supabase/content-schema.md`
2. Profile onboarding + follows: `supabase/add-profile-onboarding-and-follows.sql`
3. Notifications table/policies: `supabase/add-notifications.sql`
4. Notification dedupe + analytics milestones: `supabase/add-notification-guards-and-analytics.sql`
5. Operational visibility events: `supabase/add-operational-visibility.sql`
6. Publishing + uploads + reports: `supabase/add-publishing-storage-and-reports.sql`
7. Owner-scoped loadout slugs: `supabase/add-owner-scoped-loadout-slugs.sql`
8. Fixed categories: `supabase/seed-100-categories.sql`
9. Category images (optional starter): `supabase/seed-100-category-images.sql`
10. Seed content/products/loadouts: `supabase/seed-content.sql`

Verification helpers:
- `supabase/verify-profile-onboarding-and-follows.sql`
- `supabase/verify-category-images.sql`
- `supabase/verify-notifications-and-analytics.sql`
- `supabase/verify-operational-visibility.sql`
- `supabase/verify-publishing-storage-and-reports.sql`
- `supabase/verify-owner-scoped-loadout-slugs.sql`

## Auth Provider Configuration (Supabase Dashboard)
Enable providers you need and add redirect URLs:
- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/confirm`

For production, add your deployed domain equivalents.

## Naming Model
- `categories`: fixed taxonomy only (`cat-001` ... `cat-100`)
- `loadouts`: creator-published setups stored in the `collections` table with `kind = "loadout"`
- `saved`: private bookmarks for the signed-in user
- `studio`: creator workspace for managing owned loadouts and viewing operational signals

## Utility Scripts
- Fetch category images from Pexels:
```bash
node scripts/fetch-pexels-category-images.mjs
```

- Seed social test flow (requires service role key):
```bash
node scripts/seed-test-social-flow.mjs --seed=demo1
```

- Import the curated product catalog from official product pages:
```bash
set -a && source .env.local && set +a && node scripts/import-curated-product-catalog.mjs
```

More details: `supabase/test-social-flow.md`

## Important Notes
- Like/comment writes require an authenticated user with a complete profile.
- Save writes require an authenticated user with a complete profile.
- Uploads require `SUPABASE_SERVICE_ROLE_KEY` on the server and the `media` bucket/policies from `supabase/add-publishing-storage-and-reports.sql`.
- `/saved` is the bookmark page; `/studio` is the creator workspace. `/my-loadouts` now redirects to `/studio` for backward compatibility.
- Categories are intentionally fixed to the 100 seeded slugs.
