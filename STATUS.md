# bujo — STATUS

Update this when you STOP working, not when you start.

- **Last touched:** 2026-08-02

## Where I stopped

Six stacked branches, all pushed, all with PRs open. Each is based on the one
below it, so **merge bottom-up** — `#88 → #89 → #90 → #91 → #92 → #94` — or every
diff will show its neighbour's commits.

| PR | Branch | What |
|---|---|---|
| #88 | `fix/a11y-gaps` (off `main`) | `useFocusTrap` + all eight hand-rolled overlays, Reading headings, Monthly cell labels, save toasts |
| #89 | `refactor/pill-badge` | One `Pill` (tone × size), 18 sites in 12 files |
| #90 | `refactor/button-adoption` | 7 genuine buttons into the button system; a fourth private `CollapsibleSection` deleted |
| #91 | `feat/ux-small` | `useStickyState` (F6), `?view=&day=` deep links (F7), long-entry clamp (F8) |
| #92 | `docs/icon-button-system` | The Stage 0 audit — spec, findings, decisions |
| #94 | `feat/icon-button-stage1` | The whole icon & button pass, stages 1–6 |

Everything verifies green: `npx tsc -b` 0, `npx eslint .` 0 errors / 2
pre-existing warnings, **689 tests**, `npm run build` clean, plus the two new
gates below.

Three other PRs (#87, #93, #95) are open from other sessions and I have not
touched them.

## The icon & button system (§J) — done

`docs/ICON-BUTTON-SYSTEM.md` is the full log; the short version:

- **One icon library.** lucide is gone. Phosphor sits behind one `Icon` wrapper
  and one generated registry — 85 files, 397 conversions, three rem sizes, and
  **weight, not colour, as the active signal** (duotone when current).
- **No solid accent button.** Four variants; the loud one is tonal (accent wash,
  accent-as-text label). 31 solid fills removed. Heights 28/36/44 in rem.
- **Ten radii became three**, and emoji-as-chrome is retired — time-of-day,
  splits, avoid markers, streak flames, weather codes are all glyphs now.
- **§I1 got solved on the way.** A tonal primary renders the accent *as text* on
  the accent *as a wash*, which failed AA in latte (4.39:1) and dawn (4.07:1).
  Fixed at the token: `--color-brand-text` and `--color-danger-text` are
  per-theme, so no call site has to remember.
- **The bundle came back down.** Phosphor ships six weights per glyph and this
  app renders two, so `npm run icons` rebuilds the set locally: icons chunk
  413 kB → **134 kB** (93 → **25.8 kB** gzip), total assets 1611 → **1339 kB**.

## Two new gates — this is the important part

Everything above was originally verified *by hand*, and one regression reached a
shipped view before it was caught in review. Both gates run in CI and were run
locally before being committed:

- **`npm run design`** — fails on a lucide import, a direct Phosphor import, a
  glyph name rendering as a label, a px icon size, a retired button variant, an
  off-token radius, emoji in the fixed vocabularies, a hardcoded colour. Writing
  it found six radius stragglers a codemod had skipped.
- **`npm run a11y`** — axe-core over eight views against a production preview.
  0 serious, 0 moderate. It refuses to trust a view that did not render.

## Next

1. **Merge the stack bottom-up.** Six deep is the biggest risk on the board.
2. **Per-view container tiers** — the one Stage 5 item left.
3. **B4** — the app chunk is still 658 kB (193 gzip). recharts at 429 kB is the
   next lever.
4. **§H redesign decisions** — H5, H6, H7, H9, H11, H13 are still open.
5. **B1/G1/G2** — the Supabase project returns NXDOMAIN, so every account and
   cloud-sync feature is dead until it is repointed or the env vars are unset.

## Traps this session hit, so you don't

- **Flipping `data-theme` on a live document does not invalidate inherited
  custom properties** on already-rendered nodes. A contrast sweep that did so
  reported 1.33:1 for a label that measures 7.00:1 on a real page load. Measure
  after a reload, or through the app's own theme setter.
- **A regex rename rewrites prose too.** `Search`, `Activity`, `Repeat` and
  `Scale` are ordinary words; three shipped strings read "MagnifyingGlass your
  Drive…" before anyone noticed.
- **`.claude/worktrees/` contains other sessions' checkouts.** Each carries its
  own tsconfig, which made typescript-eslint emit 518 parse errors until it was
  ignored. Also: something switched this checkout's HEAD mid-session, so check
  `git branch --show-current` before committing.
- **UI changes are verified in all five themes** — mocha, latte, neon, vscode,
  dawn. Three redefine the accent (dawn's is an amber), two invert surface
  polarity, and dawn renders two text tiers where the rest render three.

**Read next:** `TASKS.md` (the board) · `docs/ICON-BUTTON-SYSTEM.md` (the pass,
stage by stage) · `docs/LAYOUT-WEIGHT-ALIGNMENT.md` (what sits where, and how
loud) · `docs/ACCESSIBILITY.md` (open vs closed gaps).
