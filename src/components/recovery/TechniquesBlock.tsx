import { Sparkle, Warning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import type { ReactNode } from 'react'
import type { Milestone } from '../../lib/streak'
import type { TriggerPlan } from '../../lib/types'
import { RefBlock } from './RefBlock'

/**
 * The seven techniques, verbatim from the `<ol>` they used to be written out
 * as — same words, same order, same “term · how” shape.
 *
 * A list rendered from data rather than typed seven times is what lets
 * `views/NoFap.test.tsx` assert the count. `views/Pullups.tsx` lost eleven
 * workout formats to a pass that retyped a list inline, with `tsc`, eslint,
 * vitest and the build all green, and this file is one map() away from the
 * same shape.
 */
// eslint-disable-next-line react-refresh/only-export-components -- the list this component renders, co-located so the two cannot drift; `how` carries JSX, so it cannot move to `lib/` as data
export const TECHNIQUES: { term: string; how: ReactNode }[] = [
  { term: 'Surf it', how: 'name it (“this is an urge, it will pass”) and watch it rise and fall without acting.' },
  { term: 'Delay 10 min', how: 'set a timer; move, cold water, walk, push-ups. The peak passes.' },
  { term: 'HALT check', how: 'Hungry? Angry? Lonely? Tired? Fix the real need instead.' },
  { term: 'Play it forward', how: 'picture how you’ll feel 1 hour after giving in vs. resisting.' },
  { term: 'Remove the cue', how: 'leave the room, phone in another room, block the site.' },
  { term: 'Reach out', how: 'text someone; saying it out loud drains the urge’s power.' },
  { term: 'Log the win', how: <>tap <strong>I resisted it</strong> above; evidence beats willpower.</> },
]

/**
 * Beat the urge · the coping techniques, as reference.
 *
 * The in-crisis version of this list lives in `SosOverlay`, behind a fixed
 * floating button reachable from any scroll position — which is the only reason
 * it is allowed to sit in a rail group you have to pick rather than on the page
 * at all times. A page someone opens mid-urge must not put its coping list
 * behind a click; this one does not.
 *
 * **Seven objects, not seven lines.** This was an `<ol>` of `space-y-2` rows,
 * which is the shape `docs/PAGE-SHAPE.md` calls out: "a list of
 * title-plus-description rows separated by hairlines is not a list of
 * objects". Each technique is a separate thing you might reach for, and at any
 * width above a phone the list was one tall ribbon of text with the rest of
 * the column empty beside it — the "reads as a dump" half of the report.
 *
 * They are tiles now, in a **container** grid, so the count of columns follows
 * the width the panel is actually given rather than the width of the window.
 * That matters here twice over: this panel takes the full row of `CardGrid`
 * (`wide` in `lib/recoveryCards.ts`), and the shell's 1180px cap is being
 * lifted separately — a viewport query would have to be re-tuned for both, a
 * container query is already right. The `@container` sits on the wrapper and
 * the columns on its child, because an element cannot query itself, and the
 * phone column is spelled out because an implicit `auto` track sizes to its
 * widest item and can exceed its own box.
 *
 * The hover is `.card-3d` — the app's one sanctioned lift, reduced-motion
 * aware, and the same one every other card on the page uses. Nothing is
 * revealed by it, which is why it is safe on a phone that has no hover at all:
 * all seven tiles show everything they hold at every width.
 *
 * **`npm run a11y` cannot see this panel** (COD-237). The gate reaches hidden
 * content through `[aria-expanded="false"]`; Recovery's zone 3 is a
 * `SectionRail`, whose rows are single-select nav buttons with no
 * `aria-expanded` at all, so the gate scans the group the page opens on
 * (`progress`) and never the other three. This one is in `reference`. It was
 * therefore probed per group, at five desktop themes and two phone ones — 28
 * scans, 0 serious or critical — and the probe needed a wait for the
 * `page-enter` animation in front of it, or axe measures the *blended*
 * mid-fade colour and reports `text-fg-1` at 2.53:1 on every theme.
 */
export function TechniquesBlock({ plans, next, daysToNext }: {
  plans: TriggerPlan[]
  next?: Milestone
  daysToNext: number
}) {
  return (
    <RefBlock
      title={<span className="inline-flex items-center gap-2"><Icon as={Sparkle} size="md" className="text-mauve" /> Beat the urge</span>}
      subtitle="Proven techniques, an urge peaks and passes in ~15–20 min"
    >
      <div className="@container/tech">
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-2 @md/tech:grid-cols-2 @4xl/tech:grid-cols-3">
          {TECHNIQUES.map((t) => (
            <li key={t.term} className="card-3d rounded-card bg-card p-3 text-body text-fg-1">
              {/* `text-teal` stays, and it was checked rather than assumed.
                  The tile moves these terms off the page ground onto the CARD
                  rung, and `npm run contrast` measures accents against
                  mantle/base/surface0 — `--card` is a `color-mix()` and is none
                  of the three, so no gate covers this pairing. Measured on the
                  rendered page: **6.24:1 on latte, 6.43 on dawn**, and a
                  per-group axe probe is clean on all five (see the note below
                  on why `npm run a11y` cannot be). `onRaised('teal')` was tried
                  and returns the raw token in every theme, so it would have
                  been an inline style buying nothing. */}
              <span className="font-medium text-teal">{t.term}</span> · {t.how}
            </li>
          ))}
        </ol>
      </div>
      {plans.length > 0 && (
        <div className="mt-3 rounded-card bg-secondary/50 p-2 text-label text-fg-2">
          <span className="font-medium text-mauve">Your plan:</span> {plans.map((pl) => `${pl.addiction} → ${pl.coping || pl.trigger}`).slice(0, 2).join(' · ')}
        </div>
      )}
      {next && <p className="mt-2 inline-flex items-center gap-1.5 rounded-card bg-peach/10 p-2 text-label text-fg-2"><Icon as={Warning} size="sm" className="text-peach" /> You’re {daysToNext} day{daysToNext === 1 ? '' : 's'} from {next.label}. Don’t trade weeks of progress for 10 minutes.</p>}
    </RefBlock>
  )
}
