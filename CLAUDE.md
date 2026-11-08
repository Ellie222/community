# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> ⚠️ The import above is load-bearing: this repo runs **Next.js 16.2.10**, which has breaking
> changes from older Next.js (e.g. `middleware`→`proxy`, async `cookies()`/`params`). Read the
> relevant guide in `node_modules/next/dist/docs/` before writing Next.js code.

## Commands

```bash
npm run dev          # dev server (Turbopack) at http://localhost:3000
npm run build        # production build — also runs full TypeScript check
npm start            # serve production build
npm run lint         # eslint (flat config, eslint.config.mjs)
npx tsc --noEmit     # typecheck without building
```

No test framework is configured yet. Verify changes with `npx tsc --noEmit` and `npm run build`
(the build recognizes `proxy.ts` and prints `ƒ Proxy (Middleware)` when the proxy is active).

## Stack & conventions

- **Next.js 16 App Router** + React 19, **Tailwind CSS v4** (CSS-first: no `tailwind.config`; theme
  tokens live in `app/globals.css` via `@theme inline`), TypeScript `strict`.
- **Root `app/` layout — there is NO `src/` directory.** Import alias `@/*` maps to the repo root
  (e.g. `@/lib/supabase/server`). Note `docs/plan.md` sketches a `src/`-based tree; the actual repo
  intentionally does not use it.
- Korean is the primary UI language (`<html lang="ko">`, Korean copy throughout).

## Architecture

**Mobile-container shell.** `app/layout.tsx` centers a fixed-width white column
(`max-w-md`, ~448px) over a gray page backdrop (`body` bg set in `app/globals.css`). Every route
renders inside this column. `app/components/BottomTab.tsx` is a `"use client"` component pinned with
`sticky bottom-0` inside that column — it reads `usePathname()` for active-tab highlighting across
the 3 tabs: 홈 `/`, 내정보 `/my`, 설정 `/settings`. The gray backdrop is only visible on viewports
wider than the container.

**Supabase (three-client split — do not mix them).** Setup and rationale are documented in
`docs/supabase-connection.md`.
- `lib/supabase/client.ts` — `createBrowserClient`, for client components / optimistic UI.
- `lib/supabase/server.ts` — `createServerClient` for RSC / Server Actions / Route Handlers.
  `cookies()` is **async** (must `await`); the `setAll` is wrapped in try/catch because writing
  cookies during RSC render is disallowed — session writes are the proxy's job.
- `lib/supabase/proxy.ts` (`updateSession`) + root `proxy.ts` — refreshes the session cookie on
  every request. **This is `proxy.ts`, not `middleware.ts`** (Next.js 16 rename). Its `config.matcher`
  excludes static assets. Auth guards (redirect unauthenticated users to `/login`) are not wired yet;
  add them here once auth screens exist.

Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (gitignored;
template in `.env.example`).

## Project state & intended design

This repo is **early scaffolding**: the tab-bar shell and the Supabase connection exist, but feature
routes (auth, feed, posts, comments, profile) and DB tables/RLS are **not built yet**. Before adding
features, read `docs/`:
- `docs/requirements.md` — feature list, screens, data model (profiles/posts/comments/likes).
- `docs/plan.md` — the agreed build order and the target architecture: **Server Components for reads,
  Server Actions for mutations**, `@supabase/ssr` cookie sessions, RLS on every table, `(auth)`/`(main)`
  route groups. Follow its DB→Action/Query→UI vertical-slice order.
- `docs/design.md` — Figma analysis: mobile 390px frame, orange (coral) primary accent, gray neutrals.
