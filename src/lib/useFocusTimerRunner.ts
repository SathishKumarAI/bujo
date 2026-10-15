import { useEffect } from 'react'
import { useJournal } from '../store'
import { todayISO } from './date'
import { useFocusTimer, secondsLeft, isRunning, advance } from './focusTimer'

/**
 * The timer's one completion handler, mounted once in the shell.
 *
 * Kept out of the views on purpose. Both `RailTimer` and the Focus page's ring
 * render the same store, so if either of them handled "the phase ended" the
 * work block would be logged twice whenever both were on screen — which is
 * exactly the case this feature creates. One owner, in the shell, which is the
 * only place guaranteed to be mounted once.
 */
export function useFocusTimerRunner() {
  const { addDevSession } = useJournal()
  const t = useFocusTimer()
  const running = isRunning(t)

  useEffect(() => {
    if (!running) return
    const check = () => {
      if (secondsLeft() > 0) return
      const minutes = advance()
      // `advance` returns the work minutes, or null after a break — a break is
      // not a session and logging one would inflate every focus statistic.
      if (minutes != null) {
        addDevSession({
          date: todayISO(),
          durationMin: minutes,
          project: 'Focus timer',
          focus: 8,
          stress: 2,
          tags: ['focus'],
        })
      }
    }
    check() // a block that elapsed while the tab was closed finishes on load
    const id = setInterval(check, 1000)
    return () => clearInterval(id)
  }, [running, addDevSession])
}
