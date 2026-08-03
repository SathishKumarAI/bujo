import { useEffect, useState } from 'react'
import { useJournal } from '../store'
import { activeDays, reminderMessage } from '../lib/stats'
import { todayISO } from '../lib/date'
import { Button } from './ui/button'

/**
 * Daily nudge to journal. Shows an in-app banner (and fires a browser
 * notification once per day) when the reminder time has passed and today
 * hasn't been logged yet. Purely client-side · no push server.
 */
export function ReminderBanner() {
  const { data } = useJournal()
  const { reminderEnabled, reminderTime } = data.settings
  const [dismissed, setDismissed] = useState(false)
  const [show, setShow] = useState(false)

  const today = todayISO()
  const loggedToday = activeDays(data).has(today)
  // Most-urgent nudge (streak-at-risk / challenge-day) wins over the plain one.
  const urgent = reminderMessage(data, today)
  const title = urgent?.title ?? 'Time to journal ✦'
  const body = urgent?.body ?? "A couple of minutes for yourself · fill in today's bujo."

  // Suppress only when there's nothing to nudge: logged today AND nothing
  // urgent. Derived rather than pushed into `show` from the effect — whether
  // the banner is *allowed* is a function of current props, not a stored fact,
  // and writing it in the effect body cost a second render each time.
  const suppressed = !reminderEnabled || (loggedToday && !urgent)

  useEffect(() => {
    if (suppressed) return
    const check = () => {
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const due = hhmm >= reminderTime
      setShow(due)
      // Fire one OS notification per day.
      const flag = `bujo:notified:${today}`
      if (due && 'Notification' in window && Notification.permission === 'granted' && !localStorage.getItem(flag)) {
        new Notification(title, { body })
        localStorage.setItem(flag, '1')
      }
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [suppressed, reminderTime, today, title, body])

  if (suppressed || !show || dismissed) return null

  return (
    <div className="flex items-center gap-3 border-b border-line bg-ink-1 px-4 py-2 text-body">
      <span className="text-mauve">{urgent ? urgent.title.slice(0, 2) : '✦'}</span>
      <span className="flex-1 text-fg-1">{body}</span>
      {'Notification' in window && Notification.permission === 'default' && (
        <Button variant="ghost" size="sm" onClick={() => Notification.requestPermission()} className="text-label text-mauve">
          Enable notifications
        </Button>
      )}
      <Button variant="ghost" size="icon-sm" onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-fg-2 hover:text-fg-1">×</Button>
    </div>
  )
}
