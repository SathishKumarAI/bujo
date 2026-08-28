import { describe, it, expect } from 'vitest'
import { cat, setActiveTheme, washStyle, onAccent, readableOn, HABIT_COLORS } from './colors'

const THEMES = ['mocha', 'latte', 'neon', 'vscode', 'dawn']
const ACCENTS = ['rosewater', 'flamingo', 'pink', 'mauve', 'red', 'maroon', 'peach', 'yellow', 'green', 'teal', 'sky', 'sapphire', 'blue', 'lavender']

const rgb = (hex: string): [number, number, number] => {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}
const chan = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4) }
const lum = (c: [number, number, number]) => 0.2126 * chan(c[0]) + 0.7152 * chan(c[1]) + 0.0722 * chan(c[2])
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(rgb(a)), lum(rgb(b))]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
/** What `background: accent + '22'` actually paints, over `bg`. */
const composite = (fg: string, bg: string, alpha = 0x22 / 255) => {
  const [f, b] = [rgb(fg), rgb(bg)]
  return '#' + f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('')
}

/**
 * COD-32. `{ background: cat(x) + '22', color: cat(x) }` was hand-written at
 * ten call sites and is the app's most-repeated contrast bug — tinting the
 * background with 13% of the text's own hue pulls the two together, so an
 * accent that clears 4.5 on the card can fail on its own wash. Whether a given
 * site failed depended on which token it happened to pass, which is why this
 * asserts the whole grid rather than a case.
 *
 * `scripts/check-contrast.mjs` covers the palette itself; this covers the
 * point-of-use helper, which is the half a static token check cannot see.
 */
describe('washStyle clears AA on every accent, in every theme', () => {
  for (const theme of THEMES) {
    it(theme, () => {
      setActiveTheme(theme)
      const page = cat('base')
      for (const name of ACCENTS) {
        const { background, color } = washStyle(name)
        expect(background).toBe(cat(name) + '22')
        const painted = composite(cat(name), page)
        expect(ratio(color, painted), `${theme}.${name} on its own wash`).toBeGreaterThanOrEqual(4.5)
      }
    })
  }

  it('takes a resolved hex as well as a token name', () => {
    setActiveTheme('latte')
    expect(washStyle('#f29900')).toEqual(washStyle('#f29900'))
    expect(washStyle('mauve').background).toBe(cat('mauve') + '22')
  })
})

/**
 * The habit palette is the one an ordinary user can reach — Trackers assigns
 * from it — so every entry in it has to survive being drawn as text.
 */
describe('every habit colour is legible as text', () => {
  for (const theme of THEMES) {
    it(theme, () => {
      setActiveTheme(theme)
      for (const name of HABIT_COLORS) {
        for (const surface of ['mantle', 'base', 'surface0']) {
          expect(ratio(cat(name), cat(surface)), `${theme}.${name} on ${surface}`).toBeGreaterThanOrEqual(4.5)
        }
      }
    })
  }
})

describe('onAccent picks a neutral that survives the fill', () => {
  for (const theme of THEMES) {
    it(theme, () => {
      setActiveTheme(theme)
      for (const name of ACCENTS) {
        const fill = cat(name)
        expect(ratio(onAccent(fill), fill), `${theme}.${name} as a solid fill`).toBeGreaterThanOrEqual(4.5)
      }
    })
  }
})

it('readableOn returns the accent untouched when it already passes', () => {
  setActiveTheme('mocha')
  expect(readableOn(cat('green'), cat('base'))).toBe(cat('green'))
})
