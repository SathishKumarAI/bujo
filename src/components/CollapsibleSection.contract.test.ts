import { describe, it, expect } from 'vitest'

/**
 * A comment saying "collapsed" is not a collapsed section.
 *
 * `CollapsibleSection` defaults to **open**, and its own Props doc records why
 * that matters: Trackers' "Deep analytics" group was commented as collapsed,
 * passed nothing, and opened five cards on every visit. Stats then did the same
 * thing at a larger scale — six groups, five comments saying "collapsed", not
 * one `defaultOpen={false}` — and every visit rendered 18 recharts marks and
 * 1811 DOM nodes for content the comments said was folded away.
 *
 * Nothing could catch it. It typechecks, it renders, the tests pass and the
 * page looks plausible; the only symptom is that the page is slow and long.
 * The mismatch is only visible if you read the comment and the props together,
 * which is exactly what a machine is better at than a person.
 *
 * Scoped deliberately narrow: it fires only when the source *claims* the
 * section is collapsed. A section that is open and says nothing is a decision,
 * not a defect, and flagging those would make this noise.
 */
const SOURCES = import.meta.glob('../views/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** The comment block immediately above an opening <Section …> / <QuietSection …> tag. */
function claimsCollapsed(src: string, tagStart: number): boolean {
  const before = src.slice(Math.max(0, tagStart - 400), tagStart)
  const lastComment = before.lastIndexOf('{/*')
  if (lastComment === -1) return false
  const between = before.slice(lastComment)
  // Only the comment directly above — anything with markup after it is a
  // different element's comment.
  if (/<[A-Za-z]/.test(between.slice(between.indexOf('*/') + 2))) return false
  return /\bcollapsed\b/i.test(between)
}

/**
 * The whole opening tag, from `<Section` to its closing `>`.
 *
 * Not a regex. `[^>]*>` was the first attempt, and it is wrong here in a way
 * that fails *silently*: `subtitle={<>month pulse</>}` contains a `>`, so the
 * match ended mid-tag and every attribute after it — including the
 * `defaultOpen={false}` this gate exists to look for — was invisible. It
 * reported an already-fixed section as broken. A gate whose own parser is
 * wrong is worse than no gate, so this counts braces instead.
 */
function openingTag(src: string, start: number): string {
  let depth = 0
  for (let i = start; i < src.length; i++) {
    const c = src[i]
    if (c === '{') depth++
    else if (c === '}') depth--
    else if (c === '>' && depth === 0) return src.slice(start, i + 1)
  }
  return src.slice(start)
}

describe('a section commented as collapsed is actually collapsed', () => {
  const offenders: string[] = []

  for (const [path, src] of Object.entries(SOURCES)) {
    for (const m of src.matchAll(/<(?:Quiet)?Section\b/g)) {
      const tag = openingTag(src, m.index!)
      if (!claimsCollapsed(src, m.index!)) continue
      if (tag.includes('defaultOpen={false}')) continue
      const title = tag.match(/title="([^"]*)"/)?.[1] ?? tag.slice(0, 40)
      offenders.push(`${path.replace('../views/', '')} — "${title}"`)
    }
  }

  it('scans the views', () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(20)
  })

  it('finds no section whose comment and props disagree', () => {
    expect(offenders).toEqual([])
  })
})
