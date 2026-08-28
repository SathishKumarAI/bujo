import { Barbell, BookOpen, Brain, Check, Heartbeat, ListChecks, ShieldWarning, Target } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Pill } from '../components/ui'
import { Button } from '../components/ui/button'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { PageLayout, StatBar } from '../components/page'
import { cat, onAccent } from '../lib/colors'
import { dayDiff, todayISO, WEEKDAYS } from '../lib/date'
import {
  ACADEMY_LEVELS, WEEKLY_TEMPLATE, SESSION_TEMPLATE, ACADEMY_DRILLS, MINDSET,
  TWELVE_WEEK, ACADEMY_TOTAL_WEEKS, KNEE_REHAB, type RehabEquip, TECHNIQUES,
} from '../lib/pickleballAcademy'

/**
 * COACHING · the 12-week pickleball program, and the manual that teaches it.
 *
 * On the three-zone contract, built to match Pull-ups — the two pages are the
 * same kind of thing (a program you follow, plus the reference that explains
 * it) and were shaped differently for no reason anyone had written down.
 *
 * - ORIENT · today's focus, where you are in the twelve weeks.
 * - ACT    · today's session, then the roadmap. Both are acts; the session is
 *            first because it is what you do in the next hour, and the roadmap
 *            is what you do over the next quarter.
 * - REVIEW · the manual, collapsed.
 *
 * **What this replaced.** Eight `Card`s in a `CardGrid`, six of them
 * `collapsible` and all six open by default, on `Page` rather than
 * `PageLayout`. Measured: **32 disclosure points, 25 shut, 5.80 screens** at
 * 1440 — six card folds, eleven `Expand week N` rows inside the roadmap and
 * fourteen technique folds inside another card. Drawers inside drawers: getting
 * to "Third-shot drop" cost two opens and a scroll past most of the page.
 *
 * The manual is reference and the contract says there is no zone 4, so it sits
 * at the bottom of REVIEW rather than on a page of its own — this page *is* the
 * manual. Every fold is closed so the act stays at the top; **re-run
 * `npm run a11y` with them OPEN**, because axe cannot see inside a closed fold.
 *
 * The one thing that had to survive intact is `Today: <focus>` — the week's
 * shape plus one specific instruction, which `docs/pages/README.md` calls the
 * best pattern in the product. It is now the first fact in zone 1 as well as
 * the first card in zone 2.
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

  // Open on the first week you have not finished, not on week 1 and not merely
  // on the calendar week — the same fix `ProgramTracker` got in COD-20. A
  // roadmap that opens cold on week 1 for someone in week 6 is asking them to
  // find their place on a page whose whole promise is "follow this in order".
  const firstUnfinished = TWELVE_WEEK.find((w) => !done.includes(w.week))?.week ?? ACADEMY_TOTAL_WEEKS
  const [openWeek, setOpenWeek] = useState<number | null>(start ? firstUnfinished : 1)

  const pct = Math.round((done.length / ACADEMY_TOTAL_WEEKS) * 100)

  const facts = [
    { label: 'Today', value: todaySlot.focus, prose: true },
    { label: 'Week', value: start ? `${week}/12` : 'Not started' },
    { label: 'Weeks done', value: `${done.length}/12` },
    { label: 'Progress', value: `${pct}%` },
  ]

  return (
    <PageLayout
      tier={1180}
      /**
       * `stacked`, because the 62/38 split is wrong for this page in both
       * directions at once.
       *
       * Measured at 1440: the act column ran **1676px** and the review column
       * **238px** — 1438px of empty page beside a twelve-row roadmap squeezed
       * into 424px. The split assumes the act is a form capped at 380px and the
       * review is a list; here the act is a twelve-week programme that wants
       * width and the review is five collapsed reference rows that want none.
       *
       * Swapping the two zones only mirrors the hole: today's session is ~260px
       * against a roadmap-plus-manual of ~1650. There is no allocation of two
       * columns that balances one tall thing and two short ones — so it takes
       * one column, which is the variant `stacked` exists for.
       */
      stacked
      zone1={<StatBar facts={facts} />}
      zone2={
        <>
          <TodaySession slot={todaySlot} dow={todayDow} />
          <Card
            band
            title="The 12-week roadmap"
            subtitle={start ? 'Tap a week to open it, check to mark it done' : 'Beginner → 4.0, in order'}
            help="Each week builds on the last. The third-shot drop (wk 6–7) is the gate to 3.5; resets (wk 8) gate 4.0. Open a week for what to do, the drills, and the goal."
          >
            {!start ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-dashed border-line-strong p-4">
                <p className="text-body text-fg-2">Commit to 12 weeks: fundamentals → dinks → third-shot drop → resets → hands → strategy → match play. Drill more than you play.</p>
                <Button variant="secondary" onClick={() => setSettings({ coachingStart: today })}>Start the program</Button>
              </div>
            ) : (
              <div className="mb-3">
                <div className="h-2.5 overflow-hidden rounded-none bg-ink-2">
                  <div className="h-full rounded-none transition-[width]" style={{ width: `${pct}%`, background: cat('green') }} />
                </div>
              </div>
            )}
            <ol className="space-y-1.5">
              {TWELVE_WEEK.map((w) => {
                const isDone = done.includes(w.week)
                const isNow = start && w.week === week
                const isOpen = openWeek === w.week
                return (
                  <li key={w.week} className={`rounded-none border transition-colors ${isNow ? 'border-mauve bg-mauve/5' : 'border-line bg-ink-0'}`}>
                    <div className="flex items-start gap-2.5 p-2.5">
                      <button onClick={() => toggleWeek(w.week)} aria-label={isDone ? `Mark week ${w.week} not done` : `Mark week ${w.week} done`}
                        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-none text-caption font-medium"
                        // The untaken weeks are a surface tone, not a brand fill, so
                        // crust-on-surface1 was the failing pair — those get `text`.
                        style={
                          isDone ? { background: cat('green'), color: onAccent(cat('green')) }
                            : isNow ? { background: cat('mauve'), color: onAccent(cat('mauve')) }
                              : { background: cat('surface1'), color: cat('text') }
                        }>
                        {isDone ? <Icon as={Check} size="sm" /> : w.week}
                      </button>
                      <button onClick={() => setOpenWeek(isOpen ? null : w.week)} className="min-w-0 flex-1 text-left">
                        <span className="text-body font-medium text-fg-1">Week {w.week}: {w.focus}{isNow ? ' · now' : ''}</span>
                        {/* Wraps rather than truncates — see the note on `t.what` below.
                            This line is the only place `w.skills` renders at all. */}
                        <span className="block text-label text-fg-2">{w.skills}</span>
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
                        <p className="inline-flex items-center gap-1.5 rounded-none bg-secondary/50 p-2 text-label" style={{ color: cat('green') }}><Icon as={Target} size="sm" /> Goal: {w.goal}</p>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
            {start && (
              <Button variant="ghost" onClick={() => setSettings({ coachingStart: undefined, coachingWeeksDone: [] })} className="mt-2 h-auto p-0 text-label text-fg-2 hover:text-red hover:no-underline">Reset program</Button>
            )}
          </Card>
        </>
      }
      zone3={<Manual />}
    />
  )
}

/** Zone 2 · what to do in the next hour, and where it sits in the week. */
function TodaySession({ slot, dow }: { slot: typeof WEEKLY_TEMPLATE[number]; dow: number }) {
  return (
    <Card
      band
      title={<span className="inline-flex items-center gap-2"><Icon as={Target} size="md" className="text-teal" /> Today: {slot.focus}</span>}
      subtitle={`${WEEKDAYS[dow]}, your scheduled focus`}
      help="A repeatable weekly split. Today's focus + a 45–60 min session template. Adapt freely; keep at least one rest day."
    >
      <p className="text-body text-fg-1">{slot.detail}</p>
      <details className="mt-3 rounded-none border border-line bg-ink-0 p-3">
        <summary className="cursor-pointer text-body font-medium text-fg-1">A 45–60 min session</summary>
        <ul className="mt-2 space-y-1">
          {SESSION_TEMPLATE.map((b) => (
            <li key={b.mins} className="flex gap-2 text-label"><span className="w-12 shrink-0 tabular-nums text-fg-2">{b.mins}</span><span className="text-fg-2">{b.activity}</span></li>
          ))}
        </ul>
      </details>
      {/* 4-up on a phone — see `pickleball/SignalCards.tsx`. At seven columns
          each cell held 26px and the focus words ("Dinking", "Transition")
          lost half their letters. */}
      <div className="mt-3 grid grid-cols-4 gap-1 sm:grid-cols-7">
        {WEEKLY_TEMPLATE.map((d, i) => (
          <div key={d.day} className={`rounded-none p-1.5 text-center text-micro ${i === (dow + 6) % 7 ? 'bg-teal/20 text-teal' : 'bg-ink-0 text-fg-2'}`} title={d.focus}>
            <div className="font-medium">{d.day}</div>
            <div className="mt-0.5 leading-tight">{d.focus.split(' ')[0]}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/**
 * Zone 3 · the manual. Five folds, all closed, same shape as `Pullups`.
 *
 * These were five open `Card collapsible`s in a grid. Open is the wrong default
 * for reference on a page whose act is a twelve-week program: the rule this
 * directory states is that what the app learned about you outranks what the app
 * can tell everybody, and none of this is about you.
 */
function Manual() {
  const drillSkills = [...new Set(ACADEMY_DRILLS.map((d) => d.skill))]
  const [openSkill, setOpenSkill] = useState<string | null>(drillSkills[0])
  const [openTech, setOpenTech] = useState<string | null>(null)
  const [equip, setEquip] = useState<RehabEquip | 'all'>('all')
  const rehab = KNEE_REHAB.filter((e) => equip === 'all' || e.equip === equip)
  const EQUIP_LABEL: Record<RehabEquip | 'all', string> = { all: 'All', none: 'No equipment', band: 'Band', weights: 'Weights' }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-label text-fg-2">Manual</h2>

      <CollapsibleSection
        variant="quiet" defaultOpen={false} stickyKey="coaching.shots"
        icon={BookOpen} color="mauve"
        title="How to play every shot"
        subtitle={`${TECHNIQUES.length} shots · how-to, cues & common mistakes`}
      >
        {[...new Set(TECHNIQUES.map((t) => t.group))].map((group) => (
          <div key={group} className="mb-2">
            <p className="mb-1 text-caption font-medium tracking-wider text-fg-2 uppercase">{group}</p>
            <ul className="space-y-1.5">
              {TECHNIQUES.filter((t) => t.group === group).map((t) => {
                const open = openTech === t.name
                return (
                  <li key={t.name} className="rounded-none border border-line bg-ink-0">
                    <button onClick={() => setOpenTech(open ? null : t.name)} aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} ${t.name}`} className="flex w-full items-center justify-between gap-2 p-2.5 text-left">
                      <span className="min-w-0">
                        <span className="text-body font-medium text-fg-1">{t.name}</span>
                        {/*
                          Wraps rather than truncates. `t.what` is the definition of
                          the shot and this row is the ONLY place it renders — opening
                          the fold shows the how-to steps, cues and mistakes, but never
                          this sentence. Truncated, six of them lost the end of the
                          sentence; the worst showed 436px of the 662px it needed, so a
                          third of the definition was unreachable anywhere in the app.

                          A name can survive an ellipsis because you can still tell
                          which one it is. A definition cannot: the part that explains
                          it is the part that gets cut.
                        */}
                        <span className="block text-label text-fg-2">{t.what}</span>
                      </span>
                      <span aria-hidden className="shrink-0 text-fg-2">{open ? '▴' : '▾'}</span>
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
      </CollapsibleSection>

      <CollapsibleSection
        variant="quiet" defaultOpen={false} stickyKey="coaching.drills"
        icon={Barbell} color="green"
        title="Drill library"
        subtitle={`${ACADEMY_DRILLS.length} drills by skill · pick 1–2 a session`}
      >
        <div className="space-y-2">
          {drillSkills.map((skill) => {
            const list = ACADEMY_DRILLS.filter((d) => d.skill === skill)
            const open = openSkill === skill
            return (
              <div key={skill} className="rounded-none border border-line bg-ink-0">
                {/* `aria-expanded` was missing here and nowhere else on the page,
                    so these were the only disclosures a screen reader could not
                    tell the state of — and the reason the page census counted 32
                    folds rather than 38. */}
                <button onClick={() => setOpenSkill(open ? null : skill)} aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} ${skill} drills`} className="flex w-full items-center justify-between p-2.5 text-left text-body font-medium text-fg-1">
                  {skill} <span className="text-label text-fg-2">{list.length}<span aria-hidden>{open ? ' ▴' : ' ▾'}</span></span>
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
      </CollapsibleSection>

      <CollapsibleSection
        variant="quiet" defaultOpen={false} stickyKey="coaching.ladder"
        icon={ListChecks} color="sky"
        title="Skill ladder"
        subtitle="2.0 → 4.5+ · what to master at each level, in order"
      >
        <div className="space-y-3">
          {ACADEMY_LEVELS.map((lvl) => (
            <div key={lvl.id} className="rounded-none border border-line bg-ink-0 p-3">
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
      </CollapsibleSection>

      <CollapsibleSection
        variant="quiet" defaultOpen={false} stickyKey="coaching.rehab"
        icon={Heartbeat} color="red"
        title="Knee rehab & prehab"
        subtitle="ACL / MCL · prevent and recover, with or without equipment"
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(['all', 'none', 'band', 'weights'] as const).map((e) => (
            <button key={e} onClick={() => setEquip(e)} aria-pressed={equip === e} className="rounded-none border px-2.5 py-1 text-label transition-colors"
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
                  <li key={e.name} className="rounded-none border border-line bg-ink-0 p-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-body font-medium text-fg-1">{e.name}</span>
                      <Pill color="sky" size="micro">{e.target}</Pill>
                      {e.equip !== 'none' && <span className="rounded-none bg-ink-2 px-1.5 py-0.5 text-micro text-fg-2">{e.equip}</span>}
                    </div>
                    <p className="mt-0.5 text-label text-fg-2">{e.how}</p>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
        <p className="inline-flex items-start gap-1.5 rounded-none bg-red/10 p-2 text-label text-fg-2"><Icon as={ShieldWarning} size="sm" className="mt-0.5 shrink-0 text-red" /> Educational only — not medical advice. Stop on sharp pain; after an injury follow a qualified physio's plan.</p>
      </CollapsibleSection>

      <CollapsibleSection
        variant="quiet" defaultOpen={false} stickyKey="coaching.mental"
        icon={Brain} color="peach"
        title="Mental game"
        subtitle="The mindset that wins close games"
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {MINDSET.map((m) => (
            <li key={m.title} className="rounded-none border border-line bg-ink-0 p-2.5">
              <p className="text-body font-medium text-fg-1">{m.title}</p>
              <p className="text-label text-fg-2">{m.why}</p>
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </section>
  )
}
