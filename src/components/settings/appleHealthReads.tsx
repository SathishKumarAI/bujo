import { CheckCircle, Footprints, Heartbeat, Moon, Scales, Thermometer } from '@/components/icons'
import { Abbr } from '../Abbr'

/**
 * What the import can fill, named for the user rather than for HealthKit.
 *
 * `BBT` goes through `<Abbr>` rather than being explained here: the glossary
 * already carries the definition, the NHS source, and the sentence that matters
 * for this screen — a reading taken after you are up is not a basal
 * temperature. Writing a second copy of that is how two explanations drift.
 */
export const READS: { icon: typeof Thermometer; text: React.ReactNode; key: string }[] = [
  { key: 'bbt', icon: Thermometer, text: <><Abbr term="BBT" /> → the chart on Cycle</> },
  { key: 'steps', icon: Footprints, text: 'Steps and active energy' },
  { key: 'sleep', icon: Moon, text: 'Hours asleep, on the day you woke up' },
  { key: 'hr', icon: Heartbeat, text: 'Resting heart rate' },
  { key: 'body', icon: Scales, text: 'Weight, body fat, lean mass, waist' },
  { key: 'misc', icon: CheckCircle, text: 'Workouts, food, and period days' },
]
