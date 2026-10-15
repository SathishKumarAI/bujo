import { useState } from 'react'
import { ArrowSquareOut, Target } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../store'
import { Card, Empty, Input, Pill, Segmented, Textarea } from '../ui'
import { Button } from '../ui/button'
import { CardGrid } from '../shell/CardGrid'
import { LazyMount } from '../LazyMount'
import { useNav } from '../shell/nav'
import { SectionRail } from '../page'
import { cat, onRaised } from '../../lib/colors'
import { todayISO, prettyDay, fromISODay } from '../../lib/date'
import {
  partnerStats, venueStats, opponentRecords, rollingForm, winStreaks, pointDifferential,
  levelMatchup, weekdayPerformance, monthlyGames, winRateForecast, rpeLoad, pickleMilestones,
  pickleHours, scoringStats, playConsistency,
} from '../../lib/pickleball'
import { ACADEMY_DRILLS, DRILL_FIXES } from '../../lib/pickleballAcademy'
import { PracticeTick } from '../coaching/PracticeTick'
import { PB_PANELS } from './panels'
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
function PickleRow({ p, onSave, onDelete }: {
  p: import('../../lib/types').PickleballSession
  onSave: (patch: Partial<import('../../lib/types').PickleballSession>) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [d, setD] = useState({ format: p.format, gamesWon: String(p.gamesWon), gamesLost: String(p.gamesLost), durationMin: p.durationMin != null ? String(p.durationMin) : '', notes: p.notes ?? '' })
  // Above the `editing` early return: a row can be captured and then opened for
  // an edit, and a hook called only on one of those paths is a different hook
  // order on each render.
  const justNew = useJustCaptured().has(PICKLEBALL_KEY(p.id))
  function save() {
    onSave({
      format: d.format,
      gamesWon: Number(d.gamesWon) || 0,
      gamesLost: Number(d.gamesLost) || 0,
      durationMin: d.durationMin ? Number(d.durationMin) : undefined,
      notes: d.notes.trim() || undefined,
    })
    setEditing(false)
  }
  if (editing) {
    return (
      <li className="space-y-2 py-2.5">
        <Segmented value={d.format} onChange={(v) => setD((c) => ({ ...c, format: v }))} options={[{ value: 'doubles', label: 'Doubles' }, { value: 'singles', label: 'Singles' }]} />
        <div className="grid grid-cols-3 gap-2">
          <label className="block text-label text-fg-1">Won<Input type="number" value={d.gamesWon} onChange={(e) => setD((c) => ({ ...c, gamesWon: e.target.value }))} className="mt-1" /></label>
          <label className="block text-label text-fg-1">Lost<Input type="number" value={d.gamesLost} onChange={(e) => setD((c) => ({ ...c, gamesLost: e.target.value }))} className="mt-1" /></label>
          <label className="block text-label text-fg-1">Min<Input type="number" value={d.durationMin} onChange={(e) => setD((c) => ({ ...c, durationMin: e.target.value }))} className="mt-1" /></label>
        </div>
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
      <span className="text-fg-1">{prettyDay(p.date)} <span className="text-fg-2">· {p.format}{p.durationMin ? ` · ${p.durationMin} min` : ''}{p.partner ? ` · with ${p.partner}` : ''}{p.opponent ? ` · vs ${p.opponent}` : ''}{p.location ? ` · ${p.location}` : ''}</span></span>
      <span className="flex items-center gap-2">
        <span style={{ color: onRaised('green') }}>{p.gamesWon}</span>–<span style={{ color: onRaised('red') }}>{p.gamesLost}</span>
        <Button variant="ghost" size="sm" onClick={() => { setD({ format: p.format, gamesWon: String(p.gamesWon), gamesLost: String(p.gamesLost), durationMin: p.durationMin != null ? String(p.durationMin) : '', notes: p.notes ?? '' }); setEditing(true) }} aria-label="Edit session" className="text-fg-2 reveal hover:text-mauve">Edit</Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Remove" className="text-fg-2 reveal hover:text-red">×</Button>
      </span>
    </li>
  )
}


export function PickleballReview({ panel, onPanel }: {
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
  const nav = useNav()
  const { data, updatePickleball, removePickleball } = useJournal()
  const today = todayISO()
  const sessions = [...(data.pickleball ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))

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
  // Deterministic daily rotation, over the academy's twenty-one drills.
  const drill = ACADEMY_DRILLS[(fromISODay(today).getDate() + fromISODay(today).getMonth() * 3) % ACADEMY_DRILLS.length]

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
    recentForm: 'form', forecast: 'form', points: 'form', scoring: 'form',
    intensity: 'effort', hours: 'effort',
    weekday: 'cadence', consistency: 'cadence',
    milestones: 'badges',
    winTrend: 'winning', winLoss: 'winning', byFormat: 'winning',
    perWeek: 'volume', perMonth: 'volume', cumulative: 'volume', heatmap: 'volume',
  }
  /* Plain nouns, because the first set were sentences pretending to be chips:
     "How I am playing · How hard · Turning up" read as broken English in a
     192px row and wrapped to three lines on a phone. A chip is a label, not a
     question — the heading above it already asked the question. */
  const FACET_LABELS: Record<string, string> = {
    form: 'Form', effort: 'Effort', cadence: 'Consistency', badges: 'Badges',
    winning: 'Win rate', volume: 'Volume',
  }
  const FACETS_BY_GROUP: Record<string, string[]> = {
    performance: ['form', 'effort', 'cadence', 'badges'],
    trends: ['winning', 'volume'],
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
        <h2 className="mb-3 text-label text-fg-2">The record</h2>
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
      <section aria-label="Today's drill" className="rounded-card border border-line bg-ink-1 p-3">
        <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="inline-flex items-center gap-1.5 text-label font-medium text-fg-1">
            <Icon as={Target} size="sm" className="text-mauve" /> Today&apos;s drill
          </h3>
          <Button variant="ghost" onClick={() => nav('coaching')} className="h-auto p-0 text-label text-fg-2 hover:text-fg-1 hover:no-underline">
            from Coaching · {ACADEMY_DRILLS.length} more, plus the warm-up →
          </Button>
          <PracticeTick kind="drill" name={drill.name} className="ml-auto" />
        </div>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-body font-medium text-fg-1">{drill.name}</span>
          <Pill color="mauve" size="micro" className="px-2">{drill.skill}</Pill>
        </p>
        {/* The complaint, not the category — and FIRST, because it is the line
            that tells you whether today's drill is your problem. Rendered only
            when the group has one: a lookup that silently returns undefined is
            the trap `pickleballAcademy.test.ts` guards, and an empty line here
            would read as a missing sentence rather than an absent key. */}
        {DRILL_FIXES[drill.skill] && (
          <p className="mt-1 text-label text-fg-1"><span className="text-fg-2">Fixes · </span>{DRILL_FIXES[drill.skill]}</p>
        )}
        <p className="mt-1 text-label text-fg-2">{drill.how}</p>
      </section>

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
            groups={PB_PANELS.map((g) => ({ id: g.id, label: g.label }))}
            value={panel}
            onChange={(id: string | null) => { onPanel(id ?? 'sessions'); setFacet(null) }}
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
      <Card band title="History" subtitle="Tap Edit to fix a score, × to remove" collapsible>
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
        {sessions.length === 0 ? (
          <Empty>Log a session above to start your record.</Empty>
        ) : (
          <div
            className={sessions.length > 5 ? 'max-h-[15rem] overflow-y-auto pr-1' : undefined}
            tabIndex={sessions.length > 5 ? 0 : undefined}
            role={sessions.length > 5 ? 'group' : undefined}
            aria-label={sessions.length > 5 ? `All ${sessions.length} sessions, scrollable` : undefined}
          >
            <ul className="divide-y divide-surface0">
              {sessions.map((p) => (
                <PickleRow key={p.id} p={p} onSave={(patch) => updatePickleball(p.id, patch)} onDelete={() => removePickleball(p.id)} />
              ))}
            </ul>
          </div>
        )}
        {sessions.length > 5 && (
          <p className="mt-2 text-label text-fg-2">Showing 5 of {sessions.length} · scroll for the rest</p>
        )}
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
            {panel === 'performance' && (<>
        {/* "Form & momentum" and "Deeper signals" were two headings over one
            question — how am I playing. Nine cards in one masonry balance into
            even columns; four and five in separate groups could not, and each
            group cost a heading to say something the cards already said. */}
        <CardGrid>
        <Facet of="form" active={activeFacet}>{has.recentForm && <RecentFormCard form={form} streaks={streaks} />}</Facet>
        <Facet of="form" active={activeFacet}>{has.forecast && <WinRateForecastCard forecast={forecast} />}</Facet>
        <Facet of="badges" active={activeFacet}><MilestonesCard milestones={milestones} /></Facet>
        <Facet of="effort" active={activeFacet}>{has.intensity && <SessionIntensityCard load={load} />}</Facet>
        <Facet of="cadence" active={activeFacet}>{has.weekday && <WeekdayPerformanceCard weekdays={weekdays} />}</Facet>
        <Facet of="form" active={activeFacet}>{has.points && <PointDifferentialCard points={points} />}</Facet>
        <Facet of="effort" active={activeFacet}>{has.hours && <TimeOnCourtCard hours={hours} />}</Facet>
        <Facet of="form" active={activeFacet}>{has.scoring && <ScoringPerformanceCard scoring={scoring} />}</Facet>
        <Facet of="cadence" active={activeFacet}>{has.consistency && <PlayConsistencyCard consistency={consistency} />}</Facet>
        
        </CardGrid>
            </>)}
            {panel === 'trends' && (<>
        <LazyMount minHeight={500}><TrendCharts activeFacet={activeFacet} /></LazyMount>
            </>)}
            {panel === 'matchups' && (<>
        <CardGrid>
        {partners.length > 0 && <PartnerChemistryCard partners={partners} />}
        {venues.length > 0 && <VenuesCard venues={venues} />}
        {opponents.length > 0 && <RivalryRecordCard opponents={opponents} />}
        {matchup.length > 0 && <LevelMatchupCard matchup={matchup} />}
        </CardGrid>
            </>)}
          </div>
        </div>
        </div>
      </section>
  )
}
