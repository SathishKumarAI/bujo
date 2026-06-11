import { useId } from 'react'
import { cat } from '../lib/colors'
import type { Split } from '../lib/types'

// Which muscle regions each split targets ("where the pressure goes").
const TARGETS: Record<Split, string[]> = {
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['lats', 'traps', 'biceps', 'forearms'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  upper: ['chest', 'shoulders', 'lats', 'traps', 'biceps', 'triceps', 'forearms'],
  lower: ['quads', 'hamstrings', 'glutes', 'calves'],
  full: ['chest', 'shoulders', 'lats', 'traps', 'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'abs'],
  other: [],
}

// Smooth muscle overlays as SVG paths on a 120×270 sculpted figure.
type Region = [muscle: string, d: string]

const FRONT: Region[] = [
  ['shoulders', 'M30 64 q9 -8 18 -2 q-2 9 -10 10 q-9 0 -8 -8z'],
  ['shoulders', 'M90 64 q-9 -8 -18 -2 q2 9 10 10 q9 0 8 -8z'],
  ['chest', 'M42 76 q9 -5 16 0 l0 13 q-9 4 -17 -2 q-3 -7 1 -11z'],
  ['chest', 'M78 76 q-9 -5 -16 0 l0 13 q9 4 17 -2 q3 -7 -1 -11z'],
  ['biceps', 'M26 92 q7 -3 9 4 l-1 17 q-7 2 -10 -4 q-2 -11 2 -17z'],
  ['biceps', 'M94 92 q-7 -3 -9 4 l1 17 q7 2 10 -4 q2 -11 -2 -17z'],
  ['forearms', 'M21 116 q6 -2 8 3 l-2 18 q-6 1 -8 -4 q-1 -11 2 -17z'],
  ['forearms', 'M99 116 q-6 -2 -8 3 l2 18 q6 1 8 -4 q1 -11 -2 -17z'],
  ['abs', 'M50 94 q10 -4 20 0 l-1 34 q-9 5 -18 0 z'],
  ['quads', 'M44 150 q8 -4 13 1 l-2 42 q-8 3 -13 -3 q-3 -22 2 -40z'],
  ['quads', 'M76 150 q-8 -4 -13 1 l2 42 q8 3 13 -3 q3 -22 -2 -40z'],
  ['calves', 'M45 204 q7 -2 10 3 l-2 34 q-7 2 -10 -4 q-2 -18 2 -33z'],
  ['calves', 'M75 204 q-7 -2 -10 3 l2 34 q7 2 10 -4 q2 -18 -2 -33z'],
]

const BACK: Region[] = [
  ['traps', 'M48 58 q12 -6 24 0 q1 9 -3 14 q-9 4 -18 0 q-4 -6 -3 -14z'],
  ['shoulders', 'M30 66 q9 -7 17 -2 q-2 8 -9 9 q-9 0 -8 -7z'],
  ['shoulders', 'M90 66 q-9 -7 -17 -2 q2 8 9 9 q9 0 8 -7z'],
  ['lats', 'M42 82 q9 -3 16 2 l-2 26 q-11 2 -16 -8 q-2 -12 2 -20z'],
  ['lats', 'M78 82 q-9 -3 -16 2 l2 26 q11 2 16 -8 q2 -12 -2 -20z'],
  ['triceps', 'M26 92 q7 -3 9 4 l-1 18 q-7 2 -10 -4 q-2 -12 2 -18z'],
  ['triceps', 'M94 92 q-7 -3 -9 4 l1 18 q7 2 10 -4 q2 -12 -2 -18z'],
  ['forearms', 'M21 118 q6 -2 8 3 l-2 18 q-6 1 -8 -4 q-1 -11 2 -17z'],
  ['forearms', 'M99 118 q-6 -2 -8 3 l2 18 q6 1 8 -4 q1 -11 -2 -17z'],
  ['glutes', 'M44 130 q11 -6 16 0 q-1 12 -8 15 q-9 -1 -11 -8 q-1 -4 3 -7z'],
  ['glutes', 'M76 130 q-11 -6 -16 0 q1 12 8 15 q9 -1 11 -8 q1 -4 -3 -7z'],
  ['hamstrings', 'M45 156 q8 -3 12 2 l-2 40 q-8 3 -12 -3 q-3 -20 2 -39z'],
  ['hamstrings', 'M75 156 q-8 -3 -12 2 l2 40 q8 3 12 -3 q3 -20 -2 -39z'],
  ['calves', 'M45 206 q7 -2 10 3 l-2 32 q-7 2 -10 -4 q-2 -17 2 -31z'],
  ['calves', 'M75 206 q-7 -2 -10 3 l2 32 q7 2 10 -4 q2 -17 -2 -31z'],
]

// Clean humanoid silhouette as one cohesive path (head + torso + limbs).
const SILHOUETTE =
  'M60 16 q11 0 11 13 q0 8 -5 12 q9 2 13 9 q5 8 5 20 l0 22 q8 4 10 16 l4 26 q1 8 -4 9 q-6 1 -8 -7 l-5 -22 q-2 6 -3 14 l-1 14 l3 44 q1 9 -4 10 q-6 1 -7 -8 l-5 -42 l-4 0 l-5 42 q-1 9 -7 8 q-5 -1 -4 -10 l3 -44 l-1 -14 q-1 -8 -3 -14 l-5 22 q-2 8 -8 7 q-5 -1 -4 -9 l4 -26 q2 -12 10 -16 l0 -22 q0 -12 5 -20 q4 -7 13 -9 q-5 -4 -5 -12 q0 -13 11 -13z'

function Figure({ regions, active, color, label }: { regions: Region[]; active: Set<string>; color: string; label: string }) {
  const gid = useId().replace(/:/g, '')
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 120 270" className="h-64 w-auto" role="img" aria-label={`${label} muscles worked`}>
        <defs>
          <linearGradient id={`body-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cat('surface1')} />
            <stop offset="100%" stopColor={cat('surface0')} />
          </linearGradient>
          <filter id={`glow-${gid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Sculpted silhouette with soft inner edge */}
        <path d={SILHOUETTE} fill={`url(#body-${gid})`} stroke={cat('surface2')} strokeWidth="0.8" />

        {/* Muscle overlays — inactive read as faint shading, active glow in accent */}
        {regions.map(([m, d], i) => {
          const on = active.has(m)
          return (
            <path
              key={i}
              d={d}
              fill={on ? cat(color) : cat('overlay0')}
              opacity={on ? 0.92 : 0.16}
              filter={on ? `url(#glow-${gid})` : undefined}
              style={{ transition: 'opacity 0.3s ease' }}
            >
              <title>{m}</title>
            </path>
          )
        })}
      </svg>
      <figcaption className="text-[11px] tracking-wide text-overlay0 uppercase">{label}</figcaption>
    </figure>
  )
}

/** The muscle names a split targets (for legends/chips). */
export function targetMuscles(split: Split): string[] {
  return TARGETS[split] ?? []
}

/** Body map highlighting the muscles a split trains. */
export function MuscleMap({ split, color = 'mauve' }: { split: Split; color?: string }) {
  const active = new Set(TARGETS[split] ?? [])
  return (
    <div
      className="flex items-end justify-center gap-8 rounded-2xl border border-surface0 py-5"
      style={{ background: `radial-gradient(120% 90% at 50% 0%, ${cat('surface0')}55, transparent 70%)` }}
    >
      <Figure regions={FRONT} active={active} color={color} label="Front" />
      <Figure regions={BACK} active={active} color={color} label="Back" />
    </div>
  )
}
