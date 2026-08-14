# STATUS

**Stopped:** 2026-08-14, after opening PR #108 from `fix/nav-audit-ui-pass`.

## Where things are

PR #108 is open against `main`: a nav audit across both rails plus a defect pass
over Today, Plan, Fitness, Nutrition, Insights and Settings. Six fix commits and a
session archive. All gates green — `tsc -b`, 755 tests, eslint, build, a11y,
design, clipped.

Nothing is half-migrated. The one removal (`MASONRY` class-string export) has no
remaining call sites and TypeScript enforces it.

## Next action

Review and squash-merge #108, then pick from
`docs/sessions/2026-08-14-nav-and-page-pass/BACKLOG.md`. The two highest-value
items there:

- **B3 · five stat treatments on one page.** One `Stat` primitive with two or three
  variants. Touches every page, so it needs the before/after render snapshot the
  repo already mandates for shared markup.
- **B1 · Fitness and Nutrition are one zone doing one job.** ~530px of dead width at
  1440 while History and Analytics sit below the fold. A two-column act/review
  split; `page-contract` is the right tool.

## Traps found this session, worth carrying forward

- **A screenshot cannot tell "flat by design" from "broken".** Six bar charts had
  rendered every bar at 0px for who knows how long and looked like a minimal style.
  Query `getBoundingClientRect()` on the marks, not just your eyes.
- **Viewport breakpoints lie inside a column.** `md:columns-2` on a masonry sitting
  in a 446px section column still split it in two, because `md` asks about the
  window. Use `@container` for anything that is not full-bleed — and read
  `columnCount` back, because Tailwind v4 exits 0 on a utility it does not know.
- **`offsetLeft` is relative to the nearest *positioned* ancestor.** A scroller with
  no `position` measures against `<body>`.
- **Layout measured before `document.fonts.ready` is wrong.** A tab row measured
  80px narrower than its settled width and the scroll clamped to that stale max.
- **Chrome will not go below ~501px window width on this machine**, so "390px"
  verification here is really 501px. See backlog B8.

## Environment

- Dev server: `npm run dev` on :5173. a11y gate needs `npm run preview` on :4173
  first, or it fails `ERR_CONNECTION_REFUSED` — which is a missing server, not a
  passing gate.
- Browser driving: `chrome-devtools` MCP against Chrome launched with
  `--remote-debugging-port=9333` and a scratch `--user-data-dir`. The
  `claude-in-chrome` extension was not connected this session.
- The app auto-entered `settings.explore` sample data on a fresh profile, so demo
  content was available without the Settings → Data → Load demo data path.
