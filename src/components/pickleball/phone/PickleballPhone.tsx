import { useState } from 'react'
import { CalendarDot, Medal, Target, Trophy, Timer } from '@/components/icons'
import { useJournal } from '../../../store'
import { Cell, Cells } from '../../ui/cells'
import { Sheet } from '../../ui/sheet'
import { PracticeTick } from '../../coaching/PracticeTick'
import { cat, onRaised } from '../../../lib/colors'
import { StatTiles } from '../../ui/statTiles'
import { fromISODay, prettyDay, todayISO } from '../../../lib/date'
import { pickleTotals, upcomingEvents } from '../../../lib/pickleball'
import { ACADEMY_DRILLS } from '../../../lib/pickleballAcademy'
import { VideoLink } from '../../VideoLink'
import { drillQuery } from '../../../lib/video'
import type { PickleballSession } from '../../../lib/types'
import { CompetitionPhone } from './CompetitionPhone'
import { QuickLog } from '../QuickLog'
import { SessionSheet } from './SessionSheet'
import type { SessionDraft } from '../sessionDraft'

/**
 * PICKLEBALL ON A PHONE — the whole page, rendered instead of the desktop's
 * three-zone layout when `useDevice()` says mobile (COD-454).
 *
 * OWNS: the phone page's order and its read-back: the week in three numbers,
 * the log, today's drill, recent sessions as tappable rows, and competition
 * behind one row.
 * DOES NOT OWN: the log's draft or save (the view's), any field (the one
 * `SessionFields`), or analytics — a phone logs and reads back what it logged;
 * charts, trends and matchups are the desktop's (`CLAUDE.md`).
 *
 * No `PageLayout`, no card frame and no entrance animation: asked for as
 * "drop out the card kind of animation in the background … keep it clean and
 * neat for the mobile version". The shell frame is dropped for every phone
 * page in `App.tsx`'s `ViewFrame`.
 */
export function PickleballPhone({ f, set, onLog, sessions, recentPartners, allPartners, recentVenues, allVenues }: {
  f: SessionDraft
  set: (p: Partial<SessionDraft>) => void
  onLog: () => void
  /** Newest first. */
  sessions: PickleballSession[]
  recentPartners: string[]
  allPartners: string[]
  recentVenues: string[]
  allVenues: string[]
}) {
  const { data } = useJournal()
  const today = todayISO()
  const week = pickleTotals(data, 7, today)
  const goal = data.settings.pickleballGoalGames ?? 0
  const soon = upcomingEvents(data, today)[0]
  const drill = ACADEMY_DRILLS[(fromISODay(today).getDate() + fromISODay(today).getMonth() * 3) % ACADEMY_DRILLS.length]
  const [editing, setEditing] = useState<PickleballSession | null>(null)
  const [comp, setComp] = useState(false)
  const [all, setAll] = useState(false)
  const shown = all ? sessions : sessions.slice(0, 5)

  return (
    <div className="flex flex-col gap-6 pb-4">
      {/* The tab above already says Pickleball; the title is for screen
          readers, and the log is the first thing a thumb reaches. */}
      <h1 className="sr-only">Pickleball</h1>

      <QuickLog f={f} set={set} onLog={onLog} recentPartners={recentPartners} allPartners={allPartners} recentVenues={recentVenues} allVenues={allVenues} />

      {/* THE WEEK, three numbers and no chart. */}
      <StatTiles label="This week" tiles={[
        { k: 'Games', v: goal > 0 ? `${week.games}/${goal}` : String(week.games), icon: Target, tone: 'sky' },
        { k: 'Won', v: week.games ? `${week.winPct}%` : '–', icon: Trophy, tone: 'green' },
        { k: 'Sessions', v: String(week.sessions), icon: Timer, tone: 'mauve' },
      ]} />

      <Cells title="Today">
        <Cell icon={Target} tone="mauve" title={drill.name} subtitle={`Drill · ${drill.skill}`} trail={<span className="flex items-center gap-1">
          {/* Icon-only at 44px: the cell's title already names the drill. */}
          <VideoLink name={drill.name} query={drillQuery(drill.name)} label="" size="md" className="min-h-11 min-w-11 justify-center" />
          <PracticeTick kind="drill" name={drill.name} variant="circle" />
        </span>} />
        {soon && <Cell icon={CalendarDot} tone="peach" title={soon.name} subtitle={soon.daysUntil === 0 ? 'Today' : soon.daysUntil === 1 ? 'Tomorrow' : `In ${soon.daysUntil} days`} onPress={() => setComp(true)} />}
      </Cells>

      {sessions.length > 0 && (
        <Cells title="Recent" aside={`${sessions.length} logged`}>
          {shown.map((p) => {
            const result = p.gamesWon > p.gamesLost ? 'green' : p.gamesWon < p.gamesLost ? 'red' : 'overlay0'
            const meta = [p.format === 'doubles' ? 'Doubles' : 'Singles', p.durationMin ? `${p.durationMin} min` : '', p.format === 'doubles' && p.partner ? `with ${p.partner}` : p.format === 'singles' && p.opponent ? `vs ${p.opponent}` : '', p.location ?? ''].filter(Boolean).join(' · ')
            return (
              <Cell
                key={p.id}
                lead={(
                  <span className="score-badge" style={{ background: cat(result) + '22', color: onRaised(result) }}>
                    {p.gamesWon}–{p.gamesLost}
                  </span>
                )}
                title={prettyDay(p.date)}
                subtitle={meta}
                label="Edit session"
                onPress={() => setEditing(p)}
              />
            )
          })}
          {sessions.length > 5 && <Cell title={all ? 'Show fewer' : `Show all ${sessions.length}`} onPress={() => setAll((a) => !a)} chevron={false} />}
        </Cells>
      )}

      <Cells title="Competition">
        <Cell icon={Medal} tone="yellow" title="Events & DUPR rating" subtitle="Log a tournament, league or rating" onPress={() => setComp(true)} />
      </Cells>

      {editing && <SessionSheet session={editing} onClose={() => setEditing(null)} partnerNames={allPartners} venueNames={allVenues} />}
      <Sheet open={comp} onOpenChange={setComp} title="Competition" description="Events and DUPR, apart from casual play">
        <CompetitionPhone allPartners={allPartners} />
      </Sheet>
    </div>
  )
}
