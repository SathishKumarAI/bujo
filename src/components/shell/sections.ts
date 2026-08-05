import { ArrowsClockwise, Brain, PersonSimpleRun, Sparkle, Sun } from '@/components/icons'
import type { Icon as IconGlyph } from '@/components/icons'
import type { ViewId } from './viewChrome'

/**
 * FIVE SECTIONS · the nav, and the only nav.
 *
 * The rail carried seventeen destinations under six group headers while Today
 * carried ten cards. That is the wrong way round: the nav was split so finely
 * that Trackers was a peer of Insights, and the headers existed only because
 * seventeen rows are unreadable without them. Five items need no headers.
 *
 * A section is a **destination**; the views inside it are **tabs**. Nothing
 * moved on disk — every view file is where it was, still lazy-loaded, still
 * reached by `?view=<id>`. What changed is that `?view=nutrition` now lights up
 * *Body* in the rail and renders a tab row above the page, instead of being its
 * own rail row.
 *
 * `?view=` stays the address because this app has no path router (see
 * `lib/deepLink.ts`). The tab is therefore in the URL, not in local state —
 * which is the property the tabs had to have.
 *
 * **Pull-ups and Home workout are deliberately not tabs.** They are activities
 * you pick inside Fitness, not surfaces you navigate to; `deepLink` still
 * redirects their old ids. `MEMBERS` maps them to Body anyway so that arriving
 * on one lights the right rail row.
 *
 * **Pickleball is a tab, and was wrongly grouped with them.** The test for
 * "activity or surface" is not whether you can do the thing — it is whether it
 * has a record of its own. A pull-up session IS a `Workout`, so Pull-ups is an
 * activity. A pickleball session is a `PickleballSession`: format
 * (singles/doubles), games won and lost, scoring format, partner, opponent,
 * level, points for and against — none of which a `Workout` can hold.
 *
 * Redirecting it into Fitness therefore did not move the page, it deleted it.
 * `ACTIVITIES.pickleball` is `mode: 'sport'` with `required: ['durationMin']`,
 * so the form you land on asks for a duration and nothing else, and the whole
 * record — win rate, singles-vs-doubles, tournaments, leagues — became
 * unreachable except through a companion link that only appears once you have
 * already picked Pickleball on the Fitness activity select. Reported as
 * "options are not available", which is exactly what it was.
 *
 * The Fitness activity stays, so a quick "played for 45 minutes" still logs
 * from there without a score. The two are different records on purpose.
 */
export type SectionId = 'today' | 'plan' | 'body' | 'mind' | 'insights'

export interface SectionTab {
  view: ViewId
  label: string
  /** Hidden unless the gate passes (opt-in trackers). */
  gate?: keyof SectionGates
}

export interface SectionGates {
  cycle: boolean
  nofap: boolean
}

export interface Section {
  id: SectionId
  label: string
  icon: IconGlyph
  /** Where the rail row lands. Always the first tab. */
  tabs: SectionTab[]
}

export const SECTIONS: Section[] = [
  {
    id: 'today',
    label: 'Today',
    icon: Sun,
    // One surface, no tab row: Today does its own splitting by time of day.
    tabs: [{ view: 'today', label: 'Today' }],
  },
  {
    id: 'plan',
    label: 'Plan',
    icon: ArrowsClockwise,
    tabs: [
      { view: 'plan', label: 'Week' },
      { view: 'monthly', label: 'Month' },
      { view: 'goals', label: 'Goals' },
    ],
  },
  {
    id: 'body',
    label: 'Body',
    icon: PersonSimpleRun,
    tabs: [
      { view: 'fitness', label: 'Fitness' },
      // Strength tools was reachable only from a link inside Fitness, and only
      // while the mode happened to be `strength` — so the exercise picker, the
      // program tracker, the plate calculator, the muscle map and progress
      // photos were all behind a conditional. A whole workshop should not need
      // a mode to be set before it has a door.
      { view: 'gym', label: 'Strength' },
      // Pickleball is a surface, not an activity — see the note below.
      { view: 'pickleball', label: 'Pickleball' },
      { view: 'coaching', label: 'Coaching' },
      { view: 'nutrition', label: 'Nutrition' },
      { view: 'nofap', label: 'Recovery', gate: 'nofap' },
      { view: 'cycle', label: 'Cycle', gate: 'cycle' },
    ],
  },
  {
    id: 'mind',
    label: 'Mind',
    icon: Brain,
    tabs: [
      { view: 'mindset', label: 'Mindset' },
      { view: 'reading', label: 'Reading' },
      { view: 'collections', label: 'Collections' },
      { view: 'focus', label: 'Focus' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: Sparkle,
    tabs: [
      { view: 'insights', label: 'Insights' },
      { view: 'stats', label: 'Stats' },
      { view: 'trackers', label: 'Trackers' },
      { view: 'challenges', label: 'Challenges' },
    ],
  },
]

/**
 * Which section a view belongs to — the "section prefix" the active state
 * matches on. Includes views that are **not** tabs (Strength tools, and the
 * three retired activity views) so landing on one still lights its rail row.
 * Views absent from this map (Settings, Help, Account, the kitchen sink) light
 * nothing, which is correct: they are not section destinations.
 */
export const MEMBERS: Partial<Record<ViewId, SectionId>> = (() => {
  const m: Partial<Record<ViewId, SectionId>> = {}
  for (const s of SECTIONS) for (const t of s.tabs) m[t.view] = s.id
  // Companions: reachable, not tabbed. Both are redirected by `deepLink` onto
  // Fitness with the activity preselected, and are listed here only so an
  // in-flight link lights the right rail row.
  m.pullups = 'body'
  m.homeworkout = 'body'
  return m
})()

export const sectionOf = (view: ViewId): SectionId | undefined => MEMBERS[view]

/** The tabs of a section, minus anything its settings gate turns off. */
export function tabsOf(id: SectionId, gates: SectionGates): SectionTab[] {
  const s = SECTIONS.find((x) => x.id === id)
  if (!s) return []
  return s.tabs.filter((t) => !t.gate || gates[t.gate])
}

/** Where a rail click lands: the section's first *visible* tab. */
export function landingOf(id: SectionId, gates: SectionGates): ViewId {
  return tabsOf(id, gates)[0]?.view ?? 'today'
}

