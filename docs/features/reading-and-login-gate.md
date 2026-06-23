# Reading log + real login page & auth gate

Session 2026-06-18. Adds a Reading tracker, a dedicated full-screen Account /
login page (replacing the buried Settings form), an auth gate, and email
validation. All local-first behaviour is preserved.

## Reading log (`src/views/Reading.tsx`, `src/lib/reading.ts`)

A classic bullet-journal reading list, made trackable. Three shelves:

| Shelf | What it holds |
|---|---|
| Want to read | Books queued, no progress yet |
| Reading now | In-progress, with a page-progress bar (`currentPage / totalPages`) |
| Finished | Done, with a 1–5 star rating |

- **Data:** `Book` in `types.ts`; persisted under `JournalData.books` (optional —
  migrate is forward-compatible, so old journals just gain an empty shelf).
- **Stats strip:** reading now, books finished this year, total pages read,
  average rating — all pure functions in `src/lib/reading.ts` (`reading.test.ts`).
- **Yearly goal:** `settings.readingGoalBooks`; progress bar on the view and a
  "Books read this year" row in **Goals**.
- **Store actions:** `addBook` / `updateBook` / `removeBook`.
- **Nav:** sidebar item under *Insights & Stats*; demo data seeds one book per shelf.

## Dedicated Account / login page (`src/views/Account.tsx`)

Previously the top-bar **Sign in / Sign up** menu item dropped users into the
full **Settings** page. It now routes to a focused `account` view — a real,
branded login screen (segmented Sign in / Sign up, Google button, email+password
with show/hide, forgot-password, guest + "continue on this device" escapes).

When signed in (or a guest), the same view shows an account status card with
**Save now** (manual `pushJournal` — an immediate cloud push instead of waiting
for the ~4 s debounced auto-sync) and **Sign out**.

## Auth gate (`src/App.tsx`, `onAuthChange` in `src/lib/supabase.ts`)

While **signed out** and viewing the `account` page (and a Supabase backend is
configured), the app renders the login screen **full-screen — no sidebar, no top
bar** — so the sign-in/sign-up page cannot navigate into the rest of the app.

- The gate lifts for **any session**, real *or* guest — guests chose to explore,
  so they get full app access. Only the truly signed-out state is gated.
- Local-first users are never trapped: the login page has explicit
  "Continue on this device without an account →" and guest escapes, and a
  successful sign-in / guest start auto-navigates to **Today**.
- Local-only builds (no Supabase env) are unaffected — `account` shows an
  "accounts aren't configured" note pointing at Settings → Data & Cloud.

## Email validation (`src/lib/validate.ts`)

Client-side, dependency-free (`validate.test.ts`). Real deliverability is still
confirmed by Supabase's email-confirmation link; this just catches typos early:

- `isValidEmail` — format check (`a@b.tld`), used before every auth submit.
- `suggestEmailFix` — "Did you mean me@gmail.com?" for common typos (gmial, gamil…).
- `authFormError` — one-shot check (email present → valid → password ≥ 6).

Used by both `Account.tsx` and the first-run `Welcome.tsx`.

## Auth state today (Supabase project `ueahhgqxshfvkjgcwtnh`)

| Method | Status |
|---|---|
| Email sign-up / sign-in | ✅ enabled |
| Guest (anonymous) | ✅ enabled |
| Google OAuth | ⏳ provider disabled — code ready; enable per `docs/auth/google-oauth-setup.md` |

`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` live in Vercel (the anon key is
public by design — it ships in the browser bundle). Pull them locally with
`vercel env pull` or copy from the prod bundle to enable login in dev.
