import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MONTHS, todayISO, ymOf } from '../../lib/date'

/**
 * Year-wise date jump (BUJO-238): the date-nav label opens this instead of just
 * resetting to today, so you can leap to any month/year (a calendar lookup)
 * rather than stepping ‹ › one month at a time. Day-views get a native date
 * field + the month grid; month-views get just the year + month grid.
 */
export function DateJumpPicker({
  mode, month, day, onPickMonth, onPickDay, onClose,
}: {
  mode: 'day' | 'month'
  month: string
  day: string
  onPickMonth: (ym: string) => void
  onPickDay: (iso: string) => void
  onClose: () => void
}) {
  const [year, setYear] = useState(() => Number((mode === 'day' ? day : month).slice(0, 4)))
  const curY = Number((mode === 'day' ? day : month).slice(0, 4))
  const curM = Number((mode === 'day' ? day : month).slice(5, 7))

  return (
    <>
      {/* click-away backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div className="absolute top-full left-1/2 z-50 mt-1.5 w-64 -translate-x-1/2 rounded-xl border border-surface1 bg-mantle p-3 shadow-2xl" role="dialog" aria-label="Jump to date">
        {mode === 'day' && (
          <input
            type="date"
            value={day}
            onChange={(e) => { if (e.target.value) { onPickDay(e.target.value); onClose() } }}
            aria-label="Pick a day"
            className="mb-2 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm text-text"
          />
        )}
        <div className="mb-2 flex items-center justify-between">
          <button onClick={() => setYear((y) => y - 1)} aria-label="Previous year" className="rounded p-1 text-overlay1 hover:text-text"><ChevronLeft size={16} /></button>
          <span className="font-display text-sm font-medium text-text tabular-nums">{year}</span>
          <button onClick={() => setYear((y) => y + 1)} aria-label="Next year" className="rounded p-1 text-overlay1 hover:text-text"><ChevronRight size={16} /></button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((m, i) => {
            const active = year === curY && i + 1 === curM
            const ym = `${year}-${String(i + 1).padStart(2, '0')}`
            return (
              <button
                key={m}
                onClick={() => {
                  if (mode === 'day') onPickDay(`${ym}-${day.slice(8) || '01'}`)
                  else onPickMonth(ym)
                  onClose()
                }}
                aria-pressed={active}
                className={`rounded-md px-2 py-1.5 text-xs transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-subtext1 hover:bg-secondary/60 hover:text-text'}`}
              >
                {m.slice(0, 3)}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => { if (mode === 'day') onPickDay(todayISO()); else onPickMonth(ymOf(todayISO())); onClose() }}
          className="mt-2 w-full rounded-md py-1 text-xs text-overlay0 hover:text-text"
        >
          Jump to today
        </button>
      </div>
    </>
  )
}
