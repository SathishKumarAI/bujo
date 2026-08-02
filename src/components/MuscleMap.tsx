import { useState } from 'react'
import { MUSCLES } from '../lib/muscles'

// Professional anatomical muscle diagrams from wger (CC-BY-SA): a base body
// image with per-muscle highlight overlays stacked on top · the same technique
// wger uses on its own site. Credited in CREDITS.md / README.
const WGER = 'https://wger.de/static/images/muscles'
const BASE_FRONT = `${WGER}/muscular_system_front.svg`
const BASE_BACK = `${WGER}/muscular_system_back.svg`
const overlay = (id: number) => `${WGER}/main/muscle-${id}.svg`

// Muscle data + the pure lookups live in `lib/muscles.ts` — domain data, and
// exporting them beside a component broke Fast Refresh. Import from there.

function Figure({ base, ids, label }: { base: string; ids: number[]; label: string }) {
  const [ok, setOk] = useState(true)
  if (!ok) {
    return (
      <div className="grid h-64 w-40 place-items-center rounded-card border border-line text-center text-label text-fg-2">
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
      <figcaption className="text-caption tracking-wide text-fg-2 uppercase">{label}</figcaption>
    </figure>
  )
}

/** Anatomical body map highlighting an explicit set of muscle ids. */
export function MuscleMap({ muscles }: { muscles: number[] }) {
  const ids = muscles ?? []
  const front = ids.filter((id) => MUSCLES.find((m) => m.id === id)?.side === 'front')
  const back = ids.filter((id) => MUSCLES.find((m) => m.id === id)?.side === 'back')
  return (
    <div className="flex items-end justify-center gap-8 rounded-card border border-line bg-ink-1 py-5">
      <Figure base={BASE_FRONT} ids={front} label="Front" />
      <Figure base={BASE_BACK} ids={back} label="Back" />
    </div>
  )
}
