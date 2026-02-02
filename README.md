# Loadouts

Placeholder Next.js App Router project for the Loadouts concept. This repo scaffolds the pages, API routes, and component structure described in the development plan so you can wire in real data later.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- NextAuth.js (GitHub + Google providers)
- Prisma (PostgreSQL placeholder)

## Structure
- `app/` App Router pages and layouts
- `app/api/` REST-style route handlers
- `components/` shared UI components
- `prisma/` database schema placeholder
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
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Notes
- All UI content is placeholder data.
- API route handlers return stub JSON with TODOs.
- Update `prisma/schema.prisma` once the data model is finalized.
