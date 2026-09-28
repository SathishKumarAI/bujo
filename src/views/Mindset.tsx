import { useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useJournal } from '../store'
import { PageLayout, SectionRail, StatBar, MicroPips } from '../components/page'
import { CardGrid, SPAN_2 } from '../components/shell/CardGrid'
import { LeadingPrinciple } from '../components/mindset/LeadingPrinciple'
import { PrincipleSpotlight } from '../components/mindset/PrincipleSpotlight'
import { FocusSlots } from '../components/mindset/FocusSlots'
import { StreakCard, PracticeHeatmapCard, CategoryBalanceCard } from '../components/mindset/PracticeCards'
import { LibraryBar } from '../components/mindset/LibraryBar'
import { LibraryList } from '../components/mindset/LibraryList'
import { Card } from '../components/ui'
import { MINDSET_LIBRARY, MINDSET_MAX_FOCUS, principleById } from '../lib/mindset'
import { currentStreak, daysPracticed, practiceData } from '../lib/mindsetPractice'
import {
  MINDSET_CARDS, MINDSET_DEFAULT_GROUP, MINDSET_GROUPS, MINDSET_GROUP_BLURB,
  MINDSET_GROUP_LABEL, type MindsetGroup,
} from '../lib/mindsetCards'
import { addDays, todayISO } from '../lib/date'

/**
 * MINDSET · pick a few principles to actively practise, mark today, and find
 * the next one.
 *
 * This was the worst page in the app on the only number that measures the
 * problem: `space-audit` read **4.2 screens shipped / 4.2 open** at 1440 and
 * **8.8 / 8.8** on a phone, `page-census` read `0 folds · 0 charts · 1 column`
 * at 1440. Nothing was hidden — there was nothing to hide behind. Six bands in
 * a fixed vertical order in a single column on a 1440 screen, with the
 * library's forty-six principles at the bottom of all of it, so every subject
 * was reached by scrolling past every other one.
 *
 * Two changes, and they are the same change:
 *
 * 1. **Onto the page contract**, so the page has zones and the wide layout
 *    splits instead of stacking. The act is "mark today"; the review is the
 *    record and the catalogue.
 * 2. **Off `components/mod/Band`**, which owned "2px between sections, 1px
 *    between cells, zero radius, no surface fill" — a faithful statement of
 *    the design world `DESIGN.md` declares anti-reference in its first
 *    sentence.
 *
 * ## The slot table
 *
 * | Zone | Holds |
 * |---|---|
 * | 1 · orient | In focus · practised today · current run · library size |
 * | 2 · act | The leading principle, and the three focus slots you mark |
 * | 3 · review | A rail over `practice`, `balance`, `library` |
 *
 * **`tier={1180}` and split, not `stacked`.** The measurement that settles it
 * is in `docs/PAGE-WORKFLOW.md` and has now been re-run on four pages: a page
 * with a real act column pays for `stacked` twice over, because `max(act,
 * review)` becomes `act + review`. This act column is a statement card plus
 * three slots with textareas — not Insights' 291px search box.
 *
 * **What was deleted:** nothing. `PracticeBand` was *split* — its calendar and
 * its category chart were two `BandCell`s sharing a row because the Modernist
 * grid wanted a row, and they answer two different questions, so they are two
 * cards in two groups now (`components/mindset/PracticeCards.tsx`).
 *
 * **What was added:** `StreakCard`. `lib/mindsetPractice.ts` has exported
 * `currentStreak` and `daysWithMarks` for as long as this page has existed and
 * nothing on screen read either — the page drew a 26-week grid and left you to
 * count. See `lib/mindsetCards.ts`.
 */
export function Mindset() {
  const { data, addMindsetFocus, setMindsetNote, removeMindsetFocus, toggleMindsetPractice } = useJournal()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [group, setGroup] = useState<MindsetGroup>(MINDSET_DEFAULT_GROUP)

  const today = todayISO()
  const focus = useMemo(() => data.mindsetFocus ?? [], [data.mindsetFocus])
  const log = data.mindsetPractice ?? {}
  const focusedIds = new Set(focus.map((f) => f.principleId))
  const full = focus.length >= MINDSET_MAX_FOCUS

  // Search and category filter are ANDed, and search covers the description as
  // well as the title — half of these principles are recognised by their line
  // ("slow is smooth") rather than by their name.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MINDSET_LIBRARY.filter(
      (p) =>
        (filter === 'All' || p.category === filter) &&
        (!q || `${p.title} ${p.why}`.toLowerCase().includes(q)),
    )
  }, [query, filter])

  const toggleFocus = (principleId: string) => {
    const row = focus.find((f) => f.principleId === principleId)
    if (row) return removeMindsetFocus(row.id)
    if (full) {
      // Not a disabled button: "why can't I add this?" is answered here, once,
      // in words, instead of being left to the user to infer from a grey label.
      toast.info(`Focus is full — ${MINDSET_MAX_FOCUS} at a time. Clear a slot first.`)
      return
    }
    addMindsetFocus(principleId)
  }

  // ── Zone 1 · the four facts ───────────────────────────────────────────────
  const marked = practiceData(log)
  const practisedToday = focus.filter((f) => (log[f.principleId] ?? []).includes(today)).length
  const streak = currentStreak(log, today)
  /* Fourteen days, for the fact that has a shape. The other three are states
     and totals, and a series drawn for those is the chart-with-nothing-to-show
     this repo's design notes name directly. */
  const strip = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(today, -(13 - i))
    return { on: (marked.find((d) => d.date === date)?.value ?? 0) > 0, date }
  })

  // ── Zone 3 · the review zone, one group at a time ─────────────────────────
  const cards: Record<string, ReactNode> = {
    streak: <StreakCard log={log} />,
    heatmap: <PracticeHeatmapCard log={log} today={today} />,
    categories: <CategoryBalanceCard log={log} focusedIds={focusedIds} />,
    library: (
      <Card band title="The library" subtitle={`${MINDSET_LIBRARY.length} principles · tap one to put it in a focus slot`}>
        {/* The bar keeps its own search and its nine category filters, and
            they deliberately did NOT become rail rows. The rail chooses which
            subject you are looking at; a category chooses which principles are
            listed inside one of them. Two axes in one nav is the IA failure
            the page contract names directly. */}
        <LibraryBar
          query={query}
          onQuery={setQuery}
          filter={filter}
          onFilter={setFilter}
          shown={visible.length}
          total={MINDSET_LIBRARY.length}
        />
        <LibraryList principles={visible} focusedIds={focusedIds} full={full} onToggle={toggleFocus} />
      </Card>
    ),
  }
  const shownIn = (g: MindsetGroup) => MINDSET_CARDS.filter((c) => c.group === g && cards[c.id])
  const shown = shownIn(group)

  return (
    <>
      {/* Opens once a day on top of the page it belongs to, rather than
          replacing it — see the component for why it is deliberately not a
          modal dialog. */}
      <PrincipleSpotlight
        principle={focus[0] ? principleById(focus[0].principleId) : undefined}
        cue={focus[0]?.note}
        today={today}
        practisedToday={!!focus[0] && (log[focus[0].principleId] ?? []).includes(today)}
        onPractise={() => focus[0] && toggleMindsetPractice(focus[0].principleId, today)}
      />

      <PageLayout
        tier={1180}
        zone1={
          <StatBar
            facts={[
              { label: 'In focus', value: `${focus.length} of ${MINDSET_MAX_FOCUS}` },
              { label: 'Practised today', value: focus.length ? `${practisedToday} of ${focus.length}` : '—' },
              {
                label: 'Current run',
                value: streak ? `${streak}d` : '—',
                viz: (
                  <MicroPips
                    pips={strip}
                    label={`Last 14 days: practised on ${strip.filter((d) => d.on).length} of them`}
                  />
                ),
              },
              { label: 'Library', value: MINDSET_LIBRARY.length },
            ]}
          />
        }
        zone2={
          <>
            <LeadingPrinciple
              principle={focus[0] ? principleById(focus[0].principleId) : undefined}
              daysPracticed={focus[0] ? daysPracticed(log, focus[0].principleId) : 0}
            />
            <div className="mt-4">
              <Card band title="Today's practice" subtitle="Mark each principle you actually used">
                <FocusSlots
                  focus={focus}
                  practiceLog={log}
                  today={today}
                  onNote={setMindsetNote}
                  onRemove={removeMindsetFocus}
                  onTogglePractice={toggleMindsetPractice}
                />
              </Card>
            </div>
          </>
        }
        zone3={
          <>
            {/* `@container/page` on the OUTER div and the grid on the inner
                one: an element cannot query itself, so putting both on one div
                means the two-column rail layout never fires. And the phone
                column is spelled out because a grid with no
                `grid-template-columns` gets a single implicit `auto` track
                sized to its widest item's min-content — a chip row makes that
                wider than the viewport and scrolls the whole page sideways.
                Both traps are in docs/PAGE-SHAPE.md. */}
            <div className="@container/page">
              <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 @2xl/page:grid-cols-[11rem_minmax(0,1fr)]">
                {/* No "All" row: the three groups do not overlap and there is
                    no page-wide search to cross them, so All could only offer
                    the 8.8-screen phone page this replaces. */}
                <SectionRail
                  label="Mindset sections"
                  groups={MINDSET_GROUPS.map((g) => ({ id: g, label: MINDSET_GROUP_LABEL[g], count: shownIn(g).length }))}
                  value={group}
                  onChange={(id) => setGroup((id as MindsetGroup | null) ?? MINDSET_DEFAULT_GROUP)}
                />
                <div className="min-w-0">
                  <section data-domain={group}>
                    <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
                      <h2 className="font-display text-heading font-medium text-fg-1">{MINDSET_GROUP_LABEL[group]}</h2>
                      <p className="text-label text-fg-2">{MINDSET_GROUP_BLURB[group]}</p>
                      <span className="num ml-auto text-label text-fg-3">{shown.length}</span>
                    </div>
                    {/* Two columns is the ceiling: `CardGrid` asks the
                        *viewport*, so at 1600 its `2xl:grid-cols-3` would fire
                        inside this split column and resolve to three tracks
                        too narrow for a 26-week calendar. */}
                    <CardGrid className="2xl:grid-cols-2">
                      {shown.map((c) => (
                        <div key={c.id} data-card={c.id} className={c.wide ? `min-w-0 ${SPAN_2}` : 'min-w-0'}>
                          {cards[c.id]}
                        </div>
                      ))}
                    </CardGrid>
                  </section>
                </div>
              </div>
            </div>
          </>
        }
      />
    </>
  )
}
