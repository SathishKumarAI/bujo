import { useId, useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, CaretDown, MagnifyingGlass } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Input } from '../ui'
import { Cell, Cells } from '../ui/cells'
import { SectionRail } from '../page/SectionRail'
import { useNav } from '../shell/nav'
import { VIEW_CHROME, type ViewId } from '../shell/viewChrome'
import { BULLET_LEGEND, QUICK_CAPTURE, RAPID_LOG_HOW } from '../../lib/bullets'
import { GUIDE, TUTORIALS, asPoints, guideByGroup, searchGuide, type GuideCard } from '../../lib/guide'
import { GLOSSARY, glossaryByDomain } from '../../lib/glossary'

/**
 * HELP ON A PHONE — a reading page drawn as an app's help screen.
 *
 * OWNS: the phone drawing of `views/Help.tsx` — one select for everything,
 * then grouped rows that open in place. Look: `styles/phone-help.css`.
 * DOES NOT OWN: any copy. Every word comes from `lib/guide.ts`,
 * `lib/bullets.ts` and `lib/glossary.ts`, which the desktop reads too.
 *
 * Why its own drawing (COD-563, measured at 390px, `?demo=1`): the desktop shape
 * stacked a tutorial tablist, the bullets, a folded glossary with a SECOND
 * rail inside it, and the feature catalogue with a third — 3.3 screens before
 * the catalogue's own select, which sat at the very bottom. Here the rail is
 * the only navigation: its first three rows are those reference blocks, the
 * rest the feature groups, and one panel shows at a time.
 */
export function HelpPhone() {
  const nav = useNav()
  const [query, setQuery] = useState('')
  const [panel, setPanel] = useState('start')
  const results = useMemo(() => searchGuide(query), [query])
  const searching = query.trim().length > 0
  const groups = useMemo(() => guideByGroup(), [])

  const rows = [
    { id: 'start', label: 'Start here' },
    { id: 'bullets', label: 'The bullets', count: BULLET_LEGEND.length },
    { id: 'abbr', label: 'Abbreviations', count: GLOSSARY.length },
    ...groups.map((g) => ({ id: g.id, label: g.label, count: g.cards.length })),
  ]
  const group = groups.find((g) => g.id === panel)

  return (
    <div className="help-phone">
      <label className="help-search">
        <span className="sr-only">Search the guide</span>
        <Icon as={MagnifyingGlass} size="sm" className="pointer-events-none text-fg-2" />
        <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search · backup, habit, macros" />
      </label>
      <SectionRail
        label="Help sections"
        groups={rows}
        // A query crosses every group, so the select reads "Matches" while one
        // is typed; picking a section clears it.
        value={searching ? null : panel}
        onChange={(id) => { if (id) { setPanel(id); setQuery('') } }}
        allCount={searching ? results.length : undefined}
        allLabel="Matches"
      />

      {searching ? (
        results.length === 0 ? (
          <div className="cells">
            <p className="note-row">Nothing matches “{query}”. Try one word — every word has to match.</p>
            <button type="button" className="cell help-open" onClick={() => setQuery('')}>Clear the search</button>
          </div>
        ) : (
          guideByGroup(results).map((g) => (
            <Cells key={g.id} title={g.label} aside={String(g.cards.length)}>
              {/* A hit opens itself — a result you still have to tap has only
                  narrowed the scroll. */}
              {g.cards.map((c) => <FeatureRow key={c.view} card={c} open onGo={nav} />)}
            </Cells>
          ))
        )
      ) : panel === 'start' ? (
        <StartHere onGo={nav} />
      ) : panel === 'bullets' ? (
        <Bullets />
      ) : panel === 'abbr' ? (
        <Abbreviations />
      ) : group ? (
        <section aria-label={`${group.label} features`} className="cells">
          {group.cards.map((c) => <FeatureRow key={c.view} card={c} onGo={nav} />)}
        </section>
      ) : null}
    </div>
  )
}

/** The name a step's "Open" button says: the tab's own label when it has one. */
function screenName(view: ViewId): string {
  return GUIDE.find((c) => c.view === view)?.navLabel ?? VIEW_CHROME[view].title
}

/** A row that opens in place. A button with `aria-expanded`, not `<details>`, so the a11y gate opens it. */
function Fold({ title, subtitle, defaultOpen = false, children }: {
  title: ReactNode
  subtitle?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className="help-row">
      <button type="button" className="cell" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-medium text-fg-1">{title}</span>
          {subtitle && <span className="block text-label text-fg-2">{subtitle}</span>}
        </span>
        <Icon as={CaretDown} size="sm" className={`shrink-0 text-fg-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div id={id} className="help-fold">{children}</div>}
    </div>
  )
}

function OpenButton({ view, onGo }: { view: ViewId; onGo: (v: GuideCard['view']) => void }) {
  return (
    <button type="button" className="help-open" onClick={() => onGo(view as GuideCard['view'])}>
      Open {screenName(view)} <Icon as={ArrowRight} size="sm" />
    </button>
  )
}

function Points({ items }: { items: string[] }) {
  return <ul className="help-points">{items.map((p) => <li key={p}>{p}</li>)}</ul>
}

function StartHere({ onGo }: { onGo: (v: GuideCard['view']) => void }) {
  return (
    <>
      <Cells title="Tutorials">
        {/* All three shut: open, the first one alone was 1.4 screens and
            pushed the other two tracks off the bottom. */}
        {TUTORIALS.map((t) => (
          <Fold key={t.id} title={t.title} subtitle={t.effort}>
            <p className="text-label text-fg-2">{t.blurb}</p>
            <ol className="help-steps">
              {t.steps.map((s, i) => (
                <li key={s.title} className="help-step">
                  <span className="help-step-n" aria-hidden>{i + 1}</span>
                  <div className="min-w-0">
                    <h3 className="text-body font-semibold text-fg-1">{s.title}</h3>
                    <Points items={s.body} />
                    {s.to && <OpenButton view={s.to} onGo={onGo} />}
                  </div>
                </li>
              ))}
            </ol>
          </Fold>
        ))}
      </Cells>
      <Cells title="Your journal">
        <Cell title="Back it up" subtitle="It lives on this device only" onPress={() => onGo('settings')} />
      </Cells>
    </>
  )
}

function Bullets() {
  return (
    <>
      <h2 className="sr-only">The bullets</h2>
      <ul className="cells" aria-label="How rapid logging works">
        {RAPID_LOG_HOW.map((p) => <li key={p} className="note-row">{p}</li>)}
      </ul>
      <Cells title="Glyphs">
        {BULLET_LEGEND.map((b) => (
          <Cell key={b.label} lead={<span className="help-glyph" aria-hidden>{b.glyph}</span>} title={b.label} />
        ))}
      </Cells>
      <Cells title="Quick-capture prefixes">
        {QUICK_CAPTURE.map((q) => (
          <Cell key={q.key} lead={<code className="help-glyph">{q.key}</code>} title={q.meaning} />
        ))}
        <p className="note-row">
          So <code>* t book the campsite #travel</code> logs an important task tagged travel.
        </p>
      </Cells>
    </>
  )
}

function Abbreviations() {
  return (
    <>
      <h2 className="sr-only">The abbreviations</h2>
      {glossaryByDomain().map((g) => (
        <Cells key={g.domain} title={g.label} aside={String(g.terms.length)}>
          {g.terms.map((t) => (
            <Fold key={t.term} title={t.term} subtitle={t.expansion}>
              <Points items={asPoints(t.long)} />
              {t.source && (
                <a href={t.source.url} target="_blank" rel="noreferrer" className="help-open">
                  {t.source.label} <Icon as={ArrowRight} size="sm" />
                </a>
              )}
            </Fold>
          ))}
        </Cells>
      ))}
    </>
  )
}

function FeatureRow({ card, open = false, onGo }: { card: GuideCard; open?: boolean; onGo: (v: GuideCard['view']) => void }) {
  return (
    <Fold title={card.navLabel} subtitle={card.why} defaultOpen={open}>
      <Points items={asPoints(card.what)} />
      <h3 className="text-label font-semibold text-fg-1">How to use it</h3>
      <ol className="help-points help-points-numbered">
        {card.how.map((step) => <li key={step}>{step}</li>)}
      </ol>
      <OpenButton view={card.view} onGo={onGo} />
    </Fold>
  )
}
