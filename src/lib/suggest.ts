// Input intelligence: VS Code-style completion suggestions + duplicate detection.
// Pure + framework-free so it's trivially unit-tested; the UI (SmartInput) renders
// whatever these return.

export type SuggestionKind = 'command' | 'tag' | 'recent' | 'habit'

export interface Suggestion {
  kind: SuggestionKind
  /** Text inserted when accepted. */
  value: string
  /** Label shown in the list (defaults to value). */
  label?: string
  /** Right-aligned hint (e.g. the kind). */
  hint?: string
}

export interface SuggestContext {
  tags: string[] // known #tags (without the leading '#')
  recents: string[] // recent entry texts, newest first
  habits: string[] // known habit names
}

/** Quick-capture slash/letter commands (mirrors the bullet grammar). */
const COMMANDS: Suggestion[] = [
  { kind: 'command', value: 't ', label: 't — task', hint: 'task' },
  { kind: 'command', value: 'e ', label: 'e — event', hint: 'event' },
  { kind: 'command', value: 'n ', label: 'n — note', hint: 'note' },
  { kind: 'command', value: '* ', label: '* — important', hint: 'important' },
  { kind: 'command', value: '^ ', label: '^ — memory', hint: 'memory' },
]

const dedupe = (xs: string[]) => [...new Set(xs)]

/**
 * Suggestions for the current query. The "active token" is the last
 * whitespace-separated word; `#foo` triggers tag completion, a leading `/`
 * triggers commands, otherwise we match recents + habits.
 */
export function suggest(query: string, ctx: SuggestContext, limit = 6): Suggestion[] {
  const q = query.trimStart()
  if (q === '') return ctx.recents.slice(0, limit).map((r) => ({ kind: 'recent', value: r }))

  const token = q.split(/\s+/).pop() ?? ''

  // #tag completion on the active token
  if (token.startsWith('#')) {
    const frag = token.slice(1).toLowerCase()
    return dedupe(ctx.tags)
      .filter((t) => t.toLowerCase().startsWith(frag))
      .slice(0, limit)
      .map((t) => ({ kind: 'tag', value: `#${t}`, hint: 'tag' }))
  }

  // slash commands
  if (q.startsWith('/')) {
    const frag = q.slice(1).toLowerCase()
    return COMMANDS.filter((c) => c.value.toLowerCase().startsWith(frag)).slice(0, limit)
  }

  // recents + habits: prefix matches rank above substring matches.
  // A bare 1-char query (e.g. a "t" task prefix mid-typing) is too short to be
  // a useful search, so stay quiet rather than flooding the list.
  const ql = q.toLowerCase()
  if (ql.length < 2) return []
  const pool: Suggestion[] = [
    ...ctx.habits.filter((h) => h.toLowerCase().includes(ql)).map((h) => ({ kind: 'habit' as const, value: h, hint: 'habit' })),
    ...ctx.recents.filter((r) => r.toLowerCase().includes(ql) && r.toLowerCase() !== ql).map((r) => ({ kind: 'recent' as const, value: r })),
  ]
  const rank = (s: Suggestion) => (s.value.toLowerCase().startsWith(ql) ? 0 : 1)
  return pool.sort((a, b) => rank(a) - rank(b)).slice(0, limit)
}

// ── Duplicate detection ──────────────────────────────────────────────────────

export interface DupItem {
  id: string
  text: string
}
export interface DupMatch extends DupItem {
  score: number // 0..1, 1 = exact (after normalization)
}

/** Lowercase, trim, collapse whitespace, drop surrounding punctuation. */
export function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ').replace(/^[^\w#]+|[^\w]+$/g, '')
}

const tokens = (s: string) => new Set(normalize(s).split(' ').filter(Boolean))

/** Token-overlap (Jaccard) similarity, 0..1. */
export function similarity(a: string, b: string): number {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  const ta = tokens(a)
  const tb = tokens(b)
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter += 1
  const union = ta.size + tb.size - inter
  return union ? inter / union : 0
}

/**
 * Items that look like duplicates of `query`, strongest first.
 * `threshold` defaults to 0.7 (tune for fewer/more matches).
 */
export function findDuplicates(query: string, items: DupItem[], threshold = 0.7): DupMatch[] {
  if (normalize(query) === '') return []
  return items
    .map((it) => ({ ...it, score: similarity(query, it.text) }))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
}
