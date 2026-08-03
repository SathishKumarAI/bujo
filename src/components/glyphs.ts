import {
  ArrowsVertical,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  CloudSnow,
  CaretDoubleDown,
  CaretDoubleUp,
  Clock,
  Flame,
  Footprints,
  MoonStars,
  Person,
  PersonSimpleRun,
  Sun,
  SunHorizon,
  Thermometer,
  type Icon as IconGlyph,
} from './icons'

/**
 * GLYPH MAPS · the app's fixed vocabularies, as icons rather than emoji.
 *
 * Emoji were the app's second icon library, and nobody had decided they were
 * one: a time-of-day chip rendered 🌙 next to a Phosphor-drawn everything else,
 * so the same row carried two illustration styles, two weights and two
 * colour models — emoji ignore `currentColor`, so they stayed full-colour while
 * every icon beside them followed the theme.
 *
 * These maps live in the component layer on purpose. `lib/timeofday.ts` and
 * `lib/fitness.ts` stay pure data — id, label, colour — and are unit-tested as
 * such; how a slot or a split is *drawn* is a UI decision and belongs here.
 *
 * What is deliberately still emoji, because it is content rather than chrome:
 * the emoji a user picks for their own habit, the achievement badges, and the
 * mood faces in `EmojiScale` — there the emoji *is* the scale.
 */

/** Time-of-day chips (Today, Trackers). Was 🌅 ☀️ 🌙 🕐. */
export const SLOT_GLYPHS: Record<string, IconGlyph> = {
  morning: SunHorizon,
  afternoon: Sun,
  evening: MoonStars,
  anytime: Clock,
}

/** Training splits (Fitness hub, Gym). Was 🏋️ 🤸 🦵 💪 🦿 🔥 🏃. */
export const SPLIT_GLYPHS: Record<string, IconGlyph> = {
  push: CaretDoubleUp,
  pull: CaretDoubleDown,
  legs: Footprints,
  upper: Person,
  lower: ArrowsVertical,
  full: Flame,
  other: PersonSimpleRun,
}

export const splitGlyph = (id: string): IconGlyph => SPLIT_GLYPHS[id] ?? Person
export const slotGlyph = (id: string): IconGlyph => SLOT_GLYPHS[id] ?? Clock

/**
 * WMO weather codes → glyph (Today's date subtitle). Was ☀️ 🌤️ ⛅ ☁️ 🌫️ 🌦️ 🌧️
 * 🌨️ ❄️ ⛈️ 🌡️.
 *
 * Keyed on the numeric code, which is what the journal stores — the emoji that
 * older entries also stored is left in place and simply not rendered, so no
 * saved record has to be migrated to change how weather looks.
 *
 * Ranges rather than 22 entries: open-meteo groups codes by decade (5x drizzle,
 * 6x rain, 7x snow, 8x showers, 9x thunderstorm), and a lookup that mirrors the
 * spec is easier to check against it than a flat table.
 */
export function weatherGlyph(code: number): IconGlyph {
  if (code === 0) return Sun
  if (code === 1 || code === 2) return CloudSun
  if (code === 3) return Cloud
  if (code === 45 || code === 48) return CloudFog
  if (code >= 51 && code <= 67) return CloudRain
  if (code >= 71 && code <= 77) return CloudSnow
  if (code >= 80 && code <= 82) return CloudRain
  if (code >= 85 && code <= 86) return CloudSnow
  if (code >= 95) return CloudLightning
  return Thermometer
}
