import { Band, BandCell, BandRow, Eyebrow } from '../mod'

/**
 * The Index — a bullet journal's table of contents, and this page's orient zone.
 *
 * Owns the two jump lists (collections, tag pages) and nothing else; the view
 * owns what "jump" does, because the target lives further down the same page.
 *
 * Renders even when both lists are empty. The old page hid the whole Index
 * until something existed to put in it, which meant a new journal gave no clue
 * that collections or tags were a thing at all.
 */
export function IndexBand({
  collections,
  tags,
  onOpenCollection,
  onOpenTag,
}: {
  collections: { id: string; name: string; icon: string; count: number; tasks: number; done: number }[]
  tags: { tag: string; count: number }[]
  onOpenCollection: (id: string) => void
  onOpenTag: (tag: string) => void
}) {
  /** The scale every bar is drawn against — the biggest collection is full. */
  const busiest = Math.max(0, ...collections.map((c) => c.count))
  /** Tags get their own maximum; see the note on the tag bar. */
  const hottestTag = Math.max(0, ...tags.slice(0, 20).map((t) => t.count))

  return (
    <Band>
      {/* The band is titled, so the two cells below can keep their short
          eyebrows without "Collections" appearing twice on the page with two
          different meanings — here it is a jump list, further down it is the
          list itself. */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-5">
        <h2 className="font-display text-heading font-medium text-fg-1">Index</h2>
        <Eyebrow className="tracking-[0.1em]">The journal's table of contents</Eyebrow>
      </div>
      <BandRow>
        <BandCell className="basis-[20rem] pt-4">
          <Eyebrow>Collections</Eyebrow>
          {collections.length === 0 ? (
            <p className="mt-3 text-label text-fg-2">None yet — create one below to group related entries.</p>
          ) : (
            <ul className="mt-2">
              {collections.map((c) => (
                <li key={c.id}>
                  {/* A fixed three-track grid, not a flex row.
                      The count sat at the end of a `flex` line, so its left
                      edge moved with the length of the name and the presence of
                      the "3/7 done" note — a column of numbers that did not line
                      up. Tracks put every row's bar and every row's total in the
                      same place whatever the name does. */}
                  <button
                    onClick={() => onOpenCollection(c.id)}
                    className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_4.5rem_1.75rem] items-center gap-x-3 border-t border-line py-2 text-left text-label hover:bg-ink-2/50"
                  >
                    <span aria-hidden>{c.icon}</span>
                    <span className="min-w-0 truncate text-fg-1">{c.name}</span>
                    {c.tasks > 0 ? (
                      <span className="num shrink-0 text-caption text-fg-2">
                        {c.done}/{c.tasks} done
                      </span>
                    ) : (
                      <span />
                    )}
                    {/* SIZE, not just the number.
                        The index answered "how many are in here" with a bare
                        numeral per row, which reads only if you compare them one
                        at a time. One bar per row, scaled to the largest
                        collection, answers "where is most of my stuff" without
                        reading anything. Magnitude is a length — one hue, no
                        axis, no legend; the number beside it stays for the exact
                        value, so nothing is encoded by colour alone.
                        `aria-hidden`: the count next to it already says it, and
                        a screen reader does not want the same fact twice. */}
                    <span aria-hidden className="h-1.5 overflow-hidden rounded-pill bg-ink-2">
                      <span
                        className="block h-full rounded-pill bg-brand/70"
                        style={{ width: `${busiest > 0 ? Math.max(6, (c.count / busiest) * 100) : 0}%` }}
                      />
                    </span>
                    <span className="num text-right text-fg-2">{c.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </BandCell>

        <BandCell className="basis-[20rem] pt-4">
          <Eyebrow>Tag pages</Eyebrow>
          {tags.length === 0 ? (
            <p className="mt-3 text-label text-fg-2">None yet — tag an entry with #something and it files itself here.</p>
          ) : (
            <ul className="mt-2">
              {/* Twenty, and the count says so. An index that silently stops at
                  twenty is worse than one that admits it. */}
              {tags.slice(0, 20).map((t) => (
                <li key={t.tag}>
                  <button
                    onClick={() => onOpenTag(t.tag)}
                    className="grid w-full grid-cols-[minmax(0,1fr)_4.5rem_1.75rem] items-center gap-x-3 border-t border-line py-2 text-left text-label hover:bg-ink-2/50"
                  >
                    <span className="min-w-0 truncate text-fg-1">#{t.tag}</span>
                    {/* Same bar, same scale rules, its own maximum — tags and
                        collections are different populations and sharing a
                        scale would make the smaller one look empty. */}
                    <span aria-hidden className="h-1.5 overflow-hidden rounded-pill bg-ink-2">
                      <span
                        className="block h-full rounded-pill bg-teal/70"
                        style={{ width: `${hottestTag > 0 ? Math.max(6, (t.count / hottestTag) * 100) : 0}%` }}
                      />
                    </span>
                    <span className="num text-right text-fg-2">{t.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tags.length > 20 && (
            <p className="mt-2 text-caption text-fg-3">Showing the 20 most-used of {tags.length} tags.</p>
          )}
        </BandCell>
      </BandRow>
    </Band>
  )
}
