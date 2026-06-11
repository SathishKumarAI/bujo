import { useEffect, useRef, useState } from 'react'
import { Dumbbell, Plus, X } from 'lucide-react'
import { searchExercises, type WgerExercise } from '../lib/wger'
import { cat } from '../lib/colors'
import { MuscleMap, muscleNames } from './MuscleMap'
import { Button, Empty, Input } from './ui'

/**
 * Browse the wger exercise database (image-based grid) and pick an exercise.
 * Fetches the wger public API on demand; results are read-only.
 */
export function ExerciseDB({ onPick }: { onPick: (name: string) => void }) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<WgerExercise[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [selected, setSelected] = useState<WgerExercise | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const q = term.trim()
    if (q.length < 2) {
      setResults([])
      setState('idle')
      return
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setState('loading')
      try {
        setResults(await searchExercises(q, ctrl.signal, setProgress))
        setState('idle')
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setState('error')
      }
    }, 350)
    return () => clearTimeout(t)
  }, [term])

  return (
    <div>
      <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search wger exercise database… (e.g. bench, squat)" />
      {state === 'loading' && (
        <p className="mt-2 text-sm text-overlay0">
          {progress > 0 ? `Building exercise index (one-time)… ${progress} loaded` : 'Searching…'}
        </p>
      )}
      {state === 'error' && <Empty>Couldn’t reach wger (offline or blocked). The built-in exercise list still works.</Empty>}
      {state === 'idle' && term.trim().length >= 2 && results.length === 0 && <Empty>No matches.</Empty>}

      {results.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {results.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelected(ex)}
              className="group overflow-hidden rounded-xl border border-surface0 bg-base text-left transition-colors hover:border-mauve"
              title={`View ${ex.name}`}
            >
              <div className="grid h-24 place-items-center overflow-hidden bg-mantle">
                {ex.image ? (
                  <img src={ex.image} alt={ex.name} loading="lazy" className="h-full w-full object-contain transition-transform group-hover:scale-105" />
                ) : (
                  <Dumbbell size={26} style={{ color: cat('overlay0') }} />
                )}
              </div>
              <div className="px-2 py-1.5 text-xs text-subtext1">{ex.name}</div>
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-[11px] text-overlay0">
        Exercise data & images from <a href="https://wger.de" className="underline" target="_blank" rel="noreferrer">wger.de</a> (CC-BY-SA).
      </p>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-crust/70 p-4 pt-[8vh]" onClick={() => setSelected(null)}>
          <div className="card-3d w-full max-w-lg overflow-hidden rounded-2xl border border-surface1 bg-mantle" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={selected.name}>
            <header className="flex items-center justify-between border-b border-surface0 px-4 py-3">
              <h3 className="font-display text-lg text-text">{selected.name}</h3>
              <button onClick={() => setSelected(null)} aria-label="Close" className="text-overlay0 hover:text-text"><X size={18} /></button>
            </header>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <div className="grid place-items-center rounded-xl border border-surface0 bg-base p-2">
                {selected.image ? (
                  <img src={selected.image} alt={selected.name} className="max-h-56 w-full object-contain" />
                ) : (
                  <Dumbbell size={48} style={{ color: cat('overlay0') }} />
                )}
              </div>
              <div>
                <p className="mb-1 text-xs tracking-wide text-overlay0 uppercase">Targets</p>
                {selected.muscles.length > 0 ? (
                  <>
                    <MuscleMap muscles={selected.muscles} />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {muscleNames(selected.muscles).map((m) => (
                        <span key={m} className="rounded-full px-2 py-0.5 text-xs" style={{ background: cat('mauve') + '33', color: cat('mauve') }}>{m}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-overlay0">No muscle data for this exercise.</p>
                )}
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t border-surface0 px-4 py-3">
              <Button onClick={() => setSelected(null)}>Close</Button>
              <Button variant="primary" onClick={() => { onPick(selected.name); setSelected(null) }} className="inline-flex items-center gap-1.5">
                <Plus size={15} /> Add to session
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
