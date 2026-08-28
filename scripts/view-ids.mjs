/**
 * Every routable view id, for the gate scripts that navigate by `?view=<id>`.
 *
 * Its own module so it can be asserted against the app's typed registry from a
 * vitest test — `scripts/smoke-views.mjs` launches a browser at import time and
 * cannot be imported from one.
 *
 * This is a hand-written id list resolved against another source, which is the
 * shape this repo has been bitten by twice: `BottomNav`'s `PRIMARY` silently
 * dropped a phone tab when a nav id was retired (retired trap, CLAUDE.md), and
 * `scripts/a11y-axe.mjs`'s `VIEWS` still means "0 serious for the pages that
 * happened to be opened". `viewChrome.test.ts` is what keeps this one honest.
 *
 * `kitchen-sink` is deliberately absent: it renders every component in every
 * state at once and is a development surface, not a shipped view.
 */
export const VIEW_IDS = [
  'today', 'plan', 'trackers', 'fitness', 'nutrition', 'gym', 'program',
  'pullups', 'pickleball', 'coaching', 'homeworkout', 'challenges', 'focus',
  'cycle', 'nofap', 'monthly', 'collections', 'reading', 'goals', 'mindset',
  'insights', 'stats', 'account', 'help', 'settings',
]

/** Not smoke-tested, and why. Keep the reason with the exemption. */
export const NOT_SMOKED = {
  'kitchen-sink': 'a development surface, not a shipped view',
}
