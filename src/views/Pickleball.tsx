import { ArrowsClockwise, CalendarDot, CaretRight, Gauge, Plus, Target, Trophy } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Input, Textarea } from '../components/ui'
import { ChipPick, DayPick, Stepper } from '../components/ui/quickpick'
import { durationOptions } from '../components/ui/quickpick.options'
import { Button } from '../components/ui/button'
import { ActStrip, PageLayout, DisclosureRow, StatBar } from '../components/page'
import { cat, onRaised } from '../lib/colors'
import { todayISO, addDays, prettyDay } from '../lib/date'
import { pickleTotals, recentThenFrequent, nextStep } from '../lib/pickleball'
import { PickleballReview } from '../components/pickleball/Review'
import { TodayDrill } from '../components/pickleball/TodayDrill'
import { PB_PANELS } from '../components/pickleball/panels'
import { useStickyState } from '../lib/useStickyState'
import { notify } from '../lib/notify'

/**
 * PICKLEBALL - log a session, then read what the sessions add up to.
 *
 * On the three-zone contract (`docs/PAGE-SHAPE.md`), and on the same shell as
 * Home Workout and Pull-ups, because a person who has learnt one of them has
 * learnt all three:
 *
 * - ORIENT - one sentence saying what to do next (`nextStep`), four totals, and
 *   the week against the weekly goal. Facts that change the next thirty
 *   seconds; everything all-time is in zone 3 and belongs there.
 * - ACT    - log a session. One primary button, in a sticky column.
 * - REVIEW - `components/pickleball/Review.tsx`: one bar, five panels.
 *
 * It was `shell/Page` with a hand-rolled 1.6fr/1fr split, the history list and
 * a practice card beside the form, and the record on a 13rem side rail below
 * all of it. That is three different layout decisions on one page and none of
 * them shared with any other page in the app.
 *
 * The form stays here rather than in `components/pickleball/`: it is the act,
 * it is what `PageLayout` puts in the sticky column, and a form that is lifted
 * out of its view ends up with a dozen callbacks for props.
 */
const numOrUndef = (v: string): number | undefined => (v.trim() === '' ? undefined : Number(v))

/**
 * `blankOf` is a FUNCTION, not a constant.
 *
 * It was `const blank = { date: todayISO(), ... }` evaluated once when the
 * module loaded - so the default date was whatever day the tab was opened.
 * Leave the app open overnight and every session logs to yesterday, and the
 * field resets to yesterday after each save.
 *
 * The form holds its numbers as STRINGS, because an empty field is `''` and
 * not `0` - a distinction this file depends on (`gamesWon: ''` must not log a
 * 0-0 session). `Stepper` and `ChipPick` speak numbers, so this is the seam.
 */
const blankOf = () => ({ date: todayISO(), format: 'doubles' as 'singles' | 'doubles', gamesWon: '', gamesLost: '', durationMin: '', partner: '', rpe: '', notes: '', opponent: '', location: '', level: '', pointsFor: '', pointsAgainst: '', scoring: '' as '' | '11' | '15' | '21' | 'rally21' })

export function Pickleball() {
  const { data, addPickleball } = useJournal()
  const today = todayISO()
  const [f, setF] = useState(blankOf)
  const set = (p: Partial<ReturnType<typeof blankOf>>) => setF((c) => ({ ...c, ...p }))

  const all = pickleTotals(data)
  const week = pickleTotals(data, 7, today)
  const sessions = [...(data.pickleball ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const goal = data.settings.pickleballGoalGames ?? 0
  // The one sentence at the top of the page. See `nextStep`'s docstring for the
  // priority order; it is total, so there is no empty state to design here.
  const step = nextStep(data, today)
  /* Which review panel is open. Sticky, because the folds it replaced were —
     and owned here, not in the review, so the sentence above can open the
     panel that answers it. */
  const [panel, setPanel] = useStickyState<string>(
    'pickleball.group', 'sessions', PB_PANELS.map((p) => p.id),
  )
  /* The act column's fold, the same way Home Workout and Pull-ups hold it:
     shut, the page grid turns zone 2 into a 40px rail and hands its width to
     the review. The shell owns the geometry, the page owns the state — which
     is the half this branch had back to front, with a second mechanism in
     `PageLayout` that did the same job under a different name. */
  const [act, setAct] = useStickyState<'open' | 'shut'>('pickleball.act', 'open', ['open', 'shut'])

  /**
   * The log form's Partner and Location chips.
   *
   * Same two stat tables the analytics below already use, capped at six so the
   * chip row does not become the form. They are sorted by games played, so the
   * person you play every week is the first chip rather than the alphabetically
   * luckiest.
   */
  /* Ordered by **last used, then most used** — not by games played, which
     is what `partnerStats`/`venueStats` sort by and which put the court you
     played at last night below one you stopped going to in June. Recency is
     the stronger signal for what you are about to type.

     `sessions` and not the stats arrays: `recentThenFrequent` reads its
     input in order, and `partnerStats`/`venueStats` have already collapsed
     and re-sorted it, so the recency is gone by then. `sessions` is sorted
     newest-first where it is built above.

     No `useMemo`: it is one pass over a list of sessions, and `sessions` is
     a fresh array every render, so a memo keyed on it would recompute every
     time anyway while costing a dependency to keep honest. */
  const allPartners = recentThenFrequent(sessions.map((x) => x.partner))
  const allVenues = recentThenFrequent(sessions.map((x) => x.location))
  /* ONE CHIP, THEN THE FIELD — asked for as "show only one partner name and
     add a name, or else you can choose from the name".
     
     Four chips plus a field is five controls for one answer, and in a 416px
     act column they wrapped to two lines each for Partner and Location. The
     one chip is who you played with last, which is the answer most of the
     time; everything else is in the field's own dropdown (`list=`), which is
     a real list of every name you have logged and still takes a new one. */
  const recentPartners = allPartners.slice(0, 1)
  const recentVenues = allVenues.slice(0, 1)
  const yesterday = addDays(todayISO(), -1)

  function log() {
    // A session with a duration and no score is a real session — the sport's
    // one required field is `durationMin`, and the voice path files exactly
    // that. Requiring a score here was the same bug the parser had, in the
    // form: you could not hand-log "played for 40 minutes, didn't keep score".
    if (!f.gamesWon && !f.gamesLost && !f.durationMin) { notify.info('Nothing to log yet', 'A session needs a score or how long you played.'); return }
    addPickleball({
      date: f.date,
      format: f.format,
      gamesWon: Number(f.gamesWon) || 0,
      gamesLost: Number(f.gamesLost) || 0,
      durationMin: f.durationMin ? Number(f.durationMin) : undefined,
      partner: f.partner.trim() || undefined,
      rpe: f.rpe ? Number(f.rpe) : undefined,
      notes: f.notes.trim() || undefined,
      opponent: f.opponent.trim() || undefined,
      location: f.location.trim() || undefined,
      level: f.level.trim() || undefined,
      pointsFor: f.pointsFor ? Number(f.pointsFor) : undefined,
      pointsAgainst: f.pointsAgainst ? Number(f.pointsAgainst) : undefined,
      scoring: f.scoring || undefined,
    })
    setF(blankOf())
  }
  function repeatLast() {
    const last = sessions[0]
    if (last) setF({ ...blankOf(), date: today, format: last.format, durationMin: String(last.durationMin ?? ''), partner: last.partner ?? '', location: last.location ?? '', level: last.level ?? '', scoring: last.scoring ?? '' })
  }

  const atAGlance = (
    /* ONE BLOCK, NOT THREE THINGS THAT HAPPEN TO BE ADJACENT.

       Asked for directly: *"combine this drill and the stats on the top bar so
       they have only one single space"*. The sentence, the totals and today's
       drill are the same question — what about today — and they were a row, a
       bar and then a strip at the top of the record, where the strip read as
       the first panel and ran into the Sessions heading below it.

       `@container/orient` so the drill can ask how wide THIS block is rather
       than how wide the window is: the block is the full shell with the log
       hidden and the same width with it open, because zone 1 spans both
       columns. */
    <div className="@container/orient rounded-card border border-line bg-ink-0 p-3">
      {/* THE SENTENCE, ABOVE THE NUMBERS.

          Four totals are four true things that change nothing about today. The
          one that does — an event on Saturday, a goal two games short, eleven
          days of silence — was spread across three cards in the review zone,
          behind a rail row you had to pick first. `nextStep` is the priority
          list (lib/pickleball.ts), and it always returns a sentence so this
          never renders as a hole.

          COLOUR MEANS URGENCY HERE AND NOTHING ELSE — peach has a date on it,
          yellow is a habit going quiet, teal is a goal you set, mauve is
          something to aim at. The accent stays in the left edge and the icon;
          the text is `fg-1`. Putting an accent on a wash of itself is the
          calibration trap in CLAUDE.md, and this row would have been the
          twenty-first call site of it.

          It is a BUTTON when the detail exists, and a paragraph when it does
          not: the rail groups are the detail, and a row that looks pressable
          and does nothing is worse than a row that does not. */}
      {(() => {
        const tone = { first: 'mauve', event: 'peach', goal: 'teal', lapse: 'yellow', milestone: 'mauve' }[step.id]
        const StepIcon = { first: Plus, event: CalendarDot, goal: Target, lapse: Gauge, milestone: Trophy }[step.id]
        const body = (
          <>
            <Icon as={StepIcon} size="md" style={{ color: onRaised(tone) }} className="shrink-0" />
            <span className="min-w-0 text-body text-fg-1">{step.text}</span>
            {/* The destination is named on a desktop and dropped on a phone.
                Measured: the row is 39px wide-screen and was **156px** at
                390px — four lines, because "Riverside Autumn Open is in 9 days
                — the prep checklist is under Competition." already wraps to
                three and the panel name added a fourth. The sentence names the
                panel in its own words, the whole row is the button, and a
                phone has no hover to need the hint. */}
            {step.group && (
              <span className="ml-auto hidden shrink-0 text-label text-fg-2 sm:inline">
                {PB_PANELS.find((g) => g.id === step.group)?.label} →
              </span>
            )}
          </>
        )
        const shell = 'mb-3 flex w-full items-center gap-2.5 rounded-control border-l-2 bg-ink-1 px-3 py-2 text-left'
        return step.group ? (
          <button
            type="button"
            onClick={() => setPanel(step.group!)}
            className={`${shell} transition-colors hover:bg-ink-2`}
            style={{ borderLeftColor: cat(tone) }}
          >
            {body}
          </button>
        ) : (
          <p className={shell} style={{ borderLeftColor: cat(tone) }}>{body}</p>
        )
      })()}
      {/* ONE BAR, NOT A CARD.

          This was a titled card wrapping four `StatTile`s, a "this week"
          sentence, a goal field and a progress bar — 259px on desktop and 308px
          on a phone to say four numbers. `StatBar` is what the rest of the app
          uses for exactly this (thirteen views; Pickleball was never one of
          them) and it is capped at 64px with hairline dividers.

          The four facts are the four that were here. The weekly goal stays,
          because it is the one line that changes what you do today, but as a
          single row under the bar rather than a card section of its own. */}
      {/* THE GOAL FIELD MOVED OUT OF ZONE 1, to the Sessions panel.

          The orient zone was three rows for two facts: the sentence, the bar,
          and then a near-empty line holding one progress pip and a number
          field. A control you touch about once a month does not earn a row
          above the fold — the STATE of it does, and that is the fourth fact
          below ("3 of 12 games · 67% won"). The field itself now sits under
          the history list, which is where you are standing when you decide
          whether twelve was the right number. Measured: orient 175px → 126. */}
      {/* FOUR FACTS, AND THE FOURTH IS THIS WEEK.

          It was Sessions / Games / Win % / Day streak, with a row under it
          repeating "This week 0 games of 12 - 0% won" and carrying the goal
          field: two rows and 173px of orient zone, where the fourth fact was a
          day streak that reads 0 for anybody who plays twice a week - which is
          most people, and is not a problem.

          `StatBar` gives every fact an equal share of the row, so a one-digit
          value leaves ~230px of nothing beside it. The fix is not to squeeze
          the bar, it is to SPEND the cell: the week against the goal is the one
          line here that changes what you do today, so it takes the fourth slot
          as prose and the row under it shrinks to the control that sets it.
          Nothing is lost - the streak has its own card in Performance. */}
      <StatBar
        facts={[
          { label: 'Sessions', value: all.sessions },
          { label: 'Games', value: all.games },
          { label: 'Win %', value: `${all.winPct}%` },
          {
            label: 'This week',
            value: goal > 0
              ? `${week.games} of ${goal} games · ${week.winPct}% won${week.games >= goal ? ' ✓' : ''}`
              : `${week.games} games · ${week.winPct}% won`,
            prose: true,
          },
        ]}
      />
      <TodayDrill />
    </div>
  )

  return (
    <PageLayout
      tier={1180}
      zone1={atAGlance}
      actShut={act === 'shut'}
      zone2={act === 'shut' ? (
        <ActStrip
          label="Log a session"
          summary={sessions.length ? `${sessions.length} logged · last ${prettyDay(sessions[0].date)}` : 'Nothing logged yet'}
          onOpen={() => setAct('open')}
        />
      ) : (
        <Card band title="Log a session" right={
          <span className="flex items-center gap-1.5">
            {sessions.length > 0 && (
              <Button variant="secondary" onClick={repeatLast} className="press-3d inline-flex items-center gap-1"><Icon as={ArrowsClockwise} size="sm" /> Repeat last</Button>
            )}
            {/* Shutting it lives in the card header, which is where Home
                Workout and Pull-ups put theirs — the strip that comes back is
                the way in, so the way out belongs on the thing itself. */}
            <Button variant="ghost" size="icon-sm" onClick={() => setAct('shut')} aria-label="Hide the log" title="Hide the log — the review takes the width">
              <Icon as={CaretRight} size="sm" />
            </Button>
          </span>
        }>
          {/* TAP, DON'T TYPE.

              This was fourteen controls of which twelve were free text or a bare
              number input — the most-used form in the app asking you to type "60"
              and "3.5" after every game. Converted to the `quickpick` primitives
              (#241) on the same reasoning as the rest of that pass: the answer is
              nearly always one of a handful, and a keyboard on a phone at the side
              of a court is the worst possible input device.

              Partner and Location read their chips from `partnerStats` and
              `venueStats`, which are already computed on this page for the
              analytics below and are **sorted by how often you play** — so the
              chips are your actual partners and courts, in the order you use
              them, rather than a list somebody invented. Both keep a free-text
              field beside them for the first time and the one-off.

              Points for/against stay typed on purpose: they are arbitrary numbers
              in 0–21 with no common values, so chips would be a list of twenty-two
              and a Stepper would be eleven taps. A control is only an improvement
              if it is fewer actions than typing. */}
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
            <DayPick value={f.date} onChange={(d) => set({ date: d })} today={todayISO()} yesterday={yesterday} />

            <ChipPick
              label="Format"
              value={f.format}
              onChange={(v) => set({ format: v })}
              options={[{ value: 'doubles', label: 'Doubles' }, { value: 'singles', label: 'Singles' }]}
            />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Stepper label="Games won" value={numOrUndef(f.gamesWon)} onChange={(v) => set({ gamesWon: v == null ? '' : String(v) })} max={30} placeholder="0" />
              <Stepper label="Games lost" value={numOrUndef(f.gamesLost)} onChange={(v) => set({ gamesLost: v == null ? '' : String(v) })} max={30} placeholder="0" />
            </div>

            <ChipPick
              label="On court for"
              tone="teal"
              dense
              value={numOrUndef(f.durationMin) ?? null}
              onChange={(v) => set({ durationMin: String(v) })}
              options={durationOptions([30, 45, 60, 90, 120])}
              after={
                <Input
                  type="number"
                  value={f.durationMin}
                  onChange={(e) => set({ durationMin: e.target.value })}
                  placeholder="Mins"
                  aria-label="Minutes on court"
                  className="w-20 py-1"
                />
              }
            />

            <ChipPick
              label="Effort (RPE)"
              tone="peach"
              /* `dense`, because ten chips at the default `px-3` come to 437px
                 against a 416px act column and wrap 9 + 1 — a single orphan
                 chip on its own line, which reads as a mistake rather than as
                 a scale. The prop exists for this: a call site passing its own
                 `className` would re-decide the chip geometry, which is how
                 two rows of one control come to disagree. */
              dense
              value={numOrUndef(f.rpe) ?? null}
              onChange={(v) => set({ rpe: String(v) })}
              options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ value: n, label: String(n) }))}
              hint="1 easy · 10 everything you had"
            />

            <div className="grid gap-3 sm:grid-cols-2">
            {f.format === 'doubles' && (
              <ChipPick
                label="Partner"
                value={f.partner || null}
                onChange={(v) => set({ partner: f.partner === v ? '' : v })}
                options={recentPartners.map((n) => ({ value: n, label: n }))}
                after={
                  /* `list=` — a real dropdown of every partner you have logged,
                     on a field you can still type anything into. That is the
                     whole ask: stop retyping the same four names, without
                     losing the ability to enter a new one. A `<select>` would
                     have taken the second half away. */
                  <>
                    <Input
                      value={f.partner}
                      onChange={(e) => set({ partner: e.target.value })}
                      placeholder="Pick or type"
                      aria-label="Partner"
                      list="pb-partners"
                      className="w-36 min-w-0 max-w-full py-1"
                    />
                    <datalist id="pb-partners">
                      {allPartners.map((n) => <option key={n} value={n} />)}
                    </datalist>
                  </>
                }
              />
            )}

            <ChipPick
              label="Location"
              tone="teal"
              value={f.location || null}
              onChange={(v) => set({ location: f.location === v ? '' : v })}
              options={recentVenues.map((n) => ({ value: n, label: n }))}
              after={
                <>
                  <Input
                    value={f.location}
                    onChange={(e) => set({ location: e.target.value })}
                    placeholder="Pick or type"
                    aria-label="Location"
                    list="pb-venues"
                    className="w-36 min-w-0 max-w-full py-1"
                  />
                  <datalist id="pb-venues">
                    {allVenues.map((n) => <option key={n} value={n} />)}
                  </datalist>
                </>
              }
            />
            </div>

            {/* The half you fill less than half the time.

                `DisclosureRow` and not a `<details>`: it renders `aria-expanded`,
                which is what `npm run a11y` clicks to open a fold before it
                scans. A `<details>` would keep these four controls out of the
                accessibility gate entirely — the COD-93 trap, arriving by a new
                route. It is also the page's only disclosure, which is that
                component's stated rule.

                Tap-to-log costs vertical space — chips are taller than the grid
                of number inputs they replaced, and this form grew the page by
                0.4 screens. Folding the optional half is where that comes back,
                without putting a keyboard back in the fast path. */}
            <DisclosureRow label="Level, scoring, points & opponents">
              <ChipPick
                label="Level"
                tone="teal"
                value={f.level || null}
                onChange={(v) => set({ level: v })}
                options={['2.5', '3.0', '3.5', '4.0', '4.5', '5.0'].map((l) => ({ value: l, label: l }))}
              />

              <ChipPick
                label="Scoring"
                tone="teal"
                value={f.scoring || null}
                onChange={(v) => set({ scoring: v })}
                options={[
                  { value: '11' as const, label: 'to 11' },
                  { value: '15' as const, label: 'to 15' },
                  { value: '21' as const, label: 'to 21' },
                  { value: 'rally21' as const, label: 'rally 21' },
                ]}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input type="number" value={f.pointsFor} onChange={(e) => set({ pointsFor: e.target.value })} placeholder="Pts for" aria-label="Points for" />
                <Input type="number" value={f.pointsAgainst} onChange={(e) => set({ pointsAgainst: e.target.value })} placeholder="Pts against" aria-label="Points against" />
              </div>
              <Input value={f.opponent} onChange={(e) => set({ opponent: e.target.value })} placeholder="Opponent(s) (optional)" aria-label="Opponents" />
            </DisclosureRow>
          </div>
          <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="How did it go?" rows={2} className="mt-3" />
          <Button variant="secondary" onClick={log} className="press-3d mt-3 w-full">Log session</Button>
        </Card>
      )}
      zone3={<PickleballReview panel={panel} onPanel={setPanel} />}
    />
  )
}
