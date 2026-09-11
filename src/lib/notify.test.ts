import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The app has one feedback vocabulary (`lib/notify`) and one confirm dialog
 * (`components/ConfirmDialog`). A native `alert()` bypasses both: it blocks the
 * whole page, cannot be themed, and on mobile reads as a browser error rather
 * than as the app talking.
 *
 * Twenty-six of them survived in the source for months because nothing failed
 * on them — tsc, eslint, vitest and the build are all perfectly happy with
 * `alert()`. This is that missing check.
 */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) sourceFiles(p, out)
    else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(p)
  }
  return out
}

/** Strips `//` and block comments so a *mention* of alert() is not a hit. */
function stripComments(src: string) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

describe('no blocking browser dialogs', () => {
  const files = sourceFiles(join(process.cwd(), 'src'))

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  it('calls notify.* instead of window.alert', () => {
    const offenders = files.filter((f) =>
      /(^|[^.\w])alert\s*\(/.test(stripComments(readFileSync(f, 'utf8'))),
    )
    expect(offenders.map((f) => f.replace(process.cwd(), ''))).toEqual([])
  })
})
