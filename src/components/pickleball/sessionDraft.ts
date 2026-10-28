import { todayISO } from '../../lib/date'
import type { PickleballSession } from '../../lib/types'

/**
 * A SESSION AS A FORM HOLDS IT, and the two translations either way.
 *
 * Its own file because `SessionFields.tsx` is a component file, and a
 * component file that also exports constants breaks fast refresh — the same
 * rule that split `stepStyle.ts` out of Cycle's view. The component imports
 * the type from here; nothing imports the other way.
 */
/** The form's own shape: strings, because that is what inputs hold. */
export type SessionDraft = ReturnType<typeof blankSession>

export const blankSession = () => ({
  date: todayISO(),
  format: 'doubles' as 'singles' | 'doubles',
  gamesWon: '',
  gamesLost: '',
  durationMin: '',
  partner: '',
  rpe: '',
  notes: '',
  opponent: '',
  opponent2: '',
  location: '',
  level: '',
  pointsFor: '',
  pointsAgainst: '',
  scoring: '' as '' | '11' | '15' | '21' | 'rally21',
  worked: [] as string[],
  toFix: [] as string[],
  energy: '',
  pain: '' as '' | 'yes' | 'no',
})

/** A stored session as a draft — the editor's seed. */
export function draftFrom(p: PickleballSession): SessionDraft {
  return {
    date: p.date,
    format: p.format,
    gamesWon: String(p.gamesWon ?? ''),
    gamesLost: String(p.gamesLost ?? ''),
    durationMin: p.durationMin != null ? String(p.durationMin) : '',
    partner: p.partner ?? '',
    rpe: p.rpe != null ? String(p.rpe) : '',
    notes: p.notes ?? '',
    opponent: p.opponent ?? '',
    opponent2: p.opponent2 ?? '',
    location: p.location ?? '',
    level: p.level ?? '',
    pointsFor: p.pointsFor != null ? String(p.pointsFor) : '',
    pointsAgainst: p.pointsAgainst != null ? String(p.pointsAgainst) : '',
    scoring: p.scoring ?? '',
    worked: p.worked ?? [],
    toFix: p.toFix ?? [],
    energy: p.energy != null ? String(p.energy) : '',
    pain: p.pain == null ? '' : p.pain ? 'yes' : 'no',
  }
}

/**
 * A draft as the patch both writers take.
 *
 * `undefined` for an empty field rather than `''` or `0`: absent means NOT
 * LOGGED everywhere else in this app, and a cleared partner has to be able to
 * go back to absent. Every key is listed because `updatePickleball` MERGES —
 * omitting one would mean "leave whatever was there", which is the opposite
 * of clearing it.
 */
export function sessionPatch(f: SessionDraft): Partial<PickleballSession> {
  return {
    date: f.date,
    format: f.format,
    gamesWon: Number(f.gamesWon) || 0,
    gamesLost: Number(f.gamesLost) || 0,
    durationMin: f.durationMin ? Number(f.durationMin) : undefined,
    partner: f.partner.trim() || undefined,
    rpe: f.rpe ? Number(f.rpe) : undefined,
    notes: f.notes.trim() || undefined,
    opponent: f.opponent.trim() || undefined,
    opponent2: f.opponent2.trim() || undefined,
    location: f.location.trim() || undefined,
    level: f.level.trim() || undefined,
    pointsFor: f.pointsFor ? Number(f.pointsFor) : undefined,
    pointsAgainst: f.pointsAgainst ? Number(f.pointsAgainst) : undefined,
    scoring: f.scoring || undefined,
    worked: f.worked.length ? f.worked : undefined,
    toFix: f.toFix.length ? f.toFix : undefined,
    energy: f.energy ? Number(f.energy) : undefined,
    pain: f.pain === '' ? undefined : f.pain === 'yes',
  }
}
