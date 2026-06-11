import { useEffect, useRef, useState } from 'react'
import { searchExercises, type WgerExercise } from '../lib/wger'
import { cat } from '../lib/colors'
import { Empty, Input } from './ui'

/**
 * Browse the wger exercise database (image-based grid) and pick an exercise.
 * Fetches the wger public API on demand; results are read-only.
 */
export function ExerciseDB({ onPick }: { onPick: (name: string) => void }) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<WgerExercise[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
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
              onClick={() => onPick(ex.name)}
              className="group overflow-hidden rounded-xl border border-surface0 bg-base text-left transition-colors hover:border-mauve"
              title={`Add ${ex.name}`}
            >
              <div className="grid h-24 place-items-center overflow-hidden bg-mantle">
                {ex.image ? (
                  <img src={ex.image} alt={ex.name} loading="lazy" className="h-full w-full object-contain transition-transform group-hover:scale-105" />
                ) : (
                  <span className="text-2xl" style={{ color: cat('overlay0') }}>🏋️</span>
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
    </div>
  )
}
