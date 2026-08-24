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
                  <button
                    onClick={() => onOpenCollection(c.id)}
                    className="flex w-full items-center gap-3 border-t border-line py-2 text-left text-label hover:bg-ink-2/50"
                  >
                    <span aria-hidden>{c.icon}</span>
                    <span className="min-w-0 flex-1 truncate text-fg-1">{c.name}</span>
                    {c.tasks > 0 && (
                      <span className="num shrink-0 text-caption text-fg-2">
                        {c.done}/{c.tasks} done
                      </span>
                    )}
                    <span className="num w-6 shrink-0 text-right text-fg-2">{c.count}</span>
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
                    className="flex w-full items-center gap-3 border-t border-line py-2 text-left text-label hover:bg-ink-2/50"
                  >
                    <span className="min-w-0 flex-1 truncate text-fg-1">#{t.tag}</span>
                    <span className="num w-6 shrink-0 text-right text-fg-2">{t.count}</span>
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
