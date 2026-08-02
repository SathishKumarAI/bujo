import { Barbell, BookOpen, Brain, CalendarBlank, Check, GraduationCap, Heartbeat, ListChecks, ShieldWarning, Target, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Pill, StatTile } from '../components/ui'
import { Button } from '../components/ui/button'
import { Page } from '../components/shell/Page'
import { cat } from '../lib/colors'
import { dayDiff, todayISO, WEEKDAYS } from '../lib/date'
import {
  ACADEMY_LEVELS, WEEKLY_TEMPLATE, SESSION_TEMPLATE, ACADEMY_DRILLS, MINDSET,
  TWELVE_WEEK, ACADEMY_TOTAL_WEEKS, KNEE_REHAB, type RehabEquip, TECHNIQUES,
} from '../lib/pickleballAcademy'

/**
 * Pickleball Coaching Academy — a beginner→pro curriculum, practice scheduler,
 * drill library, and mental-game track. Not tracking: improving the game + mind.
 */
export function Coaching() {
  const { data, setSettings } = useJournal()
  const s = data.settings
  const today = todayISO()
  // Ignore a future start date (e.g. from an imported journal) — treat as not started.
  const start = s.coachingStart && dayDiff(s.coachingStart, today) >= 0 ? s.coachingStart : undefined
  const week = start ? Math.min(ACADEMY_TOTAL_WEEKS, Math.max(1, Math.floor(dayDiff(start, today) / 7) + 1)) : 0
  const done = s.coachingWeeksDone ?? []
  const todayDow = new Date(today + 'T00:00:00').getDay()
  const todaySlot = WEEKLY_TEMPLATE[(todayDow + 6) % 7] // Mon-first index

  function toggleWeek(w: number) {
    setSettings({ coachingWeeksDone: done.includes(w) ? done.filter((x) => x !== w) : [...done, w] })
  }

  const drillSkills = [...new Set(ACADEMY_DRILLS.map((d) => d.skill))]
  const [openSkill, setOpenSkill] = useState<string | null>(drillSkills[0])
  const [openWeek, setOpenWeek] = useState<number | null>(start ? week : 1)
  const [openTech, setOpenTech] = useState<string | null>(null)
  const [equip, setEquip] = useState<RehabEquip | 'all'>('all')
  const rehab = KNEE_REHAB.filter((e) => equip === 'all' || e.equip === equip)
  const EQUIP_LABEL: Record<RehabEquip | 'all', string> = { all: 'All', none: 'No equipment', band: 'Band', weights: 'Weights' }

  return (
    <Page>
      {/* Program hero */}
      <Card title={<span className="inline-flex items-center gap-2"><Icon as={GraduationCap} size="md" className="text-mauve" /> 12-week program · beginner → 4.0</span>}
        subtitle="A structured path to a complete game" help="A research-backed 12-week curriculum. Start it to track your week; each week has a focus + skills. ~3–4 sessions/week, ~80% drilling / 20% play.">
        {!start ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-dashed border-line-strong p-4">
            <p className="text-body text-fg-2">Commit to 12 weeks: fundamentals → dinks → third-shot drop → resets → hands → strategy → match play. Drill more than you play.</p>
            <Button variant="secondary" onClick={() => setSettings({ coachingStart: today })}>Start the program</Button>
          </div>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-3 gap-2">
              <StatTile compact label="This week" value={`${week}/12`} color="mauve" icon={<Icon as={CalendarBlank} size="sm" />} />
              <StatTile compact label="Weeks done" value={done.length} color="green" icon={<Icon as={Check} size="sm" />} />
              <StatTile compact label="Progress" value={`${Math.round((done.length / ACADEMY_TOTAL_WEEKS) * 100)}%`} color="teal" icon={<Icon as={Trophy} size="sm" />} />
            </div>
            <div className="h-2.5 overflow-hidden rounded-pill bg-ink-2"><div className="h-full rounded-pill transition-[width]" style={{ width: `${(done.length / ACADEMY_TOTAL_WEEKS) * 100}%`, background: cat('green') }} /></div>
            <Button variant="ghost" onClick={() => setSettings({ coachingStart: undefined, coachingWeeksDone: [] })} className="mt-2 h-auto p-0 text-label text-fg-2 hover:text-red hover:no-underline">Reset program</Button>
          </>
        )}
      </Card>

      {/* Today's session */}
      <Card title={<span className="inline-flex items-center gap-2"><Icon as={Target} size="md" className="text-teal" /> Today: {todaySlot.focus}</span>} subtitle={`${WEEKDAYS[todayDow]}, your scheduled focus`} help="A repeatable weekly split. Today's focus + a 45–60 min session template. Adapt freely; keep at least one rest day.">
        <p className="text-body text-fg-1">{todaySlot.detail}</p>
        <details className="mt-3 rounded-card border border-line bg-ink-0 p-3">
          <summary className="cursor-pointer text-body font-medium text-fg-1">A 45–60 min session</summary>
          <ul className="mt-2 space-y-1">
            {SESSION_TEMPLATE.map((b) => (
              <li key={b.mins} className="flex gap-2 text-label"><span className="w-12 shrink-0 tabular-nums text-fg-2">{b.mins}</span><span className="text-fg-2">{b.activity}</span></li>
            ))}
          </ul>
        </details>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {WEEKLY_TEMPLATE.map((d, i) => (
            <div key={d.day} className={`rounded-card p-1.5 text-center text-micro ${i === (todayDow + 6) % 7 ? 'bg-teal/20 text-teal' : 'bg-ink-0 text-fg-2'}`} title={d.focus}>
              <div className="font-medium">{d.day}</div>
              <div className="mt-0.5 leading-tight">{d.focus.split(' ')[0]}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* 12-week roadmap — tap a week to study it, check to mark done */}
      <Card title="The 12-week roadmap" subtitle="Tap a week to open it, check to mark it done" collapsible defaultCollapsed help="Each week builds on the last. The third-shot drop (wk 6–7) is the gate to 3.5; resets (wk 8) gate 4.0. Open a week for what to do, the drills, and the goal.">
        <ol className="space-y-1.5">
          {TWELVE_WEEK.map((w) => {
            const isDone = done.includes(w.week)
            const isNow = start && w.week === week
            const isOpen = openWeek === w.week
            return (
              <li key={w.week} className={`rounded-card border transition-colors ${isNow ? 'border-mauve bg-mauve/5' : 'border-line bg-ink-0'}`}>
                <div className="flex items-start gap-2.5 p-2.5">
                  <button onClick={() => toggleWeek(w.week)} aria-label={isDone ? `Mark week ${w.week} not done` : `Mark week ${w.week} done`}
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-pill text-caption font-medium"
                    style={{ background: isDone ? cat('green') : isNow ? cat('mauve') : cat('surface1'), color: cat('crust') }}>
                    {isDone ? <Icon as={Check} size="sm" /> : w.week}
                  </button>
                  <button onClick={() => setOpenWeek(isOpen ? null : w.week)} className="min-w-0 flex-1 text-left">
                    <span className="text-body font-medium text-fg-1">Week {w.week}: {w.focus}{isNow ? ' · now' : ''}</span>
                    <span className="block truncate text-label text-fg-2">{w.skills}</span>
                  </button>
                  <button onClick={() => setOpenWeek(isOpen ? null : w.week)} aria-expanded={isOpen} aria-label={`${isOpen ? 'Collapse' : 'Expand'} week ${w.week}`} className="shrink-0 text-fg-2">{isOpen ? '▴' : '▾'}</button>
                </div>
                {isOpen && (
                  <div className="space-y-2 border-t border-line px-3 py-2.5 text-body">
                    <p className="text-fg-1">{w.doThis}</p>
                    <div>
                      <p className="mb-1 text-label font-medium text-fg-2">Drills</p>
                      <ul className="space-y-0.5">
                        {w.drills.map((d) => <li key={d} className="flex gap-1.5 text-label text-fg-2"><Icon as={Barbell} size="sm" className="mt-0.5 shrink-0 text-green" /> {d}</li>)}
                      </ul>
                    </div>
                    <p className="inline-flex items-center gap-1.5 rounded-control bg-secondary/50 p-2 text-label" style={{ color: cat('green') }}><Icon as={Target} size="sm" /> Goal: {w.goal}</p>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </Card>

      {/* Skill ladder */}
      <Card title={<span className="inline-flex items-center gap-2"><Icon as={ListChecks} size="md" className="text-sky" /> Skill ladder · 2.0 → 4.5+</span>} subtitle="What to master at each level, in order" collapsible defaultCollapsed help="The skills that define each DUPR level. Master them in order — the soft game before the fast game.">
        <div className="space-y-3">
          {ACADEMY_LEVELS.map((lvl) => (
            <div key={lvl.id} className="rounded-card border border-line bg-ink-0 p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-body font-medium" style={{ color: cat(lvl.color) }}>{lvl.name}</span>
                <Pill color={lvl.color} size="micro" className="px-2">DUPR {lvl.dupr}</Pill>
              </div>
              <ul className="grid gap-1 sm:grid-cols-2">
                {lvl.skills.map((sk) => <li key={sk} className="flex gap-1.5 text-label text-fg-2"><span style={{ color: cat(lvl.color) }}>•</span> {sk}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {/* Technique guide — the HOW for every shot */}
      <Card title={<span className="inline-flex items-center gap-2"><Icon as={BookOpen} size="md" className="text-mauve" /> How to play every shot</span>} subtitle="Tap a shot for step-by-step how-to, cues & common mistakes" collapsible defaultCollapsed help="The full how-to for every core shot — so this is the only place you need. Each opens to: what it is, how to do it step-by-step, key cues to remember, and the common mistakes to avoid.">
        {[...new Set(TECHNIQUES.map((t) => t.group))].map((group) => (
          <div key={group} className="mb-2">
            <p className="mb-1 text-caption font-medium tracking-wider text-fg-2 uppercase">{group}</p>
            <ul className="space-y-1.5">
              {TECHNIQUES.filter((t) => t.group === group).map((t) => {
                const open = openTech === t.name
                return (
                  <li key={t.name} className="rounded-card border border-line bg-ink-0">
                    <button onClick={() => setOpenTech(open ? null : t.name)} className="flex w-full items-center justify-between gap-2 p-2.5 text-left">
                      <span className="min-w-0">
                        <span className="text-body font-medium text-fg-1">{t.name}</span>
                        <span className="block truncate text-label text-fg-2">{t.what}</span>
                      </span>
                      <span className="shrink-0 text-fg-2">{open ? '▴' : '▾'}</span>
                    </button>
                    {open && (
                      <div className="space-y-2.5 border-t border-line px-3 py-2.5">
                        <div>
                          <p className="mb-1 text-label font-medium text-fg-1">How to do it</p>
                          <ol className="space-y-1">
                            {t.how.map((step, i) => <li key={i} className="flex gap-2 text-label text-fg-2"><span className="shrink-0 font-medium text-mauve">{i + 1}.</span> {step}</li>)}
                          </ol>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="mb-1 text-label font-medium" style={{ color: cat('green') }}>✓ Key cues</p>
                            <ul className="space-y-0.5">{t.cues.map((c) => <li key={c} className="text-label text-fg-2">{c}</li>)}</ul>
                          </div>
                          <div>
                            <p className="mb-1 text-label font-medium" style={{ color: cat('red') }}>✗ Common mistakes</p>
                            <ul className="space-y-0.5">{t.mistakes.map((m) => <li key={m} className="text-label text-fg-2">{m}</li>)}</ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </Card>

      {/* Drill library */}
      <Card title={<span className="inline-flex items-center gap-2"><Icon as={Barbell} size="md" className="text-green" /> Drill library</span>} subtitle="By skill — tap a group" collapsible defaultCollapsed help="Concrete drills grouped by skill. Pick 1–2 per session; quality reps beat hours of casual play.">
        <div className="space-y-2">
          {drillSkills.map((skill) => {
            const list = ACADEMY_DRILLS.filter((d) => d.skill === skill)
            const open = openSkill === skill
            return (
              <div key={skill} className="rounded-card border border-line bg-ink-0">
                <button onClick={() => setOpenSkill(open ? null : skill)} className="flex w-full items-center justify-between p-2.5 text-left text-body font-medium text-fg-1">
                  {skill} <span className="text-label text-fg-2">{list.length}{open ? ' ▴' : ' ▾'}</span>
                </button>
                {open && (
                  <ul className="space-y-1 px-3 pb-3">
                    {list.map((d) => <li key={d.name} className="text-label"><span className="text-fg-1">{d.name}</span> <span className="text-fg-2">· {d.how}</span></li>)}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Knee rehab / prehab (ACL & MCL) */}
      <Card title={<span className="inline-flex items-center gap-2"><Icon as={Heartbeat} size="md" className="text-red" /> Knee rehab & prehab · ACL / MCL</span>} subtitle="Prevent + recover — with or without equipment" collapsible defaultCollapsed help="Prehab builds a court-proof knee; rehab supports recovery in phases. Filter by what gear you have. General education, not medical advice — after an injury, follow your physio.">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(['all', 'none', 'band', 'weights'] as const).map((e) => (
            <button key={e} onClick={() => setEquip(e)} className="rounded-pill border px-2.5 py-1 text-label transition-colors"
              style={{ borderColor: equip === e ? cat('mauve') : cat('surface1'), background: equip === e ? cat('mauve') + '22' : 'transparent', color: equip === e ? cat('text') : cat('subtext0') }}>
              {EQUIP_LABEL[e]}
            </button>
          ))}
        </div>
        {(['prehab', 'rehab'] as const).map((phase) => {
          const list = rehab.filter((e) => e.phase === phase)
          if (!list.length) return null
          return (
            <div key={phase} className="mb-3">
              <p className="mb-1.5 text-body font-medium text-fg-1">{phase === 'prehab' ? 'Prehab — prevention' : '🩹 Rehab — recovery (clear with a physio)'}</p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {list.map((e) => (
                  <li key={e.name} className="rounded-card border border-line bg-ink-0 p-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-body font-medium text-fg-1">{e.name}</span>
                      <Pill color="sky" size="micro">{e.target}</Pill>
                      {e.equip !== 'none' && <span className="rounded-pill bg-ink-2 px-1.5 py-0.5 text-micro text-fg-2">{e.equip}</span>}
                    </div>
                    <p className="mt-0.5 text-label text-fg-2">{e.how}</p>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
        <p className="inline-flex items-start gap-1.5 rounded-control bg-red/10 p-2 text-label text-fg-2"><Icon as={ShieldWarning} size="sm" className="mt-0.5 shrink-0 text-red" /> Educational only — not medical advice. Stop on sharp pain; after an injury follow a qualified physio's plan.</p>
      </Card>

      {/* Mental game */}
      <Card title={<span className="inline-flex items-center gap-2"><Icon as={Brain} size="md" className="text-peach" /> Mental game</span>} subtitle="The mindset that wins close games" collapsible defaultCollapsed help="Pickleball is won between the ears at every level. Pick one principle to focus on this week.">
        <ul className="grid gap-2 sm:grid-cols-2">
          {MINDSET.map((m) => (
            <li key={m.title} className="rounded-card border border-line bg-ink-0 p-2.5">
              <p className="text-body font-medium text-fg-1">{m.title}</p>
              <p className="text-label text-fg-2">{m.why}</p>
            </li>
          ))}
        </ul>
      </Card>
    </Page>
  )
}
