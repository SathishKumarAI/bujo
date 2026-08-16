import { Star } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Band, BandCell, BandRow } from '../mod'
import { finishedByMonth, ratingDistribution, yearInBooks } from '../../lib/reading'
import type { Book } from '../../lib/types'

/**
 * The review zone: how the year has gone.
 *
 * Owns two charts and the year's facts. Both charts are plain DOM — twelve bars
 * and five bars.
 *
 * These used to live behind a default-collapsed fold ("Reading analytics"), and
 * a fold is where a chart goes to be forgotten: `npm run a11y` never opened it
 * either, so it went unscanned for as long as it existed. The redesign has no
 * folds — content that is not worth showing is not worth keeping.
 */
export function ReadingReview({
  books,
  today,
  streak,
  avgDays,
  pagesRead,
}: {
  books: Book[]
  today: string
  streak: number
  /** Mean days between starting and finishing a book; `null` with none finished. */
  avgDays: number | null
  pagesRead: number
}) {
  const byMonth = finishedByMonth(books, today)
  const maxMonth = Math.max(1, ...byMonth.map((m) => m.count))
  const wrapped = yearInBooks(books, today)
  const dist = ratingDistribution(books)
  const rated = dist.reduce((a, r) => a + r.count, 0)

  return (
    <Band>
      <BandRow>
        <BandCell className="basis-[24rem]">
          <h2 className="font-display text-heading font-medium text-fg-1">Finished by month · {today.slice(0, 4)}</h2>
          <p className="mt-1 mb-4 text-label text-fg-2">One bar per month, this calendar year.</p>
          {/* `items-stretch`, not `items-end`: cross-axis `end` collapses each
              column to its label and leaves the flex-1 track at 0px — the bug
              that made six charts in this app render flat and look deliberate. */}
          <div
            className="flex items-stretch gap-1.5"
            style={{ height: 84 }}
            role="img"
            aria-label={`Books finished per month: ${byMonth.map((m) => `${m.label} ${m.count}`).join(', ')}`}
          >
            {byMonth.map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={`w-full ${m.count ? 'bg-fg-1' : 'bg-ink-2'}`}
                    title={`${m.label}: ${m.count}`}
                    style={{ height: m.count ? `${Math.max(8, (m.count / maxMonth) * 100)}%` : '2px' }}
                  />
                </div>
                <span className="text-micro text-fg-3">{m.label[0]}</span>
              </div>
            ))}
          </div>

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-4 text-label">
            <div>
              <dt className="text-fg-2">Reading streak</dt>
              <dd className="num text-fg-1">{streak ? `${streak} days` : '—'}</dd>
            </div>
            <div>
              <dt className="text-fg-2">Avg days per book</dt>
              <dd className="num text-fg-1">{avgDays != null ? `${avgDays} days` : '—'}</dd>
            </div>
            <div>
              <dt className="text-fg-2">Pages read</dt>
              <dd className="num text-fg-1">{pagesRead.toLocaleString()}</dd>
            </div>
          </dl>
        </BandCell>

        <BandCell className="basis-[20rem]">
          {wrapped ? (
            <>
              <h2 className="font-display text-heading font-medium text-fg-1">{wrapped.year} in books</h2>
              <p className="mt-1 mb-4 text-label text-fg-2">Finished only — the shelf you cleared.</p>
              <dl className="flex flex-wrap gap-x-8 gap-y-3 text-label">
                <div>
                  <dt className="text-fg-2">Books</dt>
                  <dd className="num font-display text-heading text-fg-1">{wrapped.count}</dd>
                </div>
                {/* "Pages finished", not "Pages read": the other number on this
                    page counts how far into the current book you are. Both were
                    once labelled the same and showed different figures. */}
                <div>
                  <dt className="text-fg-2">Pages finished</dt>
                  <dd className="num font-display text-heading text-fg-1">{wrapped.pages.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-fg-2">Avg rating</dt>
                  <dd className="num font-display text-heading text-fg-1">
                    {wrapped.avgRating ? `${wrapped.avgRating.toFixed(1)}★` : '—'}
                  </dd>
                </div>
              </dl>

              {(wrapped.topRated || wrapped.longest) && (
                <div className="mt-4 space-y-1 border-t border-line pt-3 text-label text-fg-2">
                  {wrapped.topRated && <p>Top-rated · {wrapped.topRated.title}</p>}
                  {wrapped.longest && <p>Longest read · {wrapped.longest.title}</p>}
                </div>
              )}

              {rated > 0 && (
                <div className="mt-4 border-t border-line pt-3">
                  <p className="mb-2 text-caption tracking-[0.08em] text-fg-3 uppercase">Rating distribution · {rated} rated</p>
                  {[...dist].reverse().map((r) => (
                    <div key={r.stars} className="grid grid-cols-[3rem_1fr_1.5rem] items-center gap-3 py-1 text-label">
                      <span className="flex items-center gap-0.5 text-fg-2">
                        {r.stars}
                        <Icon as={Star} size="sm" active className="text-yellow" />
                      </span>
                      <span className="block h-2.5 bg-ink-2">
                        <span className="block h-full bg-fg-1" style={{ width: `${(r.count / rated) * 100}%` }} />
                      </span>
                      <span className="num text-right text-fg-2">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="font-display text-heading font-medium text-fg-1">{today.slice(0, 4)} in books</h2>
              <p className="mt-1 text-label text-fg-2">
                Nothing finished this year yet. The recap fills in as books reach the Finished shelf.
              </p>
            </>
          )}
        </BandCell>
      </BandRow>
    </Band>
  )
}
