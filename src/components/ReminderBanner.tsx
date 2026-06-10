import { useEffect, useState } from 'react'
import { useJournal } from '../store'
import { activeDays } from '../lib/stats'
import { todayISO } from '../lib/date'

/**
 * Daily nudge to journal. Shows an in-app banner (and fires a browser
 * notification once per day) when the reminder time has passed and today
 * hasn't been logged yet. Purely client-side — no push server.
 */
export function ReminderBanner() {
  const { data } = useJournal()
  const { reminderEnabled, reminderTime } = data.settings
  const [dismissed, setDismissed] = useState(false)
  const [show, setShow] = useState(false)

  const today = todayISO()
  const loggedToday = activeDays(data).has(today)

  useEffect(() => {
    if (!reminderEnabled || loggedToday) {
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
        new Notification('Time to journal ✦', { body: "A couple of minutes for yourself — fill in today's bujo." })
        localStorage.setItem(flag, '1')
      }
    }
    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [reminderEnabled, reminderTime, loggedToday, today])

  if (!show || dismissed) return null

  return (
    <div className="flex items-center gap-3 border-b border-surface0 bg-mantle px-4 py-2 text-sm">
      <span className="text-mauve">✦</span>
      <span className="flex-1 text-subtext1">A couple of minutes for yourself — log today's journal.</span>
      {'Notification' in window && Notification.permission === 'default' && (
        <button onClick={() => Notification.requestPermission()} className="rounded px-2 py-1 text-xs text-mauve hover:bg-surface0">
          Enable notifications
        </button>
      )}
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="text-overlay0 hover:text-text">×</button>
    </div>
  )
}
