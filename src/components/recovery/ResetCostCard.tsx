import { Warning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { cat, onRaised } from '../../lib/colors'
import { resetCost } from '../../lib/coping'

/**
 * WHAT GOING BACK WOULD COST, in this person's own numbers.
 *
 * WHAT THIS FILE OWNS: how the trade is drawn.
 * WHAT IT DOES NOT OWN: the arithmetic (`lib/coping.ts` → `resetCost`).
 *
 * Asked for as *"what is the consequence of going back again — show them that
 * in an intuitive way"*.
 *
 * ── Both halves, always, and that is the design ──────────────────────────
 *
 * A card that shows only the loss is the abstinence violation effect with a
 * chart on it: making a slip feel total is precisely what turns a slip into a
 * relapse, which is the mechanism the card beside this one exists to explain.
 * So the kept column is not a consolation prize tacked on the end — it is the
 * correction, it is the same size as the loss, and it is coloured green
 * against the loss's peach rather than being a footnote.
 *
 * **No red, and no countdown.** This is a page people open at their worst
 * moment; a red alarm is a punishment and this app does not punish a user for
 * their own data. `peach` is the "this costs something" tone the rest of the
 * app already uses for over-target, and it is as far as this goes.
 */
export function ResetCostCard({ current, best, totalClean }: {
  current: number
  best: number
  totalClean: number
}) {
  const c = resetCost(current, best, totalClean)

  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={Warning} size="sm" style={{ color: onRaised('peach') }} /> What a reset costs today</span>}
      subtitle={c.days === 0 ? 'Nothing yet — day one has nothing to lose' : `${c.days} day${c.days === 1 ? '' : 's'} of run, and what stays either way`}
    >
      {/* `@container/cost` on the WRAPPER — an element cannot query itself,
          and a container query against a container nobody declared matches at
          no width at all, with no error. Third instance in CLAUDE.md. */}
      <div className="@container/cost">
      <div className="grid grid-cols-1 gap-2 @min-[26rem]/cost:grid-cols-2">
        {/* GIVEN UP */}
        <div className="rounded-card p-3" style={{ background: `${cat('peach')}12`, border: `1px solid ${cat('peach')}44` }}>
          <p className="text-label text-fg-2">You would give up</p>
          <p className="num mt-0.5 text-display leading-none" style={{ color: onRaised('peach') }}>{c.days}</p>
          <p className="mt-1 text-label text-fg-2">day{c.days === 1 ? '' : 's'} of the current run</p>
          <ul className="mt-2 space-y-1 text-label text-fg-1">
            {c.milestone && (
              <li>
                <span className="font-medium">{c.milestone.label}</span> moves from {c.milestone.daysAway} day{c.milestone.daysAway === 1 ? '' : 's'} away back to the full stretch.
              </li>
            )}
            {c.fromBest != null && (
              <li>You are <span className="font-medium">{c.fromBest}</span> day{c.fromBest === 1 ? '' : 's'} from your own record. That is the one you are chasing.</li>
            )}
          </ul>
        </div>

        {/* KEPT · the same size, deliberately. */}
        <div className="rounded-card p-3" style={{ background: `${cat('green')}12`, border: `1px solid ${cat('green')}44` }}>
          <p className="text-label text-fg-2">You would keep</p>
          <p className="num mt-0.5 text-display leading-none" style={{ color: onRaised('green') }}>{c.kept}</p>
          <p className="mt-1 text-label text-fg-2">clean days already banked</p>
          <ul className="mt-2 space-y-1 text-label text-fg-1">
            <li>Your personal best stays where it is.</li>
            <li>Every trigger and hour this page has learned about you stays too.</li>
            <li>A slip is one episode. It only becomes a relapse if the next decision says so.</li>
          </ul>
        </div>
      </div>

      </div>

      <p className="mt-2 text-micro text-fg-2">
        This is arithmetic, not a warning. It is here so the trade is a real one rather than a feeling.
      </p>
    </Card>
  )
}
