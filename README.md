# Loadouts

Placeholder Next.js App Router project for the Loadouts concept. This repo scaffolds the pages, API routes, and component structure described in the development plan so you can wire in real data later.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase Auth (Email/Password + GitHub + Google OAuth)
- Supabase SSR session middleware (`@supabase/ssr`)

## Structure
- `app/` App Router pages and layouts
- `app/api/` REST-style route handlers
- `components/` shared UI components
- `styles/` global styles
- `public/` static assets

## Getting started
1. Install dependencies
   ```bash
   npm install
   ```
2. Run the dev server
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`

## Environment variables (placeholders)
Create a `.env` file with the following:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Notes
- All UI content is placeholder data.
- API route handlers return stub JSON with TODOs.
- Configure Supabase Auth providers and redirect URLs in the Supabase dashboard.
