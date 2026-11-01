import { useState, type ReactNode } from 'react'
import { Check, Minus, Plus, SlidersHorizontal } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Seg } from '../ui/seg'
import { Cells, FieldCell } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { TimerPhone } from './TimerPhone'
import { addDays, prettyDay, todayISO } from '../../lib/date'
import { onRaised } from '../../lib/colors'
import { formatMinutes } from '../../lib/focus'
import {
  MINUTE_CHOICES, draftFrom, lastSession, shortMin, toSession, toggle, withChoice, type FocusDraft,
} from '../../lib/focusDraft'
import type { DevSession } from '../../lib/types'

/**
 * FOCUS ON A PHONE — the timer, then a session logged without a scroll.
 *
 * OWNS: the phone drawing. The timer as one card (`TimerPhone`); then
 * minutes and project as segmented rows and tags as pills, all starting from
 * your last session (`lib/focusDraft.ts`) with the heading saying what that
 * was; a dock with the day (Today / Yesterday), the sheet's button and Log;
 * focus, stress, interruptions, notes and anything new in a `Sheet`. The
 * review (history, typing) is handed in and sits below.
 * DOES NOT OWN: the store write (`onLog`), the review, or the desktop form
 * (`LogSession.tsx`) — a field added to a session goes in BOTH drawings.
 *
 * Measured before (390×664, `?demo=1`): the desktop form on a phone, 3.51
 * screens, its Log button at y 1600.
 */
export function FocusPhone({ sessions, recentProjects, recentTags, onLog, review }: {
  sessions: DevSession[]
  /** By minutes spent, most first — the bar's order. */
  recentProjects: string[]
  recentTags: string[]
  onLog: (s: Omit<DevSession, 'id'>) => void
  review: ReactNode
}) {
  const today = todayISO()
  const yesterday = addDays(today, -1)
  const last = lastSession(sessions)
  const [f, setF] = useState<FocusDraft>(() => draftFrom(last, today))
  const set = (p: Partial<FocusDraft>) => setF((c) => ({ ...c, ...p }))
  const [more, setMore] = useState(false)
  const [justLogged, setJustLogged] = useState<string | null>(null)

  const minutes = withChoice([...MINUTE_CHOICES], f.durationMin, MINUTE_CHOICES.length)
  const projects = withChoice(recentProjects, f.project, 3)
  const tags = [...new Set([...recentTags.slice(0, 5), ...f.tags])]
  const added = [f.interruptions !== undefined, f.notes.trim(), f.moreTags.trim(), f.date < yesterday].filter(Boolean).length

  function log() {
    const s = toSession(f)
    if (!s) return
    onLog(s)
    setJustLogged(`${formatMinutes(s.durationMin)}${s.project ? ` · ${s.project}` : ''}`)
    // The next block starts from this one — the same carry-over as a fresh visit.
    setF(draftFrom({ ...s, id: '' }, today))
  }

  return (
    <div className="focus-phone flex flex-col gap-3 pb-2">
      <h1 className="sr-only">Focus</h1>
      <TimerPhone />

      <section aria-label="Log a session" className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2 px-1">
          <h2 className="shrink-0 text-heading font-semibold text-fg-1">Log a session</h2>
          {/* What the bars below were filled from — or, once you log, that it
              landed. One line: the heading wrapping cost the row Log needed. */}
          <span aria-live="polite" className="min-w-0 truncate text-label"
            style={justLogged ? { color: onRaised('green') } : undefined}>
            {justLogged ? `Logged · ${justLogged}` : last && <span className="text-fg-2">last {shortMin(last.durationMin)}{last.project && ` · ${last.project}`}<span className="sr-only">, {prettyDay(last.date)}</span></span>}
          </span>
        </div>
        <div className="cells">
          {/* Each always holds a value carried from last time, so none is
              `allowNone`: a tap on the lit option confirms it. */}
          <div className="cell gap-3">
            <span className="w-16 shrink-0 text-body text-fg-1">Minutes</span>
            <Seg label="Minutes" className="min-w-0 flex-1" value={f.durationMin ?? null}
              onChange={(v) => v && set({ durationMin: v })}
              options={minutes.map((m) => ({ value: m, label: shortMin(m) }))} />
          </div>
          {projects.length > 0 && (
            <div className="cell gap-3">
              <span className="w-16 shrink-0 text-body text-fg-1">Project</span>
              <Seg label="Project" className="min-w-0 flex-1" value={f.project || null}
                onChange={(v) => v && set({ project: v })}
                options={projects.map((p) => ({ value: p, label: p }))} />
            </div>
          )}
          {tags.length > 0 && (
            /* No label line over the pills — they say what they are, and the
               ~30px it cost was the row the Log dock needed. Named for a
               screen reader by the group. */
            <div className="cell">
              <div role="group" aria-label="Tags" className="flex flex-wrap gap-1.5" style={{ ['--tone' as string]: 'var(--color-peach)' }}>
                {tags.map((t) => (
                  <button key={t} type="button" className="chip-toggle" aria-pressed={f.tags.includes(t)} onClick={() => set({ tags: toggle(f.tags, t) })}>
                    <Icon as={Check} size="sm" />{t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="log-dock">
        {/* The day, at the dock's left — where every session page keeps it.
            Always holds a value, so not `allowNone`; an earlier day is in the
            sheet, and lights neither. */}
        <Seg label="Day" className="mr-auto min-w-0" value={f.date === today || f.date === yesterday ? f.date : null}
          onChange={(v) => v && set({ date: v })}
          options={[{ value: today, label: 'Today' }, { value: yesterday, label: 'Yesterday' }]} />
        <button type="button" className="round-btn" onClick={() => setMore(true)}
          aria-label={`Focus, stress, notes${added ? `, ${added} added` : ''}`}>
          <Icon as={SlidersHorizontal} size="md" />
        </button>
        <button type="button" className="cta cta-compact" disabled={!f.durationMin} onClick={log}>
          {/* Just "Log": the minutes are lit on the bar above, and "Log · 25m"
              pushed the dock onto two lines at 375px. */}
          <Icon as={Check} size="md" />Log
        </button>
      </div>

      {review}

      <Sheet open={more} onOpenChange={setMore} title="This session" description="All optional · focus and stress start from last time">
        <div className="flex flex-col gap-4">
          <Cells>
            {(['focus', 'stress'] as const).map((k) => (
              <label key={k} className="cell gap-3">
                <span className="flex w-16 shrink-0 flex-col">
                  <span className="text-body text-fg-1">{k === 'focus' ? 'Focus' : 'Stress'}</span>
                  <span className="text-label text-fg-2">{k === 'focus' ? '0–10 flow' : '0–10'}</span>
                </span>
                <input type="range" min={0} max={10} value={f[k]} onChange={(e) => set({ [k]: Number(e.target.value) })}
                  aria-valuetext={`${f[k]} of 10`} className={`effort min-w-0 flex-1${k === 'focus' ? ' effort-good' : ''}`} />
                <span className="num w-7 shrink-0 text-right text-title font-bold text-fg-1">{f[k]}</span>
              </label>
            ))}
            <div className="cell gap-3">
              <span className="flex-1 text-body text-fg-1">Interruptions</span>
              <button type="button" className="round-btn" aria-label="One fewer interruption" disabled={!f.interruptions}
                onClick={() => set({ interruptions: Math.max(0, (f.interruptions ?? 0) - 1) })}><Icon as={Minus} size="sm" /></button>
              <output aria-live="polite" aria-label="Interruptions" className="min-w-[2rem] text-center text-heading font-bold tabular-nums text-fg-1">{f.interruptions ?? '–'}</output>
              <button type="button" className="round-btn" aria-label="One more interruption"
                onClick={() => set({ interruptions: Math.min(99, (f.interruptions ?? 0) + 1) })}><Icon as={Plus} size="sm" /></button>
            </div>
          </Cells>
          <Cells title="Something new">
            <FieldCell label="Project" value={f.project} onChange={(v) => set({ project: v })} placeholder="Cadence, work…" />
            <FieldCell label="Minutes" type="number" inputMode="numeric" value={f.durationMin ? String(f.durationMin) : ''}
              onChange={(v) => set({ durationMin: v === '' ? undefined : Math.max(0, Number(v)) })} placeholder="Any length" />
            <FieldCell label="More tags" value={f.moreTags} onChange={(v) => set({ moreTags: v })} placeholder="go, rust" />
            <label className="cell gap-3">
              <span className="w-[6.5rem] shrink-0 text-body text-fg-1">Earlier day</span>
              <input type="date" value={f.date} max={today} onChange={(e) => e.target.value && set({ date: e.target.value })} className="cell-input" />
            </label>
          </Cells>
          <Cells title="Notes">
            <div className="cell"><textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="What did you work on?" rows={3} aria-label="Notes" className="cell-textarea" /></div>
          </Cells>
        </div>
      </Sheet>
    </div>
  )
}
