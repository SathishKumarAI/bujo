import type { ReactNode } from 'react'
import { Check, PencilSimple, Timer, Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { VideoLink } from '../VideoLink'
import { PageHint } from '../ui/pageHint'

/**
 * ONE EXERCISE ON A PHONE, the same card on Program, Pull-ups and Home
 * workout (owner, 2026-11-14: "what to do today, complete it, get out").
 *
 * OWNS: the card's two lines. Line 1 is the set counter, the name on ONE line
 * and a small remove button; line 2 is one row of actions: the plan ("3 sets
 * of 12, 35 lb") which IS the Edit button, Watch, and the timer when the plan
 * is timed. Everything else a page knows (last time, a suggested weight, what
 * you did) lives behind Edit, in the page's own sheet.
 * DOES NOT OWN: the counting, the sheet or the timer (each page's), nor which
 * side is which: `:root[data-hand]` (Settings, Hand) mirrors the card in
 * `styles/phone-exercise.css`, completion under the thumb.
 */
export function ExerciseCard({ name, n, total, onTap, plan, onEdit, onTimer, onRemove, watch = true }: {
  name: string
  /** Sets ticked, and the sets planned. */
  n: number
  total: number
  /** Tap after a set; on a full counter it clears. */
  onTap: () => void
  /** What to do, in words. Drawn as the Edit button when `onEdit` is given. */
  plan: ReactNode
  onEdit?: () => void
  onTimer?: () => void
  onRemove?: () => void
  watch?: boolean
}) {
  const all = n >= total
  return (
    <li className="ex-card ex-row" data-done={all || undefined}>
      <button type="button" className="set-count" aria-pressed={all}
        aria-label={all ? `${name}: all ${total} sets done, tap to clear` : `${name}: ${n}/${total} sets done, tap after set ${n + 1}`}
        onClick={onTap}>
        {all ? <Icon as={Check} size="md" /> : <span aria-hidden><b>{n}</b>/{total}</span>}
      </button>
      <div className="min-w-0 flex-1">
        <h3 className={`truncate text-body font-semibold ${all ? 'text-fg-2' : 'text-fg-1'}`} title={name}>{name}</h3>
        <div className="ex-actions">
          {onEdit ? (
            <button type="button" className="ex-act ex-plan" aria-haspopup="dialog" onClick={onEdit}>
              <span className="min-w-0">{plan}</span><Icon as={PencilSimple} size="sm" className="shrink-0" />
              <span className="sr-only">, edit {name}</span>
            </button>
          ) : <span className="ex-plan text-label text-fg-2">{plan}</span>}
          {watch && <VideoLink name={name} label="Watch" size="sm" className="ex-act" />}
          {onTimer && (
            <button type="button" className="ex-act" aria-haspopup="dialog" onClick={onTimer}>
              <Icon as={Timer} size="sm" />Timer{' '}<span className="sr-only">for {name}</span>
            </button>
          )}
        </div>
      </div>
      {onRemove && (
        <button type="button" className="ex-del" aria-label={`Remove ${name} from the session`} onClick={onRemove}>
          <Icon as={Trash} size="sm" />
        </button>
      )}
    </li>
  )
}

/** The workout pages' note, as points (owner, 2026-11-14). One `id` for all
 *  three pages, so it is read once, not three times. */
export function WorkoutHint() {
  return <PageHint id="workout" points={['Tap the circle after each set.', 'Tap the plan to change it.', 'Watch shows how to do it.', 'Log when you are done.']} />
}
