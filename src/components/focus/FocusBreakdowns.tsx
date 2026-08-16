import { useState } from 'react'
import { Band, BandCell, BandRow, Eyebrow } from '../mod'
import { formatMinutes } from '../../lib/focus'

/** One labelled bar. The three breakdowns below are the same row three times. */
function Bar({ label, value, share, accent = false }: { label: string; value: string; share: number; accent?: boolean }) {
  return (
    <div className="grid grid-cols-[6rem_1fr_3.5rem] items-center gap-3 py-1 text-label">
      <span className="truncate text-fg-2">{label}</span>
      <span className="block h-2.5 bg-ink-2">
        <span className={`block h-full ${accent ? 'bg-brand' : 'bg-fg-1'}`} style={{ width: `${Math.round(share * 100)}%` }} />
      </span>
      <span className="num text-right text-fg-2">{value}</span>
    </div>
  )
}

/**
 * Three breakdowns of the same sessions: by weekday, by project, by tag.
 *
 * Owns the weekday volume/quality toggle. The toggle is a real choice between
 * two different questions — "when do I put the hours in" and "when is the work
 * any good" — which is why it is one chart with two modes rather than two
 * charts competing for the same column.
 *
 * Interruptions ride along under the weekday chart: it is the same "when" axis,
 * and on its own it was a card holding fourteen thin bars and nothing else.
 */
export function FocusBreakdowns({
  byWeekday,
  focusWd,
  byProject,
  tags,
  interruptions,
  today,
}: {
  byWeekday: { day: number; label: string; min: number }[]
  focusWd: { day: number; label: string; avg: number; count: number }[]
  byProject: { project: string; min: number }[]
  tags: { tag: string; min: number }[]
  interruptions: { date: string; avg: number; count: number }[]
  today: string
}) {
  const [mode, setMode] = useState<'volume' | 'quality'>('volume')
  const hasVolume = byWeekday.some((w) => w.min > 0)
  const hasQuality = focusWd.some((w) => w.count > 0)
  // Fall back to whichever metric has data if the chosen one is empty.
  const showQuality = mode === 'quality' ? hasQuality : !hasVolume && hasQuality

  const maxWd = Math.max(1, ...byWeekday.map((w) => w.min))
  const maxFocusWd = Math.max(1, ...focusWd.map((w) => w.avg))
  const maxProj = Math.max(1, ...byProject.map((p) => p.min))
  const maxTag = Math.max(1, ...tags.map((t) => t.min))
  const maxInt = Math.max(1, ...interruptions.map((d) => d.avg))
  const anyInterruptions = interruptions.some((d) => d.count > 0)

  if (!hasVolume && !hasQuality && byProject.length === 0 && tags.length === 0) return null

  return (
    <Band>
      <BandRow>
        <BandCell className="basis-[22rem]">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2 className="font-display text-heading font-medium text-fg-1">By weekday</h2>
            <div className="ml-auto flex gap-4 text-label">
              {(['volume', 'quality'] as const).map((m) => {
                const on = showQuality ? m === 'quality' : m === 'volume'
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    aria-pressed={on}
                    className={`border-b-2 pb-0.5 capitalize ${on ? 'border-brand text-fg-1' : 'border-transparent text-fg-2 hover:text-brand-text'}`}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
          <p className="mt-1 mb-4 text-label text-fg-2">
            {showQuality ? 'Duration-weighted average focus score.' : 'Total deep-work minutes.'}
          </p>

          {showQuality
            ? focusWd.map((w) => (
                <Bar
                  key={w.day}
                  label={w.label}
                  value={w.count ? `${w.avg}/10` : '—'}
                  share={w.avg / maxFocusWd}
                  accent={w.avg === maxFocusWd && w.avg > 0}
                />
              ))
            : byWeekday.map((w) => (
                <Bar key={w.day} label={w.label} value={formatMinutes(w.min)} share={w.min / maxWd} accent={w.min === maxWd && w.min > 0} />
              ))}

          {anyInterruptions && (
            <div className="mt-6 border-t border-line pt-4">
              <Eyebrow>Interruptions · last 14 days</Eyebrow>
              <div
                className="mt-3 flex items-end gap-1.5"
                style={{ height: 60 }}
                role="img"
                aria-label={`Average interruptions per session over the last 14 days: ${interruptions
                  .map((d) => `${d.date} ${d.count ? d.avg : 'no session'}`)
                  .join(', ')}`}
              >
                {interruptions.map((d) => (
                  <div key={d.date} className="flex h-full flex-1 items-end" title={`${d.date}: ${d.count ? `${d.avg} avg` : 'no session'}`}>
                    <div
                      className={d.date === today ? 'w-full bg-brand' : 'w-full bg-fg-1'}
                      style={{ height: d.count ? `${Math.max(4, (d.avg / maxInt) * 100)}%` : '0%' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </BandCell>

        <BandCell className="basis-[20rem]">
          {byProject.length > 0 && (
            <>
              <h2 className="font-display text-heading font-medium text-fg-1">By project</h2>
              <p className="mt-1 mb-4 text-label text-fg-2">Total deep-work minutes.</p>
              {byProject.map((p) => (
                <Bar key={p.project} label={p.project} value={formatMinutes(p.min)} share={p.min / maxProj} accent={p.min === maxProj} />
              ))}
            </>
          )}

          {tags.length > 0 && (
            <div className={byProject.length > 0 ? 'mt-6 border-t border-line pt-4' : ''}>
              <h2 className="font-display text-heading font-medium text-fg-1">Languages & tools</h2>
              <p className="mt-1 mb-4 text-label text-fg-2">By time logged against a tag.</p>
              {tags.map((t) => (
                <Bar key={t.tag} label={t.tag} value={formatMinutes(t.min)} share={t.min / maxTag} />
              ))}
            </div>
          )}
        </BandCell>
      </BandRow>
    </Band>
  )
}
