import { Check } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../store'
import { prettyDay, todayISO } from '../../lib/date'
import { practiceKey, practiceStat, togglePractice } from '../../lib/practiceLog'

/**
 * "Did you practise this?" — one tick, beside a drill or a shot.
 *
 * WHAT THIS OWNS: asking, and writing the answer. It does not own the key
 * format (`lib/practiceLog.ts`), the merge (`lib/conflict.ts`), or any layout
 * around it.
 *
 * **Why it is a toggle and not a counter.** A `+1` button cannot be undone,
 * and the first thing anybody does with a new control is press it to see what
 * it does. This writes today's date and pressing again removes it — which is
 * `docs/USER-CONTROL.md` rule 1 in its smallest possible form: anything you
 * record, you can correct.
 *
 * **It states its own history rather than only its state.** `3× · last Tue,
 * Oct 7` beside an unticked box is the difference between "you have never done
 * this" and "you did it, just not today", and those must not render the same —
 * the same argument as the urge-coverage card that prints `3 of 5`.
 *
 * The accessible name carries all of it, because the visible text is a count
 * and a date with no subject: a screen reader on a row of nine of these would
 * otherwise hear "3 times, last Tuesday" nine times with nothing to attach it
 * to.
 */
export function PracticeTick({ kind, name, className = '' }: {
  kind: 'drill' | 'shot'
  /** The drill or shot as written. Slugged into the key — see `practiceKey`. */
  name: string
  className?: string
}) {
  const { data, setSettings } = useJournal()
  const today = todayISO()
  const key = practiceKey(kind, name)
  const stat = practiceStat(data.settings.practiceLog, key, today)
  const verb = kind === 'drill' ? 'Drilled' : 'Practised'

  return (
    <button
      type="button"
      onClick={() => setSettings({ practiceLog: togglePractice(data.settings.practiceLog ?? {}, key, today) })}
      aria-pressed={stat.onDate}
      aria-label={
        stat.onDate
          ? `${name} — ${verb.toLowerCase()} today. Press to remove today.`
          : `${name} — mark ${verb.toLowerCase()} today.${stat.last ? ` Last done ${prettyDay(stat.last)}, ${stat.days.length} time${stat.days.length === 1 ? '' : 's'} in all.` : ' Never done.'}`
      }
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2 py-0.5 text-label transition-colors active:scale-95 ${
        stat.onDate
          ? 'border-green bg-green/15 text-fg-1'
          : 'border-line bg-ink-2 text-fg-2 hover:border-line-strong hover:text-fg-1'
      } ${className}`}
    >
      {/* Green for "done", which is the only thing green means on this page.
          The box is empty rather than a different colour when it is not — an
          unticked control that is also coloured reads as a second state. */}
      <span aria-hidden className={`grid h-3.5 w-3.5 place-items-center rounded-[4px] ${stat.onDate ? 'bg-green' : 'border border-line-strong'}`}>
        {stat.onDate && <Icon as={Check} size="sm" className="h-2.5 w-2.5 text-ink-0" />}
      </span>
      <span aria-hidden>
        {stat.onDate ? `${verb} today` : stat.days.length > 0 ? `${stat.days.length}× · ${prettyDay(stat.last!)}` : verb}
      </span>
    </button>
  )
}
