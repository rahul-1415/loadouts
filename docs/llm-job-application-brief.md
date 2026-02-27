# Loadouts: LLM Job-Application Content Brief

Use this document as source context when asking an LLM to generate resume bullets, portfolio case studies, cover letters, and interview answers.

## 1) How to use this brief
- Paste this file into the LLM as context.
- Tell the model the exact output type you want (resume bullets, LinkedIn section, STAR stories, etc.).
- Tell the model your target role (Frontend, Full-Stack, Backend, Founding Engineer, etc.).
- Ask the model to stay within the facts listed here and avoid fabricated scale claims.

## 2) Project one-liner
Loadouts is a full-stack Next.js + Supabase application for creating, organizing, and sharing product loadouts under a fixed 100-category taxonomy, with auth, profiles, social graph, likes/comments, notifications, search, and feed.

## 3) Verified tech stack
- Frontend: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS.
- Backend: Next.js Route Handlers (`app/api/*`) with Supabase Postgres.
- Auth/session: Supabase Auth + `@supabase/ssr` cookie-based SSR sessions.
- Data access: Supabase client helpers for browser/server/middleware contexts.
- Infra/deploy target: Vercel + Supabase (free-tier compatible setup used during development).

## 4) Verified architecture and implementation details
### 4.1 Auth and access control
- Supabase-only auth architecture (no active NextAuth runtime path).
- Signup/login with email-password and OAuth-oriented callback/confirm routes.
- Profile completeness gate via middleware and API checks.
- Incomplete users are redirected to onboarding profile setup.
- Route protection for private pages with `next` redirect propagation.
- API-level standardized auth/ownership response patterns.

### 4.2 Data model and domain
- Content model includes profiles, categories, collections (loadouts), products, collection-products join, comments, likes, follows, notifications, analytics events.
- Categories are intentionally constrained to a fixed `cat-001` ... `cat-100` slug model.
- Loadouts are assigned to those categories and surfaced publicly based on visibility.

### 4.3 Social features
- Public profile pages with follow/unfollow.
- Followers/following pages with cursor-based pagination.
- Likes and comments persisted to DB, exposed through dedicated APIs.
- Notification generation for follow/like/comment events.

### 4.4 Reliability and data integrity
- Notification dedupe protection at DB level using a uniqueness key/index strategy.
- Non-blocking notification writes in interaction flows (core action succeeds even if notification write fails).
- Cursor pagination implemented for feed and notifications to avoid unbounded reads.

### 4.5 Discovery and content operations
- Following feed route/page.
- Search route/page with multi-entity results.
- Loadout create/edit workflow and product management within loadouts.
- Category image seeding and verification scripts/docs.

### 4.6 Brand/UI system
- Dark UI with integrated `LOADOUTS` branding assets (SVG-based icon/wordmark lockups).
- Shared nav/footer brand integration.
- Profile-aware navbar with auth-state-driven actions.

## 5) Evidence map (code references)
Use these paths as evidence anchors in generated portfolio/interview content:
- Auth middleware and route gating: `middleware.ts`
- Supabase SSR middleware sync: `lib/supabase/middleware.ts`
- Supabase server client: `lib/supabase/server.ts`
- Auth callback and confirm handlers: `app/auth/callback/route.ts`, `app/auth/confirm/route.ts`
- Profile onboarding page: `app/onboarding/profile/page.tsx`
- Profile setup API: `app/api/profile/setup/route.ts`
- Follow APIs: `app/api/follows/route.ts`, `app/api/follows/[targetHandle]/route.ts`
- Followers/following list APIs: `app/api/profiles/[userHandle]/followers/route.ts`, `app/api/profiles/[userHandle]/following/route.ts`
- Likes API: `app/api/likes/route.ts`
- Comments APIs: `app/api/comments/route.ts`, `app/api/comments/[id]/route.ts`
- Notifications API: `app/api/notifications/route.ts`
- Feed API: `app/api/feed/route.ts`
- Feed data layer: `lib/data/feed.ts`
- Notifications data layer: `lib/data/notifications.ts`
- Analytics helper: `lib/data/analytics.ts`
- Collections data layer: `lib/data/collections.ts`
- Search API/data: `app/api/search/route.ts`, `lib/data/search.ts`
- Loadout detail interaction UI: `components/CollectionEngagement.tsx`
- Loadout detail pages: `app/loadouts/[id]/page.tsx`, `app/collections/[id]/page.tsx`
- Profile page UI: `app/profile/[userHandle]/page.tsx`
- Notifications SQL migration: `supabase/add-notifications.sql`
- Notification guard + analytics migration: `supabase/add-notification-guards-and-analytics.sql`
- Core schema reference: `supabase/content-schema.md`

## 6) What is in scope vs not complete
### Implemented
- Auth + profile onboarding gate.
- Follow graph + paginated lists.
- Likes/comments persistence.
- Notifications + pagination + mark-read.
- Feed + pagination.
- Search and category/loadout/product surfacing.

### Known in-progress / partial
- Saved-items API is scaffolded and not fully implemented in `app/api/saved/route.ts`.

## 7) Claim-safe language guidance (important)
### Allowed claims
- "Designed and built" / "implemented" / "shipped" features listed above.
- "Implemented cursor-based pagination for feed/notifications."
- "Added DB-level dedupe guard for notifications."
- "Implemented Supabase SSR cookie session architecture and route/API protection."

### Do not claim without your own metrics
- Production DAU/MAU numbers.
- Latency/SLO improvements with exact percentages.
- Revenue impact.
- Team leadership scope you did not actually own.

### Metric placeholders you can fill later
- "Reduced stale UI reports by [X]% after refresh strategy updates."
- "Implemented [N]+ API routes across auth, social, feed, and content workflows."
- "Modeled [N] core relational tables with RLS policies."

## 8) Resume bullets (seed examples)
Use/adapt only if accurate for your role.

- Built a full-stack social loadout platform using Next.js App Router, TypeScript, and Supabase, covering auth, profile onboarding, follows, likes/comments, notifications, search, and feed experiences.
- Implemented Supabase SSR cookie-session auth with middleware-based route gating and API-level authorization checks, including profile-completion enforcement for write operations.
- Designed and shipped cursor-pagination for activity feed and notifications to keep server reads bounded and UX responsive as data grows.
- Added DB-backed notification eventing for follow/like/comment actions and enforced deduplication with a uniqueness index to prevent duplicate fan-out.
- Modeled relational entities (profiles, collections, products, comments, likes, follows, notifications) with RLS-aware API contracts and ownership validation patterns.
- Delivered profile social graph UX with public profile pages, follow/unfollow actions, and followers/following listing routes.

## 9) LLM prompts you can copy

### Prompt A: ATS resume bullets
"Using the project brief below, generate 6 ATS-friendly resume bullets for a [ROLE] position. Constraints: 20-30 words per bullet, action verb first, no fabricated scale metrics, include concrete technologies and architectural decisions."

### Prompt B: Portfolio case study
"Using the brief below, write a portfolio case study with sections: Problem, Constraints, Architecture, Key Decisions, Tradeoffs, Outcomes, and What I’d Improve Next. Keep it factual and technical."

### Prompt C: Cover letter paragraph
"Using the brief below and this job description [PASTE JD], write a targeted 150-200 word paragraph showing relevance to the role. Map project decisions to the JD requirements."

### Prompt D: Interview STAR stories
"Using the brief below, produce 4 STAR stories: auth migration, notification dedupe bug prevention, pagination design, and profile-onboarding gating. Keep each under 180 words and technically concrete."

### Prompt E: Recruiter summary
"Using the brief below, write a concise recruiter-facing summary in 5 lines for LinkedIn/About section. Avoid hype. Emphasize backend + product engineering execution."

## 10) Advanced prompt pack (high quality outputs)
Use this wrapper with any prompt above:

"You are writing career materials for a software engineer. Use only the facts in the provided brief. If a metric is missing, use [X] placeholder instead of inventing numbers. Output should be concise, technically specific, and readable by hiring managers and senior engineers."

## 11) Customization inputs before generation
Provide these values to the LLM before generation:
- Target role title: [e.g., Full-Stack Engineer]
- Seniority: [e.g., 1-3 years / Mid-level]
- Target company/domain: [e.g., SaaS creator tools]
- Preferred emphasis: [frontend/backend/product/security]
- Tone: [direct, technical, non-marketing]
- Word limit: [e.g., 120 words, 6 bullets, etc.]

## 12) Suggested supporting artifacts for applications
- Short architecture diagram (auth flow + API + DB tables).
- 60-90 second product walkthrough clip.
- Screenshots: feed, profile, loadout detail, notifications.
- A small "engineering notes" section linking to key files in this repo.

