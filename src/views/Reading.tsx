import { useState, type ReactNode } from 'react'
import { useJournal } from '../store'
import { PageLayout, SectionRail, StatBar, MicroBars } from '../components/page'
import { CardGrid, SPAN_2 } from '../components/shell/CardGrid'
import { NowReading } from '../components/reading/NowReading'
import { AddBookCard, ShelfCard } from '../components/reading/Shelves'
import { StalledCard } from '../components/reading/Stalled'
import { FinishedByMonthCard, YearInBooksCard } from '../components/reading/ReadingReview'
import { LearningsCard } from '../components/reading/LearningFeed'
import { ReadLaterCard } from '../components/reading/ReadLater'
import {
  averageDaysToFinish,
  finishedByMonth,
  pagesRead as pagesReadOf,
  projectedBooksThisYear,
  readingStreak,
  readingSummary,
  shelf,
  staleBooks,
} from '../lib/reading'
import {
  READING_CARDS, READING_DEFAULT_GROUP, READING_GROUPS, READING_GROUP_BLURB,
  READING_GROUP_LABEL, type ReadingGroup,
} from '../lib/readingCards'
import { todayISO } from '../lib/date'

/**
 * READING · what you are reading, the three shelves, and how the year went.
 *
 * Six `mod/Band` sections in a fixed vertical order — the same shape as
 * Mindset, one third the length. `space-audit` read **1.7 shipped / 1.9 open**
 * at 1440 and **3.1 / 3.9** on a phone, `page-census` read
 * `3 folds · 0 charts · 1 column` at 1440: one column on a 1440 screen, so the
 * year's chart was reached by scrolling past all three shelves.
 *
 * ## The slot table
 *
 * | Zone | Holds |
 * |---|---|
 * | 1 · orient | Reading now · finished this year · pages · stalled |
 * | 2 · act | Add a book, and the book you are on with its pace and goal |
 * | 3 · review | A rail over `shelves`, `year`, `stalled`, `notes` |
 *
 * **Each shelf is its own card.** The three were `BandCell`s in a row, which
 * is the Modernist grid deciding the layout rather than the content: a shelf
 * is a list with its own count and its own emptiness, and three of them in one
 * box share a heading they do not share a subject with. As cards the grid
 * packs them at whatever width there is, and an empty shelf says so in its own
 * frame instead of leaving a third of a card blank.
 *
 * **Two cards used to `return null`.** `Stalled` at zero stalled books and
 * `LearningFeed` at zero learnings — harmless in a vertical stack and not
 * harmless under a rail, where a card that renders nothing makes its row's
 * count a lie and a group of one vanishes into a heading over an empty grid.
 * Both render a frame now, which is the contract's rule regardless: a visual
 * that disappears until it has data is invisible to exactly the people who
 * have not started.
 *
 * `tier={1180}` and split, not `stacked` — same measurement as the other four
 * rail pages, recorded in `docs/PAGE-WORKFLOW.md`.
 */
export function Reading() {
  const { data, setSettings, addBook } = useJournal()
  const books = data.books ?? []
  const today = todayISO()
  const sum = readingSummary(books, today)
  const [group, setGroup] = useState<ReadingGroup>(READING_DEFAULT_GROUP)

  const stalled = staleBooks(books, today)
  const reading = shelf(books, 'reading')
  const byMonth = finishedByMonth(books, today)
  const streak = readingStreak(books, today)
  const avgDays = averageDaysToFinish(books)
  const pages = pagesReadOf(books)

  const cards: Record<string, ReactNode> = {
    'shelf-reading': <ShelfCard label="Reading" books={reading} />,
    'shelf-want': <ShelfCard label="Want to read" books={shelf(books, 'want')} />,
    'shelf-finished': <ShelfCard label="Finished" books={shelf(books, 'finished')} />,

    bymonth: <FinishedByMonthCard books={books} today={today} streak={streak} avgDays={avgDays} pagesRead={pages} />,
    wrapped: <YearInBooksCard books={books} today={today} />,

    stalled: <StalledCard items={stalled} />,

    learnings: <LearningsCard books={books} />,
    later: <ReadLaterCard />,
  }
  const shownIn = (g: ReadingGroup) => READING_CARDS.filter((c) => c.group === g && cards[c.id])
  const shown = shownIn(group)

  return (
    <PageLayout
      tier={1180}
      zone1={
        <StatBar
          facts={[
            { label: 'Reading now', value: reading[0]?.title ?? 'Nothing on the go', prose: true },
            {
              label: 'Finished · year',
              value: data.settings.readingGoalBooks ? `${sum.finishedThisYear} of ${data.settings.readingGoalBooks}` : sum.finishedThisYear,
              /* Twelve bars, one per month. "Seven books" is a different year
                 depending on whether it was one a month or all in January,
                 and the figure alone cannot say which. */
              viz: (
                <MicroBars
                  bars={byMonth.map((m) => ({ value: m.count }))}
                  label={`Books finished per month this year: ${byMonth.map((m) => `${m.label} ${m.count}`).join(', ')}`}
                />
              ),
            },
            { label: 'Pages read', value: pages },
            { label: 'Stalled', value: stalled.length },
          ]}
        />
      }
      zone2={
        <>
          <AddBookCard onAdd={(title, author) => addBook({ title, author, status: 'want' })} />
          <div className="mt-4">
            <NowReading
              // The leading book is the first on the Reading shelf — one rule,
              // not a "featured" flag to keep in sync.
              book={reading[0]}
              goal={data.settings.readingGoalBooks ?? 0}
              finishedThisYear={sum.finishedThisYear}
              projected={projectedBooksThisYear(books, today)}
              onGoal={(readingGoalBooks) => setSettings({ readingGoalBooks })}
            />
          </div>
        </>
      }
      zone3={
        <>
          {/* `@container/page` on the OUTER div and the grid on the inner one:
              an element cannot query itself. The phone column is spelled out
              because a grid with no `grid-template-columns` gets one implicit
              `auto` track sized to its widest item's min-content, and a chip
              row makes that wider than the viewport. Both in
              docs/PAGE-SHAPE.md. */}
          <div className="@container/page">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-3 @2xl/page:grid-cols-[11rem_minmax(0,1fr)]">
              {/* No "All" row: the four groups do not overlap and there is no
                  page-wide search to cross them. */}
              <SectionRail
                label="Reading sections"
                groups={READING_GROUPS.map((g) => ({ id: g, label: READING_GROUP_LABEL[g], count: shownIn(g).length }))}
                value={group}
                onChange={(id) => setGroup((id as ReadingGroup | null) ?? READING_DEFAULT_GROUP)}
              />
              <div className="min-w-0">
                <section data-domain={group}>
                  <div className="mb-3 flex flex-wrap items-baseline gap-x-3 border-b border-line pb-1.5">
                    <h2 className="font-display text-heading font-medium text-fg-1">{READING_GROUP_LABEL[group]}</h2>
                    <p className="text-label text-fg-2">{READING_GROUP_BLURB[group]}</p>
                    <span className="num ml-auto text-label text-fg-3">{shown.length}</span>
                  </div>
                  {/* Two columns is the ceiling: `CardGrid` asks the viewport,
                      so at 1600 its `2xl:grid-cols-3` would fire inside this
                      split column and resolve to tracks too narrow for a
                      twelve-bar chart. */}
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
  )
}
