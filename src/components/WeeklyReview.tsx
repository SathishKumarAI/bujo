import { ClipboardText } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { cat } from '../lib/colors'
import { todayISO, prettyDay } from '../lib/date'
import { weekCoverage } from '../lib/coverage'
import { notify } from '../lib/notify'
import { useNav } from './shell/nav'
import { Card, Textarea } from './ui'
import { Button } from './ui/button'

/**
 * Guided weekly review, top to bottom: (1) migrate overdue tasks, (2) read the
 * week's coverage + what slipped, (3) reflect · saved as a #review note on today.
 * Collapsed by default so it doesn't crowd Insights until you want to sit down
 * for a review.
 */
export function WeeklyReview() {
  const { data, addEntry } = useJournal()
  const navigate = useNav()
  const today = todayISO()
  const [open, setOpen] = useState(false)
  const [reflection, setReflection] = useState('')

  const week = weekCoverage(data, today, 7)
  const score = Math.round((week.reduce((a, d) => a + d.score, 0) / week.length) * 100)
  const overdue = data.entries.filter((e) => e.type === 'task' && e.status === 'open' && e.date && e.date < today).length
  // Habits missed at least once this week, with miss counts.
  const missCounts = new Map<string, number>()
  for (const d of week) for (const m of d.habits.missed) missCounts.set(m, (missCounts.get(m) ?? 0) + 1)
  const topMissed = [...missCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  function saveReflection() {
    const t = reflection.trim()
    if (!t) return
    addEntry(today, `n ${t} #review`)
    setReflection('')
    setOpen(false)
    // The reflection lands in today's log, which is a different view — without
    // this the form just empties and nothing tells you it saved (and a screen
    // reader gets no announcement at all).
    notify.success('Reflection saved', "Filed in today's log as a #review note.")
  }

  return (
    <Card band
      title={<span className="inline-flex items-center gap-2"><Icon as={ClipboardText} size="md" className="text-mauve" /> Weekly review</span>}
      subtitle={`Last 7 days, ${score}% covered`}
      right={<Button variant="secondary" onClick={() => setOpen((o) => !o)} className="press-3d rounded-none">{open ? 'Close' : 'Start review'}</Button>}
    >
      {!open ? (
        <p className="text-body text-fg-2">A 1-minute Sunday ritual: clear overdue tasks, see what slipped, and write one reflection.</p>
      ) : (
        <div className="space-y-4">
          {/* Step 1 · migrate */}
          <div>
            <p className="mb-1 text-label font-medium tracking-wide text-fg-2 uppercase">1. Clear the backlog</p>
            {overdue === 0
              ? <p className="text-body text-green">Nothing overdue, clean slate. 🎉</p>
              : <p className="text-body text-fg-1">{overdue} overdue task{overdue === 1 ? '' : 's'} waiting. <button onClick={() => navigate('plan')} className="text-mauve hover:underline">Migrate them →</button></p>}
          </div>

          {/* Step 2 · review */}
          <div className="border-t border-line pt-3">
            <p className="mb-2 text-label font-medium tracking-wide text-fg-2 uppercase">2. How the week went</p>
            <div className="mb-2 flex gap-1.5">
              {week.map((d) => (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${prettyDay(d.date)}: ${Math.round(d.score * 100)}%`}>
                  <div className="h-6 w-full rounded" style={{ background: d.score >= 0.99 ? cat('green') : d.score >= 0.5 ? cat('yellow') : d.score > 0 ? cat('peach') : cat('surface1') }} />
                  <span className="text-micro text-fg-2">{d.date.slice(8)}</span>
                </div>
              ))}
            </div>
            {topMissed.length > 0
              ? <p className="text-label text-fg-2"><span className="text-peach">Most missed:</span> {topMissed.map(([n, c]) => `${n} (${c}×)`).join(', ')}</p>
              : <p className="text-label text-green">No habits missed this week.</p>}
          </div>

          {/* Step 3 · reflect */}
          <div className="border-t border-line pt-3">
            <p className="mb-2 text-label font-medium tracking-wide text-fg-2 uppercase">3. Reflect</p>
            <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="What went well? What will you change next week?" rows={3} />
            <div className="mt-2 flex justify-end">
              <Button variant="secondary" onClick={saveReflection} className="press-3d">Save reflection</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
