# UI + MCP Integrations

This project is a **Next.js + React** application. The integrations in this document are split into:

- **runtime/UI tooling**: `shadcn/ui`, `Magic UI`
- **developer tooling / MCP**: `Context7`, `Supabase MCP`, `shadcn MCP`, `Svelte MCP`

`Svelte` is intentionally **not** added to the runtime app. This codebase should stay on the current Next.js/React architecture. Use Svelte only as an external MCP/tooling source when you need Svelte reference material.

## What Is Already Wired Into The Repo

The repo is now ready for `shadcn/ui` and `Magic UI` installs:

- `tsconfig.json` includes the `@/*` import alias
- `components.json` is present for `shadcn` CLI and MCP usage
- `lib/utils.ts` includes the standard `cn()` helper
- `clsx` and `tailwind-merge` are installed

## shadcn/ui

Official docs:
- https://ui.shadcn.com/docs/installation/next
- https://ui.shadcn.com/docs/mcp

Add components with:

```bash
npx shadcn@latest add button card dialog
```

Project diagnostics:

```bash
npx shadcn@latest info
```

Browse docs from the CLI:

```bash
npx shadcn@latest docs button
```

## Magic UI

Official docs:
- https://magicui.design/docs/installation
- https://magicui.design/docs/mcp

Magic UI uses the same project setup pattern as `shadcn/ui`.

Install open-source Magic UI components with:

```bash
npx shadcn@latest add @magicui/terminal
npx shadcn@latest add @magicui/shimmer-button
```

If you use Magic UI Pro, add this env var locally before installing Pro registry items:

```bash
MAGICUI_PRO_REGISTRY_TOKEN=your_token_here
```

The Pro registry is already declared in `components.json` as `@magicui-pro`.

## Project-Local MCP Examples

Example configs are in:

- `mcp/cursor.mcp.example.json`
- `mcp/vscode.mcp.example.json`
- `mcp/codex.example.toml`

These examples cover:

- `Context7`
- `Supabase MCP`
- `shadcn MCP`

`Magic UI MCP` is installed per IDE with the official CLI because it writes editor-specific MCP settings:

```bash
pnpm dlx @magicuidesign/cli@latest install cursor
```

Adjust the target editor name as needed.

## Context7

Official docs:
- https://context7.com/docs/installation
- https://github.com/upstash/context7#installation

Recommended usage:

- keep `Context7` as a general documentation MCP
- ask for a specific library when possible:
  - `/vercel/next.js`
  - `/supabase/supabase`
  - `/radix-ui/primitives`

Useful prompt pattern:

```text
Use Context7 for the latest Next.js App Router docs.
Use library /vercel/next.js.
```

Required env var for the example config:

```bash
CONTEXT7_API_KEY=your_api_key_here
```

## Supabase MCP

Official docs:
- https://supabase.com/docs/guides/getting-started/mcp

Required env vars for the example config:

```bash
SUPABASE_PROJECT_REF=your_project_ref
SUPABASE_ACCESS_TOKEN=your_supabase_pat
```

Important:

- Use Supabase MCP against a **development/test** project, not production.
- Review tool calls before execution.

## shadcn MCP

Official docs:
- https://ui.shadcn.com/docs/mcp

The repo is already configured for it via `components.json`.

Example server entry:

```json
{
  "shadcn": {
    "command": "npx",
    "args": ["shadcn@latest", "mcp"]
  }
}
```

## Svelte MCP

Official repo:
- https://github.com/sveltejs/ai-tools

Use this only if you want Svelte-specific reference material in your editor/agent workflow. Do **not** add Svelte runtime dependencies to this project unless the app architecture changes.

## Recommended Setup Order

1. Copy the MCP example file for your editor/client.
2. Set the required environment variables locally.
3. Restart the editor/client so MCP servers are reloaded.
4. Verify `shadcn` with:

```bash
npx shadcn@latest info
```

5. Start adding UI pieces only when you actually need them. Do not bulk-install component libraries into the codebase without a concrete use case.
