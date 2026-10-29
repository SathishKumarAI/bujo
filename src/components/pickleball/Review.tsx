import { useState } from 'react'
import { ArrowSquareOut } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../store'
import { Card, Empty, Input, Textarea } from '../ui'
import { Button } from '../ui/button'
import { SectionRail, StatGrid } from '../page'
import { LazyMount } from '../LazyMount'
import { cat, onRaised } from '../../lib/colors'
import { todayISO, addDays, prettyDay, fromISODay, WEEKDAYS } from '../../lib/date'
import {
  partnerStats, venueStats, opponentRecords, opponentLabel, rollingForm, winStreaks, pointDifferential,
  levelMatchup, weekdayPerformance, monthlyGames, winRateForecast, rpeLoad, pickleMilestones,
  pickleHours, scoringStats, playConsistency,
} from '../../lib/pickleball'
import { PB_PANELS, panelsFor } from './panels'
import { useDevice } from '../shell/device'
import { SessionFields } from './SessionFields'
import { draftFrom, sessionPatch, type SessionDraft } from './sessionDraft'
import { Facet } from './Facet'
import { TrendCharts } from './TrendCharts'
import { CompetitionPanel } from './CompetitionPanel'
import { RecentFormCard, WinRateForecastCard, MilestonesCard, SessionIntensityCard } from './FormCards'
import { PartnerChemistryCard, VenuesCard, RivalryRecordCard, LevelMatchupCard } from './MatchupCards'
import { WeekdayPerformanceCard, PointDifferentialCard, TimeOnCourtCard, ScoringPerformanceCard, PlayConsistencyCard } from './SignalCards'
import { justCapturedProps, useJustCaptured } from '../CaptureReceipt'
import { PICKLEBALL_KEY } from '../../lib/recordKeys'

/**
 * ZONE 3 - everything this page has recorded, behind ONE bar.
 *
 * It was four groups on a 13rem side rail, with the history list and a practice
 * card stranded up in the act: "what I did" sat beside the form while "what it
 * adds up to" sat below it, and the page had two navigations. Five rows now,
 * same instrument and same shape as `views/Pullups.tsx` and
 * `components/homeworkout/Review.tsx` - `railAt="never"`, a bar above the panel
 * at every width - so the three pages that record a sport are one page.
 *
 * Ordered for somebody who has just logged: Sessions first, because the first
 * question after logging is "did that land, and what does the week look like".
 * Competition last - a DUPR rating moves a few times a year.
 *
 * It reads the store directly rather than taking twenty aggregates as props.
 * Each is one pass over a list of sessions (see the no-`useMemo` note in
 * `lib/pickleball.ts`), and a prop list that long is a second place for two
 * components to disagree about what a number means.
 */


/** Reputable external coaching / rules resources (open in a new tab). */
const RESOURCES = [
  { name: 'USA Pickleball · official rules & how-to', url: 'https://usapickleball.org' },
  { name: 'The Dink · drills, strategy & news', url: 'https://www.thedinkpickleball.com' },
]



// History row with in-place editing (BUJO-201): correct a mistyped score/format/
// duration without delete-and-re-log.
function PickleRow({ p, onSave, onDelete, partnerNames, venueNames }: {
  p: import('../../lib/types').PickleballSession
  onSave: (patch: Partial<import('../../lib/types').PickleballSession>) => void
  onDelete: () => void
  /** Every partner and venue already logged, for the form's own dropdowns. */
  partnerNames: string[]
  venueNames: string[]
}) {
  const [editing, setEditing] = useState(false)
  /* THE WHOLE SESSION, not five of its fourteen fields. `draftFrom` is the
     same translation the log form uses, so an edit starts from everything
     that is stored rather than from the subset this row used to render. */
  const [d, setD] = useState(() => draftFrom(p))
  // Above the `editing` early return: a row can be captured and then opened for
  // an edit, and a hook called only on one of those paths is a different hook
  // order on each render.
  const justNew = useJustCaptured().has(PICKLEBALL_KEY(p.id))
  const phone = useDevice() === 'mobile'
  /* HOW IT WENT, read back (COD-451). Only for a session that answered any of
     it — a field that is written and never shown is the write-only trap in
     CLAUDE.md — and the note rides along only when pain was flagged, because
     that is where the form tells you to say where it hurts. */
  const how = [
    p.worked?.length ? `worked: ${p.worked.join(', ')}` : '',
    p.toFix?.length ? `work on: ${p.toFix.join(', ')}` : '',
    p.energy != null ? `energy ${p.energy}/5` : '',
    p.pain ? `pain${p.notes ? ` — ${p.notes}` : ''}` : '',
  ].filter(Boolean).join(' · ')
  function save() {
    // `sessionPatch` lists every key, so clearing a partner here actually
    // clears it — `updatePickleball` merges, and an omitted key would mean
    // "leave what was there", which is the opposite of what a cleared field
    // is asking for.
    onSave(sessionPatch(d))
    setEditing(false)
  }
  if (editing) {
    return (
      <li className={phone ? 'ios-form flex flex-col gap-5 py-3' : 'space-y-2 py-2.5'}>
        {/* THE REAL FORM, not a re-declaration of part of it.

            This row used to render five controls — format, won, lost,
            duration, notes — against the log form's fourteen. So a session
            corrected here could be switched to doubles and never given a
            partner, nor an opponent, location, level, points or scoring.
            Reported exactly that way, and it is the third time this shape has
            been found this week.

            The nine missing fields were never lost: `updatePickleball` merges
            a `Partial<>`, so they survived untouched and unreachable. That is
            why this is a render change and not a migration. COD-348. */}
        <SessionFields
          f={d}
          set={(patch: Partial<SessionDraft>) => setD((c) => ({ ...c, ...patch }))}
          recentPartners={partnerNames.slice(0, 1)}
          allPartners={partnerNames}
          recentVenues={venueNames.slice(0, 1)}
          allVenues={venueNames}
          yesterday={addDays(todayISO(), -1)}
        />
        <Textarea value={d.notes} onChange={(e) => setD((c) => ({ ...c, notes: e.target.value }))} placeholder="Notes" rows={2} />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={save} className="press-3d flex-1">Save</Button>
          <Button variant="secondary" onClick={() => setEditing(false)} className="press-3d flex-1">Cancel</Button>
        </div>
      </li>
    )
  }
  return (
    <li {...justCapturedProps(justNew)} className={`group flex items-center justify-between gap-2 py-2 text-body ${justNew ? 'just-captured' : ''}`}>
      {/* `durationMin` was stored and never rendered, so a session logged by
          voice — where the duration is usually the ONLY fact given — showed as
          "doubles 0–0" and looked empty. It is the sport's required field
          (`domain/activities.ts`), so it reads before the optional ones. */}
      <span className="text-fg-1">{prettyDay(p.date)} <span className="text-fg-2">· {p.format}{p.durationMin ? ` · ${p.durationMin} min` : ''}{p.partner ? ` · with ${p.partner}` : ''}{opponentLabel(p) ? ` · vs ${opponentLabel(p)}` : ''}{p.location ? ` · ${p.location}` : ''}</span>
        {how && <span className="mt-0.5 block text-label text-fg-2">{how}</span>}
      </span>
      <span className="flex items-center gap-2">
        <span style={{ color: onRaised('green') }}>{p.gamesWon}</span>–<span style={{ color: onRaised('red') }}>{p.gamesLost}</span>
        <Button variant="ghost" size="sm" onClick={() => { setD(draftFrom(p)); setEditing(true) }} aria-label="Edit session" className="text-fg-2 reveal hover:text-mauve">Edit</Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Remove" className="text-fg-2 reveal hover:text-red">×</Button>
      </span>
    </li>
  )
}


export function PickleballReview({ panel: asked, onPanel }: {
  /**
   * Which row is open.
   *
   * Lifted to the view rather than held here, because zone 1's "what to do
   * next" row is a shortcut INTO a panel ("10 days since you last played →
   * Performance") and a button that cannot reach the state it names is a
   * button that lies. One owner, passed down; the view persists it.
   */
  panel: string
  onPanel: (id: string) => void
}) {
  const { data, updatePickleball, removePickleball, setSettings } = useJournal()
  /* On a phone the bar holds only the logging panels (`panels.ts`). The
     remembered choice is shared with the desktop, so a phone that inherits
     "Results" opens Sessions instead of an empty bar — without overwriting the
     choice the desktop will read back. */
  const panels = panelsFor(useDevice() === 'mobile')
  const panel = panels.some((p) => p.id === asked) ? asked : 'sessions'
  const today = todayISO()
  const sessions = [...(data.pickleball ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  /**
   * A WAY BACK TO YOUR OWN ENTRIES, from the figure that made you look.
   *
   * Every card in this review is read-only — a win rate by weekday, a partner's
   * record, a court — and the sessions underneath them were a rail row away in
   * a list of everything. Asked for as *"I need to be able to edit them as
   * well, my entries, not the visualizations"*. Clicking a weekday, a partner
   * or a venue opens Sessions filtered to exactly those rows, where Edit and ×
   * already are.
   *
   * Not sticky and not in the URL, for the same reason as the sub-section
   * chips: it is a narrowing you do while reading. It clears when you pick a
   * different panel from the bar, because a filter you cannot see is a list
   * that looks wrong.
   */
  const [focus, setFocus] = useState<{ kind: 'weekday' | 'partner' | 'venue'; value: string } | null>(null)
  const pick = (kind: 'weekday' | 'partner' | 'venue') => (value: string) => { setFocus({ kind, value }); onPanel('sessions') }
  const same = (a: string | undefined, b: string) => (a ?? '').trim().toLowerCase() === b.trim().toLowerCase()
  const shown = focus
    ? sessions.filter((p) => (
        focus.kind === 'weekday' ? WEEKDAYS[fromISODay(p.date).getDay()] === focus.value
          : focus.kind === 'partner' ? same(p.partner, focus.value)
            : same(p.location, focus.value)
      ))
    : sessions
  const focusLabel = focus && (focus.kind === 'weekday' ? `${focus.value} sessions` : focus.value)

  // Not sticky, and not in the URL: a sub-section is a narrowing you do while
  // reading, not a place you return to. Sticky it would be, on a page you open
  // a week later, four cards you cannot find and no memory of hiding them.
  const [facet, setFacet] = useState<string | null>(null)

  // Read-only rivalry / chemistry / venue aggregates over logged sessions.
  const partners = partnerStats(data)
  const venues = venueStats(data)
  const opponents = opponentRecords(data)
  // Read-only form / streak / point / matchup / weekday signals.
  const form = rollingForm(data)
  const streaks = winStreaks(data)
  const points = pointDifferential(data)
  const matchup = levelMatchup(data)
  const weekdays = weekdayPerformance(data)
  const weekdaysPlayed = weekdays.filter((w) => w.games > 0)
  // Read-only monthly volume / forecast / load / milestone signals.
  /* Only the chip COUNT needs this here — the chart itself lives in
     `TrendCharts`, which calls the same function over the same journal. Two
     call sites of one pure function, not two opinions about what a month is. */
  const monthsPlayed = monthlyGames(data, 6, today).some((m) => m.games > 0)
  const forecast = winRateForecast(data)
  const load = rpeLoad(data, 7, today)
  const milestones = pickleMilestones(data)
  // Read-only time-on-court, scoring split, consistency & event signals.
  const hours = pickleHours(data, 30, today)
  const scoring = scoringStats(data)
  const consistency = playConsistency(data, 8, today)

  const current = PB_PANELS.find((p) => p.id === panel) ?? PB_PANELS[0]

  /*
   * SUB-SECTIONS, FOR THE TWO GROUPS BIG ENOUGH TO NEED THEM.
   *
   * A rail row that opens nine cards is a wall with a nicer door. Performance
   * holds nine and Trends seven, and inside each the cards answer two or three
   * different questions — "how am I playing" is not "how hard was it" is not
   * "am I turning up". Competition (3) and Opponents (4) get no chip row: a
   * sub-navigation over four things costs more than it saves, which is the
   * same arithmetic that keeps `count` off a rail whose groups hold prose.
   *
   * `has` is the single source for BOTH the chip and the card. The obvious
   * shape — a chip list beside the render conditions — is the hand-written id
   * list resolved against another source that this repo has been bitten by
   * three times (`BottomNav`'s `PRIMARY`, `view-ids.mjs`, the `VIEWS` list),
   * and it fails the same way: a chip that selects nothing, or a card that no
   * chip can reach. One boolean, two readers.
   */
  const has = {
    recentForm: form.results.length > 0,
    forecast: forecast.ready,
    milestones: true,
    intensity: load.sessions > 0,
    weekday: weekdaysPlayed.length > 0,
    points: points.sessions > 0,
    hours: hours.timedSessions > 0,
    scoring: scoring.length > 0,
    consistency: consistency.daysPlayed > 0,
    winTrend: true,
    winLoss: true,
    perWeek: true,
    perMonth: monthsPlayed,
    byFormat: true,
    cumulative: true,
    heatmap: true,
  }
  /** card → sub-section, for every card that lives under a chip row. */
  const FACET_OF: Record<keyof typeof has, string> = {
    // Results
    recentForm: 'form', forecast: 'form', winTrend: 'form',
    points: 'margins', scoring: 'margins', winLoss: 'margins', byFormat: 'margins',
    weekday: 'days',
    // Activity
    consistency: 'consistency',
    intensity: 'effort', hours: 'effort',
    milestones: 'badges',
    perWeek: 'volume', perMonth: 'volume', cumulative: 'volume', heatmap: 'volume',
  }
  /* Plain nouns, because the first set were sentences pretending to be chips:
     "How I am playing · How hard · Turning up" read as broken English in a
     192px row and wrapped to three lines on a phone. A chip is a label, not a
     question — the heading above it already asked the question. */
  const FACET_LABELS: Record<string, string> = {
    form: 'Form', margins: 'Margins', days: 'Days',
    volume: 'Volume', effort: 'Effort', consistency: 'Cadence', badges: 'Badges',
  }
  const FACETS_BY_GROUP: Record<string, string[]> = {
    results: ['form', 'margins', 'days'],
    activity: ['volume', 'effort', 'consistency', 'badges'],
  }
  // Counted from `has`, so a sub-section with nothing in it is not offered.
  const facetRows = (FACETS_BY_GROUP[panel] ?? [])
    .map((id) => ({
      id,
      label: FACET_LABELS[id],
      count: (Object.keys(has) as (keyof typeof has)[]).filter((k) => FACET_OF[k] === id && has[k]).length,
    }))
    .filter((f) => f.count > 0)
  const groupCount = facetRows.reduce((a, f) => a + f.count, 0)
  // A facet from the group you just left must not hide every card in this one.
  const activeFacet = facetRows.some((f) => f.id === facet) ? facet : null



  return (
      <section className="mt-2">
        {/* `sr-only`, not deleted. The bar under it names every row — a
            separate grey "The record" above it was a line of furniture, and
            with the log hidden it was a line of furniture 1110px wide. The
            heading still exists for the document outline and for anyone
            navigating by headings, which is the half that was load-bearing. */}
        <h2 className="sr-only">The record</h2>
      {/* ── ONE DRILL, THE SYMPTOM IT CURES, AND A TICK. ──

            This was "Practice today & improve": a drill, a five-line warm-up
            and two links, 2×2 inside a card — a second page about how to play
            on the page where you record that you played.

            Three things changed and each is a rule from
            `docs/REUSABLE-PATTERNS.md`:

            §12, the drill says WHAT IT FIXES. `DRILL_FIXES` is keyed on the
            group and written as the complaint you arrive with ("your dinks sit
            up and get attacked"), which is the only sentence that can tell you
            whether today's drill is your problem. A name and a how never could.

            §13, it is a TICK and not an instruction. `PracticeTick` writes the
            day into `settings.practiceLog` under the same key Coaching uses, so
            drilling it here and drilling it there are one record — which they
            could not have been while this page's drill names existed nowhere
            else.

            And the warm-up is gone rather than shortened: it is Coaching's
            `prep` chapter, eight minutes of it, and two copies of a safety
            instruction is the worse failure mode of the two. The row below
            says where it went. ── */}
      {/* A STRIP, NOT A CARD — and it says where it comes from.

          It shipped as a titled, collapsible card called "Today's focus" with
          a subtitle, which asked three questions nobody wanted: what is a
          focus, why is it in my record, and what happens if I fold it. It is
          one drill out of Coaching's twenty-one, chosen by the date, and the
          only thing to do with it is tick it — so it is a strip with a label
          that says exactly that, and `from Coaching` is a link to the page
          that owns the drills.

          Pinned above the bar because it is not one of the five subjects: it
          is today, and it stays on screen whichever row you are reading. */}

        {/* A BAR ACROSS THE TOP, NOT A COLUMN DOWN THE SIDE.

            The rail was a 13rem column, which cost the panel beside it 208px
            plus a 2rem gap — measured, **870px of an 1180px shell** — and that
            is the number that had the review zone resolving to one column at
            1440 (see the `CardGrid` swap one commit back). As a bar the panel
            is the full width and the four rows read left to right, which is
            how a table of contents over four peers is read when it fits on one
            line. Same component, same state: `railAt="never"` keeps the chip
            row at every width and **wraps** rather than scrolling sideways,
            which matters here because "Opponents, partners & venues" is a long
            row and a strip that scrolls with nothing advertising it is how
            three of eight chapters went missing on Pull-ups.

            Not sticky — `SectionRail`'s own note: a bar that sticks paints over
            the panel it switches, and hiding it on scroll is COD-202, where the
            phone's only navigation slid out of frame and a gate declared the
            page retired having scanned nothing. */}
        <div className="@container/page">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-y-3">
          <SectionRail
            label="Pickleball record"
            groups={panels.map((g) => ({ id: g.id, label: g.label }))}
            value={panel}
            onChange={(id: string | null) => { onPanel(id ?? 'sessions'); setFacet(null); setFocus(null) }}
            railAt="never"
          />
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
              <h3 className="flex items-center gap-2 text-heading font-medium text-fg-1">
                <Icon as={current.icon} size="md" style={{ color: onRaised(current.color) }} />
                {current.label}
              </h3>
              <p className="text-label text-fg-2">{current.blurb}</p>
            </div>
            {/* THE SUB-SECTIONS · only where the group is big enough to need
                them, and every chip counted from the same `has` the cards
                render from, so a chip can never select an empty panel.

                The selected chip takes the GROUP's colour in its border and
                its ground, with `fg-1` text — never the accent as text on a
                wash of itself, which measured 3.64–4.40 across latte and dawn
                on `ChipPick` and is the calibration trap in CLAUDE.md. */}
            {facetRows.length > 1 && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label={`${current.label} sub-sections`}>
                <button
                  type="button"
                  onClick={() => setFacet(null)}
                  aria-pressed={activeFacet == null}
                  className={`rounded-pill border px-2.5 py-0.5 text-label transition-colors active:scale-95 ${activeFacet == null ? 'text-fg-1' : 'border-line bg-ink-2 text-fg-2 hover:border-line-strong hover:text-fg-1'}`}
                  style={activeFacet == null ? { borderColor: cat(current.color), background: cat(current.color) + '1f' } : undefined}
                >
                  All <span className="num text-fg-2">{groupCount}</span>
                </button>
                {facetRows.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFacet(f.id)}
                    aria-pressed={activeFacet === f.id}
                    className={`rounded-pill border px-2.5 py-0.5 text-label transition-colors active:scale-95 ${activeFacet === f.id ? 'text-fg-1' : 'border-line bg-ink-2 text-fg-2 hover:border-line-strong hover:text-fg-1'}`}
                    style={activeFacet === f.id ? { borderColor: cat(current.color), background: cat(current.color) + '1f' } : undefined}
                  >
                    {f.label} <span className="num text-fg-2">{f.count}</span>
                  </button>
                ))}
              </div>
            )}
            {panel === 'sessions' && (<>
      <Card
        band
        title="History"
        subtitle="Tap Edit to fix a score, × to remove"
        collapsible
        right={focus ? (
          /* The filter states itself and can be taken off in one tap. A list
             that is quietly short is a list that looks broken. */
          <button
            type="button"
            onClick={() => setFocus(null)}
            className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-ink-2 px-2.5 py-0.5 text-label text-fg-1 transition-colors hover:border-line-strong"
          >
            {focusLabel} · {shown.length} of {sessions.length}
            <span aria-hidden>×</span>
            <span className="sr-only">Clear this filter</span>
          </button>
        ) : undefined}
      >
        {/* FIVE ROWS, AND THE REST SCROLLS.

            It was eight rows and a "Show all 23" button, so the card was
            either 8 rows tall or 23 — and at 23 it pushed everything under
            it down a screen and a half. A history is a thing you glance at
            and occasionally dig through; neither of those wants a button
            that changes the page's height.

            `max-h` on the list with the rows all present: five are visible,
            the rest are one flick away, and the card is the same height
            whichever you are doing. 5 × 45px measured, plus a few pixels so
            the sixth row is half-visible — a clean bottom edge reads as the
            end of the list, which is the thing that made the old button
            necessary.

            `tabIndex` and a name because it scrolls: a scrollable region
            that cannot be focused is unreachable by keyboard, and
            `npm run a11y` fails it as a serious `scrollable-region-focusable`
            (it caught exactly this on the Cycle symptom table). */}
        {shown.length === 0 ? (
          <Empty>{focus ? `No sessions match ${focusLabel}.` : 'Log a session above to start your record.'}</Empty>
        ) : (
          <div
            className={shown.length > 5 ? 'max-h-[15rem] overflow-y-auto pr-1' : undefined}
            tabIndex={shown.length > 5 ? 0 : undefined}
            role={shown.length > 5 ? 'group' : undefined}
            aria-label={shown.length > 5 ? `All ${shown.length} sessions, scrollable` : undefined}
          >
            <ul className="divide-y divide-surface0">
              {shown.map((p) => (
                <PickleRow key={p.id} p={p} partnerNames={partners.map((x) => x.partner)} venueNames={venues.map((x) => x.location)} onSave={(patch) => updatePickleball(p.id, patch)} onDelete={() => removePickleball(p.id)} />
              ))}
            </ul>
          </div>
        )}
        {shown.length > 5 && (
          <p className="mt-2 text-label text-fg-2">Showing 5 of {shown.length} · scroll for the rest</p>
        )}
        {/* THE WEEKLY GOAL, where you decide whether it was the right number.
            It used to hold a row of its own in zone 1, above the fold, for a
            control touched about once a month — while the thing that actually
            belongs up there, how this week is going against it, is a fact in
            the bar. Here it sits under the sessions it is counting. */}
        <label className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-label text-fg-2">
          Weekly goal
          <Input
            type="number"
            value={data.settings.pickleballGoalGames || ''}
            onChange={(e) => setSettings({ pickleballGoalGames: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="—"
            className="w-16 py-0.5 text-right"
          />
          games a week
        </label>
      </Card>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-3 text-label text-fg-2">
          Rules and reading:
          {RESOURCES.map((r) => (
            <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue hover:underline">
              {r.name} <Icon as={ArrowSquareOut} size="sm" />
            </a>
          ))}
        </p>
            </>)}
            {panel === 'competition' && <CompetitionPanel />}
            {panel === 'results' && (<>
        {/* AM I WINNING. Form and the margins behind it, the win-rate trend
            that put the form in context, and the days that go well — each
            chart beside the figures it explains rather than in a gallery of
            charts one rail row away. */}
        <StatGrid>
        <Facet of="form" active={activeFacet}>{has.recentForm && <RecentFormCard form={form} streaks={streaks} />}</Facet>
        <Facet of="form" active={activeFacet}>{has.forecast && <WinRateForecastCard forecast={forecast} />}</Facet>
        <Facet of="margins" active={activeFacet}>{has.points && <PointDifferentialCard points={points} />}</Facet>
        <Facet of="margins" active={activeFacet}>{has.scoring && <ScoringPerformanceCard scoring={scoring} />}</Facet>
        <Facet of="days" active={activeFacet}>{has.weekday && <WeekdayPerformanceCard weekdays={weekdays} onPick={pick('weekday')} />}</Facet>
        </StatGrid>
        {/* The charts are a grid of their own, BELOW the stat cards, not a
            child of theirs. Nested, the whole `LazyMount` was one cell of the
            outer grid, so three charts stacked in a single column beside a
            column of stat cards — a nested grid is a grid inside one cell, not
            a continuation of the outer one. */}
        <LazyMount minHeight={320}><TrendCharts activeFacet={activeFacet} group="results" /></LazyMount>
            </>)}
            {panel === 'activity' && (<>
        {/* AM I PLAYING. Volume, cadence, effort — and the badges, which are
            counts of exactly those and belong with what produces them. */}
        <StatGrid>
        <Facet of="consistency" active={activeFacet}>{has.consistency && <PlayConsistencyCard consistency={consistency} />}</Facet>
        <Facet of="effort" active={activeFacet}>{has.intensity && <SessionIntensityCard load={load} />}</Facet>
        <Facet of="effort" active={activeFacet}>{has.hours && <TimeOnCourtCard hours={hours} />}</Facet>
        <Facet of="badges" active={activeFacet}><MilestonesCard milestones={milestones} /></Facet>
        </StatGrid>
        <LazyMount minHeight={320}><TrendCharts activeFacet={activeFacet} group="activity" /></LazyMount>
            </>)}
            {panel === 'matchups' && (<>
        <StatGrid>
        {partners.length > 0 && <PartnerChemistryCard partners={partners} onPick={pick('partner')} />}
        {venues.length > 0 && <VenuesCard venues={venues} onPick={pick('venue')} />}
        {opponents.length > 0 && <RivalryRecordCard opponents={opponents} />}
        {matchup.length > 0 && <LevelMatchupCard matchup={matchup} />}
        </StatGrid>
            </>)}
          </div>
        </div>
        </div>
      </section>
  )
}
