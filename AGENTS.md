# AGENTS.md

This file defines project-specific rules for AI/code agents working in this repository.

## Project Overview
- App name: `Loadouts`
- Product: creator/product loadout sharing platform
- Core stack: Next.js 14 App Router + TypeScript + Tailwind + Supabase Auth/Postgres
- Session strategy: Supabase SSR cookie sessions (`@supabase/ssr`)

## Non-Negotiable Architecture Decisions
1. Use **Supabase Auth only**.
- Do not reintroduce NextAuth routes, adapters, or middleware.

2. Enforce profile completion for write actions.
- Protected writes should use `requireCompleteUser()`.
- If profile is incomplete, return/propagate `PROFILE_INCOMPLETE` (`409`).

3. Keep categories fixed.
- Categories are constrained to 100 seeded slugs: `cat-001` ... `cat-100`.
- Do not add user-created categories unless explicitly requested.

4. Maintain current API error contract.
- `401`: `{ error: { code: "UNAUTHORIZED", message: "Sign in required" } }`
- `403`: `{ error: { code: "FORBIDDEN", message: "Not allowed" } }`
- `409`: `{ error: { code: "PROFILE_INCOMPLETE", message: "Complete profile setup" } }`

## Environment Requirements
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

Optional (admin-only seed scripts):
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOADOUTS_ADMIN_EMAILS`

## Important Paths
- App routes: `app/*`
- API routes: `app/api/*`
- Auth/session middleware: `middleware.ts`, `lib/supabase/middleware.ts`
- Supabase clients: `lib/supabase/browser.ts`, `lib/supabase/server.ts`
- Auth utilities: `lib/auth/*`
- Data access layer: `lib/data/*`
- SQL migrations/seeds: `supabase/*`

## Naming Conventions
- Use `category` for the fixed discovery taxonomy only.
- Use `loadout` for creator-published setups in UI copy and route naming.
- The `collections` table is a storage detail; avoid exposing `collection` in new user-facing copy unless the API contract already depends on it.
- Use `saved` for bookmarks and `studio` for the owner workspace.

## Supabase Migration/Seed Order
When bootstrapping a new environment, apply in order:
1. `supabase/content-schema.md` (core schema SQL)
2. `supabase/add-profile-onboarding-and-follows.sql`
3. `supabase/add-notifications.sql`
4. `supabase/add-notification-guards-and-analytics.sql`
5. `supabase/add-operational-visibility.sql`
6. `supabase/add-publishing-storage-and-reports.sql`
7. `supabase/seed-100-categories.sql`
8. `supabase/seed-100-category-images.sql` (optional starter)
9. `supabase/seed-content.sql`

Validation helpers:
- `supabase/verify-profile-onboarding-and-follows.sql`
- `supabase/verify-category-images.sql`
- `supabase/verify-notifications-and-analytics.sql`
- `supabase/verify-operational-visibility.sql`
- `supabase/verify-publishing-storage-and-reports.sql`

## Coding Rules
1. Keep changes TypeScript-safe and App Router compatible.
2. Prefer existing helpers over duplicating logic.
- Auth checks: `lib/auth/api.ts`
- Redirect sanitization: `lib/auth/redirect.ts`
- Data queries: `lib/data/*`

3. For client-side mutations on server-rendered pages:
- Update local UI state optimistically/safely.
- Call `router.refresh()` after success to avoid stale route cache.

4. For ownership-protected writes:
- Resolve resource owner server-side.
- Use `assertOwner()` before update/delete.

5. Keep notifications best-effort and non-blocking.
- User action should succeed even if notification insert fails.
- Respect DB dedupe guards for notifications.

6. Preserve accessibility and UX basics.
- Buttons/inputs must remain keyboard-usable.
- Keep auth redirects with `next` propagation.

## Existing Feature Status
Implemented:
- Auth (email/password + callback/confirm flow)
- Profile onboarding and immutable username setup
- Follow/unfollow + followers/following pages
- Save/bookmark system
- Likes/comments persistence
- Notifications + pagination + mark-read
- Following feed + pagination
- Search across entities
- Studio workspace for owned loadouts + operational visibility
- Loadout create/edit/delete + inline product management
- Draft / published / archived loadout workflow
- Media uploads (avatar, loadout cover, product image)
- Share/report actions for public profiles and loadouts
- Admin moderation dashboard
- Vitest integration coverage for auth, onboarding, saves, notifications, and interaction validation

## Quality Gates Before Handoff
Run:
```bash
npm test
npm run build
```

If you run standalone type-check and see missing `.next/types/*`, generate build artifacts first:
```bash
npm run build && npx tsc --noEmit
```

## Deployment Notes
- Expected deployment model: Vercel + Supabase.
- Ensure Supabase Auth redirect URLs include:
  - `/auth/callback`
  - `/auth/confirm`

## Change Management
- Keep commits focused and atomic.
- Document schema-impacting changes in `supabase/` with matching verify SQL where useful.
- Update `README.md` when setup steps, env vars, or architecture assumptions change.
