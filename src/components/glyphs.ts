import {
  ArrowsVertical,
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
