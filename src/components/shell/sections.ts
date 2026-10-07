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
 * **Home workout is deliberately not a tab.** It is an activity you pick inside
 * Fitness, not a surface you navigate to. `MEMBERS` maps it to Body anyway so
 * that arriving on it lights the right rail row.
 *
 * **Pickleball is a tab, and was wrongly grouped with it.** The test for
 * "activity or surface" is not whether you can do the thing — it is whether the
 * page holds anything the Fitness activity form does not. A pickleball session
 * is a `PickleballSession`: format (singles/doubles), games won and lost,
 * scoring format, partner, opponent, level, points for and against — none of
 * which a `Workout` can hold.
 *
 * **Pull-ups is a tab too, and this note argued the opposite for three
 * releases.** The argument was "a pull-up session IS a `Workout`, so Pull-ups
 * is an activity", and it is the wrong test — the same wrong test this file
 * already records making about Pickleball, applied to the record instead of to
 * the page. A pull-up session is indeed a `Workout`. The *page* is the six-week
 * program tracker, the ability calculator, the rep-scheme builder and the whole
 * training manual, and none of those are reachable from a duration field. Its
 * only door was a link that appeared inside Fitness once you had already picked
 * Pull-ups on the activity select, which is the Strength-tools hole verbatim.
 *
 * Redirecting Pickleball into Fitness did not move the page, it deleted it.
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
  /**
   * The second key of the `g` leader chord that jumps here, e.g. `g` then `b`.
   *
   * Here rather than in `AppShell` because it is rendered: `SideRail` draws it
   * on the row, which is the only reason anyone finds out the chord exists.
   * Two copies of the mapping would let the hint and the key disagree, and a
   * keyboard hint that lies is worse than none — so `AppShell` builds its
   * `useLeaderKey` table from this field instead of listing the keys again.
   */
  jump: string
  /** Where the rail row lands. Always the first tab. */
  tabs: SectionTab[]
}

/**
 * `g` chords that are NOT a section — destinations with no rail row, so no hint
 * is drawn for them anywhere.
 *
 * Here rather than inline in `AppShell` so one file holds the whole chord
 * table and `sections.test.ts` can assert the halves do not collide. They can:
 * `AppShell` spreads the section keys first and these second, so a section
 * whose `jump` matched one of these would be silently overridden — the rail
 * would draw a hint for a key that goes somewhere else. That is the failure the
 * test exists to catch, and it is invisible at runtime.
 */
export const EXTRA_JUMPS: Record<string, ViewId> = {
  h: 'trackers',
  f: 'fitness',
  c: 'collections',
  ',': 'settings',
}

export const SECTIONS: Section[] = [
  {
    id: 'today',
    label: 'Today',
    jump: 't',
    icon: Sun,
    // One surface, no tab row: Today does its own splitting by time of day.
    tabs: [{ view: 'today', label: 'Today' }],
  },
  {
    id: 'plan',
    label: 'Plan',
    jump: 'p',
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
    jump: 'b',
    icon: PersonSimpleRun,
    tabs: [
      { view: 'fitness', label: 'Fitness' },
      // Moved out of Insights, by the same test that moved Challenges. Trackers
      // is where the gym habit, the protein target and the step count are
      // *logged* — it is the second half of the daily loop whose first half is
      // Fitness, and it sat two rail sections away from it. It produces charts,
      // which is a fact about its output, not about what the page is for.
      //
      // Insights keeps the two surfaces that only ever look backwards.
      /* `trackers` is no longer a tab here. The habit grid is Today's fourth
         surface now — the daily tick already lived on Today while the month
         view of the same data sat two sections away. The view id survives as a
         redirect (`views/Trackers.tsx`) because fifteen places link to it. */
      // Strength tools was reachable only from a link inside Fitness, and only
      // while the mode happened to be `strength` — so the exercise picker, the
      // program tracker, the plate calculator, the muscle map and progress
      // photos were all behind a conditional. A whole workshop should not need
      // a mode to be set before it has a door.
      //
      // And once it had one, Fitness kept its `strength` segment: the same
      // `Workout` with two loggers, the lesser one unable to hold a set row, a
      // split, a PR or a rest timer. The segment is gone (`LOGGABLE_MODES` in
      // the activity registry); this tab is where strength is logged. A
      // `?activity=pullups` link now redirects here rather than landing on a
      // toggle that cannot represent the mode it asked for.
      { view: 'gym', label: 'Strength' },
      // The 12-week hypertrophy block, by the same test that made Pickleball a
      // tab. It was one line inside Strength's "Program & progress" fold, so a
      // twelve-week commitment sat behind a collapsible on a page whose job is
      // logging today's sets — invisible unless you went looking for it. What
      // you follow six days a week for three months is a destination.
      { view: 'program', label: 'Program' },
      // Pickleball is a surface, not an activity — see the note below.
      { view: 'pickleball', label: 'Pickleball' },
      // Pull-ups, by the same test, applied a third time. See the note below.
      { view: 'pullups', label: 'Pull-ups' },
      // Home workout, by the same test, applied a fourth time — and this one
      // was not merely hard to find, it was **unreachable**. The page had no
      // tab on purpose: it was "reachable from a link inside Fitness". That
      // link is `COMPANION`, keyed on the *activity* `homeWorkout`, which is
      // `mode: 'strength'` — and strength came out of `LOGGABLE_MODES` when
      // Fitness's strength segment was deleted. So the activity could no
      // longer be selected, so the link could never render, so the only door
      // to a whole page was welded shut by a change two files away that had
      // no reason to know the door existed.
      //
      // Measured in the browser rather than argued from the code: Fitness
      // offers two mode segments, Cardio with nine activities and Sport with
      // two, and "Home workout" appears in neither list. Reported as "I want
      // to log a home workout and I'm unable to".
      //
      // The general shape: a destination whose only route is conditional on
      // state that another module owns is a destination with no route. Give
      // it a tab, like the three above it.
      { view: 'homeworkout', label: 'Home workout' },
      { view: 'coaching', label: 'Coaching' },
      { view: 'nutrition', label: 'Nutrition' },
      // Moved out of Insights. 75 Hard and the 90-day blocks are disciplines you
      // *run*, checking in against rules each day — not analytics you read. They
      // sat beside Stats and Trackers because they produce a streak, which is a
      // fact about their output, not about what the page is for. Insights keeps
      // the three surfaces that only ever look backwards.
      { view: 'challenges', label: 'Challenges' },
      { view: 'nofap', label: 'Recovery', gate: 'nofap' },
      { view: 'cycle', label: 'Cycle', gate: 'cycle' },
    ],
  },
  {
    id: 'mind',
    label: 'Mind',
    jump: 'm',
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
    jump: 'i',
    icon: Sparkle,
    tabs: [
      /* One tab. `stats` was the second until its panels moved into Insights
         behind the domain filter — a tab whose charts nobody found is not
         cheaper than a fold, it is the same problem one level up. Bookmarks
         still land, via `VIEW_ALIASES` in `lib/deepLink.ts`. */
      { view: 'insights', label: 'Insights' },
    ],
  },
]

/**
 * Which section a view belongs to — the "section prefix" the active state
 * matches on.
 *
 * Derived wholly from `SECTIONS` now. Home workout used to be bolted on here
 * by hand, because it was a member of Body without being one of its tabs; it
 * is a tab, so it arrives through the loop like everything else and the
 * hand-written exception is gone. Pull-ups made the same trip earlier.
 *
 * Views absent from this map (Settings, Help, Account, the kitchen sink) light
 * nothing, which is correct: they are not section destinations.
 */
export const MEMBERS: Partial<Record<ViewId, SectionId>> = (() => {
  const m: Partial<Record<ViewId, SectionId>> = {}
  for (const s of SECTIONS) for (const t of s.tabs) m[t.view] = s.id
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

