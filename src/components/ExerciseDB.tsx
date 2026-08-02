import { Barbell, Plus, Video, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useRef, useState } from 'react'
import { searchExercises, type WgerExercise } from '../lib/wger'
import { cat } from '../lib/colors'
import { MuscleMap } from './MuscleMap'
import { muscleNames } from '../lib/muscles'
import { Empty, Input, Pill } from './ui'
import { Button } from './ui/button'
import { useFocusTrap } from '../lib/useFocusTrap'

/** Stable identity, so the derived empty case doesn't churn referentially. */
const EMPTY_RESULTS: WgerExercise[] = []

/**
 * Browse the wger exercise database (image-based grid) and pick an exercise.
 * Fetches the wger public API on demand; results are read-only.
 */
export function ExerciseDB({ onPick }: { onPick: (name: string, muscles?: number[]) => void }) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<WgerExercise[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [selected, setSelected] = useState<WgerExercise | null>(null)
  // Hand-rolled detail sheet: trap Tab inside it, hand focus back to the
  // result button that opened it.
  const trap = useFocusTrap<HTMLDivElement>(selected !== null)
  const abortRef = useRef<AbortController | null>(null)

  // A query under two characters isn't a state to store, it's a state to
  // derive — clearing `results`/`state` from the effect body meant an extra
  // render every keystroke on the way down to one character.
  const q = term.trim()
  const tooShort = q.length < 2
  const shownResults = tooShort ? EMPTY_RESULTS : results
  const shownState = tooShort ? 'idle' : state

  useEffect(() => {
    if (tooShort) return
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
  }, [q, tooShort])

  return (
    <div>
      <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search wger exercise database… (e.g. bench, squat)" />
      {shownState === 'loading' && (
        <p className="mt-2 text-body text-fg-2">
          {progress > 0 ? `Building exercise index (one-time)… ${progress} loaded` : 'Searching…'}
        </p>
      )}
      {shownState === 'error' && <Empty>Couldn’t reach wger (offline or blocked). The built-in exercise list still works.</Empty>}
      {shownState === 'idle' && !tooShort && shownResults.length === 0 && <Empty>No matches.</Empty>}

      {shownResults.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {shownResults.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelected(ex)}
              className="group overflow-hidden rounded-xl border border-line bg-ink-0 text-left transition-colors hover:border-mauve"
              title={`View ${ex.name}`}
            >
              <div className="grid h-24 place-items-center overflow-hidden bg-ink-1">
                {ex.image ? (
                  <img src={ex.image} alt={ex.name} loading="lazy" className="h-full w-full object-contain transition-transform group-hover:scale-105" />
                ) : (
                  <Icon as={Barbell} size="lg" style={{ color: cat('overlay0') }} />
                )}
              </div>
              <div className="px-2 py-1.5 text-label text-fg-1">{ex.name}</div>
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-caption text-fg-2">
        Exercise data & images from <a href="https://wger.de" className="underline" target="_blank" rel="noreferrer">wger.de</a> (CC-BY-SA).
      </p>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-crust/70 p-4 pt-[8vh]" onClick={() => setSelected(null)}>
          <div ref={trap} className="card-3d w-full max-w-lg overflow-hidden rounded-2xl border border-line-strong bg-ink-1" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={selected.name}>
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="font-display text-heading text-fg-1">{selected.name}</h3>
              <Button variant="ghost" size="icon-sm" onClick={() => setSelected(null)} aria-label="Close" className="text-fg-2 hover:text-fg-1"><Icon as={X} size="md" /></Button>
            </header>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="grid place-items-center overflow-hidden rounded-xl border border-line bg-ink-0 p-2">
                  {selected.video ? (
                    <video src={selected.video} controls playsInline muted loop className="max-h-56 w-full rounded-lg object-contain" />
                  ) : selected.image ? (
                    <img src={selected.image} alt={selected.name} className="max-h-56 w-full object-contain" />
                  ) : (
                    <Icon as={Barbell} size="lg" style={{ color: cat('overlay0') }} />
                  )}
                </div>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selected.name + ' exercise form')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-body text-red hover:underline"
                >
                  <Icon as={Video} size="md" /> Watch on YouTube
                </a>
              </div>
              <div>
                <p className="mb-1 text-label tracking-wide text-fg-2 uppercase">Targets</p>
                {selected.muscles.length > 0 ? (
                  <>
                    <MuscleMap muscles={selected.muscles} />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {muscleNames(selected.muscles).map((m) => (
                        <Pill key={m} color="mauve">{m}</Pill>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-body text-fg-2">No muscle data for this exercise.</p>
                )}
              </div>
            </div>
            <footer className="flex justify-end gap-2 border-t border-line px-4 py-3">
              <Button variant="secondary" onClick={() => setSelected(null)} className="press-3d rounded-lg">Close</Button>
              <Button variant="primary" onClick={() => { onPick(selected.name, selected.muscles); setSelected(null) }} className="press-3d rounded-lg inline-flex items-center gap-1.5">
                <Icon as={Plus} size="sm" /> Add to session
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
