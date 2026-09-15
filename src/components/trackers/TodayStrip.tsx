import { Prohibit } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { fromISODay } from '../../lib/date'
import { cat, habitChipStyle, readableOn } from '../../lib/colors'
import { habitDoneOn, habitTarget, habitValueOn, nextHabitValue } from '../../lib/stats'
import type { Habit, JournalData } from '../../lib/types'
import { justCapturedProps, useJustCaptured } from '../CaptureReceipt'
import { HABIT_KEY } from '../../lib/recordKeys'

/**
 * TODAY STRIP · zone 2's whole content: one tappable chip per habit due today.
 *
 * Owns the chip, its −/+ steppers and what a tap writes. Owns no chrome — the
 * `Card` around it supplies the title and the done count, which is why there is
 * no wrapper box or heading in here.
 *
 * Not the month grid (`CategoryRows.tsx`), and not the filter deciding which
 * habits are "today": the caller applies the same `activeDays` test so its
 * header count and these chips cannot disagree.
 */
export function TodayStrip({
  habits, data, today, onToggle, onSetValue,
}: {
  habits: Habit[]
  data: JournalData
  today: string
  onToggle: (date: string, id: string) => void
  onSetValue: (date: string, id: string, value: number) => void
}) {
  // "water 6" from the capture bar writes today's value and lands here, so this
  // strip is where a captured habit is actually looked for. The month grid gets
  // the same mark on the same cell — one capture, two places it is visible, and
  // both read the one set.
  const justCaptured = useJustCaptured()

  const todays = habits.filter((h) => !h.activeDays?.length || h.activeDays.includes(fromISODay(today).getDay()))
  if (todays.length === 0) return null

  // No wrapper box and no "Today" heading: this is zone 2's whole content now,
  // and the Card around it supplies both — a bordered box titled "Today" inside
  // a card titled "Today" was two frames and one subject. The done count moved
  // to the card header, where every other panel on the page puts its state.
  return (
    <div className="flex flex-wrap gap-1.5">
        {todays.map((h) => {
          const type = h.type ?? 'check'
          const numeric = type === 'count' || type === 'timer' || type === 'rating'
          const target = habitTarget(h)
          const val = habitValueOn(data, h, today)
          const on = habitDoneOn(data, h, today)
          const next = nextHabitValue(type, target, val)
          // Count/timer habits get explicit −/+ steppers so you can both add and
          // subtract (and overshoot the target) without cycling back to 0.
          if ((type === 'count' || type === 'timer') && !h.avoid) {
            const step = type === 'timer' ? (target >= 20 ? 5 : 1) : 1
            return (
              <span
                key={h.id}
                {...justCapturedProps(justCaptured.has(HABIT_KEY(today, h.id)))}
                className={`inline-flex items-center gap-1 rounded-pill border px-1.5 py-0.5 text-label ${justCaptured.has(HABIT_KEY(today, h.id)) ? 'just-captured' : ''}`}
                style={habitChipStyle(on ? 'on' : 'off', h.color)}
              >
                <span className="pl-1">{h.emoji ?? '●'} {h.name}</span>
                <button
                  onClick={() => onSetValue(today, h.id, Math.max(0, val - step))}
                  disabled={val <= 0}
                  aria-label={`Decrease ${h.name}`}
                  className="grid h-5 w-5 place-items-center rounded-pill bg-ink-0/60 text-fg-2 transition-colors hover:bg-ink-0 hover:text-fg-1 disabled:opacity-30"
                >−</button>
                <span className="min-w-[2.5rem] text-center tabular-nums text-fg-2">{val}/{target}{type === 'timer' ? 'm' : ''}</span>
                <button
                  onClick={() => onSetValue(today, h.id, val + step)}
                  aria-label={`Increase ${h.name}`}
                  className="grid h-5 w-5 place-items-center rounded-pill bg-ink-0/60 text-fg-2 transition-colors hover:bg-ink-0 hover:text-fg-1"
                >+</button>
              </span>
            )
          }
          return (
            <button
              key={h.id}
              onClick={() => (numeric ? onSetValue(today, h.id, next) : onToggle(today, h.id))}
              {...justCapturedProps(justCaptured.has(HABIT_KEY(today, h.id)))}
              className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-label transition-colors ${justCaptured.has(HABIT_KEY(today, h.id)) ? 'just-captured' : ''}`}
              title={h.avoid ? (on ? 'Slipped today · tap to clear' : 'Clean today') : undefined}
              style={habitChipStyle(on ? (h.avoid ? 'slip' : 'on') : 'off', h.color)}
            >
              <span>{h.avoid ? <Icon as={Prohibit} size="sm" /> : (h.emoji ?? '●')}</span>
              {h.name}
              {/* Sits ON the chip, so its background is the chip's — a wash of red
                  when slipped, the neutral surface when clean. `readableOn`
                  measures against that rather than assuming the page, which is
                  the mistake that costs a 10px label AA in the light themes. */}
              {h.avoid && (
                <span
                  className="text-micro"
                  style={{
                    // `habitChipStyle` already solved a foreground for this exact
                    // background; ask it rather than recomputing the composite,
                    // which is how this drifted when the chip became opaque and
                    // card-anchored.
                    color: on
                      ? habitChipStyle('slip', h.color).color
                      : readableOn(cat('green'), habitChipStyle('off', h.color).background, 4.6),
                  }}
                >
                  {on ? 'slip' : 'clean'}
                </span>
              )}
              {numeric && !h.avoid && <span className="text-fg-2">{type === 'rating' ? `${val}/5` : `${val}/${target}${type === 'timer' ? 'm' : ''}`}</span>}
            </button>
          )
        })}
    </div>
  )
}
