import type { Split } from './types'

/*
  Muscle reference data + the two pure lookups over it.

  Split out of `components/MuscleMap.tsx`: that file exported these functions
  alongside a component, which breaks Fast Refresh — the
  `react-refresh/only-export-components` error. They are domain data, not view
  code, and four modules import them without wanting the component, so `lib` is
  where they belong.
*/

export interface Muscle {
  id: number
  name: string
  side: 'front' | 'back'
}

// wger's standard muscle ids.
export const MUSCLES: Muscle[] = [
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
  push: [4, 2, 5],
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
