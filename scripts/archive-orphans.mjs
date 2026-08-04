/**
 * One-shot: move the verified-orphan lib functions into `archive/`.
 *
 * Follows the convention already in `archive/`: the original path plus `.txt`,
 * with the source commented out so it can never compile or be imported by
 * accident, under a header saying what replaced it.
 *
 * Deliberately NOT a general tool. It is run once, reviewed as a diff, and the
 * script goes with the commit — the list it operates on was hand-verified, and
 * an earlier version of that list was wrong by five entries.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

/** fn -> what already ships that makes it a duplicate. */
const ORPHANS = {
  trainingHeatmap: "Fitness's `CalendarHeatmap`, 12 weeks of training volume",
  cardioBadges: 'removed on purpose — the badge card returned `null` until you had earned a badge, so it was invisible to exactly the people it was meant to motivate',
  bodyweightSeries: "Gym's Body weight chart, which builds its own 7-day average",
  activeDayStreak: '`focusStreak` / `currentStreak`, per surface',
  taskAging: "`overdueBuckets` (lib/bullets), in Plan's aging histogram",
  habitWeekdayPerformance: '`bestWeekday` (lib/habitStats), in the Trackers habit detail',
  migrationAnalytics: "`migrationCounts` (lib/bullets), Plan's “chronically deferred”",
  categoryRollup: '`CategoryConsistencyCard` in Trackers',
}

const SOURCES = ['src/lib/fitness.ts', 'src/lib/correlations.ts', 'src/lib/habitStats.ts']
const TESTS = ['src/lib/fitness.test.ts', 'src/lib/correlations.test.ts', 'src/lib/habitStats.test.ts']

/**
 * Take a top-level `export function <name>` and everything up to its closing
 * brace at column 0, plus any contiguous comment block immediately above it.
 * These files are all flat modules with no indentation at the top level, which
 * is what makes the column-0 rule safe here.
 */
function cut(lines, name) {
  const start = lines.findIndex((l) => l.startsWith(`export function ${name}`))
  if (start === -1) return null
  let top = start
  while (top > 0) {
    const prev = lines[top - 1].trim()
    if (prev.startsWith('*') || prev.startsWith('/*') || prev.startsWith('//') || prev.startsWith('*/')) top--
    else break
  }
  let end = start
  while (end < lines.length && lines[end] !== '}') end++
  return { top, end, body: lines.slice(top, end + 1) }
}

const archived = []
for (const file of SOURCES) {
  let lines = readFileSync(file, 'utf8').split(/\r?\n/)
  const taken = []
  for (const name of Object.keys(ORPHANS)) {
    const found = cut(lines, name)
    if (!found) continue
    taken.push({ name, body: found.body })
    lines = [...lines.slice(0, found.top), ...lines.slice(found.end + 1)]
  }
  if (!taken.length) continue
  writeFileSync(file, lines.join('\n'))

  const out = `archive/${file}.txt`
  mkdirSync(dirname(out), { recursive: true })
  const header = [
    `// ARCHIVED 2026-08-04 — dead code cut from ${file}.`,
    '//',
    '// Each of these was a complete, tested, documented function with NO caller:',
    '// not in a view, not in a component, not in another lib module. They are not',
    '// features waiting to be wired up — every one duplicates something the app',
    '// already ships under a different name, listed per function below.',
    '//',
    '// Found by a mechanical sweep for exported functions with no consumer. The',
    '// first version of that sweep reported 13; five of those turned out to have',
    '// callers inside their own module, which is why the check has to include the',
    '// defining file. These eight were verified to have none.',
    '//',
    '// Commented out so it can never compile or be imported by accident, and',
    '// saved as .txt so it is outside the TS program.',
    '',
  ]
  const parts = taken.map(({ name, body }) => [
    `// ── ${name} ${'─'.repeat(Math.max(0, 60 - name.length))}`,
    `// Superseded by: ${ORPHANS[name]}`,
    '//',
    ...body.map((l) => (l ? `// ${l}` : '//')),
    '',
  ].join('\n'))
  writeFileSync(out, header.join('\n') + '\n' + parts.join('\n'))
  archived.push(`${out} <- ${taken.map((t) => t.name).join(', ')}`)
}

// Their tests go too — a test for archived code is a test that pins nothing.
for (const file of TESTS) {
  const src = readFileSync(file, 'utf8')
  const lines = src.split(/\r?\n/)
  const keep = []
  let depth = 0
  let dropping = false
  for (const line of lines) {
    if (!dropping && /^describe\(/.test(line) && Object.keys(ORPHANS).some((n) => line.includes(n))) {
      dropping = true
      depth = 0
    }
    if (dropping) {
      depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length
      if (depth <= 0 && /^\}\)/.test(line)) dropping = false
      continue
    }
    keep.push(line)
  }
  writeFileSync(file, keep.join('\n'))
}

console.log(archived.join('\n') || 'nothing archived')
