import { describe, it, expect } from 'vitest'

/**
 * The app has one feedback vocabulary (`lib/notify`) and one confirm dialog
 * (`components/ConfirmDialog`). A native `alert()` bypasses both: it blocks the
 * whole page, cannot be themed, and on mobile reads as a browser error rather
 * than as the app talking.
 *
 * Twenty-six of them survived in the source for months because nothing could
 * fail on them — `tsc -b`, eslint, vitest and `vite build` are all perfectly
 * happy with `alert()`. This is that missing check.
 *
 * Sources come from `import.meta.glob` rather than a node `fs` walk so the file
 * typechecks under the app's tsconfig, which has no node types.
 */
const SOURCES = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/** Strips block and line comments so a *mention* of alert() is not a hit. */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

describe('no blocking browser dialogs', () => {
  const files = Object.entries(SOURCES).filter(([p]) => !/\.test\.tsx?$/.test(p))

  it('scans the whole src tree', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  it('calls notify.* instead of window.alert', () => {
    const offenders = files
      .filter(([, src]) => /(^|[^.\w])alert\s*\(/.test(stripComments(src)))
      .map(([p]) => p)
    expect(offenders).toEqual([])
  })

  it('routes sync conflicts through ConfirmDialog, not window.confirm', () => {
    // `useConfirm` keeps one deliberate `window.confirm` fallback for a missing
    // provider — a missing provider must never turn a destructive guard into a
    // silent yes. Everywhere else, a bare confirm( is the bug.
    const offenders = files
      .filter(([p]) => !p.endsWith('ConfirmDialog.tsx'))
      .filter(([, src]) => /(^|[^.\w])confirm\s*\(\s*['"`]/.test(stripComments(src)))
      .map(([p]) => p)
    expect(offenders).toEqual([])
  })
})
