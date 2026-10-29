import { useState } from 'react'
import { CalendarDot, CaretDown, Check, MapPin, Minus, Plus, SlidersHorizontal, Users } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Seg } from '../ui/seg'
import { Cell, Cells } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { todayISO, addDays, prettyDay } from '../../lib/date'
import { onRaised } from '../../lib/colors'
import { SessionFields } from './SessionFields'
import type { SessionDraft } from './sessionDraft'

/** The word under the effort number — the 1–10 scale said in English. */
const EFFORT_WORD = ['', 'Very easy', 'Easy', 'Easy', 'Moderate', 'Moderate', 'Solid', 'Hard', 'Hard', 'Very hard', 'All out']

const TIME_OPTIONS = [
  { value: '30', label: '30m', name: '30 minutes' },
  { value: '45', label: '45m', name: '45 minutes' },
  { value: '60', label: '1h', name: '1 hour' },
  { value: '90', label: '1½h', name: '1 and a half hours' },
  { value: '120', label: '2h', name: '2 hours' },
] as const

/**
 * THE PHONE'S LOG — one screen, nothing to scroll to log a session.
 *
 * OWNS: the phone layout of a new session — date and format, a scoreboard,
 * time and effort, a grouped list for who / where / more, and the sheet.
 * DOES NOT OWN: the draft, `log()`, or any field's meaning. The draft and the
 * save are the view's; every optional field is `SessionFields` in a `Sheet`,
 * so there is still exactly one form for a session.
 *
 * Shape (COD-452): ask on screen only what changes every session, start from
 * last time for what rarely does (`carryOver`), and put everything optional
 * one tap away. Look (COD-454, the refresh): native-app surfaces — an iOS
 * segmented control, a scoreboard card, a graded effort slider, an inset
 * grouped list, a solid main action. `styles/phone.css` holds all of it.
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
  const won = n(f.gamesWon)
  const lost = n(f.gamesLost)
  const bump = (k: 'gamesWon' | 'gamesLost', d: number) => set({ [k]: String(Math.max(0, Math.min(30, n(f[k]) + d))) })
  const dayLabel = f.date === today ? 'Today' : f.date === yesterday ? 'Yesterday' : prettyDay(f.date)
  const singles = f.format === 'singles'
  const who = singles ? f.opponent : f.partner
  // What the sheet holds that is filled in — so the row says it is not empty.
  const added = [f.worked.length > 0, f.toFix.length > 0, f.energy, f.pain, f.level, f.scoring, f.pointsFor, f.pointsAgainst, !singles && f.opponent, f.opponent2, f.notes.trim()].filter(Boolean).length

  return (
    <section aria-label="Log a session" className="ios-form flex flex-col gap-3.5">
      <div className="flex items-center gap-2">
        {/* The date is a pill over a real date input — tapping it opens the
            phone's own date wheel — and it says "Today", which is the answer
            nine times in ten. */}
        <label className="relative inline-flex h-[2.75rem] shrink-0 items-center gap-1.5 rounded-[0.75rem] bg-ink-2 px-3 text-body font-medium text-fg-1">
          <Icon as={CalendarDot} size="sm" className="text-fg-2" />
          {dayLabel}
          <Icon as={CaretDown} size="sm" className="text-fg-2" />
          <input
            type="date"
            value={f.date}
            max={today}
            onChange={(e) => e.target.value && set({ date: e.target.value })}
            aria-label={`Date, ${dayLabel}`}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <Seg
          label="Format"
          className="min-w-0 flex-1"
          value={f.format}
          onChange={(v) => v && set({ format: v })}
          options={[{ value: 'doubles', label: 'Doubles' }, { value: 'singles', label: 'Singles' }]}
        />
      </div>

      {/* THE SCOREBOARD — the one number every session has, so the biggest
          thing on the screen. The side that is ahead takes its colour. */}
      <div className="scoreboard" role="group" aria-label="Games">
        {(['gamesWon', 'gamesLost'] as const).map((k, i) => {
          const name = k === 'gamesWon' ? 'Won' : 'Lost'
          const v = k === 'gamesWon' ? won : lost
          const ahead = k === 'gamesWon' ? won > lost : lost > won
          return [
            i === 1 && <hr key="rule" />,
            <div key={k} className="flex flex-col items-center gap-1 px-2 py-2.5">
              <span className="text-label font-semibold tracking-wider text-fg-2 uppercase">{name}</span>
              {/* − N + on ONE row: the buttons flank the number they change. */}
              <div className="flex w-full items-center justify-between">
                <button type="button" className="round-btn" onClick={() => bump(k, -1)} aria-label={`One fewer game ${name.toLowerCase()}`}><Icon as={Minus} size="md" /></button>
                <output
                  aria-live="polite"
                  aria-label={`Games ${name.toLowerCase()}`}
                  className="score-num"
                  style={{ color: ahead ? onRaised(k === 'gamesWon' ? 'green' : 'red') : undefined }}
                >
                  {v}
                </output>
                {/* + is the tap a session is made of, so it is the filled one;
                    − corrects a mis-tap and stays quiet. */}
                <button type="button" className="round-btn round-btn-primary" onClick={() => bump(k, 1)} aria-label={`One more game ${name.toLowerCase()}`}><Icon as={Plus} size="md" /></button>
              </div>
            </div>,
          ]
        })}
      </div>

      <Seg
        label="Time on court"
        value={f.durationMin === '' ? null : (f.durationMin as (typeof TIME_OPTIONS)[number]['value'])}
        onChange={(v) => v && set({ durationMin: v })}
        options={TIME_OPTIONS}
        /* NOT `allowNone`. Time arrives pre-selected from last session, and a
           tap on the highlighted option is how people CONFIRM it — measured,
           the e2e did exactly that and logged a session with no duration. */
      />

      {/* EFFORT, graded easy → all out, with the word under the number. Unset
          until touched — "no answer" and "5" are different facts. */}
      <label className="flex items-center gap-3">
        <span className="flex w-[4.5rem] shrink-0 flex-col">
          <span className="text-body font-medium text-fg-1">Effort</span>
          <span className="text-label text-fg-2">{f.rpe === '' ? 'Slide' : EFFORT_WORD[Number(f.rpe)]}</span>
        </span>
        <input
          type="range"
          min={1}
          max={10}
          value={f.rpe === '' ? 5 : Number(f.rpe)}
          onChange={(e) => set({ rpe: e.target.value })}
          aria-valuetext={f.rpe === '' ? 'Not set' : `${f.rpe} of 10, ${EFFORT_WORD[Number(f.rpe)]}`}
          className="effort min-w-0 flex-1"
          data-unset={f.rpe === '' || undefined}
        />
        <span className="num w-8 shrink-0 text-right text-title font-bold text-fg-1">{f.rpe === '' ? '–' : f.rpe}</span>
      </label>

      <Cells>
        {/* Who and where, ONE row — both open the same sheet, and two rows
            cost the 52px that put the Log button under the fold. */}
        <Cell
          icon={who ? Users : MapPin}
          tone="sky"
          title={[who, f.location].filter(Boolean).join(' · ') || (singles ? 'Add opponent & court' : 'Add partner & court')}
          subtitle={singles ? 'Opponent & court' : 'Partner & court'}
          onPress={() => setMore(true)}
        />
        <Cell icon={SlidersHorizontal} tone="mauve" title="How it went, level, notes" subtitle={added > 0 ? `${added} added` : 'Optional'} onPress={() => setMore(true)} />
      </Cells>

      <button type="button" className="cta" onClick={onLog}><Icon as={Check} size="md" />Log session</button>

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
          <Cells title="Notes">
            <div className="cell"><textarea value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="How did it go?" rows={3} aria-label="Notes" className="cell-textarea" /></div>
          </Cells>
        </div>
      </Sheet>
    </section>
  )
}
