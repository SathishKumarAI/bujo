/**
 * Copy for a phone plan, in words rather than symbols (owner, 2026-11-13:
 * "make sure I don't see those symbols"). One place, so Pull-ups and Home
 * workout say "3 sets of 12" and "8 to 12" the same way.
 *
 * - "3×12" / "3x10 per side" / "3×45s" become "3 sets of 12" / "… of 10 per side" / "… of 45 s"
 * - a range "8–12" becomes "8 to 12"
 * - an aside " — " or a separator " · " becomes a comma; an arrow becomes "to"
 */
export function plain(s: string): string {
  return s
    .replace(/(\d+)\s*[x×]\s*(\d+)\s*s\b/gi, '$1 sets of $2 s')
    .replace(/(\d+)\s*[x×]\s*(\d+)/gi, '$1 sets of $2')
    .replace(/(\d)\s*[–-]\s*(\d)/g, '$1 to $2')
    .replace(/\s*[—·]\s*/g, ', ')
    .replace(/\s*→\s*/g, ' to ')
}
