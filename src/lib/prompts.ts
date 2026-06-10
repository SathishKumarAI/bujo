// Rotating reflection prompts — local, no API. Picked deterministically by day
// so the prompt is stable within a day but changes daily.
import { fromISODay } from './date'

export const REFLECTION_PROMPTS = [
  'What went well today, and why?',
  'What drained your energy today?',
  'One small win you can build on tomorrow?',
  'What are you avoiding, and what is the next tiny step?',
  'Who made your day better? Tell them.',
  'What did you learn about yourself this week?',
  'If today repeated, what would you change?',
  'What are you looking forward to?',
  'Name a worry — is it in your control?',
  'What did your body need today that you ignored?',
  'A moment you want to remember from today?',
  'What would make tomorrow 1% better?',
  'Where did you spend time that did not matter?',
  'What are you proud of right now?',
  'What is one thing you can let go of?',
]

/** Stable prompt for a given ISO day. */
export function promptForDay(iso: string): string {
  const dayNumber = Math.floor(fromISODay(iso).getTime() / 86_400_000)
  return REFLECTION_PROMPTS[((dayNumber % REFLECTION_PROMPTS.length) + REFLECTION_PROMPTS.length) % REFLECTION_PROMPTS.length]
}
