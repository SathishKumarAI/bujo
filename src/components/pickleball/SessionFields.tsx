import { Input } from '../ui'
import { ChipPick, DayPick, Stepper } from '../ui/quickpick'
import { durationOptions } from '../ui/quickpick.options'
import { DisclosureRow } from '../page'
import { FieldGroup } from '../ui/FieldGroup'
import { SessionFieldsPhone } from './SessionFieldsPhone'
import { useDevice } from '../shell/device'
import { todayISO } from '../../lib/date'
import { SESSION_SKILLS } from '../../lib/pickleballAcademy'
import type { SessionDraft } from './sessionDraft'

/** `''` is "not filled", which a `Stepper` reads as no value rather than 0. */
export type SessionSection = 'when' | 'score' | 'session' | 'who' | 'how' | 'details'

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

export function SessionFields({ f, set, recentPartners, allPartners, recentVenues, allVenues, yesterday, sections, noDate }: {
  f: SessionDraft
  set: (p: Partial<SessionDraft>) => void
  /** The one chip: who you played with last. */
  recentPartners: string[]
  /** Everything you have ever logged, for the field's own dropdown. */
  allPartners: string[]
  recentVenues: string[]
  allVenues: string[]
  yesterday: string
  /**
   * Which parts to draw; all of them by default. The phone's quick log draws
   * the everyday facts itself and puts only `who`, `how` and `details` in its
   * sheet (COD-452) — still this one component, so there is still exactly one
   * form for a session.
   */
  sections?: readonly SessionSection[]
  /**
   * Leave the date out: the new-session log picks its day with the page's
   * `DayStrip`, and one day gets one picker. The history editor omits this —
   * moving a logged session to another day is an edit it must still offer
   * (`docs/USER-CONTROL.md`).
   */
  noDate?: boolean
}) {
  const has = (k: SessionSection) => !sections || sections.includes(k)
  /* A PHONE GETS ITS OWN DRAWING of the same fields (`SessionFieldsPhone`),
     so the quick log's sheet and the history edit sheet both get it without
     knowing; desktop rendering below is unchanged. */
  const phoneDevice = useDevice() === 'mobile'
  /* ON A PHONE: THE SAME FIELDS, IN THE SAME ORDER, NOTHING FOLDED.
     Asked for as "all the input should be taken only in one screen" — one
     scrolling form, so the fold below opens out into a group of its own, and
     every section is an iOS inset group (`FieldGroup`, `styles/phone.css`).
     On a desktop each `FieldGroup` renders the exact wrapper it replaced. */
  const phone = useDevice() === 'mobile'
  /* ONE LINE, LABEL LEFT — iOS's settings row, for a choice short enough to
     sit beside its name (`styles/phone.css`, `.ios-row`). */
  const row = phone ? 'ios-row' : undefined
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])
  /* HOW IT WENT — what worked, what to fix, energy, pain (COD-451). Optional,
     and in the phone's own group right after the facts, because a phone is
     where you answer it, at the side of the court. On a desktop it sits in the
     Details fold, so the desktop form looks the same until you open it — and
     the history editor, which renders this same component, can still reach
     every field it stores. */
  const howItWent = (<>
    <ChipPick
      label="What worked"
      tone="green"
      multi
      value={f.worked}
      onChange={(v) => set({ worked: toggle(f.worked, v) })}
      options={SESSION_SKILLS.map((s) => ({ value: s.value, label: s.label, name: 'name' in s ? s.name : undefined }))}
    />
    <ChipPick
      label="To work on"
      tone="peach"
      multi
      value={f.toFix}
      onChange={(v) => set({ toFix: toggle(f.toFix, v) })}
      options={SESSION_SKILLS.map((s) => ({ value: s.value, label: s.label, name: 'name' in s ? s.name : undefined }))}
    />
    <ChipPick
      className={row}
      label={phone ? 'Energy 1–5' : 'Energy after'}
      tone="teal"
      value={numOrUndef(f.energy) ?? null}
      onChange={(v) => set({ energy: numOrUndef(f.energy) === v ? '' : String(v) })}
      /* A phone draws the plain segmented row beside its label; the scale's
         ends line is a second row a phone pays for on every session. */
      scale={phone ? undefined : { low: '1 drained', high: '5 buzzing' }}
      options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
    />
    <ChipPick
      className={row}
      label="Any pain?"
      tone="red"
      value={f.pain || null}
      onChange={(v) => set({ pain: f.pain === v ? '' : v })}
      options={[{ value: 'no' as const, label: 'No' }, { value: 'yes' as const, label: 'Yes' }]}
      hint={f.pain === 'yes' ? 'Say where in the notes.' : undefined}
    />
  </>)
  /* The opponents. On a phone they are WHO, beside the partner and the court
     — the quick log's "Opponent" pill opens the sheet onto them; on a
     desktop they stay in the Details fold where they have always been. */
  const opponents = (
          <div className={f.format !== 'doubles' ? undefined : phone ? 'grid grid-cols-2 gap-3' : 'grid gap-3 sm:grid-cols-2'}>
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
  )
  if (phoneDevice) return <SessionFieldsPhone f={f} set={set} allPartners={allPartners} allVenues={allVenues} sections={sections} noDate={noDate} />
  return (
      <div className={phone ? 'flex flex-col gap-4' : 'flex flex-col gap-3'}>
        {has('when') && (<>
        <FieldGroup title="When" desktop="grid gap-3 sm:grid-cols-2">
        {!noDate && <DayPick value={f.date} onChange={(d) => set({ date: d })} today={todayISO()} yesterday={yesterday} />}

        <ChipPick
          className={row}
          label="Format"
          value={f.format}
          onChange={(v) => set({ format: v })}
          options={[{ value: 'doubles', label: 'Doubles' }, { value: 'singles', label: 'Singles' }]}
        />
        </FieldGroup>
        </>)}

        {has('score') && (<>
        <FieldGroup title="Score" desktop="grid gap-3 sm:grid-cols-2" cols={2}>
          <Stepper label="Games won" value={numOrUndef(f.gamesWon)} onChange={(v) => set({ gamesWon: v == null ? '' : String(v) })} max={30} placeholder="0" />
          <Stepper label="Games lost" value={numOrUndef(f.gamesLost)} onChange={(v) => set({ gamesLost: v == null ? '' : String(v) })} max={30} placeholder="0" />
        </FieldGroup>
        </>)}

        {has('session') && (<>
        <FieldGroup title="Session">
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
          hint={phone ? undefined : '1 easy · 10 everything you had'}
        />
        </FieldGroup>
        </>)}

        {has('who') && (<>
        <FieldGroup title="Who & where" desktop="grid gap-3 sm:grid-cols-2">
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
        {phone && opponents}
        </FieldGroup>
        </>)}

        {phone && has('how') && <FieldGroup title="How it went">{howItWent}</FieldGroup>}

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
        {has('details') && (<>
        {(() => { const details = (<>
          <ChipPick
            className={row}
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
          <div className={phone ? 'grid grid-cols-2 gap-3' : 'grid gap-3 sm:grid-cols-2'}>
            <Input type="number" value={f.pointsFor} onChange={(e) => set({ pointsFor: e.target.value })} placeholder="Pts for" aria-label="Points for" />
            <Input type="number" value={f.pointsAgainst} onChange={(e) => set({ pointsAgainst: e.target.value })} placeholder="Pts against" aria-label="Points against" />
          </div>
          {/* TWO BOXES IN DOUBLES, because doubles is four people and this
              used to be one field whose placeholder said "Opponent(s)" — a
              control inviting two names into one string, which then joins
              against nothing. The second is gated on the format exactly as
              `Partner` is, so a singles session is never asked for a name it
              cannot have. */}
          {!phone && opponents}
          {!phone && howItWent}
        </>)
        return phone
          ? <FieldGroup title="Details">{details}</FieldGroup>
          : <DisclosureRow label="Level, scoring, points & opponents">{details}</DisclosureRow>
        })()}
        </>)}
      </div>
  )
}
