import { useJournal } from '../store'
import { Page } from '../components/shell/Page'
import { NowReading } from '../components/reading/NowReading'
import { Shelves } from '../components/reading/Shelves'
import { Stalled } from '../components/reading/Stalled'
import { ReadingReview } from '../components/reading/ReadingReview'
import { LearningFeed } from '../components/reading/LearningFeed'
import { ReadLater } from '../components/reading/ReadLater'
import {
  averageDaysToFinish,
  projectedBooksThisYear,
  readingStreak,
  readingSummary,
  shelf,
  staleBooks,
} from '../lib/reading'
import { todayISO } from '../lib/date'

/**
 * Reading — what you are reading, the three shelves, and how the year has gone.
 *
 * Composition and decisions only; the bands live in `components/reading/` and
 * the arithmetic in `lib/reading.ts`.
 *
 * The page reads: what am I reading → what is on the shelves → what has stalled
 * → how the year went → what I learned → what I saved. The previous version
 * opened with six stat tiles and buried both charts in a default-collapsed fold.
 */
export function Reading() {
  const { data, setSettings, addBook } = useJournal()
  const books = data.books ?? []
  const today = todayISO()
  const sum = readingSummary(books, today)

  return (
    <Page width="wide" className="gap-0 sm:gap-0">
      <NowReading
        // The leading book is the first on the Reading shelf — one rule, not a
        // "featured" flag to keep in sync.
        book={shelf(books, 'reading')[0]}
        goal={data.settings.readingGoalBooks ?? 0}
        finishedThisYear={sum.finishedThisYear}
        projected={projectedBooksThisYear(books, today)}
        onGoal={(readingGoalBooks) => setSettings({ readingGoalBooks })}
      />

      <Shelves books={books} onAdd={(title, author) => addBook({ title, author, status: 'want' })} />

      <Stalled items={staleBooks(books, today)} />

      <ReadingReview
        books={books}
        today={today}
        streak={readingStreak(books, today)}
        avgDays={averageDaysToFinish(books)}
        pagesRead={sum.pages}
      />

      <LearningFeed books={books} />

      <ReadLater />
    </Page>
  )
}
