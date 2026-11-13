import { Cell, Cells } from '../ui/cells'
import { plain } from '../../lib/plain'
import { PULLUP_FORM, PULLUP_METHODS, methodSteps, type PullupAbility } from '../../lib/pullups'

/**
 * THE PLAN, ON THE PULL-UPS PHONE PAGE — what to do today, in plain words.
 *
 * OWNS: your numbers (training set, today's and this week's volume), the four
 * methods as steps built from your training set, and the form cues — all open,
 * nothing to tap (owner, 2026-11-13: "show everything in one page … mention
 * in the workout plan, not on the log session", and no symbols).
 * DOES NOT OWN: the words themselves (`lib/pullups.ts` — `methodSteps`,
 * `PULLUP_FORM`), nor logging (`ProgramDay`, `QuickLog`).
 */
export function PullupTodayGuide({ ability, weekReps }: { ability: PullupAbility; weekReps: number }) {
  const set = ability.trainingSet
  return (
    <>
      <Cells title="Your numbers">
        <Cell chevron={false} title="Training set" subtitle={`${set} ${set === 1 ? 'rep' : 'reps'} a set, for ${ability.group}`} />
        <Cell chevron={false} title="Today" subtitle={plain(ability.daily)} />
        <Cell chevron={false} title="This week" subtitle={`${weekReps} done, aim for ${ability.weeklyLow} to ${ability.weeklyHigh}`} />
      </Cells>

      <section aria-labelledby="pu-methods" className="flex flex-col gap-3">
        <h2 id="pu-methods" className="px-1 text-heading font-semibold text-fg-1">How to do each method</h2>
        {PULLUP_METHODS.map((m) => (
          <article key={m.value} className="ex-card">
            <h3 className="text-body font-semibold text-fg-1">{m.label}</h3>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-label text-fg-2">
              {methodSteps(m.value, set).map((s) => <li key={s}>{s}</li>)}
            </ol>
          </article>
        ))}
      </section>

      <section aria-labelledby="pu-form" className="flex flex-col gap-3">
        <h2 id="pu-form" className="px-1 text-heading font-semibold text-fg-1">Form</h2>
        {PULLUP_FORM.map((f) => (
          <article key={f.phase} className="ex-card">
            <h3 className="text-body font-semibold text-fg-1">{f.phase}</h3>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-label text-fg-2">
              {f.cues.map((c) => <li key={c}>{plain(c)}</li>)}
            </ol>
          </article>
        ))}
      </section>
    </>
  )
}

