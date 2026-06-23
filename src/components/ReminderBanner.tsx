import { useEffect, useState } from 'react'
import { useJournal } from '../store'
import { activeDays, reminderMessage } from '../lib/stats'
import { todayISO } from '../lib/date'

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

  useEffect(() => {
    // Suppress only when there's nothing to nudge: logged today AND nothing urgent.
    if (!reminderEnabled || (loggedToday && !urgent)) {
      setShow(false)
      return
    }
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
  }, [reminderEnabled, reminderTime, loggedToday, today, urgent, title, body])

  if (!show || dismissed) return null

  return (
    <div className="flex items-center gap-3 border-b border-surface0 bg-mantle px-4 py-2 text-sm">
      <span className="text-mauve">{urgent ? urgent.title.slice(0, 2) : '✦'}</span>
      <span className="flex-1 text-subtext1">{body}</span>
      {'Notification' in window && Notification.permission === 'default' && (
        <button onClick={() => Notification.requestPermission()} className="rounded px-2 py-1 text-xs text-mauve hover:bg-surface0">
          Enable notifications
        </button>
      )}
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-overlay0 hover:text-text">×</button>
    </div>
  )
}
