# bujo — STATUS

Update this when you STOP working, not when you start.

- **Last touched:** 2026-08-02
- **Where I stopped:** Design-system migration on `feat/design-system` (branched
  off `feat/ui-polish`). Steps 1–4 of the redesign brief are done and committed:
  purpose-token layer, self-hosted fonts, seven-step rem type scale, two
  container tiers, primitives reconciled, `/kitchen-sink` review route, and a
  2,443-replacement sweep so all 24 views render what the kitchen sink
  documents. eslint is at 0 errors (was 17). Everything verified — tsc, 678
  tests, build, and 24 views × 5 themes in a real browser.
- **Next action:** Open `?view=kitchen-sink`, then walk the accent-inflation
  pass — 25 views, mocha only, one question each: *which single element here is
  the primary action?* Everything else drops to secondary or ghost. It is the
  brief's sharpest observation and the only item no tool can measure.
- **Blocked on:** Nothing in the redesign. Separately, `B1` in `TASKS.md`: the
  Supabase project at `ueahhgqxshfvkjgcwtnh.supabase.co` returns NXDOMAIN, so
  every account/cloud-sync feature is dead until it is repointed or the env vars
  are unset.

**Read next:** `TASKS.md` (the working board) · `docs/redesign/09-redesign-audit.md`
(what the codebase actually is) · `docs/redesign/10-redesign-build.md` (what
shipped, and the four bugs found on the way).
