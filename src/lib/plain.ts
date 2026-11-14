/**
 * Copy for a phone plan, in words rather than symbols (owner, 2026-11-13:
 * "make sure I don't see those symbols"). One place, so Pull-ups and Home
 * workout say "3 sets of 12" and "8 to 12" the same way.
 *
 * - "3×12" / "3x10 per side" / "3×45s" become "3 sets of 12" / "… of 10 per side" / "… of 45 s"
 * - a range "8–12" becomes "8 to 12"
 * - an aside " — " or a separator " · " becomes a comma; an arrow becomes "to"
 * - "5× a week" becomes "5 times a week"; a score "7/10" becomes "7 of 10"
 *   (a date's "11/13/2026" is left alone)
 * - a trend arrow ↑ / ↓ becomes "up" / "down"; a "±" before a spread goes
 */
export function plain(s: string): string {
  return s
    .replace(/(\d+)\s*[x×]\s*(\d+)\s*s\b/gi, '$1 sets of $2 s')
    .replace(/(\d+)\s*[x×]\s*(\d+)/gi, '$1 sets of $2')
    .replace(/(\d)×/g, '$1 times')
    .replace(/(?<![\d/])(\d+(?:\.\d+)?)\/(\d+)(?![\d/])/g, '$1 of $2')
    .replace(/↑\s*/g, 'up ')
    .replace(/↓\s*/g, 'down ')
    .replace(/±/g, '')
    .replace(/(\d)\s*[–-]\s*(\d)/g, '$1 to $2')
    .replace(/\s*[—·]\s*/g, ', ')
    .replace(/\s*→\s*/g, ' to ')
}
