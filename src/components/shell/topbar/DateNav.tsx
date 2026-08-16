import { CaretLeft, CaretRight } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { Button } from '../../ui/button'
import { useCursor } from '../cursor'
import { DateJumpPicker } from '../DateJumpPicker'
import { addDays, prettyDay, prettyMonth, ymOf } from '../../../lib/date'
import { hrefFor } from '../../../lib/deepLink'
import type { ViewId } from '../viewChrome'

function shiftMonth(ym: string, delta: number): string {
  const [y, mo] = ym.split('-').map(Number)
  return ymOf(new Date(y, mo - 1 + delta, 1))
}

/**
 * The header's date cursor · ‹ label › , with the year-wise jump picker behind
 * the label.
 *
 * Rendered only for the views `viewChrome` gives a `dateNav` to, and it drives
 * whichever cursor that view declared — `day` or `month`.
 */
export function DateNav({ view, mode }: { view: ViewId; mode: 'day' | 'month' }) {
  const { day, setDay, month, setMonth } = useCursor()
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="relative flex shrink-0 items-center gap-1 py-1.5">
      {/* Real anchors on day views, so ⌘-click and middle-click open a day in a
          new tab — the thing a date you can link to is for. Month views have no
          addressable URL of their own yet, so they stay buttons rather than
          pretending to be links. */}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Previous"
        {...(mode === 'day' ? { asChild: true } : { onClick: () => setMonth(shiftMonth(month, -1)) })}
      >
        {mode === 'day' ? (
          <a
            href={hrefFor(view, addDays(day, -1))}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
              e.preventDefault()
              setDay(addDays(day, -1))
            }}
          >
            <Icon as={CaretLeft} size="md" />
          </a>
        ) : (
          <Icon as={CaretLeft} size="md" />
        )}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        aria-haspopup="dialog"
        aria-expanded={pickerOpen}
        title="Jump to month / year"
        onClick={() => setPickerOpen((o) => !o)}
      >
        {mode === 'day' ? prettyDay(day) : prettyMonth(month)}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Next"
        {...(mode === 'day' ? { asChild: true } : { onClick: () => setMonth(shiftMonth(month, 1)) })}
      >
        {mode === 'day' ? (
          <a
            href={hrefFor(view, addDays(day, 1))}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
              e.preventDefault()
              setDay(addDays(day, 1))
            }}
          >
            <Icon as={CaretRight} size="md" />
          </a>
        ) : (
          <Icon as={CaretRight} size="md" />
        )}
      </Button>
      {pickerOpen && (
        <DateJumpPicker
          mode={mode}
          month={month}
          day={day}
          onPickMonth={setMonth}
          onPickDay={setDay}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
