# bujo — STATUS

Update this when you STOP working, not when you start.

- **Last touched:** 2026-08-02
- **Where I stopped:** Redesign steps 1–9 done across two stacked branches.
  `feat/design-system` (PR #80) has the token layer, self-hosted fonts, the
  seven-step rem type scale, two container tiers, reconciled primitives, the
  `/kitchen-sink` route and a 2,443-replacement adoption sweep.
  `feat/accent-and-motion` (PR #81, current) has the accent-inflation pass
  (accent fills in view bodies: 19 → 0), the motion-token pass, and the bullet
  glyph column raised to a real signature. eslint 0 errors, 678 tests, build
  green, 18 views × 5 themes clean.
- **Next action:** Reconcile the day/week strip — `Heatmap`, `ActivityLayout`
  and `TodayHabits` are three implementations of one visual idea. **Propose the
  API before building it**; three implementations means three sets of
  assumptions, and merging them by guess will lose one.
- **Blocked on:** Nothing in the redesign. Separately, `B1` in `TASKS.md`: the
  Supabase project at `ueahhgqxshfvkjgcwtnh.supabase.co` returns NXDOMAIN, so
  every account/cloud-sync feature is dead until it is repointed or the env vars
  are unset.

**Read next:** `TASKS.md` (the working board) · `docs/redesign/09-redesign-audit.md`
(what the codebase actually is) · `docs/redesign/10-redesign-build.md` (what
shipped, and the four bugs found on the way).
