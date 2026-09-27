import { Bar } from './FocusCharts'
import type { interruptionCost } from '../../lib/focus'

/**
 * What the log says, in sentences.
 *
 * The page carried two of these in a band titled *Worth knowing* — the longest
 * session and one line about stress — both computed inline in the view, both
 * competing for attention with the three emoji notice boxes that preceded them.
 * `lib/focus.ts`'s `focusFindings` is the whole list now, so a finding is a
 * tested function rather than a conditional in JSX.
 *
 * **The empty state is one sentence, not five hedges.** Every finding comes from
 * a helper that returns `null` when it cannot answer, and an unanswerable
 * finding is absent rather than rendered as "not enough data yet" — a list
 * padded with those is a list nobody reads twice.
 */
export function FindingsList({ findings }: { findings: { id: string; text: string }[] }) {
  if (findings.length === 0) {
    return (
      <p className="text-body text-fg-2">
        Log a handful of sessions and this fills in — which block length runs deepest, what an
        interruption costs you, and which day of the week is your best.
      </p>
    )
  }
  return (
    <ul className="space-y-2.5 text-body">
      {findings.map((f) => (
        <li key={f.id} className="flex gap-2.5 text-pretty text-fg-1">
          {/* A bullet, not an icon and not an emoji. Seven findings each with
              their own glyph is seven competing marks; the list's shape is the
              affordance and the app's own bullet vocabulary is the page's
              signature elsewhere. */}
          <span aria-hidden className="mt-[0.45em] size-1.5 shrink-0 rounded-pill bg-brand" />
          <span>{f.text}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * What an interruption costs, as two bars on the same 0–10 scale.
 *
 * `interruptionsTrend` plots how *often* they happen and never said whether they
 * mattered. Both bars are normalised against 10 rather than against each other,
 * because the gap is the reading and re-basing on the better row would show a
 * full bar beside a short one whatever the real difference was.
 */
export function InterruptionCost({ cost }: { cost: ReturnType<typeof interruptionCost> }) {
  if (!cost) return null
  return (
    <div className="mt-5 border-t border-line pt-4">
      <h3 className="mb-3 text-label font-medium text-fg-1">What they cost</h3>
      <Bar
        label="Clean"
        value={`${cost.clean}/10`}
        share={cost.clean / 10}
        accent={cost.gap > 0}
        title={`${cost.cleanCount} sessions with no interruptions logged`}
      />
      <Bar
        label="Interrupted"
        value={`${cost.noisy}/10`}
        share={cost.noisy / 10}
        accent={cost.gap < 0}
        title={`${cost.noisyCount} sessions with at least one interruption`}
      />
      <p className="mt-3 text-label text-fg-2">
        Mean focus across {cost.cleanCount} uninterrupted and {cost.noisyCount} interrupted sessions.
        Needs two of each before it will say anything.
      </p>
    </div>
  )
}
