/**
 * Design-system gate.
 *
 * Every rule here is a regression that actually happened during the icon and
 * button pass, and that no existing gate caught: typecheck, tests and the build
 * are all perfectly happy with a purple solid button, a 14px icon, or a search
 * placeholder reading "MagnifyingGlass your Drive". Those were found by eye, one
 * of them by the user. This makes them fail the build instead.
 *
 *     node scripts/check-design-system.mjs
 *
 * Deliberately source-level and dependency-free so it runs in a second on every
 * PR. It cannot see rendered output — the browser sweeps stay a manual step.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(root, 'src')

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const files = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes('.test.'))
const read = (f) => readFileSync(f, 'utf8')
const rel = (f) => relative(root, f).replace(/\\/g, '/')

const failures = []
const fail = (rule, file, line, detail) =>
  failures.push(`${rule}\n    ${rel(file)}${line ? `:${line}` : ''}  ${detail}`)

// Glyph names that are also ordinary English words. The lucide->Phosphor
// codemod renamed identifiers with a word-boundary regex and rewrote these
// inside user-visible strings; "Repeat last" shipped as "ArrowsClockwise last".
const RENAMED = [
  'MagnifyingGlass', 'PersonSimpleRun', 'SlidersHorizontal', 'ArrowsClockwise',
  'FadersHorizontal', 'ArrowLineRight', 'ArrowLineUp', 'DotsSixVertical',
  'CaretDown', 'CaretUp', 'CaretRight', 'CaretLeft', 'Prohibit', 'Smiley',
  'NotePencil', 'CalendarBlank', 'ChartBar', 'ChartPie', 'Lifebuoy',
  'ShareNetwork', 'ArrowSquareOut', 'Microphone', 'SquaresFour', 'ArrowsOut',
]
const proseLeak = new RegExp(`/>\\s*(${RENAMED.join('|')})\\b`)

for (const file of files) {
  const src = read(file)
  const name = rel(file)
  const lines = src.split('\n')

  // 1 · One icon library, one importer.
  if (/from ['"]lucide-react['"]/.test(src)) {
    fail('lucide is retired — import from @/components/icons', file, null, 'lucide-react import')
  }
  // icon-paths.ts only *mentions* the package in its generated banner.
  if (/from ['"]@phosphor-icons\/react['"]/.test(src) && !name.endsWith('src/components/icons.tsx')) {
    fail('Phosphor is imported only by the generated registry', file, null, 'direct Phosphor import')
  }

  lines.forEach((line, i) => {
    const n = i + 1

    // 2 · A glyph name leaking into a label.
    if (proseLeak.test(line)) {
      fail('a glyph name is rendering as text', file, n, line.trim().slice(0, 90))
    }

    // 3 · Icons are three rem steps, never px.
    if (/<[A-Z][A-Za-z0-9]*\s+[^>]*\bsize=\{\d+\}/.test(line)) {
      fail('icon sized in px — use <Icon size="sm|md|lg">', file, n, line.trim().slice(0, 90))
    }

    // 4 · No solid accent fill. The loud button is tonal.
    if (/variant=["']default["']/.test(line) || /variant:\s*["']default["']/.test(line)) {
      if (!name.includes('components/ui/')) {
        fail('variant="default" is gone — use primary/secondary/ghost/danger', file, n, line.trim().slice(0, 90))
      }
    }
    if (/variant=["'](outline|link|destructive)["']/.test(line)) {
      fail('retired button variant', file, n, line.trim().slice(0, 90))
    }

    // 4b · The accent-on-its-own-wash pairing, hand-written.
    //
    // `background: cat(x) + '22'` next to `color: cat(x)` is the app's
    // most-copied idiom and its most-repeated contrast bug: the wash pulls the
    // background toward the text, so an accent that clears 4.5 on the card
    // fails on its own wash. Ten call sites had their own copy; `washStyle()`
    // is the one that derives the foreground from the composited background.
    //
    // Deliberately narrow: it only fires when the SAME expression appears as
    // both the wash and the colour, because `color: cat('text')` on an accent
    // wash is a different (and fine) pairing, and half a dozen selected-chip
    // styles do exactly that.
    if (!name.includes('lib/colors') && /\+\s*['"]22['"]/.test(line)) {
      const wash = line.match(/background:[^,}]*?(cat\([^)]*\)|\baccent\b)[^,}]*?\+\s*['"]22['"]/)
      if (wash && new RegExp(`color:[^,}]*${wash[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(line)) {
        fail('accent on its own wash — use washStyle()', file, n, line.trim().slice(0, 90))
      }
    }

    // 5 · Three radii and three control heights, by token.
    if (/\brounded-(lg|md|xl|2xl|full)\b/.test(line)) {
      fail('use rounded-control / rounded-card / rounded-pill', file, n, line.trim().slice(0, 90))
    }

    // 6 · A palette colour written as hex is pinned to whichever theme it was
    // copied from. Three chart tooltips were hardcoded to Mocha and stayed
    // near-black on latte and dawn; nobody noticed, because the chart still drew.
    //
    // Exempt, because there the hex IS the point: the palette definitions
    // themselves, the Settings theme-swatch previews (they must show another
    // theme's colours while you are looking at this one), and third-party brand
    // marks like the Google "G".
    const paletteSource = name.endsWith('src/lib/colors.ts')
    const swatchPreview = /swatch:/.test(line)
    const brandMark = /fill="#(EA4335|4285F4|FBBC05|34A853)"/.test(line)
    if (/#[0-9a-fA-F]{6}\b/.test(line) && !paletteSource && !swatchPreview && !brandMark) {
      fail('hardcoded colour — use cat() or a token', file, n, line.trim().slice(0, 90))
    }
  })
}

// 6 · Emoji as chrome in the fixed vocabularies. The emoji a user picks for a
// habit is data and stays; a hard-coded one in a shared module is a second icon
// library nobody decided to keep.
const CHROME_MODULES = ['src/lib/timeofday.ts', 'src/lib/fitness.ts']
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
for (const modulePath of CHROME_MODULES) {
  const full = join(root, modulePath)
  read(full).split('\n').forEach((line, i) => {
    if (EMOJI.test(line)) fail('emoji as chrome — map it in components/glyphs.ts', full, i + 1, line.trim().slice(0, 80))
  })
}

if (failures.length) {
  console.error(`\nDesign-system check failed — ${failures.length} issue(s):\n`)
  for (const f of failures) console.error(`  ${f}\n`)
  process.exit(1)
}
console.log(`Design-system check passed (${files.length} files).`)
