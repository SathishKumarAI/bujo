import { isConfigured } from '../../lib/supabase'
import { useAuthUser } from '../../lib/authUser'
import { useAccountStatus } from '../../lib/accountStatus'
import { phaseCopy, type AccountPhase, type AccountTone } from '../../lib/account'
import { hrefFor } from '../../lib/deepLink'

/**
 * Where your journal is, in the top bar, all the time.
 *
 * ── Why this is in the chrome and not on a settings page ──────────────────
 *
 * Because the desktop top bar was doing nothing. Measured at 1707 on
 * Insights: the strip is **1489 x 48**, it contains **three text leaves** —
 * a title, a middot and a subtitle — and **zero interactive controls**. Ink
 * ends at x=487, leaving **1,210px dead: 81.3% of the bar**. It costs
 * `--header-h` on every page and every viewport and gives back the name of
 * the page you just clicked on in the nav beside it.
 *
 * The strip has already been through a space-saving pass (#, 60px -> 42px, in
 * response to "it takes more space"). That was the wrong axis. The problem was
 * never its height, it was that four fifths of it said nothing.
 *
 * ── Why THIS fact, out of everything that could go there ──────────────────
 *
 * Because "where is my journal" was invisible, and that cost a whole session
 * of debugging. The phase existed — `lib/accountStatus.ts` publishes it and
 * `phaseCopy` has the words — and it rendered in exactly three places you had
 * to go looking for: the Account card, the Settings sync bar, and the header
 * avatar menu behind a click. Meanwhile the state it describes includes
 * "signed in, nothing uploaded, and nothing ever will be".
 *
 * A fact you have to navigate to is a fact you check once and then assume.
 * This is the same phase, the same words and the same tones as the card —
 * imported, not re-typed, because three hand-written copies of a sentence are
 * three sentences that drift, which this repo has already done twice.
 *
 * ── It is quiet on purpose ────────────────────────────────────────────────
 *
 * `fg-2`, label-sized, a 6px dot. The shell already carries a
 * `[one-primary]` warning for having two primary buttons; a third loud thing
 * in the chrome would be worse than the empty space it replaced. A dot carries
 * the tone and the sentence carries the meaning — never the other way round,
 * because colour alone is not readable to everyone.
 *
 * ── And it does not duplicate `SyncIndicator` ─────────────────────────────
 *
 * That one is transient, bottom-right, and fires on a `bujo:sync` event: it
 * answers "something just happened". This answers "where do things stand",
 * which is a different question and is the one nobody could answer. It is
 * desktop-only (`PageHeader` is `md:flex`); the phone's `TopBar` is a
 * different component with no room, and keeps the transient pill.
 */

/** Tone -> a `bg-*` utility, spelled out rather than interpolated.
 *
 *  Tailwind cannot see `bg-${tone}`, and a class it cannot see is a class it
 *  does not emit — the v4 trap in CLAUDE.md: no error, no CSS, the dot simply
 *  inherits and the status loses its colour silently. Backgrounds and not text
 *  colours, because an accent as text is the `cat('crust')` family of contrast
 *  bugs and the sentence beside it is what actually carries the meaning. */
const TONE: Record<AccountTone, string> = {
  green: 'bg-green',
  peach: 'bg-peach',
  red: 'bg-red',
  'fg-2': 'bg-fg-2',
}

export function SyncPill() {
  const configured = isConfigured()
  const { user, ready } = useAuthUser()
  const status = useAccountStatus()

  // Absent, not broken. This repo is public and most clones never set
  // `VITE_SUPABASE_*`; a pill describing an account you cannot have is worse
  // than no pill. Same rule as `AccountCard`.
  if (!configured) return null

  // The session wins over the sync phase when they disagree, which they do for
  // a tick after a sign-in — both subscriptions fire, in whatever order React
  // flushes them. Identical rule to `AccountCard`, deliberately.
  const phase: AccountPhase = !ready
    ? 'checking'
    : user
      ? (status.phase === 'signed-out' ? 'checking' : status.phase)
      : 'signed-out'
  const copy = phaseCopy(phase, status.lastSyncedAt)

  return (
    <a
      href={hrefFor('settings', undefined, { tab: 'sync' })}
      // A real anchor so cmd-click opens a tab — the same reason the section
      // rail's rows are anchors rather than buttons.
      // `no-underline` opts out of the base anchor rule on purpose. That rule
      // exists because an inline link in prose has nothing else to mark it as
      // one, and it lives in `@layer base` precisely so a deliberately-styled
      // link can override it — which this is. A pill has a shape, a dot and a
      // hover fill doing that job already, and an underline on a chip reads as
      // a stray link rather than as a control.
      className="flex w-full min-w-0 items-center gap-2 rounded-control px-2 py-1 text-label text-fg-2 no-underline transition-colors hover:bg-ink-2 hover:text-fg-1"
      // The dot is decorative; this is the accessible name, and it carries the
      // whole sentence rather than the two-word summary, because a screen
      // reader has no second glance.
      aria-label={`Sync: ${copy.short}. ${copy.detail}`}
      title={copy.detail}
    >
      <span aria-hidden className={`size-1.5 shrink-0 rounded-pill ${TONE[copy.tone]}`} />
      {/* Hidden below `lg` rather than truncated: at that width the page title
          and its subtitle already want the room, and a two-word status cut to
          an ellipsis is worse than a dot on its own — which still carries the
          tone and still has the full sentence in its accessible name. */}
      <span className="truncate">{copy.short}</span>
    </a>
  )
}
