import { Brain, Check, Plus, Sparkle, Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { Card, Empty, Textarea } from '../components/ui'
import { Button } from '../components/ui/button'
import { Page } from '../components/shell/Page'
import { MasonryGrid } from '../components/shell/CardGrid'
import { MINDSET_LIBRARY, MINDSET_CATEGORIES, principleById } from '../lib/mindset'

/**
 * Mindset — an interactive, app-wide thinking-style tool. Pick principles to
 * actively work on (left rail) and jot how you'll apply each; browse the full
 * library by category (main). Turns reading into doing.
 */
export function Mindset() {
  const { data, addMindsetFocus, setMindsetNote, removeMindsetFocus } = useJournal()
  const focus = data.mindsetFocus ?? []
  const focusedIds = new Set(focus.map((f) => f.principleId))

  return (
    <Page width="wide">
      <Card title={<span className="inline-flex items-center gap-2"><Icon as={Sparkle} size="md" className="text-mauve" /> Your focus</span>} subtitle="What you’re working on now" help="The principles you’ve chosen to practise. Add a note on how you’ll apply each — a personal cue you’ll actually use.">
        {focus.length === 0 ? (
          <Empty>Pick a principle from the library below to start working on your thinking style.</Empty>
        ) : (
          <ul className="space-y-3">
            {focus.map((f) => {
              const p = principleById(f.principleId)
              if (!p) return null
              return (
                <li key={f.id} className="group rounded-control border border-mauve/40 bg-mauve/5 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Icon as={Check} size="sm" className="shrink-0 text-mauve" />
                    <span className="text-body font-medium text-fg-1">{p.title}</span>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeMindsetFocus(f.id)} aria-label="Remove focus" className="ml-auto text-fg-2 opacity-0 group-hover:opacity-100 hover:text-red"><Icon as={Trash} size="sm" /></Button>
                  </div>
                  <p className="mb-2 text-label text-fg-2">{p.why}</p>
                  <Textarea value={f.note ?? ''} onChange={(e) => setMindsetNote(f.id, e.target.value)} placeholder="How will you apply this? (your cue)" rows={2} className="text-label" />
                </li>
              )
            })}
          </ul>
        )}
        {focus.length > 0 && <p className="mt-3 text-label text-fg-2">Tip: keep it to 1–3 at a time — focus beats breadth.</p>}
      </Card>

      {/* The library used to be a single 1,575px card — every principle in the
          app, one uninterrupted wall, no collapse and no way to reach a
          category except scrolling past the ones before it. Each theme is its
          own card now, three across, so the seven categories are visible at
          once and each is a real heading rather than an uppercase caption. */}
      <p className="flex items-center gap-2 text-body text-fg-2">
        <Icon as={Brain} size="md" className="shrink-0 text-peach" />
        Principle library · tap + to add one to your focus
      </p>
      <MasonryGrid>
        {MINDSET_CATEGORIES.map((catName) => (
          <Card key={catName} title={catName}>
            <ul className="space-y-2">
              {MINDSET_LIBRARY.filter((p) => p.category === catName).map((p) => {
                const added = focusedIds.has(p.id)
                return (
                  <li key={p.id} className="flex items-start gap-2 rounded-control border border-line bg-ink-0 p-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-body font-medium text-fg-1">{p.title}</p>
                      <p className="text-label text-fg-2">{p.why}</p>
                    </div>
                    <button onClick={() => added ? undefined : addMindsetFocus(p.id)} disabled={added} aria-label={added ? `${p.title} is already in your focus` : `Add ${p.title} to your focus`}
                      className={`grid size-6 shrink-0 place-items-center rounded-pill ${added ? 'bg-green text-crust' : 'bg-secondary text-fg-1 hover:bg-mauve hover:text-crust'}`}>
                      {added ? <Icon as={Check} size="sm" /> : <Icon as={Plus} size="sm" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        ))}
      </MasonryGrid>
    </Page>
  )
}
