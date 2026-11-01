import { todayISO } from '../../lib/date'
import type { PickleballEvent, PickleballFormat } from '../../lib/types'

/**
 * A league or tournament as a form holds it, and what saving one writes.
 *
 * OWNS: the blank draft, the draft ↔ event conversion (an edit loads `draftOf`
 * and saves through the same `eventFrom` an add does), the same-day rating
 * clash, and the prep checklist.
 * DOES NOT OWN: any drawing. Both the desktop `CompetitionPanel` and the phone
 * `phone/CompetitionPhone` read this, so an event field added here is added to
 * BOTH forms by hand — same rule as `sessionDraft.ts`.
 */
export const evtBlankOf = () => ({ date: todayISO(), name: '', kind: 'tournament' as 'league' | 'tournament', format: 'pool-play' as PickleballFormat, division: '', wins: '', losses: '', placement: '', partner: '', notes: '' })
export type EventDraft = ReturnType<typeof evtBlankOf>

/** Blank strings become `undefined`, so an unanswered field is not stored as "". */
export function eventFrom(ev: EventDraft): Omit<PickleballEvent, 'id'> {
  return {
    date: ev.date,
    name: ev.name.trim(),
    kind: ev.kind,
    format: ev.format,
    division: ev.division.trim() || undefined,
    wins: ev.wins ? Number(ev.wins) : undefined,
    losses: ev.losses ? Number(ev.losses) : undefined,
    placement: ev.placement.trim() || undefined,
    partner: ev.partner.trim() || undefined,
    notes: ev.notes.trim() || undefined,
  }
}

/** An event back into the form, for editing. `notes` rides along although
 *  neither form draws it, so an edit does not erase it. */
export function draftOf(e: PickleballEvent): EventDraft {
  const str = (n?: number) => (n == null ? '' : String(n))
  return { date: e.date, name: e.name, kind: e.kind, format: e.format, division: e.division ?? '', wins: str(e.wins), losses: str(e.losses), placement: e.placement ?? '', partner: e.partner ?? '', notes: e.notes ?? '' }
}

/** DUPR is one rating per day, so saving on `date` replaces whatever it holds.
 *  Returns that rating unless it is the one being edited (`from`) — the caller
 *  asks before replacing it, instead of the store doing it silently. */
export const ratingClash = (log: { date: string; rating: number }[] | undefined, date: string, from?: string | null) =>
  (log ?? []).find((p) => p.date === date && p.date !== from)

/** Tournament-day prep checklist, shown beside the countdown to an event. */
export const PREP_CHECKLIST = [
  'Paddles (+ a backup) and fresh grip / overgrip tape',
  'Court shoes, extra socks, athletic tape',
  'Water + electrolytes; quick-energy snacks',
  'Sun: hat, sunglasses, sunscreen - or layers for cold',
  'Warm-up band, foam roller; ibuprofen / blister kit',
  'Know your start time, division & format; arrive 45 min early',
  'Mental routine: pre-point breath, one tactical intention',
]
