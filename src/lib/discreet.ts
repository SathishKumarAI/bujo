import type { Settings } from './types'

/**
 * DISCREET MODE · the Recovery page, readable over your shoulder.
 *
 * WHAT THIS FILE OWNS: which words are sensitive and what they become.
 * WHAT IT DOES NOT OWN: whether the mode is on (`Settings.discreetRecovery`),
 * or any component's layout.
 *
 * ── Why ──────────────────────────────────────────────────────────────────
 *
 * Reviewed as: *"chips like Porn and Masturbation are sensitive to show on
 * screen — consider a discreet mode that swaps labels for neutral names"*.
 * It is the strongest unbuilt idea in that review, because it is the only one
 * that changes whether somebody logs honestly at all. This page asks people to
 * record the worst ninety seconds of their day; a person who has to check the
 * room first will either not log it or log it vaguely, and a vague log is what
 * every pattern card on this page is made of.
 *
 * ── What it is, and what it is NOT ───────────────────────────────────────
 *
 * It is a **display** swap. Nothing stored changes: the journal keeps the real
 * word, every export carries it, and turning the mode off shows it again
 * immediately. A mode that rewrote the data would be a mode that lost it.
 *
 * It is **not security**. Anyone who opens Settings sees the toggle, and
 * anyone who scrolls sees a page about streaks and urges. The passcode lock is
 * the security feature; this is the one for the two seconds somebody glances
 * at your screen on a train.
 *
 * ── Why a map rather than redaction ──────────────────────────────────────
 *
 * Blanking a chip to `•••` would make the form unusable — you cannot pick a
 * thing you cannot read. Each sensitive label gets a neutral word that is
 * still unambiguous TO YOU, in the same position, at the same length-ish, so
 * the page works exactly as it did and only the vocabulary changes.
 */
export const DISCREET_LABELS: Record<string, string> = {
  // The explicit ones — the whole reason the mode exists.
  Porn: 'Pattern A',
  Masturbation: 'Pattern B',
  'Porn & masturbation': 'Pattern A',
  NoFap: 'Streak',

  // The ones that are merely personal. Still swapped, because a screen reading
  // "Nicotine · Alcohol · Gambling" over your shoulder is its own disclosure.
  Nicotine: 'Habit N',
  Vaping: 'Habit V',
  Alcohol: 'Habit A',
  Gambling: 'Habit G',
  Smoking: 'Habit N',
  Doomscrolling: 'Scrolling',
  'Social media': 'Feeds',
  'Short-form video': 'Clips',
  Gaming: 'Games',
  'Junk food': 'Snacks',
  Sugar: 'Sweets',
  Caffeine: 'Coffee',
}

/** Whether the swap is on. One reader, so no component decides this twice. */
export function isDiscreet(settings?: Pick<Settings, 'discreetRecovery'>): boolean {
  return settings?.discreetRecovery === true
}

/**
 * The label to draw for `name`.
 *
 * Case-insensitive on the lookup and **unchanged when there is no mapping** —
 * a user's own addiction called "Instagram" is their word and this file has no
 * business inventing one for it. That is a real limit of the feature and it is
 * stated on the toggle rather than hidden: the presets are covered, your own
 * names are yours.
 */
export function discreetLabel(name: string, on: boolean): string {
  if (!on || !name) return name
  const hit = Object.keys(DISCREET_LABELS).find((k) => k.toLowerCase() === name.trim().toLowerCase())
  return hit ? DISCREET_LABELS[hit] : name
}

/**
 * `discreetLabel` bound to the setting, for a component that draws many.
 *
 * `const label = discreetly(settings)` then `label(x)` — so a card is not
 * threading a boolean through every call site and cannot get one of them
 * wrong, which is how half the labels on a page end up swapped and half not.
 */
export function discreetly(settings?: Pick<Settings, 'discreetRecovery'>): (name: string) => string {
  const on = isDiscreet(settings)
  return (name: string) => discreetLabel(name, on)
}
