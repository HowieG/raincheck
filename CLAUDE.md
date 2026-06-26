@AGENTS.md

# raincheck v1 — project notes for Claude

Design doc (source of truth): `~/.gstack/projects/HowieG-raincheck/2026-06-26-main-design-raincheck-v1.md`. Read it before changing architecture.

Claude Design source: `~/Desktop/Projects/raincheck/designs/Raincheck.dc.html` (gitignored). 6 mobile screens in "Quiet Editorial" palette: teal `#C9E3E7`, wine `#4A1E33`, rose `#C2627E`, cream `#E8DBB9`, ochre `#B0863C`. Fonts: Instrument Serif (display), Instrument Sans (body), JetBrains Mono (labels). Don't deviate without a reason.

## Locked architecture

- **Stack:** Next.js 16 App Router on Vercel, Supabase Postgres, Drizzle ORM, Twilio Verify (login OTP) + Twilio SMS + Resend (dual notify), Google Places (deferred), Tailwind v4.
- **Auth:** signed cookie carrying `{ uid, sv, iat, exp }` HMAC-SHA256 with `SESSION_SECRET`. Revocation via `users.session_version` bump. No sessions table. No Auth.js.
- **Cancel mechanic:** unanimous-of-attendees vote (pair-only in v1). Vote state private until threshold trips.
- **SMS fan-out:** INLINE in the deciding server action — no outbox, no cron. Failures recorded in `failed_notifications`.
- **Hold-before-send:** 5s client-side undo window before the vote commits.
- **Test scope:** race-condition test + happy-path E2E (Playwright) + state-machine unit tests. Not full coverage; intentional.
- **Phone normalization:** `libphonenumber-js` (app) + Postgres CHECK constraint (DB). Both layers.

## Next.js 16 gotchas hit this session

- `cookies()` is **async** — `const jar = await cookies()`.
- Server-page `searchParams` is a **Promise** in Next 16: `({ searchParams }: { searchParams: Promise<{ ... }> })` then `await searchParams`.
- `useSearchParams()` in a client page breaks production builds unless wrapped in `<Suspense>` OR the page is marked `export const dynamic = "force-dynamic"`. Prefer: lift to a server component, read `searchParams` server-side, pass as prop to the client form. (See `src/app/login/verify/page.tsx`.)
- Server actions: pass values via `<input type="hidden">` for ID-bearing state; cookie/session is read server-side via `getCurrentUser()`.

## Drizzle quirks hit this session

- `drizzle-kit push` requires a real TTY — won't run in non-interactive shells. Use `db:generate` → `db:migrate` instead.
- `drizzle.config.ts` only auto-loads `.env`, not `.env.local`. All db scripts in `package.json` are wrapped with `dotenv -e .env.local --`.
- Connection: `postgres-js` driver. `db.transaction(async tx => { ... })` for the cancel race. `WHERE cancelled_at IS NULL` clause is the race winner check.

## Environment

- `.env.local` is gitignored. Required keys listed in `.env.example`.
- Vercel Marketplace Supabase integration: env vars are only scoped to Preview/Production, NOT Development. `vercel env pull --environment=production` returns the keys but the **values are empty** for Marketplace integrations. Copy from the Vercel Storage dashboard panel manually.
- `ADMIN_PHONE` + `ADMIN_NAME` bootstrap the first admin user on app boot (`ensureAdminBootstrapped()`).

## Conventions

- Server actions return `{ ok: true, ... } | { ok: false, error }`. Avoid throwing across the boundary.
- `requireUser()` / `requireAdmin()` **redirect** on failure; never throw. Use them in server components.
- `notify({ user, kind, ...message })` is the single send surface; routes via `NOTIFY_CHANNEL` env (`both` | `email` | `sms` | `sms-first`).
- All `Date` → string formatting uses `Intl.DateTimeFormat` on the client; storage is `TIMESTAMPTZ` (UTC).

## Routes

```
/login              GET   phone entry
/login/verify       GET   OTP entry (server reads ?phone= via searchParams Promise)
/logout             GET   destroy session
/                   GET   upcoming dinners
/dinners/new        GET   create form (manual entry)
/dinners/[id]       GET   detail — 3 states: active | pending | cancelled
/admin/users        GET   add user form + roster (admin only)
```

## Not yet built (in design-doc priority order)

- T7 URL scrape (OpenTable/Resy/Maps og:* + JSON-LD)
- T8 Google Places autocomplete + photos
- T14 Daily elapsed-marker cron
- T15 Race-condition Vitest test
