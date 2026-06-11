import { useState } from 'react'
import { Lightbulb, X } from 'lucide-react'
import { useJournal } from '../store'
import { recommendations } from '../lib/recommend'
import type { ViewId } from './shell/viewChrome'

/** Dismissible "smart default" suggestion chips, shown above the page content. */
export function Recommendations({ onNavigate }: { onNavigate: (id: ViewId) => void }) {
  const { data } = useJournal()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const recs = recommendations(data).filter((r) => !dismissed.has(r.id)).slice(0, 2)
  if (recs.length === 0) return null

  return (
    <div className="mx-auto mb-4 flex max-w-[1400px] flex-col gap-2">
      {recs.map((r) => (
        <div key={r.id} className="flex items-center gap-2 rounded-lg border border-surface0 bg-mantle/60 px-3 py-2 text-sm">
          <Lightbulb size={15} className="shrink-0 text-yellow" aria-hidden />
          <span className="flex-1 text-subtext1">{r.text}</span>
          {r.action && (
            <button onClick={() => onNavigate(r.action!.view)} className="shrink-0 rounded-md bg-secondary px-2.5 py-1 text-xs text-text hover:bg-surface1">
              {r.action.label}
            </button>
          )}
          <button onClick={() => setDismissed((d) => new Set(d).add(r.id))} aria-label="Dismiss" className="shrink-0 text-overlay0 hover:text-text">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}
