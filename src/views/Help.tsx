import { ArrowRight, MagnifyingGlass } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useMemo, useState } from 'react'
import { Card, Empty, Input, Pill } from '../components/ui'
import { Button } from '../components/ui/button'
import { PageLayout } from '../components/page/PageLayout'
import { StatBar } from '../components/page/StatBar'
import { useNav } from '../components/shell/nav'
import { BULLET_LEGEND } from '../lib/bullets'
import { onRaised } from '../lib/colors'
import { GUIDE, TUTORIALS, guideByGroup, searchGuide, type GuideCard, type Tutorial } from '../lib/guide'

/**
 * GUIDE · the page a stuck user opens.
 *
 * This was 1,127px of hand-written prose in one card — no search, no anchors,
 * no links out, and it named fifteen of the app's twenty-four screens. Every
 * finding in `docs/pages/help.md` traces to the same cause: the page carried
 * its own copy of what each screen does, so it drifted from the app and there
 * was nothing to notice. All of that prose now lives in `lib/guide.ts`, keyed
 * off `VIEW_CHROME` and `SECTIONS`, with a test that fails when a view is added
 * without a guide entry.
 *
 * The three-zone contract bends slightly here and it is worth naming how. This
 * page records nothing, so zone 3 is not "what you have recorded" — it is the
 * reference body: the bullet grammar, then the searchable catalogue. Zone 2 is
 * still the act, and the act on a guide is **start**, not read.
 */
export function Help() {
  const nav = useNav()
  const [query, setQuery] = useState('')
  const [track, setTrack] = useState(TUTORIALS[0].id)

  const results = useMemo(() => searchGuide(query), [query])
  const groups = useMemo(() => guideByGroup(results), [results])
  const searching = query.trim().length > 0
  const tutorial = TUTORIALS.find((t) => t.id === track) ?? TUTORIALS[0]

  return (
    <PageLayout
      tier={1180}
      zone1={
        <StatBar
          facts={[
            { label: 'Features', value: searching ? `${results.length} / ${GUIDE.length}` : String(GUIDE.length) },
            { label: 'Tutorials', value: String(TUTORIALS.length) },
            {
              label: 'Your journal',
              value: 'This device only — back it up',
              prose: true,
              onClick: () => nav('settings'),
            },
          ]}
        />
      }
      zone2={<StartHere tutorial={tutorial} tracks={TUTORIALS} onTrack={setTrack} onGo={nav} />}
      zone3={
        <div className="space-y-4">
          <Bullets />
          <Card
            band
            title="Every feature"
            subtitle="What it is, why it exists, and the first three things to do"
            hideInfo
            right={
              <div className="relative w-full max-w-[16rem] sm:w-64">
                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-fg-2">
                  <AppIcon as={MagnifyingGlass} size="sm" />
                </span>
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="backup · habit · macros…"
                  aria-label="Search the guide"
                  className="pl-8"
                />
              </div>
            }
          >
            {results.length === 0 ? (
              <Empty
                icon={MagnifyingGlass}
                hint="Try one word rather than a sentence — the search wants every word to match."
                action={{ label: 'Clear the search', onClick: () => setQuery('') }}
              >
                Nothing in the guide matches “{query}”
              </Empty>
            ) : (
              <div className="space-y-5">
                {groups.map((g) => (
                  <section key={g.id} aria-label={g.label}>
                    <h3 className="mb-2 text-micro tracking-wider text-fg-2 uppercase">
                      {g.label} · {g.cards.length}
                    </h3>
                    <div className="space-y-2">
                      {g.cards.map((c) => (
                        // Remounted when the search turns on or off so a hit
                        // opens itself: a result you still have to click is a
                        // search that has only narrowed the same long scroll.
                        <Feature key={`${c.view}-${searching}`} card={c} open={searching} onGo={nav} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </Card>
        </div>
      }
    />
  )
}

/** Zone 2. Pick a track, then work its steps — each one opens where it happens. */
function StartHere({
  tutorial,
  tracks,
  onTrack,
  onGo,
}: {
  tutorial: Tutorial
  tracks: Tutorial[]
  onTrack: (id: string) => void
  onGo: (view: GuideCard['view']) => void
}) {
  return (
    <Card band title="Start here" subtitle={tutorial.blurb} hideInfo>
      {/* Not `Segmented`: three labels of this length are unreadable in a
          segmented control at 380px, and this is a list of documents rather
          than a mode the page is in. */}
      <div role="tablist" aria-label="Tutorials" className="mb-3 flex flex-col gap-1">
        {tracks.map((t) => {
          const on = t.id === tutorial.id
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => onTrack(t.id)}
              // The selected row is `ink-2` + `shadow-raise`, which is the
              // idiom `SectionTabs` already uses for an active tab — not
              // `ink-3`. `ink-3` is 24% of the foreground over the card and
              // `fg-2` on it measures **4.07:1**, which `npm run a11y` caught
              // on the effort label in four themes at once. The ground moved
              // out from under the small text; the fix is the ground.
              className={`flex items-baseline justify-between gap-2 rounded-card px-3 py-2 text-left transition-colors ${
                on ? 'bg-ink-2 text-foreground shadow-raise' : 'text-fg-2 hover:bg-ink-2 hover:text-fg-1'
              }`}
            >
              <span className="text-body font-medium">{t.title}</span>
              <span className="shrink-0 text-caption text-fg-2">{t.effort}</span>
            </button>
          )
        })}
      </div>

      <ol className="space-y-3">
        {tutorial.steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span
              className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-pill text-micro font-medium"
              style={{ background: 'var(--color-surface1)', color: onRaised('mauve') }}
              aria-hidden
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-body font-medium text-fg-1">{s.title}</p>
              <p className="mt-0.5 text-label leading-relaxed text-fg-2">{s.body}</p>
              {s.to && (
                <Button
                  variant="ghost"
                  onClick={() => onGo(s.to as GuideCard['view'])}
                  className="mt-1 h-auto justify-start gap-1 p-0 text-label text-blue"
                >
                  Open it <AppIcon as={ArrowRight} size="sm" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  )
}

/**
 * One feature, folded.
 *
 * Collapsed it shows the name and the *why* — one sentence, which is what makes
 * a list of twenty-four scannable. The what and the how are behind the fold,
 * and search forces it open.
 */
function Feature({ card, open, onGo }: { card: GuideCard; open: boolean; onGo: (view: GuideCard['view']) => void }) {
  return (
    <Card
      collapsible
      defaultCollapsed={!open}
      hideInfo
      title={card.navLabel}
      subtitle={card.why}
      right={card.navLabel !== card.title ? <Pill tone="muted" size="caption">{card.title}</Pill> : undefined}
    >
      <p className="text-body leading-relaxed text-fg-2">{card.what}</p>
      <p className="mt-3 mb-1.5 text-micro tracking-wider text-fg-2 uppercase">How to use it</p>
      <ol className="space-y-1.5">
        {card.how.map((step, i) => (
          <li key={step} className="flex gap-2.5 text-label leading-relaxed text-fg-1">
            <span className="shrink-0 font-mono text-fg-2" aria-hidden>{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <Button onClick={() => onGo(card.view)} variant="secondary" size="sm" className="mt-3 gap-1.5">
        Open {card.navLabel} <AppIcon as={ArrowRight} size="sm" />
      </Button>
    </Card>
  )
}

/**
 * The bullet grammar. Pinned above the catalogue because it is the single
 * most-looked-up thing on this page and it used to sit in the lower half.
 */
function Bullets() {
  return (
    <Card band title="The bullets" subtitle="Rapid logging, the whole grammar" hideInfo>
      <p className="mb-3 text-body text-fg-1">
        On <strong>Today</strong>, type into the add bar and press Enter. Start a line with a letter
        to choose the kind, and click the glyph on any task to cycle its status.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {BULLET_LEGEND.map((b) => (
          <li key={b.label} className="flex items-center gap-3 rounded-card bg-ink-2 px-3 py-1.5 text-body">
            <span className="w-5 text-center font-mono" style={{ color: onRaised('mauve') }}>{b.glyph}</span>
            <span className="text-fg-1">{b.label}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-card bg-ink-0 p-3 text-body text-fg-2">
        <p className="font-medium text-fg-1">Quick-capture prefixes</p>
        <p className="mt-1">
          <code>t</code> task · <code>e</code> event · <code>n</code> note · <code>*</code> important ·{' '}
          <code>^</code> memory · <code>#tag</code> to tag.
        </p>
        <p className="mt-1 text-fg-2">
          So <code>* t book the campsite #travel</code> logs an important task tagged travel.
        </p>
      </div>
    </Card>
  )
}
