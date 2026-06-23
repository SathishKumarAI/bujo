import { useState } from 'react'
import type { Split } from '../lib/types'

// Professional anatomical muscle diagrams from wger (CC-BY-SA): a base body
// image with per-muscle highlight overlays stacked on top · the same technique
// wger uses on its own site. Credited in CREDITS.md / README.
const WGER = 'https://wger.de/static/images/muscles'
const BASE_FRONT = `${WGER}/muscular_system_front.svg`
const BASE_BACK = `${WGER}/muscular_system_back.svg`
const overlay = (id: number) => `${WGER}/main/muscle-${id}.svg`

interface Muscle {
  id: number
  name: string
  side: 'front' | 'back'
}

// wger's standard muscle ids.
const MUSCLES: Muscle[] = [
  { id: 2, name: 'Shoulders', side: 'front' },
  { id: 4, name: 'Chest', side: 'front' },
  { id: 1, name: 'Biceps', side: 'front' },
  { id: 13, name: 'Brachialis', side: 'front' },
  { id: 6, name: 'Abs', side: 'front' },
  { id: 14, name: 'Obliques', side: 'front' },
  { id: 3, name: 'Serratus', side: 'front' },
  { id: 10, name: 'Quads', side: 'front' },
  { id: 7, name: 'Calves', side: 'back' },
  { id: 15, name: 'Soleus', side: 'back' },
  { id: 9, name: 'Traps', side: 'back' },
  { id: 12, name: 'Lats', side: 'back' },
  { id: 5, name: 'Triceps', side: 'back' },
  { id: 8, name: 'Glutes', side: 'back' },
  { id: 11, name: 'Hamstrings', side: 'back' },
]

// Which muscle ids each split trains ("where the pressure goes").
const TARGETS: Record<Split, number[]> = {
  push: [4, 2, 5, 3],
  pull: [12, 9, 1, 13],
  legs: [10, 11, 8, 7, 15],
  upper: [4, 2, 12, 9, 1, 5, 13, 3],
  lower: [10, 11, 8, 7, 15],
  full: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  other: [],
}

/** Muscle ids a split trains. */
export function musclesForSplit(split: Split): number[] {
  return TARGETS[split] ?? []
}

/** Human names for a set of muscle ids. */
export function muscleNames(ids: number[]): string[] {
  const set = new Set(ids)
  return MUSCLES.filter((m) => set.has(m.id)).map((m) => m.name)
}

function Figure({ base, ids, label }: { base: string; ids: number[]; label: string }) {
  const [ok, setOk] = useState(true)
  if (!ok) {
    return (
      <div className="grid h-64 w-40 place-items-center rounded-xl border border-surface0 text-center text-xs text-overlay0">
        Muscle diagram needs a connection
      </div>
    )
  }
  return (
    <figure className="flex flex-col items-center gap-1">
      <div className="relative h-64">
        <img src={base} alt={`${label} body`} onError={() => setOk(false)} className="h-64 w-auto opacity-90" />
        {ids.map((id) => (
          <img
            key={id}
            src={overlay(id)}
            alt=""
            aria-hidden
            className="absolute top-0 left-0 h-64 w-auto"
            style={{ filter: 'saturate(1.3)' }}
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        ))}
      </div>
      <figcaption className="text-[11px] tracking-wide text-overlay0 uppercase">{label}</figcaption>
    </figure>
  )
}

/** Anatomical body map highlighting an explicit set of muscle ids. */
export function MuscleMap({ muscles }: { muscles: number[] }) {
  const ids = muscles ?? []
  const front = ids.filter((id) => MUSCLES.find((m) => m.id === id)?.side === 'front')
  const back = ids.filter((id) => MUSCLES.find((m) => m.id === id)?.side === 'back')
  return (
    <div className="flex items-end justify-center gap-8 rounded-2xl border border-surface0 bg-mantle py-5">
      <Figure base={BASE_FRONT} ids={front} label="Front" />
      <Figure base={BASE_BACK} ids={back} label="Back" />
    </div>
  )
}
