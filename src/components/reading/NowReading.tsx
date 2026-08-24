import { Band, BandCell, BandRow, Eyebrow, Statement } from '../mod'
import { progressPct, estimatedFinish } from '../../lib/reading'
import { prettyDay, todayISO } from '../../lib/date'
import type { Book } from '../../lib/types'

/**
 * The opening band: the book you are actually reading, and the year's goal.
 *
 * Owns the two orient cells. Which book leads is decided by the view (the
 * first book on the Reading shelf), the same way Mindset's leading principle is
 * `focus[0]` — one rule, stated once, not a "featured" flag to maintain.
 *
 * The old page opened with six stat tiles. Five of them were things you could
 * not act on, and the one that mattered — what am I reading, how far in — was
 * three sections down inside a card in a column.
 */
export function NowReading({
  book,
  goal,
  finishedThisYear,
  projected,
  onGoal,
}: {
  book: Book | undefined
  goal: number
  finishedThisYear: number
  /** Books this pace lands on by year end; `null` when there is no pace yet. */
  projected: number | null
  onGoal: (books: number) => void
}) {
  const pct = book ? progressPct(book) : 0
  const est = book ? estimatedFinish(book, todayISO()) : null

  return (
    <Band>
      <BandRow>
        <BandCell className="basis-[24rem] pt-4">
          <Eyebrow>Reading now</Eyebrow>
          {book ? (
            <>
              <Statement as="h2" className="mt-3">{book.title}</Statement>
              {book.author && <p className="mt-3 text-body text-fg-2">{book.author}</p>}
              <div className="mt-5 max-w-[24rem]">
                <div className="h-1.5 bg-ink-2">
                  <div className="h-full bg-brand transition-[width]" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap justify-between gap-x-6 text-label text-fg-2">
                  <span className="num">{pct}%</span>
                  {book.totalPages && (
                    <span className="num">
                      {book.currentPage ?? 0} / {book.totalPages} pages
                    </span>
                  )}
                </div>
              </div>
              {est && (
                <p className="mt-3 border-t border-line pt-3 text-label text-fg-2">
                  At this pace, done by {prettyDay(est.iso)} · ~{est.daysLeft}d left
                </p>
              )}
            </>
          ) : (
            <>
              <Statement as="h2" className="mt-3 text-fg-3">Nothing on the go</Statement>
              <p className="mt-3 max-w-[46ch] text-body text-fg-2">
                Move a book to the Reading shelf below and it leads here, with its progress and pace.
              </p>
            </>
          )}
        </BandCell>

        <BandCell className="basis-[18rem] pt-4">
          <Eyebrow>This year</Eyebrow>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="num font-display text-display font-medium text-fg-1">{finishedThisYear}</span>
            <span className="text-body text-fg-2">finished</span>
          </div>
          <label className="mt-4 flex items-center gap-2 text-label text-fg-2">
            Goal
            <input
              type="number"
              min={0}
              value={goal || ''}
              placeholder="0"
              onChange={(e) => onGoal(Math.max(0, Number(e.target.value) || 0))}
              className="w-16 border-0 border-b border-line bg-transparent py-0.5 text-right text-fg-1 focus-visible:border-brand focus-visible:outline-none"
            />
            books
          </label>
          {goal > 0 && (
            <>
              <div className="mt-3 h-1.5 max-w-[18rem] bg-ink-2">
                <div
                  className="h-full bg-fg-1 transition-[width]"
                  style={{ width: `${Math.min(100, Math.round((finishedThisYear / goal) * 100))}%` }}
                />
              </div>
              {/* Pace as words, not a coloured chip: "ahead" and "behind" is the
                  whole message, and colour was carrying it alone before. */}
              {projected != null && (
                <p className="mt-2 text-label text-fg-2">
                  On pace for {projected} · {projected >= goal ? 'ahead of goal' : 'behind goal'}
                </p>
              )}
            </>
          )}
        </BandCell>
      </BandRow>
    </Band>
  )
}
