## Branch workflow

Default to a branch per unit of work — do not commit onto whatever branch
happens to be checked out.

1. **Branch first.** `git checkout -b <type>/<short-slug>` off the branch the
   work builds on (not always `main` — if it extends an open PR, branch off
   that PR's branch so the stack stays in order). Types match the commit
   prefixes: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`.
2. **Commit in logical chunks**, not one blob. One concern per commit, with a
   body explaining *why*, including anything surprising found on the way.
3. **Verify before pushing:** `npx tsc -b` (NOT `--noEmit`, see below), then
   `npx vitest run`, `npx eslint .`, `npm run build`. For UI work, also open the
   app and check the affected views.
4. **Push and open a PR** with `gh pr create --base <parent-branch>`. State what
   is *not* in the PR as well as what is.
5. **Write `STATUS.md` when you stop**, not when you start.

Trap: **`npx tsc --noEmit` typechecks nothing here** — the root `tsconfig.json`
is solution-style (`"files": []` + project references), so it has no root files
and always exits 0. Always use `npx tsc -b`.

Trap: **Tailwind v4 does not fail the build on a stale utility class.** It exits
0 and emits no CSS, so the element silently inherits. When retiring a class,
migrate every call site first and only then remove it from the theme, with a
grep as the gate.

Trap (fixed, COD-93): **`npm run a11y` could not scan inside a collapsed
fold.** axe walks the rendered page, so anything behind a closed section was
simply not checked — folding a section was a way to make a violation vanish
from the gate, and the Gym contract pass did exactly that to a **1.41:1**
contrast bug in the same commit. `openFolds()` now clicks every
`[aria-expanded="false"]` inside `#main`, up to four passes because folds nest,
before every scan. Arming it turned a green run red on a **critical**
`select-name` — Trackers' new-habit category select, unnamed and behind a
`DisclosureRow`, exactly the violation the old wording said "shipped for months
this way". Its ceiling: a **single-open accordion** (Coaching's weeks) shows one
panel at a time, so those groups get one representative panel, not all of them;
the fold count in the summary column oscillates there rather than settling.
Scoped to `#main` on purpose — the shell header's four `aria-expanded` menu
buttons are not page content.

Trap: **`vite preview` serves a stale bundle through its service worker.** A
screenshot can show pre-change markup against a freshly built `dist/`. Before
believing what you see:
`navigator.serviceWorker.getRegistrations().then(r => r.forEach(x => x.unregister()))`
then clear `caches` and reload.

Trap: **a dev server is pinned to the worktree it was started in.** This repo
has several under `.claude/worktrees/`, each on its own branch, and a tab
pointed at one of their ports will never show changes made here no matter how
hard you reload. Check the port's `Get-CimInstance Win32_Process` command line
before concluding a change did not land.

Trap: **git worktrees inside the repo inflate `vitest`.** Each holds a full
second copy of the app, so vitest discovered both suites and reported their sum
— 743 tests read as 1474 while `.claude/worktrees/today-ux` existed, and the
number moved whenever an unrelated session added or removed a worktree. Fixed by
excluding the path in `vite.config.ts`; eslint already ignored it. A count that
changes with what else is checked out is worse than no count, and this one was
quoted in commit messages before anyone noticed.

Trap: **an audit keyed on a prop misses the feature it feeds.** `Card` renders
its ⓘ from `help ?? subtitle`, so a sweep grepping `help=` reported the Body
cluster clean while every titled card with a subtitle still drew one. Same shape
as the six typographic folds that matched neither the caret-icon nor the
`aria-expanded` grep. Grep the *output*, and confirm on the rendered page.

Trap: **"environmental, not a regression" in a handover note means a gate has
been switched off.** `npm run smoke` carried that sentence across two sessions:
its default browser path was `/usr/bin/google-chrome-stable`, so it could not
launch here at all, and even with the documented `CHROME_PATH` workaround it
went red on `account` because there is no route to Supabase. A gate that is
known to fail has a red that carries no information, and a gate with a manual
incantation is one nobody types — so it silently stopped covering anything, and
two Body tabs (`program`, `nutrition`) fell off its id list unnoticed. Fixed:
falls back to Playwright's own Chromium, and judges a failed resource load by
its **origin** rather than its message. When a gate needs a workaround, fix the
gate; a workaround written in STATUS.md is a gate that is off.

Trap (fixed): **`npm run smoke` was testing a different application.** Its
default was `http://localhost:5173` — Vite's *dev* default, so it belongs to
whichever project on the machine started a dev server first, while every other
script here defaults to 4173 (`vite preview`, what CI starts). With
`interview_prep/frontend` holding 5173, smoke drove **PrepForge — AI/ML
Interview Prep**, found nothing it recognised as an error, and printed
`Smoke: 25/25 views OK · All views rendered clean`. Three PRs quoted that line
as evidence. The port was only half of it: the pass condition was "`main` or
`#root` has more than five characters of text", which any web page satisfies,
so the gate could not tell bujo from a stranger. It now **asserts its own
identity** (`document.title` starts with `bujo` **and** `#main` exists) before
scoring a single view, and it runs in CI beside `a11y` instead of local-only —
a gate nothing runs is a gate that rots. Sibling of the empty-journal and
closed-fold traps, one level up: not "a page that is never visited cannot
fail", but **an app that is never checked cannot fail**. When a browser gate
passes, confirm what it was pointed at.

Trap: **a control can be hidden without being clipped, and neither rendering
gate sees it.** `scripts/clipped-text.mjs` asks whether an element shows less
than it holds (`scrollWidth > clientWidth`); `npm run a11y` asks whether the
accessibility tree is sound. A button at **x=453 in a 390px viewport** passes
both — it shows everything it holds, its own box is fine, and it is focusable
and named. The clip happens at an *ancestor*, and `document.body.scrollWidth`
still reads 390 because it happens above the body. Trackers shipped a
seven-control toolbar of which Month, three layouts, the wheel and the settings
button were **unreachable on a phone**. `clipped-text.mjs` now also fails on "a
control outside the viewport with no ancestor able to scroll it into view" —
**controls only**, because the first draft ran over every leaf with text and
reported 52 cosmetic hits across 23 views, and a gate whose red is mostly noise
is a gate nobody reads. Two corollaries: a wide box inside `overflow-x-auto` is
a *design* (every day cell in the month grid is a button), so the reachability
walk is load-bearing; and `Card` can cap its `right` slot at `max-w-full` but
**cannot wrap a cluster whose markup it does not own** — an over-wide child just
changes which edge it leaves by, so the call site needs `flex-wrap` itself.

Trap: **`grid-cols-N` is safe and the *implicit* track is not.** Tailwind's
`grid-cols-2/3` expand to `repeat(n, minmax(0, 1fr))`. A grid with no
`grid-template-columns` at all — which `CardGrid` had below 768px — gets one
implicit `auto` track that sizes to the **widest item's min-content** and may
exceed its own container. A grid track is *shared*, so one wide item drags every
sibling with it: Stats' Activity heatmap (a 53-column `table-fixed`, min-content
398px) stretched all six neighbouring cards to 398px inside a 324px box and put
sixteen controls off the right edge. **A card's own `min-w-0` cannot fix this** —
it is the track that overflows, not the item. Spell the phone column out.

Trap: **`count ? sum / count : 0` makes "no data" indistinguishable from "you
scored zero".** `monthlyCompletion` and `weekdayConsistency` both ended that
way, so *Monthly trend* opened with `0% · 0%` for the two months preceding the
first habit's `startedOn` — a total failure that never happened, in the leftmost
position where a trend is read from. Return `null` and let the caller decide;
`moodByWeekday`, immediately below them in the same file, always did. Watch for
the test that hides it: **`expect(null).toBeGreaterThanOrEqual(0)` coerces and
passes**, so `weekdayConsistency returns 7 values in 0..1` would have gone on
passing whatever that function returned. Assert `not.toBeNull()` first.

Trap: **a chart is not empty because a full-page screenshot says so.** The
screenshot tool downscales, and 2px strokes at `opacity 0.35` vanish — Trackers'
Mood/Stress/Sleep line chart and its category radar both read as bare grids at
1440 and are in fact dense and legible. Count the `recharts-curve` paths in the
DOM, or take an **element** screenshot at native size, before calling one
broken. A downscaled page shot cannot support that claim in either direction.

Trap: **there are two disclosure implementations and only one puts text in its
toggle.** `CollapsibleSection` renders its title inside the button;
`Card collapsible` renders a caret glyph and nothing else, so its name lives
entirely in `aria-label`. A sweep that reads `textContent` therefore sees every
`CollapsibleSection` and **no card fold at all** — `scripts/page-census.mjs`
shipped that way and reported Coaching as 14 folds when it has 32, and
Pickleball as 4 when it has 18. Read the accessible name
(`aria-label ?? textContent`), and scope the query to `#main`: the shell header
carries four `aria-expanded` menu buttons on every view, so a document-wide
count adds a flat 4 to every page. Same family as the `help ?? subtitle` trap
below — and note it was the script written to stop people quoting unmeasured
numbers that got it wrong.

Trap: **squash-merging the bottom of a PR stack permanently closes its child
PR.** Deleting the base branch on merge auto-closes any PR pointing at it, and
GitHub will not reopen or retarget a closed PR whose base branch is gone
(`Cannot change the base branch of a closed pull request`) — #145 and #147 had
to be re-created as #148 and #149 with their bodies copied across. Rebase each
child onto `main` with `git rebase --onto main <old-base-sha> <branch>` and
retarget it **before** merging its parent.

Trap (fixed, COD-28): **`npm run a11y` used to run against an empty journal**,
so every `{peakHour && <Card/>}` / `{rows.length > 0 && …}` was absent from the
DOM and could not fail. It now loads `?demo=1` and **asserts the seed landed**
before scanning — arming it turned one green run into **16 serious violations**
that had been invisible for the gate's whole existence. Keep the assertion: a
gate that silently reverts to an empty journal prints the same reassuring zero.
Sibling of the `VIEWS`-list trap below: "a page that is never visited cannot
fail" became "a card that never renders cannot fail".

Trap: **`cat('crust')` is not a foreground.** It is the light-on-*saturated*
half of a pair, and it is near-white in the light themes — so `crust` on any
fill is correct in Mocha and wrong in Latte and Dawn. **Use `onAccent(fill)`**,
which picks the better neutral per theme and pushes it to 4.6. That helper
existed and had two adopters against 21 hand-written `cat('crust')` call sites;
finishing the migration fixed 7 of the 16 violations above. Its partner mistake
is `cat('overlay0')` as text on the *neutral* branch of the same ternary —
**2.57:1** at 10px, four instances. Use `subtext0` there. When you write a
ternary that picks a foreground per state, both branches are a decision.

Trap: **the accent-on-wash idiom is calibrated at `'22'`, and `'33'` breaks
it.** The accents clear 4.5 as text on a **13%** wash of themselves. A 20% wash
lifts the background further toward the text and puts it back under — Plan's
migration pill measured 4.25 on latte red. One hex digit, and nothing fails
loudly.

Trap (fixed, COD-32): **the palette was written down twice and the copies had
diverged.** Every theme lives in `src/index.css` as `--color-*` *and* in
`src/lib/colors.ts` as a literal map, because Tailwind utilities resolve the
first and `cat()` (inline styles, charts) resolves the second. Nothing kept
them in step: vscode's `red` was solved by hand in #157 and applied to
`colors.ts` only, so `text-red` painted `#f14c4c` and `cat('red')` painted
`#f57979` **on the same screen**. Mocha's three surfaces had drifted the same
way. `npm run contrast` now fails on any divergence and on any accent under
4.5:1 as text — **run it, and edit both files.**

Trap: **a static gate catches what a rendering gate structurally cannot.** The
armed a11y gate was green while latte's `yellow` sat at **2.02:1** — below even
the 3.0 floor for a graphic — because the only place it renders is one branch
of Plan's `count >= 4 ? red : count >= 2 ? peach : yellow`, and the demo seed
produces counts of 2, 3 and 4 only. **A branch the seed never takes cannot
fail.** Same family as the empty-journal and closed-fold traps: prefer a check
on the *source* when one is possible.

Trap: **in a light theme there is no legible light yellow.** Any yellow that
clears 4.5:1 on white is dark, and darkening `#f29900` straight down lands on
`#8a5700` — dE 14 from latte's `peach`, i.e. the same brown, which collapses
the red/peach/yellow three-step scale Plan and Trackers both use. Re-pick by
**hue** instead (the olive-gold side, h≈50): `#816c03` is dE 31 from peach.
When an accent cannot be darkened into legibility without colliding, move it
sideways in hue, not down in lightness.

Trap: **`scripts/a11y-axe.mjs` visits a fixed `VIEWS` list.** A page not on it is
not checked, and "0 serious" means only "for the pages that were opened". Add new
surfaces. Do not argue a page is unreachable from the code's shape — Recovery was
excluded on the belief it was behind an opt-in, but `nofapEnabled` defaults to
true, and adding it immediately failed on a contrast bug.

Trap (retired): `BottomNav`'s `PRIMARY` list used to be silently filtered
against the sidebar items, so retiring a nav id dropped its phone tab with no
error — collapsing the Body cluster left the bar at three. There is no list any
more: both nav bars read `SECTIONS` directly. Kept as a warning against
re-introducing a hand-written id list that resolves against another source.

Trap: **a data module can go dead without anything failing.** A pass adding
"cards from the training guide" to `views/Pullups.tsx` rewrote the lists
*inline* instead of reading `lib/pullups.ts`: `PULLUP_WORKOUTS` went from
fourteen formats to three, `PULLUP_PROGRESSIONS` from nine to seven rewritten
ones, and the ability table was dropped. `tsc -b`, eslint, vitest and the build
were all clean — an export nobody imports is not an error — and the page still
rendered a plausible-looking list, so the loss was invisible on screen too. Same
family as the emergency-banner extraction in the global rules, running the other
way: the copy was retyped rather than reused. **When a view stops importing a
data module, that is the finding.** Assert the counts in a test
(`lib/pullups.test.ts`), because nothing else will.

Trap: **demo data is persisted, not regenerated.** Editing `src/lib/demo.ts`
changes nothing for an existing journal — re-seed via Settings → Data → Load
demo data.

## graphify

This project has a graphify knowledge graph at .graphify/.

Rules:
- For codebase or architecture questions, when `.graphify/graph.json` exists, first run `graphify query "<question>"` (or `graphify path "<A>" "<B>"` / `graphify explain "<concept>"`); these return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output
- If .graphify/wiki/index.md exists, navigate it instead of reading raw files
- If .graphify/graph.json is missing but graphify-out/graph.json exists, run `graphify migrate-state --dry-run` first; if tracked legacy artifacts are reported, ask before using the recommended `git mv -f graphify-out .graphify` and commit message
- If .graphify/needs_update exists or .graphify/branch.json has stale=true, warn before relying on semantic results and run /graphify . --update when appropriate
- Before proposing or committing .graphify artifacts, run `graphify portable-check .graphify`; commit-safe graph artifacts must use repo-relative paths, and never commit .graphify/branch.json, .graphify/worktree.json, .graphify/needs_update, or .graphify/cache/. If a repo already tracks any of them, first add them to .gitignore, then propose `git rm --cached .graphify/branch.json .graphify/worktree.json .graphify/needs_update` and `git rm -r --cached .graphify/cache`; never mutate git state without asking
- Before deep graph traversal, prefer `graphify summary --graph .graphify/graph.json` for compact first-hop orientation
- For review impact on changed files, use `graphify review-delta --graph .graphify/graph.json` instead of generic traversal
- Read `.graphify/GRAPH_REPORT.md` only for broad architecture review or when `query` / `path` / `explain` do not surface enough context
- After modifying code files in this session, run `npx graphify hook-rebuild` to keep the graph current

<!-- plane-agent-rules:v2 -->
## Issue tracking (Plane, local)

All work across `~/Documents/coding` is tracked in one Plane board.
The `plane` MCP server is registered at user scope, so its tools are available
in every session — no setup needed per repo.

- Workspace `coding`, project `Coding` (identifier `COD`), at <http://localhost:8080/coding/>
- **This repo is the label `repo:bujo`.** Every work item you create must carry it.
- Also add one `type:` label matching the conventional-commit type you intend to
  use: `type:feat` `type:fix` `type:refactor` `type:perf` `type:docs` `type:test`
  `type:build` `type:chore`.

States, and what each one means here:

| State | Means |
|---|---|
| `Backlog` | Captured, not committed to. Default for anything you file mid-task. |
| `Todo` | Pulled into the current cycle. This week's list. |
| `In Progress` | A branch exists. |
| `In Review` | A PR is open, waiting on CI or a read. |
| `Done` | Squash-merged, branch deleted. |
| `Cancelled` | Decided against. Say why in a comment — that reasoning is the value. |

Rules:

1. **Before starting work, check for an existing work item** for what you are
   about to do. Duplicates are worse than nothing because they split the history
   of a decision. **Two ways to look, and both have a trap** — see "Finding an
   existing item" below. An empty result from a search you got wrong reads
   exactly like an empty board, which is how duplicates get filed.
2. **A found bug outside the current task's scope gets filed, not silently left.**
   File it in `Backlog` with `repo:bujo`, say in your reply that you filed it.
   This is the mechanism the global CLAUDE.md rule refers to.
3. **Move the item as the branch moves**: `In Progress` when the branch is cut,
   `In Review` when the PR opens, `Done` on squash-merge.
4. **Put the work item id in the PR body** (`COD-12`), not only in the branch name.
5. Do not create Plane *projects*. One project is deliberate — repos are labels
   so a repo can move between `now/`, `shelf/` and `live/` without its tickets
   being migrated.
6. Cycles are weeks. If the user asks "what am I doing this week", read the
   current cycle, not the whole backlog.

### Finding an existing item

This Plane is the **Community edition**. `workitem list` with a `pql` or any
structured filter fails outright:

> PQL and structured filters are not supported on this Plane edition.

So **there is no server-side way to filter by the `repo:` label.** Filter in your
own head instead — list, then read:

```
workitem list  project_id=<COD uuid>  per_page=100
               fields=sequence_id,name,state,labels
```

and keep only the rows whose `labels` contain this repo's label UUID. Get that
UUID once from `label list` (the API returns UUIDs everywhere and accepts nothing
else). The board is small enough that one unfiltered list is cheaper than the
round-trips to avoid it.

`workitem search` also works, but **it matches a contiguous substring of the
title, not a set of words.** Searching `"LM Studio local model"` returns nothing
while `"LM Studio"` returns two items — the first phrase appears in no title.
**Search one distinctive token** (`local_model`, `vault.yaml`, `8787`), never a
sentence, and treat a miss as "my query was too long", not as "no such ticket".

### Useful UUIDs

Every repo shares one project and one set of states, so these are fixed. Only the
`repo:` label differs — look yours up with `label list`.

| Thing | UUID |
|---|---|
| project `Coding` (COD) | `384bb763-72eb-497f-8ddb-142f7c178668` |
| state `Backlog` | `c1497bfa-8446-49f0-aa45-976b0311b82f` |
| state `Todo` | `c074ade8-4a34-4a89-8de3-e7ab61caedf6` |
| state `In Progress` | `824d6862-acf5-4562-82d3-fc1ee7eaadd9` |
| state `In Review` | `25021b28-b089-490e-9628-d4c0fd1a5253` |
| state `Done` | `ede567e7-3e57-405e-ac93-fb04db6bcfff` |
| state `Cancelled` | `85b6f97d-30e3-4cf4-ae58-063a0e239b4f` |

Plane does not replace `STATUS.md`. `STATUS.md` is re-entry context — where you
stopped, the next action, the traps. Plane is the queue. Both, in the same commit
as the work.

<!-- /plane-agent-rules -->
