import { BBT_RULES, CYCLE_PHASES, TRACKING_TIPS } from '../../lib/cycleGuide'
import { onRaised } from '../../lib/colors'
import { Card, Pill } from '../ui'
import { PhaseNutrition } from './PhaseNutrition'

/**
 * THE GUIDE CARDS · the reference shelf, out of the view.
 *
 * These four were `CollapsibleSection`s in `views/Cycle.tsx` — all shipping
 * closed, which is the fold-wall this pass removes. Under the zone-3 rail they
 * are ordinary cards in the `guide` group, so their bodies moved here whole:
 * **moved, not retyped.** The difference is invisible to `tsc`, eslint, vitest
 * and the build alike, which is how `views/Pullups.tsx` lost eleven workout
 * formats; `lib/cycleGuide.test.ts` pins the counts (four phases, five rules,
 * four tips) so a shrunken guide fails something.
 *
 * Titles and subtitles live with their bodies rather than at the call site,
 * because the card's own words are part of the content — the view's job is to
 * decide *which group* a card is in, and that is `lib/cycleCards.ts`.
 *
 * One file, not four: this is one concern (render `lib/cycleGuide.ts`), and
 * four files whose only difference is an import block would be three more
 * places to look. None of them holds content of its own — editing a phase, a
 * rule or a tip is an edit to `lib/cycleGuide.ts`.
 *
 * Which of them takes the full row is `lib/cycleCards.ts`' `wide` flag, not a
 * class here: the grid item is the view's `data-card` wrapper, so a span class
 * on the `Card` inside it resolves against nothing. The phase grid is
 * `sm:grid-cols-2` and the food guide is long-form prose, so both are `wide`;
 * the two short lists read fine at half width.
 */

/** The four phases: what each one is, how it can feel, what helps. */
export function PhasesCard() {
  return (
    <Card band title="The four phases" subtitle="What each one is, how it can feel, what helps" hideInfo>
      <div className="grid gap-3 sm:grid-cols-2">
        {CYCLE_PHASES.map((ph) => (
          <div key={ph.id} className="rounded-card bg-ink-2 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-body font-medium" style={{ color: onRaised(ph.color) }}>{ph.name}</span>
              <Pill color={ph.color} size="micro" className="px-2">{ph.days}</Pill>
            </div>
            <p className="text-label text-fg-2">{ph.what}</p>
            <p className="mt-1 text-label text-fg-2"><span className="font-medium text-fg-1">How it can feel:</span> {ph.feel}</p>
            <p className="mt-1 text-label text-fg-2"><span className="font-medium" style={{ color: onRaised('green') }}>Helps:</span> {ph.tip}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-label text-fg-2">Day ranges assume the textbook 28 days — 21–35 is a normal range, and the wheel above uses your logged average once two periods anchor it.</p>
    </Card>
  )
}

/** Cravings, what is worth eating, and who says so. Body in `PhaseNutrition`. */
export function FoodCard() {
  return (
    <Card band title="Cravings & food, phase by phase" subtitle="What the cravings tend to be, what is worth eating, and who says so" hideInfo>
      <PhaseNutrition />
    </Card>
  )
}

/** Five rules that make the temperature chart readable rather than noise. */
export function BbtRulesCard() {
  return (
    <Card band title="Basal temperature, done right" subtitle="Five rules that make the chart readable" hideInfo>
      <ol className="space-y-1.5">
        {BBT_RULES.map((r, i) => (
          <li key={i} className="flex gap-2 text-label text-fg-2">
            <span className="shrink-0 font-medium text-mauve">{i + 1}.</span> {r}
          </li>
        ))}
      </ol>
    </Card>
  )
}

/** What each flag buys you — the *why keep it*, not what the mark records. */
export function LoggingCard() {
  return (
    <Card band title="What to log & why" subtitle="The flags above, and what each one buys you" hideInfo>
      <ul className="grid gap-2 sm:grid-cols-2">
        {TRACKING_TIPS.map((t) => (
          <li key={t.what} className="rounded-card bg-ink-2 p-2.5">
            <p className="text-body font-medium text-fg-1">{t.what}</p>
            <p className="text-label text-fg-2">{t.why}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
