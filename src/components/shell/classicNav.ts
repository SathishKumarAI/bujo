import { ArrowsClockwise, Barbell, BookOpen, Books, Brain, CalendarBlank, ChartBar, ChartPie, Code, Flag, Flower, ForkKnife, GraduationCap, PersonSimpleRun, ShieldCheck, Sparkle, Sun, Target, Trophy } from '@/components/icons'
import type { SectionGates } from './sections'
import type { NavItem } from './Sidebar'

/**
 * THE CLASSIC RAIL · the other half of `settings.layout`.
 *
 * `settings.layout` picks between two rails and both stay maintained:
 *
 * - **focused** (default) — five sections, no group headers, the views inside
 *   each reached as tabs (`sections.ts`).
 * - **classic** — the destinations below under six headers, no tab row.
 *
 * The classic list is not dead code kept "for later": it is the other half of a
 * choice the person using the app makes in Settings → Journal feel.
 *
 * It lives here rather than in `App.tsx` because it is rail data, and because
 * the invariant it shares with `SECTIONS` — *every section view is reachable in
 * both layouts* — can only be tested if both lists are importable without
 * dragging the whole app in. See `classicNav.test.ts`.
 */
export const CLASSIC_NAV: (NavItem & { show?: (g: SectionGates) => boolean })[] = [
  { id: 'today', label: 'Today', icon: Sun, group: 'Journal' },
  { id: 'plan', label: 'Plan', icon: ArrowsClockwise, group: 'Journal' },
  // BODY · every entry is the same kind of thing: a surface.
  //
  // Pull-ups and Home workout are deliberately absent — they are *activities*,
  // things you pick inside Fitness rather than places you navigate to, reached
  // by `?view=fitness&activity=pullups`; `deepLink.ts` keeps the old ids
  // working so existing bookmarks resolve.
  { id: 'fitness', label: 'Fitness', icon: PersonSimpleRun, group: 'Body' },
  // Strength and Pickleball ARE surfaces, and were missing here. They are Body
  // tabs in the focused rail, and classic renders no tab row — so leaving them
  // out did not demote them, it deleted them: `?view=gym` and
  // `?view=pickleball` had no door in classic at all, only the command palette
  // and a hand-typed URL. That took the whole Strength workshop (exercise
  // picker, program tracker, plate calculator, muscle map, progress photos) and
  // the entire pickleball record (win rate, singles vs doubles, tournaments,
  // leagues) off the map for anyone on this layout.
  //
  // Exactly the failure the focused rail already suffered and documented at
  // length in `sections.ts`, repeated in the list nobody re-read. The test now
  // asserts the invariant, so the next retirement fails a run instead of a user.
  { id: 'gym', label: 'Strength', icon: Barbell, group: 'Body' },
  { id: 'pickleball', label: 'Pickleball', icon: Trophy, group: 'Body' },
  { id: 'nutrition', label: 'Nutrition', icon: ForkKnife, group: 'Body' },
  { id: 'nofap', label: 'Recovery', icon: ShieldCheck, group: 'Body', show: (g) => g.nofap },
  { id: 'coaching', label: 'Coaching', icon: GraduationCap, group: 'Body' },
  { id: 'trackers', label: 'Trackers', icon: ChartBar, group: 'Habits' },
  { id: 'challenges', label: 'Challenges', icon: Target, group: 'Habits' },
  { id: 'focus', label: 'Focus', icon: Code, group: 'Habits' },
  { id: 'mindset', label: 'Mindset', icon: Brain, group: 'Wellbeing' },
  { id: 'cycle', label: 'Cycle', icon: Flower, group: 'Wellbeing', show: (g) => g.cycle },
  { id: 'collections', label: 'Collections', icon: Books, group: 'Library' },
  { id: 'reading', label: 'Reading', icon: BookOpen, group: 'Library' },
  { id: 'monthly', label: 'Monthly', icon: CalendarBlank, group: 'Library' },
  { id: 'goals', label: 'Goals', icon: Flag, group: 'Library' },
  { id: 'insights', label: 'Insights', icon: Sparkle, group: 'Review' },
  { id: 'stats', label: 'Stats', icon: ChartPie, group: 'Review' },
  // No `System` group. Help and Settings used to sit here under
  // `group: 'System'`, which `CLASSIC_GROUP_ORDER` does not list — `Sidebar`
  // filters on that list, so neither row has ever rendered. They read as the
  // rail's system section while being dead entries. Both destinations are real
  // and reachable: Settings from the rail footer, Help from the top bar's ⓘ
  // menu and the overflow menu. Deleted rather than wired up, because keeping
  // them out of the rail is the intent recorded below.
]

/**
 * Order and membership of the classic rail's group headers.
 *
 * Order flows: capture → body → habits → wellbeing → reference → analysis.
 * A group absent from this array is not rendered at all, whatever items claim
 * it — which is what silently retired the `System` rows above. Adding a group
 * to a `NavItem` without adding it here adds nothing.
 */
export const CLASSIC_GROUP_ORDER = ['Journal', 'Body', 'Habits', 'Wellbeing', 'Library', 'Review']
