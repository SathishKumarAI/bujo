import { useState } from 'react'
import { X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Empty, Input } from '../ui'
import { Button } from '../ui/button'
import { useJournal } from '../../store'
import { useConfirm } from '../ConfirmDialog'
import { cat, onRaised } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import { useCappedList } from '../../lib/useCappedList'
import { ShowMore } from '../ShowMore'
import type { Relapse } from '../../lib/types'
import { RefBlock } from './RefBlock'

/**
 * RESET HISTORY · every logged reset, newest first, and now correctable.
 *
 * WHAT THIS FILE OWNS: the list, its editor, and the delete that asks.
 * WHAT IT DOES NOT OWN: what a reset does to the streak — `restartFrom` in
 * `lib/streak.ts` owns that, and both mutations go through it.
 *
 * ── It was read-only, on the page's most consequential record ─────────────
 *
 * `USER-CONTROL.md` rule 1 is that if a view can `add` it, the same view can
 * `edit` it — and this one could do neither. A reset logged on the wrong day,
 * or tapped by mistake on a day you were clean, was permanent: it moved
 * `startedOn`, it fed `best`, it appeared in every weekday and trigger
 * pattern on the page, and nothing anywhere could take it back. Reported as
 * *"a history reference, not in the logs — and give them the capability of
 * edit, clearing them out as well"*.
 *
 * **The edit rewrites the streak, not just the row.** `startedOn` is derived
 * from the latest reset, so changing a date or removing a reset has to move it
 * — otherwise the page counts from a day that no longer has a reset on it.
 * That is the `setRows` case in `USER-CONTROL.md` on a different record: one
 * stored shape updated, another left stale, and nothing failing.
 *
 * **Edit before ×, and the delete names what it removes** (rule 2). A reset
 * carries the reason you wrote at the worst moment of a bad day; deleting it
 * silently on a mis-tap is the failure this repo has already shipped once.
 */
export function ResetHistoryBlock({ relapses }: { relapses: Relapse[] }) {
  const { updateRelapse, removeRelapse } = useJournal()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<string | null>(null)

  /* Newest first, and capped: a year of resets is not a reference section, it
     is a scroll. `ShowMore` carries the total so the cap is never a surprise. */
  const newest = [...relapses].reverse()
  const list = useCappedList(newest, 5)

  return (
    <RefBlock
      title="Reset history"
      subtitle={relapses.length ? `${relapses.length} reset${relapses.length === 1 ? '' : 's'} · no shame, patterns are data` : 'No shame · patterns are data'}
    >
      {relapses.length === 0 ? (
        <Empty>No resets logged. Keep going.</Empty>
      ) : (<>
        <ul className="space-y-2 text-body">
          {list.shown.map((r) => (
            /* `@container/reset` DECLARED HERE, on the row, because the grid
               inside it asks `@min-[26rem]/reset` — and a container query
               against a container nobody declared never matches, with no
               error and a perfectly valid class list. Third trap in CLAUDE.md
               and the one easiest to reintroduce. The row, not the grid: an
               element cannot query itself. */
            <li key={r.id} className="@container/reset rounded-card border p-2" style={{ borderColor: cat('red') + '55', background: cat('red') + '12' }}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {/* `count` shown only when it says something: a bare row
                    means "once", and "×1" on every line before this field
                    existed would be a number the user never entered. */}
                <span className="flex items-center gap-1.5 font-medium" style={{ color: onRaised('red') }}>
                  <Icon as={X} size="sm" /> Reset · {prettyDay(r.date)}
                </span>
                {(r.count ?? 1) > 1 && <span className="text-label text-fg-2">×{r.count}</span>}

                {/* The reversible action first, and named — a bare glyph is
                    the affordance `USER-CONTROL.md` says is not one. */}
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(editing === r.id ? null : r.id)}
                    aria-expanded={editing === r.id}
                    aria-label={editing === r.id
                      ? `Close the editor for the reset on ${prettyDay(r.date)}`
                      : `Edit the reset on ${prettyDay(r.date)}`}
                    className="h-auto p-0 text-label text-fg-2 hover:text-fg-1"
                  >{editing === r.id ? 'Close' : 'Edit'}</Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={async () => {
                      if (await confirm({
                        title: 'Delete this reset?',
                        description: `The reset on ${prettyDay(r.date)}${r.trigger ? ` (${r.trigger})` : ''} is removed from your history, and your streak restarts from whatever reset is left. This cannot be undone from here.`,
                        confirmLabel: 'Delete reset',
                        destructive: true,
                      })) { setEditing(null); removeRelapse(r.id) }
                    }}
                    aria-label={`Delete the reset on ${prettyDay(r.date)}`}
                    className="shrink-0 text-fg-2 reveal hover:text-red"
                  >×</Button>
                </span>
              </div>

              {editing === r.id ? (
                <div className="mt-2 grid grid-cols-1 gap-2 @min-[26rem]/reset:grid-cols-2">
                  <label className="block text-micro text-fg-2">
                    Day
                    <Input
                      type="date"
                      value={r.date}
                      onChange={(e) => e.target.value && updateRelapse(r.id, { date: e.target.value })}
                      aria-label={`Day of the reset logged on ${prettyDay(r.date)}`}
                      className="mt-0.5 py-1"
                    />
                  </label>
                  <label className="block text-micro text-fg-2">
                    How many
                    <Input
                      type="number"
                      min={1}
                      value={r.count ?? 1}
                      onChange={(e) => updateRelapse(r.id, { count: e.target.value ? Math.max(1, Number(e.target.value)) : undefined })}
                      aria-label={`How many, for the reset on ${prettyDay(r.date)}`}
                      className="num mt-0.5 py-1 text-right"
                    />
                  </label>
                  <label className="block text-micro text-fg-2 @min-[26rem]/reset:col-span-2">
                    Reason
                    <Input
                      value={r.trigger ?? ''}
                      onChange={(e) => updateRelapse(r.id, { trigger: e.target.value })}
                      placeholder="What ran up to it"
                      aria-label={`Reason for the reset on ${prettyDay(r.date)}`}
                      className="mt-0.5 py-1"
                    />
                  </label>
                  <label className="block text-micro text-fg-2 @min-[26rem]/reset:col-span-2">
                    Note
                    <Input
                      value={r.note ?? ''}
                      onChange={(e) => updateRelapse(r.id, { note: e.target.value })}
                      placeholder="Anything worth remembering"
                      aria-label={`Note on the reset on ${prettyDay(r.date)}`}
                      className="mt-0.5 py-1"
                    />
                  </label>
                  <p className="text-micro text-fg-2 @min-[26rem]/reset:col-span-2">
                    Changing the day moves the streak with it — it counts from your latest reset.
                  </p>
                </div>
              ) : (<>
                {r.trigger && <div className="mt-0.5 text-fg-1"><span className="text-fg-2">Reason:</span> {r.trigger}</div>}
                {r.note && <div className="text-fg-2 italic">{r.note}</div>}
              </>)}
            </li>
          ))}
        </ul>
        <ShowMore list={list} />
      </>)}
    </RefBlock>
  )
}
