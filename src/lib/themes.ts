import type { ThemeName } from './types'

/**
 * THE theme list. One name, one hint, one swatch, per theme.
 *
 * There were three, hand-written, and they disagreed:
 *
 * | Where | Count | Called `mocha` |
 * |---|---|---|
 * | `views/Settings.tsx` | 6 | "Mocha · Dark · default" |
 * | `components/CommandPalette.tsx` | 6 | "Mocha (dark)" |
 * | `shell/topbar/OverflowMenu.tsx` | **4** | "Dark" |
 *
 * The header menu could not reach `vscode` or `dawn` at all — pick Dawn in
 * Settings, open ⋯, and none of the four rows carried the ● marking the theme
 * you were actually looking at. Three names for one thing, and one of the
 * three could not name two of them.
 *
 * The swatch is `[base, surface, accent]` — the three colours that tell the
 * themes apart at a glance. It is duplicated from `index.css` on purpose and
 * `npm run contrast` is what keeps the two in step; see the palette trap in
 * `CLAUDE.md`, which is the same lesson one level down.
 */
export interface ThemeOption {
  value: ThemeName
  /** The theme's name. Never a role ("Dark") — two of these are dark. */
  label: string
  /** What kind of theme it is, for the line under the name. */
  hint: string
  /** base / surface / accent, for the preview strip. */
  swatch: [string, string, string]
}

export const THEMES: ThemeOption[] = [
  { value: 'mocha', label: 'Mocha', hint: 'Dark · default', swatch: ['#1e1e2e', '#313244', '#cba6f7'] },
  { value: 'vscode', label: 'VS Code', hint: 'Dark · editor', swatch: ['#1f1f1f', '#2a2a2e', '#c586c0'] },
  { value: 'neon', label: 'Neon', hint: 'Dark · vivid', swatch: ['#0a0a16', '#20203c', '#c77dff'] },
  { value: 'latte', label: 'Latte', hint: 'Light · crisp', swatch: ['#f8f9fa', '#e8eaed', '#6c4cf0'] },
  { value: 'dawn', label: 'Dawn', hint: 'Light · warm', swatch: ['#faf3e7', '#ecdcc4', '#b45309'] },
  { value: 'system', label: 'System', hint: 'Match OS', swatch: ['#1e1e2e', '#f8f9fa', '#89b4fa'] },
]

/** "Mocha · Dark · default" — for a one-line surface with no room for a swatch. */
export const themeLabel = (t: ThemeOption): string => `${t.label} · ${t.hint}`
