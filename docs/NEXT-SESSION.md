# Next session

Written 2026-10-29 at the end of the phone-pages session
(`docs/sessions/2026-10-29-phone-pages.md`). Rewrite this file once picked up.

## 0 · Before any code: merge the phone stack

#438 → #447, #449 → #457, then `docs/phone-handoff`, in order — retarget each
child to `main` before squash-merging its parent (auto-close trap,
`CLAUDE.md`). Close #448. Then one full `npm run a11y` on the merged result.

## 1 · COD-479 — "watch how" on YouTube, everywhere, phone AND desktop

Owner, 2026-10-29: *"if I have something like a workout I want to see …
YouTube videos … search in YouTube as well? For both mobile as well as the
desktop versions, not only workouts, like other features as well."*

What already exists: `src/lib/video.ts` — `videoUrl(name, yt?)` and
`videoSearchUrl(name)` build a YouTube search from a NAME (pinned ids rot; the
reasoning is in that file and `REUSABLE-PATTERNS.md` §5). Only two call sites
use it: `components/ExerciseDB.tsx`, `components/gym/Tools.tsx`.

The work:

1. One control, `components/ui/VideoLink.tsx`: a 44px icon button (phone) /
   small icon link (desktop) that opens `youtube.com/results?search_query=…`
   in a new tab, `rel="noopener noreferrer"`. Its accessible name CONTAINS
   the visible text ("Watch how: Bench press"), never replaces it.
2. Adopt it wherever a thing has a name you could learn from:

   | page | where |
   |---|---|
   | Program | each lift row, and the opened set panel |
   | Strength | each set card header |
   | Fitness | each activity |
   | Pickleball / Coaching | drills, skills, shots |
   | Home Workout / Pull-ups | movements (Home Workout already builds links — reuse, do not fork) |
   | Mindset | each principle ("<title> explained") |
   | Nutrition | foods and recipes ("how to cook …") |
   | Focus | typing practice |

3. A query builder per domain in `lib/video.ts` (`exerciseQuery`,
   `drillQuery`, `recipeQuery`, …) so each page asks the right question —
   "proper form" for a lift is the wrong search for a recipe.
4. Tests: one call-site test per page that the link renders with the item
   name in the query (the `InfoTip onMore` trap in `CLAUDE.md`: a helper
   with no caller is a feature nobody can reach).

**Privacy — links only, no embedded player.** An iframe sends every view to
Google and needs `frame-src` in the CSP; that contradicts the "no data from
users is collected" goal (COD-436). A link leaves only when the user taps it,
and `csp.contract.test.ts` does not treat an `<a href>` as egress.

## 2 · Owner actions still blocking production

- **COD-434** — the Supabase project does not resolve (NXDOMAIN). Restore it
  or create a new one and update the Vercel env vars. Google sign-in is dead
  until then. (The 2026-10-14 migration note that used to head this file
  applies to whichever project is live.)
- **COD-436** — journal sync is plaintext. Decide: encrypt before upload, or
  drop cloud sync.

## 3 · Audit tickets, code

COD-435 (feedback form publishes the email publicly), COD-437 (`/api/sync`
auth + rate limit), COD-438 (hardening), COD-455 (desktop axe blind under the
book cover), COD-463 (dead TopBar rows).
