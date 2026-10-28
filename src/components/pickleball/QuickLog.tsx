import { useState } from 'react'
import { CalendarDot, CaretRight, MapPin, Minus, Plus, SlidersHorizontal, Users } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Button } from '../ui/button'
import { Textarea } from '../ui'
import { ChipPick } from '../ui/quickpick'
import { durationOptions } from '../ui/quickpick.options'
import { Sheet } from '../ui/sheet'
import { FieldGroup } from '../ui/FieldGroup'
import { todayISO, addDays, prettyDay } from '../../lib/date'
import { SessionFields } from './SessionFields'
import type { SessionDraft } from './sessionDraft'

/**
 * THE PHONE'S LOG — one screen, no scrolling to log a session (COD-452).
 *
 * OWNS: the phone layout of a new session — a scoreboard, the everyday
 * choices, two pills for who and where, and a sheet for the rest.
 * DOES NOT OWN: the draft, `log()`, or any field's meaning. The draft and the
 * save are the view's; every optional field is `SessionFields` in a `Sheet`,
 * so there is still exactly one form for a session.
 *
 * Why this shape, after a grouped form was rejected: "try not to make them
 * scroll down again and again — it's not worth it for the user to spend more
 * time getting the input in". A form, however well grouped, asks every
 * question every time. This asks the three that change each session (score,
 * length, effort) on the screen, starts from last time for the ones that
 * rarely change (`carryOver`), and puts everything optional one tap away.
 * A typical log is +, +, Log.
 */
export function QuickLog({ f, set, onLog, recentPartners, allPartners, recentVenues, allVenues }: {
  f: SessionDraft
  set: (p: Partial<SessionDraft>) => void
  onLog: () => void
  recentPartners: string[]
  allPartners: string[]
  recentVenues: string[]
  allVenues: string[]
}) {
  const [more, setMore] = useState(false)
  const today = todayISO()
  const yesterday = addDays(today, -1)
  const n = (v: string) => (v === '' ? 0 : Number(v))
  const bump = (k: 'gamesWon' | 'gamesLost', d: number) => set({ [k]: String(Math.max(0, Math.min(30, n(f[k]) + d))) })
  const dayLabel = f.date === today ? 'Today' : f.date === yesterday ? 'Yesterday' : prettyDay(f.date)
  // What the sheet holds that is filled in — so "More" says it is not empty.
  const added = [f.worked.length > 0, f.toFix.length > 0, f.energy, f.pain, f.level, f.scoring, f.pointsFor, f.pointsAgainst, f.opponent, f.opponent2, f.notes.trim()].filter(Boolean).length

  return (
    <section aria-label="Log a session" className="ios-form flex flex-col gap-3">
      {/* DATE AND FORMAT, one line. The date is a pill over a real date input:
          tapping it opens the phone's own date wheel, and it reads "Today"
          rather than "10/28/2026" because that is the answer nine times in
          ten. */}
      <div className="flex items-center gap-2">
        <label className="relative inline-flex h-11 shrink-0 items-center gap-1.5 rounded-pill border border-line-strong bg-ink-2 px-3.5 text-body font-medium text-fg-1">
          <Icon as={CalendarDot} size="sm" className="text-fg-2" />
          {dayLabel}
          <input
            type="date"
            value={f.date}
            max={today}
            onChange={(e) => e.target.value && set({ date: e.target.value })}
            aria-label={`Date, ${dayLabel}`}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <ChipPick
          className="ios-bare min-w-0 flex-1"
          label="Format"
          value={f.format}
          onChange={(v) => set({ format: v })}
          options={[{ value: 'doubles', label: 'Doubles' }, { value: 'singles', label: 'Singles' }]}
        />
      </div>

      {/* THE SCOREBOARD. The one thing every session has, so it is the biggest
          thing on the screen: numerals at the app's `answer` size, and −/+
          buttons a thumb cannot miss. */}
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Games">
        {(['gamesWon', 'gamesLost'] as const).map((k) => {
          const name = k === 'gamesWon' ? 'Won' : 'Lost'
          return (
            <div key={k} className="rounded-card bg-ink-0 px-2 py-2.5 text-center">
              <div className="text-label font-medium tracking-wide text-fg-2 uppercase">{name}</div>
              <div className="mt-1 flex items-center justify-between">
                <Button variant="secondary" size="icon" onClick={() => bump(k, -1)} aria-label={`One fewer game ${name.toLowerCase()}`} className="size-11 rounded-pill"><Icon as={Minus} size="md" /></Button>
                <output aria-live="polite" aria-label={`Games ${name.toLowerCase()}`} className="num text-answer leading-none font-semibold text-fg-1">{n(f[k])}</output>
                <Button variant="secondary" size="icon" onClick={() => bump(k, 1)} aria-label={`One more game ${name.toLowerCase()}`} className="size-11 rounded-pill"><Icon as={Plus} size="md" /></Button>
              </div>
            </div>
          )
        })}
      </div>

      <ChipPick
        label="Time"
        className="ios-row ios-row-short"
        tone="teal"
        value={f.durationMin === '' ? null : Number(f.durationMin)}
        onChange={(v) => set({ durationMin: f.durationMin === String(v) ? '' : String(v) })}
        options={durationOptions([30, 45, 60, 90, 120])}
      />

      {/* EFFORT AS A SLIDER — ten chips were a row of 30px targets; a slider
          is one 44px control the thumb drags. Unset until touched, and says
          so, because "no answer" and "5" are different facts. */}
      <label className="flex h-11 items-center gap-3">
        <span className="w-14 shrink-0 text-body font-medium text-fg-1">Effort</span>
        <input
          type="range"
          min={1}
          max={10}
          value={f.rpe === '' ? 5 : Number(f.rpe)}
          onChange={(e) => set({ rpe: e.target.value })}
          aria-valuetext={f.rpe === '' ? 'Not set' : `${f.rpe} of 10`}
          className="ios-range min-w-0 flex-1"
          data-unset={f.rpe === '' || undefined}
        />
        <span className="num w-10 shrink-0 text-right text-heading font-semibold text-fg-1">{f.rpe === '' ? '–' : f.rpe}</span>
      </label>

      {/* WHO AND WHERE, as two pills carrying last time's answers. Tapping
          either opens the sheet, where the full pickers are. */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: Users, text: f.format === 'singles' ? (f.opponent || 'Opponent') : (f.partner || 'Partner'), set: f.format === 'singles' ? !!f.opponent : !!f.partner },
          { icon: MapPin, text: f.location || 'Court', set: !!f.location },
        ].map((p) => (
          <button
            key={p.text + String(p.icon)}
            type="button"
            onClick={() => setMore(true)}
            className={`flex h-11 min-w-0 items-center gap-2 rounded-card border px-3 text-left text-body ${p.set ? 'border-line-strong bg-ink-0 text-fg-1' : 'border-dashed border-line-strong text-fg-2'}`}
          >
            <Icon as={p.icon} size="sm" className="shrink-0 text-fg-2" />
            <span className="min-w-0 flex-1 truncate">{p.text}</span>
            <Icon as={CaretRight} size="sm" className="shrink-0 text-fg-2" />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setMore(true)}
        className="flex h-11 items-center gap-2 rounded-card px-1 text-left text-body text-fg-1"
      >
        <Icon as={SlidersHorizontal} size="sm" className="text-fg-2" />
        <span className="flex-1">How it went, level, points, notes</span>
        <span className="text-label text-fg-2">{added > 0 ? `${added} added` : 'Optional'}</span>
        <Icon as={CaretRight} size="sm" className="text-fg-2" />
      </button>

      <Button variant="primary" size="lg" onClick={onLog} className="press-3d h-12 w-full bg-brand text-[length:var(--text-heading)] font-semibold text-brand-ink hover:bg-brand/90">Log session</Button>

      <Sheet open={more} onOpenChange={setMore} title="More about this session" description="All optional">
        <div className="flex flex-col gap-4">
          <SessionFields
            f={f}
            set={set}
            recentPartners={recentPartners}
            allPartners={allPartners}
            recentVenues={recentVenues}
            allVenues={allVenues}
            yesterday={yesterday}
            sections={['who', 'how', 'details']}
          />
          <FieldGroup title="Notes">
            <Textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="How did it go?" rows={3} aria-label="Notes" />
          </FieldGroup>
        </div>
      </Sheet>
    </section>
  )
}
