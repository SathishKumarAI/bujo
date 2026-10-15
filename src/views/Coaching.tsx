import { Barbell, BookOpen, Brain, Check, Heartbeat, ListChecks, Medal, ShieldPlus, ShieldWarning, Target } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Input, Pill } from '../components/ui'
import { CommitField } from '../components/CommitField'
import { useConfirm } from '../components/ConfirmDialog'
import { Button } from '../components/ui/button'
import { PageLayout, SectionRail, StatBar } from '../components/page'
import { useStickyState } from '../lib/useStickyState'
import { cat, onAccent, onRaised } from '../lib/colors'
import { dayDiff, prettyDay, todayISO, WEEKDAYS } from '../lib/date'
import { coachingResetPatch, coachingWeekRange, rowsInCoachingWeek, weekPlay } from '../lib/coachingWeek'
import type { PickleballSession } from '../lib/types'
import { PICKLE_FORMATS } from '../lib/pickleballPlan'
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
 *
 * **What the page could not record.** For its whole life this view held twelve
 * week toggles and **no text field at all** — a probe over every view at
 * `?demo=1` scored it 0 ticks and 0 text fields, the ticks invisible because
 * they carried no `aria-pressed`. So a week prescribing five named drills could
 * only be marked done, and `data.pickleball` separately held the sessions you
 * played in those same seven days with nothing joining them. `WeekRecord`
 * below closes both halves; `lib/coachingWeek.ts` owns the date join. COD-275.
 */
export function Coaching() {
  const { data, setSettings } = useJournal()
  const s = data.settings
  const today = todayISO()
  // Ignore a future start date (e.g. from an imported journal) — treat as not started.
  const start = s.coachingStart && dayDiff(s.coachingStart, today) >= 0 ? s.coachingStart : undefined
  const week = start ? Math.min(ACADEMY_TOTAL_WEEKS, Math.max(1, Math.floor(dayDiff(start, today) / 7) + 1)) : 0
  const done = s.coachingWeeksDone ?? []
  const weekNotes = s.coachingWeekNotes ?? {}
  const sessions = data.pickleball ?? []
  /** `''` deletes the key — see `Settings.coachingWeekNotes`. */
  function setWeekNote(w: number, text: string) {
    const next = { ...weekNotes }
    if (text.trim()) next[String(w)] = text.trim()
    else delete next[String(w)]
    setSettings({ coachingWeekNotes: next })
  }
  const todayDow = new Date(today + 'T00:00:00').getDay()
  const todaySlot = WEEKLY_TEMPLATE[(todayDow + 6) % 7] // Mon-first index

  const confirm = useConfirm()
  /**
   * Reset named what it destroys, and destroying ALL of it.
   *
   * It was a bare ghost button that wiped the start date and twelve week ticks
   * on the first click with no confirmation — the same shape as the Home
   * Workout history's `×` that `docs/USER-CONTROL.md` was written for. And it
   * cleared two of the three things the program stores; `coachingResetPatch`
   * owns the third, with the reason.
   */
  async function resetProgram() {
    const notes = Object.keys(weekNotes).length
    const ok = await confirm({
      title: 'Reset the 12-week program?',
      description: (
        <>
          Removes the start date ({prettyDay(start!)}), {done.length} week tick{done.length === 1 ? '' : 's'}
          {notes > 0 && ` and ${notes} week note${notes === 1 ? '' : 's'}`}. The{' '}
          {sessions.length} pickleball session{sessions.length === 1 ? '' : 's'} you logged stay — they belong to the
          days they happened on, not to the program. This cannot be undone.
        </>
      ),
      confirmLabel: 'Reset the program',
      destructive: true,
    })
    if (ok) setSettings(coachingResetPatch())
  }

  function toggleWeek(w: number) {
    setSettings({ coachingWeeksDone: done.includes(w) ? done.filter((x) => x !== w) : [...done, w] })
  }

  // Open on the first week you have not finished, not on week 1 and not merely
  // on the calendar week — the same fix `ProgramTracker` got in COD-20. A
  // roadmap that opens cold on week 1 for someone in week 6 is asking them to
  // find their place on a page whose whole promise is "follow this in order".
  const firstUnfinished = TWELVE_WEEK.find((w) => !done.includes(w.week))?.week ?? ACADEMY_TOTAL_WEEKS
  const [openWeek, setOpenWeek] = useState<number | null>(start ? firstUnfinished : 1)

  /* Sticky so the section survives a reload — the seven folds this page
     started as each did, and losing that would be a regression dressed as a
     redesign. Same key as the manual's old chapter state, so a reader who
     left it on `drills` comes back to `drills`; `playsafe` is no longer in
     the allowed list and falls back to the default, which is what should
     happen to a row that no longer exists. */
  const [section, setSection] = useStickyState<string>('coaching.chapter', 'program', CHAPTERS.map((c) => c.id))

  const pct = Math.round((done.length / ACADEMY_TOTAL_WEEKS) * 100)

  /*
    `Today` is NOT a fact here any more. It was the first StatBar fact, the
    title of the card immediately below it, AND the lit cell in the weekday
    strip inside that card — the same sentence three times in the first 232px
    of the page. Zone 1 answers "where am I in the program"; the focus and its
    instruction are one thing, said once, on the card that carries the detail.
  */
  const facts = [
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
          {/*
            THE BAR IS THE PAGE, and it sits above everything it switches.

            There is no zone 3 any more. The review zone held the manual and
            its own bar, under 1640px of act — so the seven chapters were a
            table of contents you reached by scrolling past the thing it was
            an alternative to. Reported as "why do I need to scroll down".

            Not sticky, deliberately: `SectionRail`'s own note explains that a
            bar above its panel paints over the panel when it sticks, and that
            hiding it on scroll is COD-202, where the phone's only navigation
            slid out of frame.
          */}
          <SectionRail
            label="Coaching sections"
            groups={CHAPTERS.map((c) => ({ id: c.id, label: c.label, count: 'count' in c ? c.count : undefined }))}
            value={section}
            onChange={(id) => setSection(id ?? 'program')}
            railAt="never"
          />
          {section !== 'program' ? <Manual chapter={section} /> : <>
          <TodaySession slot={todaySlot} dow={todayDow} />
          <Card
            band
            title="The 12-week roadmap"
            subtitle={start ? 'Tap a week to open it, check to mark it done' : 'Beginner → 4.0, in order'}
            help="Each week builds on the last. The third-shot drop (wk 6–7) is the gate to 3.5; resets (wk 8) gate 4.0. Open a week for what to do, the drills, and the goal."
          >
            {!start ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-dashed border-line-strong p-4">
                <p className="text-body text-fg-2">Commit to 12 weeks: fundamentals → dinks → third-shot drop → resets → hands → strategy → match play. Drill more than you play.</p>
                <Button variant="secondary" onClick={() => setSettings({ coachingStart: today })}>Start the program</Button>
              </div>
            ) : (
              <div className="mb-3">
                <div className="h-2.5 overflow-hidden rounded-pill bg-ink-2">
                  <div className="h-full rounded-pill transition-[width]" style={{ width: `${pct}%`, background: cat('green') }} />
                </div>
              </div>
            )}
            <ol className="space-y-1.5">
              {TWELVE_WEEK.map((w) => {
                const isDone = done.includes(w.week)
                const isNow = start && w.week === week
                const isOpen = openWeek === w.week
                // The sessions that fall inside this week, joined by DATE —
                // `PickleballSession` has no week field and should not grow
                // one. See `lib/coachingWeek.ts`.
                const played = start ? rowsInCoachingWeek(sessions, start, w.week) : []
                const note = weekNotes[String(w.week)] ?? ''
                return (
                  <li key={w.week} className={`rounded-control border transition-colors ${isNow ? 'border-mauve bg-mauve/5' : 'border-line bg-ink-0'}`}>
                    <div className="flex items-start gap-2.5 p-2.5">
                      {/* `aria-pressed`, which these twelve toggles never carried. A bare
                          button announces as "Mark week 6 done" whether or not week 6
                          IS done, so the state of the page's only act was unreadable to
                          a screen reader — and invisible to any sweep that finds toggles
                          by `aria-pressed`, which is how a probe over every view
                          reported this page as having zero tick controls. */}
                      <button onClick={() => toggleWeek(w.week)} aria-pressed={isDone} aria-label={isDone ? `Mark week ${w.week} not done` : `Mark week ${w.week} done`}
                        className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-control text-caption font-medium"
                        // The untaken weeks are a surface tone, not a brand fill, so
                        // crust-on-surface1 was the failing pair — those get `text`.
                        style={
                          isDone ? { background: cat('green'), color: onAccent(cat('green')) }
                            : isNow ? { background: cat('mauve'), color: onAccent(cat('mauve')) }
                              : { background: cat('surface1'), color: onRaised('text') }
                        }>
                        {isDone ? <Icon as={Check} size="sm" /> : w.week}
                      </button>
                      <button onClick={() => setOpenWeek(isOpen ? null : w.week)} className="min-w-0 flex-1 text-left">
                        <span className="text-body font-medium text-fg-1">Week {w.week}: {w.focus}{isNow ? ' · now' : ''}</span>
                        {/* Wraps rather than truncates — see the note on `t.what` below.
                            This line is the only place `w.skills` renders at all. */}
                        <span className="block text-label text-fg-2">{w.skills}</span>
                        {/* THE RECEIPT, ON THE CLOSED ROW. Without it everything
                            below only exists once the week is opened, and
                            docs/PAGE-SHAPE.md's rule is that a thing behind a closed
                            fold is a thing that does not exist — which applies with
                            more force to text you typed yourself than to a chart. */}
                        {(played.length > 0 || note) && (
                          <span className="mt-0.5 block text-label" style={{ color: onRaised('green') }}>
                            {played.length > 0 && `${played.length} session${played.length === 1 ? '' : 's'} · ${weekPlay(played).games} games`}
                            {played.length > 0 && note && ' · '}
                            {note && 'noted'}
                          </span>
                        )}
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
                        <p className="inline-flex items-center gap-1.5 rounded-card bg-secondary/50 p-2 text-label" style={{ color: onRaised('green') }}><Icon as={Target} size="sm" /> Goal: {w.goal}</p>
                        <WeekRecord week={w.week} start={start} played={played} note={note} onNote={setWeekNote} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
            {start && (
              /*
                THE FOOT OF THE PROGRAM · the date you can fix, then the button
                that throws it all away — in that order, because the reversible
                control goes first (docs/USER-CONTROL.md rule 2) and because
                for the whole life of this page the only way to correct a start
                date was Reset, which also cost you twelve ticks.
              */
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-2.5">
                <label className="flex items-center gap-2 text-label text-fg-2">
                  Started
                  {/* A native date input, which is also the control
                      `CommitmentCard` uses for a quit date. `max` is today:
                      the component above already ignores a future start (an
                      imported journal can carry one), and a picker that cannot
                      offer the broken state is better than a guard that
                      silently corrects it. */}
                  <Input
                    type="date"
                    value={start}
                    max={today}
                    onChange={(e) => { if (e.target.value) setSettings({ coachingStart: e.target.value }) }}
                    aria-label="Program start date"
                    className="h-8 w-auto py-1 text-label"
                  />
                </label>
                <Button variant="ghost" onClick={resetProgram} className="h-auto p-0 text-label text-fg-2 hover:text-red hover:no-underline">Reset program</Button>
              </div>
            )}
          </Card>
          </>}
        </>
      }
    />
  )
}

/**
 * WHAT YOU ACTUALLY DID THIS WEEK — the half of a coaching week the tick could
 * not hold.
 *
 * The complaint this answers, in the user's words about the sibling page: *"you
 * only mention workout one, workout two. What kind of workout should I enter
 * here? How can I mention the workout that I did?"* Coaching had the same shape
 * and worse — twelve week toggles and **no text field anywhere on the view** —
 * while the week prescribes three to five named drills and one goal.
 *
 * Two halves, and only one of them is a new field:
 *
 * 1. **Play comes from the record that already exists.** `data.pickleball` holds
 *    every session you logged, with its score, partner, venue and its own notes.
 *    Asking you to retype that under a coaching week would have been a second
 *    record of the same fact — so it is joined by date and shown, not re-asked.
 *    A week with none says *that*, naming the days, rather than drawing an empty
 *    list: "nothing logged" is a gap in the record, not a week you played zero
 *    games in, and the two must not render the same (CLAUDE.md, COD-251).
 * 2. **Drills get the one new field**, `settings.coachingWeekNotes`, because no
 *    existing record holds them: a logged session is "doubles, 6–3, with Mara"
 *    and says nothing about whether the cross-court dink rally got to 50.
 */
function WeekRecord({ week, start, played, note, onNote }: {
  week: number
  /** Undefined until the program is started; there is no week to date then. */
  start: string | undefined
  played: PickleballSession[]
  note: string
  onNote: (week: number, text: string) => void
}) {
  // Before the program is started a week covers no actual days, so there is
  // nothing to join and nothing to note *about* — the card above this already
  // shows "Start the program" as the act.
  if (!start) return null
  const range = coachingWeekRange(start, week)
  const play = weekPlay(played)

  return (
    <div className="space-y-2 border-t border-line pt-2.5">
      <p className="text-label font-medium text-fg-2">
        What you did · {prettyDay(range.from)} – {prettyDay(range.to)}
      </p>

      {played.length > 0 ? (
        <>
          <p className="num text-label text-fg-1">
            {play.sessions} session{play.sessions === 1 ? '' : 's'} · {play.games} games, {play.won} won
            {play.minutes > 0 && ` · ${Math.round((play.minutes / 60) * 10) / 10}h`}
          </p>
          <ul className="space-y-0.5">
            {played.map((p) => (
              <li key={p.id} className="text-label text-fg-2">
                <span className="num text-fg-1">{prettyDay(p.date)}</span> · {p.format} {p.gamesWon}–{p.gamesLost}
                {p.partner && ` · with ${p.partner}`}
                {p.location && ` · ${p.location}`}
                {/* The session's OWN note, read here rather than re-asked. */}
                {p.notes && <span className="italic"> · “{p.notes}”</span>}
              </li>
            ))}
          </ul>
        </>
      ) : (
        /* Names the days and says where to log, because "0 sessions" reads as a
           measurement of a week you played nothing in. */
        <p className="text-label text-fg-2">
          No sessions logged for these days. They go on the <span className="text-fg-1">Pickleball</span> tab,
          and land here by date.
        </p>
      )}

      <label className="block">
        <span className="mb-1.5 block text-label text-fg-2">
          <span className="font-medium text-fg-1">Drills &amp; how it went</span> · which of the drills above you
          actually ran, and what to carry into next week
        </span>
        {/* `key` is load-bearing: `CommitField` flushes its draft on unmount, so
            a re-seeded component would write the previous week's text into this
            one. One week per key. */}
        <CommitField
          key={week}
          rows={2}
          value={note}
          onCommit={(v) => onNote(week, v)}
          placeholder="Cross-court dink rally got to 38, not 50. Backhand dink still popping up."
          label={`What you drilled in week ${week}`}
          className="w-full"
        />
      </label>
    </div>
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
      <details className="mt-3 rounded-card bg-ink-2 p-3">
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
          <div key={d.day} className={`rounded-card p-1.5 text-center text-micro ${i === (dow + 6) % 7 ? 'bg-teal/20 text-teal' : 'bg-ink-0 text-fg-2'}`} title={d.focus}>
            <div className="font-medium">{d.day}</div>
            <div className="mt-0.5 leading-tight">{d.focus.split(' ')[0]}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
/**
 * Zone 3 · the manual, as seven chapters behind a rail.
 *
 * It was seven `CollapsibleSection`s, all shipping closed — so arriving here
 * showed seven grey titles and reading anything meant opening one, scrolling,
 * and closing it again. Measured: **2,091px shut and 12.9 screens with every
 * fold open on a phone**, for a reference manual whose chapters you read one
 * at a time by definition.
 *
 * A fold is the right primitive for one aside inside a page about something
 * else. Seven peers, each a chapter, is a table of contents — so the titles
 * become the navigation and the chapter body renders plainly, with no caret
 * and nothing to open. The `stickyKey`s are gone with the folds; the rail
 * remembers the chapter instead.
 *
 * Same `SectionRail` as Insights. No "All" row: the chapters do not overlap
 * and nobody wants all seven at once — that is the page this replaces.
 */
/** Physio / trainer / doctor guidance for pickleball · injury-prevention basics. */
const TIPS = [
  { t: 'Warm up first', d: '5–10 min: brisk walk, leg swings, arm circles, a few easy dinks. Cold muscles = pulls.' },
  { t: 'Protect the ankles', d: 'Lateral ankle sprains are the #1 court injury. Court shoes (not runners), split-step, don’t backpedal · turn and run.' },
  { t: 'Mind the shoulder & elbow', d: 'Rotator-cuff and “pickleball elbow” come from over-gripping and all-arm swings. Loosen the grip, drive from the legs/core.' },
  { t: 'Achilles & calves', d: 'Sudden push-offs strain the Achilles. Calf raises 3×/week; ease in after rest days.' },
  { t: 'Hydrate & cool down', d: 'Water before you’re thirsty; finish with calf, hip-flexor and shoulder stretches. Sharp joint pain → stop and rest.' },
]

/**
 * THE PAGE'S ONE NAVIGATION · the program first, then the manual it teaches.
 *
 * It was two surfaces stacked: 1640px of act (today's session plus a
 * twelve-row roadmap) and then, below the fold on every viewport, a bar of
 * seven manual chapters. Reaching "Third-shot drop" meant scrolling past a
 * roadmap you were not reading — and the fault is the one
 * `docs/REUSABLE-PATTERNS.md` names: **a page has one navigation in it.** A
 * bar at the bottom of the page is a table of contents you have to reach the
 * end to use.
 *
 * So the program is a row. It is the default row, so landing on the page still
 * lands on the act, and nothing about the act changed — but the manual is now
 * one click from the top instead of 1640px down.
 *
 * **Play safe is gone as a row**, folded into `rehab`. Five physio tips and
 * twenty-three knee exercises are the same subject (0.36 screens of it), and
 * the row budget is the constraint a bar lives under: a facet goes inside the
 * row it is a facet of.
 *
 * The counts are on the chips on purpose, against this file's own older note
 * that a count here "would be a number about nothing". That was true of a
 * count of *chapters*; these are counts of items — 14 shots, 21 drills — and
 * they say where the bulk is before you open it. `program` carries none
 * because "12" would be a week number competing with the StatBar.
 */
const CHAPTERS = [
  { id: 'program', color: 'teal', label: 'Program', title: 'Your 12-week program', blurb: 'Today, and the twelve weeks', icon: Target },
  { id: 'shots', color: 'mauve', label: 'Shots', title: 'How to play every shot', count: TECHNIQUES.length, blurb: `${TECHNIQUES.length} shots · how-to, cues & common mistakes`, icon: BookOpen },
  { id: 'drills', color: 'green', label: 'Drills', title: 'Drill library', count: ACADEMY_DRILLS.length, blurb: `${ACADEMY_DRILLS.length} drills by skill · pick 1–2 a session`, icon: Barbell },
  { id: 'ladder', color: 'sky', label: 'Skill ladder', count: ACADEMY_LEVELS.length, blurb: "2.0 → 4.5+ · what to master at each level, in order", icon: ListChecks },
  { id: 'rehab', color: 'red', label: 'Knee & safety', title: 'Knee rehab, prehab & playing safe', count: KNEE_REHAB.length + TIPS.length, blurb: "ACL / MCL, and the physio notes for staying on court", icon: Heartbeat },
  { id: 'mental', color: 'peach', label: 'Mental game', count: MINDSET.length, blurb: "The mindset that wins close games", icon: Brain },
  { id: 'formats', color: 'blue', label: 'Formats', title: 'Format playbook', count: PICKLE_FORMATS.length, blurb: "How each league & tournament format works", icon: Medal },
] as const

/** One chapter of the manual. The bar that chooses it lives in `Coaching`. */
function Manual({ chapter }: { chapter: string }) {
  const drillSkills = [...new Set(ACADEMY_DRILLS.map((d) => d.skill))]
  const [openSkill, setOpenSkill] = useState<string | null>(drillSkills[0])
  const [openTech, setOpenTech] = useState<string | null>(null)
  const [equip, setEquip] = useState<RehabEquip | 'all'>('all')
  const rehab = KNEE_REHAB.filter((e) => equip === 'all' || e.equip === equip)
  const EQUIP_LABEL: Record<RehabEquip | 'all', string> = { all: 'All', none: 'No equipment', band: 'Band', weights: 'Weights' }
  const current = CHAPTERS.find((c) => c.id === chapter) ?? CHAPTERS[0]

  return (
    <section>
      <div className="@container/page">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
            <h3 className="flex items-center gap-2 text-heading font-medium text-fg-1">
              <Icon as={current.icon} size="md" style={{ color: onRaised(current.color) }} />
              {'title' in current ? current.title : current.label}
            </h3>
            <p className="text-label text-fg-2">{current.blurb}</p>
          </div>
          {chapter === 'shots' && (<>
        {[...new Set(TECHNIQUES.map((t) => t.group))].map((group) => (
          <div key={group} className="mb-2">
            <p className="mb-1 text-caption font-medium tracking-wider text-fg-2 uppercase">{group}</p>
            <ul className="space-y-1.5">
              {TECHNIQUES.filter((t) => t.group === group).map((t) => {
                const open = openTech === t.name
                return (
                  <li key={t.name} className="rounded-control bg-ink-2">
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
                            {t.how.map((step, i) => <li key={i} className="flex gap-2 text-label text-fg-2"><span className="shrink-0 font-medium" style={{ color: onRaised('mauve') }}>{i + 1}.</span> {step}</li>)}
                          </ol>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <p className="mb-1 text-label font-medium" style={{ color: onRaised('green') }}>✓ Key cues</p>
                            <ul className="space-y-0.5">{t.cues.map((c) => <li key={c} className="text-label text-fg-2">{c}</li>)}</ul>
                          </div>
                          <div>
                            <p className="mb-1 text-label font-medium" style={{ color: onRaised('red') }}>✗ Common mistakes</p>
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
          </>)}
          {chapter === 'drills' && (<>
        <div className="space-y-2">
          {drillSkills.map((skill) => {
            const list = ACADEMY_DRILLS.filter((d) => d.skill === skill)
            const open = openSkill === skill
            return (
              <div key={skill} className="rounded-control bg-ink-2">
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
          </>)}
          {chapter === 'ladder' && (<>
        <div className="space-y-3">
          {ACADEMY_LEVELS.map((lvl) => (
            <div key={lvl.id} className="rounded-card bg-ink-2 p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-body font-medium" style={{ color: onRaised(lvl.color) }}>{lvl.name}</span>
                <Pill color={lvl.color} size="micro" className="px-2">DUPR {lvl.dupr}</Pill>
              </div>
              <ul className="grid gap-1 sm:grid-cols-2">
                {lvl.skills.map((sk) => <li key={sk} className="flex gap-1.5 text-label text-fg-2"><span style={{ color: onRaised(lvl.color) }}>•</span> {sk}</li>)}
              </ul>
            </div>
          ))}
        </div>
          </>)}
          {chapter === 'rehab' && (<>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(['all', 'none', 'band', 'weights'] as const).map((e) => (
            <button key={e} onClick={() => setEquip(e)} aria-pressed={equip === e} className="rounded-control border px-2.5 py-1 text-label transition-colors"
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
                  <li key={e.name} className="rounded-card bg-ink-2 p-2.5">
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
        {/* The five physio tips that were their own rail row. Same subject as
            the twenty-three exercises above them and 0.36 screens of it, so
            they are a facet of this chapter rather than a peer of it — the
            row budget is what a single bar lives under. */}
        <div className="mb-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-body font-medium text-fg-1"><Icon as={ShieldPlus} size="sm" className="text-green" /> Playing safe — physio &amp; trainer notes</p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {TIPS.map((x) => (
              <li key={x.t} className="rounded-card bg-ink-2 p-2.5">
                <p className="text-body font-medium text-fg-1">{x.t}</p>
                <p className="text-label text-fg-2">{x.d}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="inline-flex items-start gap-1.5 rounded-card bg-red/10 p-2 text-label text-fg-2"><Icon as={ShieldWarning} size="sm" className="mt-0.5 shrink-0 text-red" /> Educational only — not medical advice. Stop on sharp pain; after an injury follow a qualified physio's plan.</p>
          </>)}
          {chapter === 'mental' && (<>
        <ul className="grid gap-2 sm:grid-cols-2">
          {MINDSET.map((m) => (
            <li key={m.title} className="rounded-card bg-ink-2 p-2.5">
              <p className="text-body font-medium text-fg-1">{m.title}</p>
              <p className="text-label text-fg-2">{m.why}</p>
            </li>
          ))}
        </ul>
          </>)}
          {chapter === 'formats' && (<>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PICKLE_FORMATS.map((fm) => (
            <li key={fm.id} className="rounded-card bg-ink-2 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-body font-medium text-fg-1">{fm.label}</span>
                <span className="text-micro text-fg-2">{fm.size}</span>
              </div>
              <p className="text-label text-fg-2">{fm.how}</p>
            </li>
          ))}
        </ul>
          </>)}
        </div>
      </div>
    </section>
  )
}
