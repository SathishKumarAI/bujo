import { Input } from '../ui'
import { ChipPick, DayPick, Stepper } from '../ui/quickpick'
import { durationOptions } from '../ui/quickpick.options'
import { DisclosureRow } from '../page'
import { todayISO } from '../../lib/date'
import type { SessionDraft } from './sessionDraft'

/** `''` is "not filled", which a `Stepper` reads as no value rather than 0. */
const numOrUndef = (v: string): number | undefined => (v.trim() === '' ? undefined : Number(v))

/**
 * EVERY FIELD A SESSION HAS, in one place, for both the things that write one.
 *
 * WHAT THIS FILE OWNS: the controls, and the two translations between a
 * session and the strings a form holds.
 * WHAT IT DOES NOT OWN: where it is rendered, or what the submit button says.
 *
 * The new-session form collected **fourteen** fields and the history editor
 * collected **five** — format, games won, games lost, duration, notes. So a
 * session corrected from the history could be switched to doubles and never
 * given a partner, nor an opponent, location, level, points or scoring.
 * Reported exactly that way.
 *
 * It was **not** data loss — `updatePickleball` merges a `Partial<>`, so the
 * nine unreachable fields survived untouched — which is what made the cheap
 * fix possible. The editor did not need a migration, it needed the real form,
 * and the only way a form stays the real one is that there is exactly one of
 * it. `docs/USER-CONTROL.md`: an edit rewrites every stored shape, not the
 * one the list renders.
 *
 * Third time this shape has been fixed this week — Challenges' rule notes had
 * one reader bound to `today`, and Cycle's optional fields were ten of
 * fourteen never rendered once the day had passed.
 */

export function SessionFields({ f, set, recentPartners, allPartners, recentVenues, allVenues, yesterday }: {
  f: SessionDraft
  set: (p: Partial<SessionDraft>) => void
  /** The one chip: who you played with last. */
  recentPartners: string[]
  /** Everything you have ever logged, for the field's own dropdown. */
  allPartners: string[]
  recentVenues: string[]
  allVenues: string[]
  yesterday: string
}) {
  return (
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
        <DayPick value={f.date} onChange={(d) => set({ date: d })} today={todayISO()} yesterday={yesterday} />

        <ChipPick
          label="Format"
          value={f.format}
          onChange={(v) => set({ format: v })}
          options={[{ value: 'doubles', label: 'Doubles' }, { value: 'singles', label: 'Singles' }]}
        />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Stepper label="Games won" value={numOrUndef(f.gamesWon)} onChange={(v) => set({ gamesWon: v == null ? '' : String(v) })} max={30} placeholder="0" />
          <Stepper label="Games lost" value={numOrUndef(f.gamesLost)} onChange={(v) => set({ gamesLost: v == null ? '' : String(v) })} max={30} placeholder="0" />
        </div>

        <ChipPick
          label="On court for"
          tone="teal"
          dense
          value={numOrUndef(f.durationMin) ?? null}
          onChange={(v) => set({ durationMin: String(v) })}
          options={durationOptions([30, 45, 60, 90, 120])}
          after={
            <Input
              type="number"
              value={f.durationMin}
              onChange={(e) => set({ durationMin: e.target.value })}
              placeholder="Mins"
              aria-label="Minutes on court"
              className="w-20 py-1"
            />
          }
        />

        <ChipPick
          label="Effort (RPE)"
          tone="peach"
          /* `dense`, because ten chips at the default `px-3` come to 437px
             against a 416px act column and wrap 9 + 1 — a single orphan
             chip on its own line, which reads as a mistake rather than as
             a scale. The prop exists for this: a call site passing its own
             `className` would re-decide the chip geometry, which is how
             two rows of one control come to disagree. */
          dense
          value={numOrUndef(f.rpe) ?? null}
          onChange={(v) => set({ rpe: String(v) })}
          options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ value: n, label: String(n) }))}
          hint="1 easy · 10 everything you had"
        />

        <div className="grid gap-3 sm:grid-cols-2">
        {f.format === 'doubles' && (
          <ChipPick
            label="Partner"
            value={f.partner || null}
            onChange={(v) => set({ partner: f.partner === v ? '' : v })}
            options={recentPartners.map((n) => ({ value: n, label: n }))}
            after={
              /* `list=` — a real dropdown of every partner you have logged,
                 on a field you can still type anything into. That is the
                 whole ask: stop retyping the same four names, without
                 losing the ability to enter a new one. A `<select>` would
                 have taken the second half away. */
              <>
                <Input
                  value={f.partner}
                  onChange={(e) => set({ partner: e.target.value })}
                  placeholder="Pick or type"
                  aria-label="Partner"
                  list="pb-partners"
                  className="w-36 min-w-0 max-w-full py-1"
                />
                <datalist id="pb-partners">
                  {allPartners.map((n) => <option key={n} value={n} />)}
                </datalist>
              </>
            }
          />
        )}

        <ChipPick
          label="Location"
          tone="teal"
          value={f.location || null}
          onChange={(v) => set({ location: f.location === v ? '' : v })}
          options={recentVenues.map((n) => ({ value: n, label: n }))}
          after={
            <>
              <Input
                value={f.location}
                onChange={(e) => set({ location: e.target.value })}
                placeholder="Pick or type"
                aria-label="Location"
                list="pb-venues"
                className="w-36 min-w-0 max-w-full py-1"
              />
              <datalist id="pb-venues">
                {allVenues.map((n) => <option key={n} value={n} />)}
              </datalist>
            </>
          }
        />
        </div>

        {/* The half you fill less than half the time.

            `DisclosureRow` and not a `<details>`: it renders `aria-expanded`,
            which is what `npm run a11y` clicks to open a fold before it
            scans. A `<details>` would keep these four controls out of the
            accessibility gate entirely — the COD-93 trap, arriving by a new
            route. It is also the page's only disclosure, which is that
            component's stated rule.

            Tap-to-log costs vertical space — chips are taller than the grid
            of number inputs they replaced, and this form grew the page by
            0.4 screens. Folding the optional half is where that comes back,
            without putting a keyboard back in the fast path. */}
        <DisclosureRow label="Level, scoring, points & opponents">
          <ChipPick
            label="Level"
            tone="teal"
            value={f.level || null}
            onChange={(v) => set({ level: v })}
            options={['2.5', '3.0', '3.5', '4.0', '4.5', '5.0'].map((l) => ({ value: l, label: l }))}
          />

          <ChipPick
            label="Scoring"
            tone="teal"
            value={f.scoring || null}
            onChange={(v) => set({ scoring: v })}
            options={[
              { value: '11' as const, label: 'to 11' },
              { value: '15' as const, label: 'to 15' },
              { value: '21' as const, label: 'to 21' },
              { value: 'rally21' as const, label: 'rally 21' },
            ]}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="number" value={f.pointsFor} onChange={(e) => set({ pointsFor: e.target.value })} placeholder="Pts for" aria-label="Points for" />
            <Input type="number" value={f.pointsAgainst} onChange={(e) => set({ pointsAgainst: e.target.value })} placeholder="Pts against" aria-label="Points against" />
          </div>
          {/* TWO BOXES IN DOUBLES, because doubles is four people and this
              used to be one field whose placeholder said "Opponent(s)" — a
              control inviting two names into one string, which then joins
              against nothing. The second is gated on the format exactly as
              `Partner` is, so a singles session is never asked for a name it
              cannot have. */}
          <div className={f.format === 'doubles' ? 'grid gap-3 sm:grid-cols-2' : undefined}>
            <Input
              value={f.opponent}
              onChange={(e) => set({ opponent: e.target.value })}
              placeholder={f.format === 'doubles' ? 'Opponent 1' : 'Opponent (optional)'}
              aria-label={f.format === 'doubles' ? 'First opponent' : 'Opponent'}
            />
            {f.format === 'doubles' && (
              <Input
                value={f.opponent2}
                onChange={(e) => set({ opponent2: e.target.value })}
                placeholder="Opponent 2"
                aria-label="Second opponent"
              />
            )}
          </div>
        </DisclosureRow>
      </div>
  )
}
