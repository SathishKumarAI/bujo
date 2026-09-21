# Prompt · space & content audit for one page

Paste this and replace `<VIEW>`. It is the `space-audit` skill written out for a
session that does not have the skill loaded, and it follows the house prompt
skeleton (`~/coding/workspace/dotfiles/docs/templates/prompt-skeleton.md`):
role, context, numbered steps, MUST/MUST NOT, measure-then-answer.

---

You are working in the `bujo` repo. Audit and fix the layout of `?view=<VIEW>`.

<context>
- Run the built app, not the dev server: `npm run build && npm run preview` (4173).
- `npm run space -- <VIEW>` prints, per viewport: screens of scroll, card count,
  how many columns the layout **actually uses**, and any card whose box is
  mostly air. It opens every fold first, because a collapsed page is not a
  short page.
- The layout primitives are in `src/components/shell/CardGrid.tsx`:
  `CardGrid` (viewport breakpoints, supports `SPAN_2`), `MasonryGrid`
  (container query, for peer cards in no particular order). `CollapsibleSection`
  **stacks its children and does not lay them out** — a group wraps its children
  in a grid itself.
- Traps that have already cost this repo a session are in `CLAUDE.md`. Read the
  ones about `CardGrid`'s implicit track, `MasonryGrid` being a container query,
  and the a11y gate not seeing inside a closed fold.
</context>

<steps>
1. **Measure first and paste the numbers** for both viewports. Do not open the
   page and describe it; a description is not a measurement.
2. **Diagnose from the `columns` number.** `1 column` at 1440 means a primitive
   is stacking, not that the page needs a redesign. Find which one.
3. **Fix the primitive or the call site — whichever is the root cause — and fix
   it once.** If you find two components doing the same job, say so: that
   duplicate is usually the bug, and deleting it is the fix.
4. **Then ask the questions the tool cannot.** Is the summary above what it
   summarises? Is the primary action above the analytics? Does any subtitle
   merely list the cards visible beneath it? Do two groups answer the same
   question and deserve to be one?
5. **Re-measure with the same tool and the same fold state.** For a true
   baseline after editing, copy your file aside, `git checkout HEAD --` the
   originals, build, measure, restore. (`git stash push -- <path>` fails on a
   path you have `git rm`'d.)
6. **Run `npm run verify`, then `npm run a11y`.** Quote both exit codes.
</steps>

<must>
- Report the viewport that did **not** improve. A phone lays out one column by
  design, so packing work is usually a desktop win and neutral on phone. Say so.
- Keep every card. Shortening a page by deleting content is a product decision,
  not a layout one — propose it, do not do it.
- Preserve the rendered inventory across any move: headings, text lines,
  buttons, chart labels. Diff it before and after with folds forced open.
</must>

<must-not>
- **Do not collapse sections by default to make the page shorter.** `npm run
  a11y` walks the rendered page, so a fold that starts shut hides its contents
  from the gate — that is how a 1.41:1 contrast bug shipped once already.
- Do not add padding tweaks as the fix. If the answer is not a layout primitive
  or an ordering decision, re-read step 2.
- Do not claim an improvement without the before and after numbers in the reply.
</must-not>

<output>
1. The measured table, before and after, both viewports.
2. What the root cause was, in one sentence.
3. What you changed, and what you deliberately did not.
4. `verify` and `a11y` exit codes.
</output>
