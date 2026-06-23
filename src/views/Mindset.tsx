import { Brain, Plus, Check, Trash2, Sparkles } from 'lucide-react'
import { useJournal } from '../store'
import { Card, Empty, Textarea } from '../components/ui'
import { Page } from '../components/shell/Page'
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
    <Page
      asideFirst
      aside={
        <Card title={<span className="inline-flex items-center gap-2"><Sparkles size={18} className="text-mauve" /> Your focus</span>} subtitle="What you’re working on now" help="The principles you’ve chosen to practise. Add a note on how you’ll apply each — a personal cue you’ll actually use.">
          {focus.length === 0 ? (
            <Empty>Pick a principle from the right to start working on your thinking style.</Empty>
          ) : (
            <ul className="space-y-3">
              {focus.map((f) => {
                const p = principleById(f.principleId)
                if (!p) return null
                return (
                  <li key={f.id} className="group rounded-lg border border-mauve/40 bg-mauve/5 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Check size={14} className="shrink-0 text-mauve" />
                      <span className="text-sm font-medium text-text">{p.title}</span>
                      <button onClick={() => removeMindsetFocus(f.id)} aria-label="Remove focus" className="ml-auto text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red"><Trash2 size={13} /></button>
                    </div>
                    <p className="mb-2 text-xs text-overlay1">{p.why}</p>
                    <Textarea value={f.note ?? ''} onChange={(e) => setMindsetNote(f.id, e.target.value)} placeholder="How will you apply this? (your cue)" rows={2} className="text-xs" />
                  </li>
                )
              })}
            </ul>
          )}
          {focus.length > 0 && <p className="mt-3 text-xs text-overlay0">Tip: keep it to 1–3 at a time — focus beats breadth.</p>}
        </Card>
      }
    >
      <Card title={<span className="inline-flex items-center gap-2"><Brain size={18} className="text-peach" /> Principle library</span>} subtitle="Tap + to add a principle to your focus" help="A curated set of mental-game and thinking-style principles. Browse by theme; add the ones you want to build into how you think and play.">
        <div className="space-y-4">
          {MINDSET_CATEGORIES.map((catName) => (
            <div key={catName}>
              <p className="mb-1.5 text-[11px] font-medium tracking-wider text-overlay0 uppercase">{catName}</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {MINDSET_LIBRARY.filter((p) => p.category === catName).map((p) => {
                  const added = focusedIds.has(p.id)
                  return (
                    <li key={p.id} className="flex items-start gap-2 rounded-lg border border-surface0 bg-base p-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text">{p.title}</p>
                        <p className="text-xs text-overlay1">{p.why}</p>
                      </div>
                      <button onClick={() => added ? undefined : addMindsetFocus(p.id)} disabled={added} aria-label={added ? 'Already in focus' : `Add ${p.title}`}
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${added ? 'bg-green text-crust' : 'bg-secondary text-subtext1 hover:bg-mauve hover:text-crust'}`}>
                        {added ? <Check size={13} /> : <Plus size={13} />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  )
}
