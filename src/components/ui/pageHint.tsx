import { useStickyState } from '../../lib/useStickyState'

/**
 * A how-it-works note at the top of a phone page, as points, until "Got it"
 * (owner, 2026-11-14: "a note at the top … what is happening with this UI").
 * `id` keys the dismissal (`bujo.ui.hint.<id>`); styled by `.ex-hint` in
 * `styles/phone-exercise.css`.
 */
export function PageHint({ id, points }: { id: string; points: readonly string[] }) {
  const [hint, setHint] = useStickyState<'show' | 'hidden'>(`hint.${id}`, 'show', ['show', 'hidden'])
  if (hint === 'hidden') return null
  return (
    <aside aria-label="How this page works" className="ex-hint">
      <ul className="min-w-0 flex-1 list-disc space-y-0.5 pl-4">
        {points.map((t) => <li key={t}>{t}</li>)}
      </ul>
      <button type="button" className="min-h-11 shrink-0 self-start font-semibold text-brand-text" onClick={() => setHint('hidden')}>Got it</button>
    </aside>
  )
}
