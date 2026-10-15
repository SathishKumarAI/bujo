// What to SAY about an account, as pure functions. COD-291.
//
// ── Why this file exists ───────────────────────────────────────────────────
//
// Signing in with Google used to change exactly one card on one page. The
// signed-in user was `useState` inside `components/account/AccountCard.tsx` and
// the sync lifecycle was `useState` inside `components/AccountSync.tsx`, so no
// other surface could read either: the header avatar menu rendered
// `settings.profile.name` ("No name set") and `autoSyncEnabled()` ("This device
// only"), the Account page's StatBar rendered the same two local facts, and
// `SyncIndicator` listened for an event only `lib/bujocloud.ts` emits. Sign-in
// worked; the application did not admit it had happened.
//
// The wiring fix is `authUser.ts` and `accountStatus.ts`. This file is the
// *words*, and they live here rather than inside the components because the
// same sentence now has to appear in three places — a header menu, an
// orientation bar and a card — and three hand-typed copies of a sentence are
// three sentences that drift. That has already happened in this repo twice
// (`CYCLE_CLAUSE`, the retired auth form).
//
// ── The claim that must never be made ──────────────────────────────────────
//
// **"Signed in" does not mean "synced".** It used to be false for a structural
// reason — no passphrase, no upload, ever — and COD-309 removed that reason:
// signing in now is enough, and `no-passphrase` is gone from `AccountPhase`
// along with the whole secret.
//
// It is still false for the ordinary reasons, and those are the ones that will
// now be mistaken for nothing happening, because the obvious obstacle has been
// taken away. A first pull takes a moment; an upload can fail; a demo journal
// is refused on purpose; a row this build cannot read is refused on purpose.
// Each of those is a phase below with a sentence of its own, and the rule that
// produced this file is unchanged: **the card may only say what is actually
// happening.**
import type { User } from './supabase'

/**
 * Who the provider says you are, reduced to the four fields any surface needs.
 *
 * Google puts the display name in `user_metadata` under either `full_name` or
 * `name` depending on the scopes granted, and neither is guaranteed — a Google
 * account with no name set has only an email. So `name` falls back through
 * `full_name → name → the local part of the email → 'Your account'`, and is
 * never empty: it is rendered as the identity line of the header menu, and an
 * empty identity line reads as a broken app rather than as a sparse profile.
 */
export interface AccountIdentity {
  /** Always non-empty. See the fallback chain above. */
  name: string
  email: string | null
  avatarUrl: string | null
  /** 'google', or whatever provider signed this session in. */
  provider: string
}

export function identityOf(user: User | null | undefined): AccountIdentity | null {
  if (!user) return null
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const str = (k: string) => (typeof meta[k] === 'string' && meta[k] ? (meta[k] as string) : null)
  const email = typeof user.email === 'string' && user.email ? user.email : null
  const name = str('full_name') ?? str('name') ?? email?.split('@')[0] ?? 'Your account'
  return {
    name,
    email,
    avatarUrl: str('avatar_url') ?? str('picture'),
    provider: (user.app_metadata?.provider as string | undefined) ?? 'google',
  }
}

/**
 * Where account sync is, as one value.
 *
 * Deliberately NOT a boolean and deliberately not derived from the user object:
 * "signed in" and "syncing" are different questions and conflating them is the
 * bug this whole change is about.
 */
export type AccountPhase =
  /** No Supabase project in this build — the feature is absent, not off. */
  | 'absent'
  | 'signed-out'
  /** Signed in, and this journal is the demo seed, which never reaches a real account. */
  | 'demo'
  /** Reading the account's row to find out whether this device may write to it. */
  | 'checking'
  | 'uploading'
  | 'synced'
  /** The row exists and this build could not read it. Nothing overwritten. */
  | 'unusable'
  | 'error'

/** A token name, used as a `bg-*` dot. Never as a foreground — see the `cat('crust')` trap. */
export type AccountTone = 'green' | 'peach' | 'red' | 'fg-2'

export interface AccountCopy {
  /** Two or three words. Fits a StatBar fact and a menu line. */
  short: string
  /** One sentence. Says what is true, including when the answer is "nothing". */
  detail: string
  tone: AccountTone
}

export function phaseCopy(phase: AccountPhase, lastSyncedAt: number | null = null, now = Date.now()): AccountCopy {
  switch (phase) {
    case 'absent':
    case 'signed-out':
      return {
        short: 'this device only',
        detail: 'This journal has never left this device. Sign in to reach it from another one.',
        tone: 'fg-2',
      }
    // `mayPush` refuses sample data, and a card that said "synced" over a demo
    // journal would be describing an upload that is forbidden rather than slow.
    case 'demo':
      return {
        short: 'demo, not uploaded',
        detail:
          'This journal is the sample data, and sample data is never pushed into a real account. '
          + 'Erase the demo in Settings → Data and your own entries start syncing.',
        tone: 'peach',
      }
    case 'checking':
      return { short: 'checking…', detail: 'Reading your account to see what it already holds.', tone: 'fg-2' }
    case 'uploading':
      return { short: 'uploading…', detail: 'Sending this journal to your account.', tone: 'fg-2' }
    case 'synced':
      return {
        short: 'synced',
        detail:
          lastSyncedAt == null
            ? 'Your journal is in your account. Sign in anywhere else and it is there.'
            : `Last synced ${syncedAgo(lastSyncedAt, now)}. Sign in anywhere else and it is there.`,
        tone: 'green',
      }
    // A statement about the row, not a guess about the person — and the second
    // sentence is the load-bearing one. The reasonable fear on seeing a sync
    // error is that the error WAS the data being lost; here the refusal to
    // write is the thing that kept it.
    case 'unusable':
      return {
        short: 'not uploaded',
        detail:
          "This account's journal could not be read, so nothing has been overwritten. A row this "
          + 'app cannot read is a row it must not write over, and refusing is the whole point — '
          + 'your entries on this device are untouched.',
        tone: 'red',
      }
    case 'error':
      return {
        short: 'not reaching your account',
        detail:
          'The last upload did not go through — offline, or the session expired. Your journal is '
          + 'safe on this device and the next change you make is the retry.',
        tone: 'red',
      }
  }
}

/**
 * "just now" / "4 minutes ago" / "yesterday".
 *
 * `Intl.RelativeTimeFormat` with `numeric: 'auto'` rather than a hand-rolled
 * table — it is in the platform, it says "yesterday" instead of "1 day ago",
 * and it is localised for free. The sub-45-second case is special-cased because
 * "0 minutes ago" is not something anyone says.
 */
export function syncedAgo(at: number | null, now = Date.now()): string {
  if (at == null) return 'never'
  const s = Math.max(0, Math.round((now - at) / 1000))
  if (s < 45) return 'just now'
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute')
  if (s < 86_400) return rtf.format(-Math.round(s / 3600), 'hour')
  return rtf.format(-Math.round(s / 86_400), 'day')
}

/**
 * What an account upload contains, and what it deliberately does not.
 *
 * The user's question was "what kind of data is being synced", and until now
 * the app had no answer anywhere on screen — the only place the boundary was
 * written down was a comment in `lib/cyclePrivacy.ts`. These two lists are read
 * off `forEgress` (`forNetwork` + `stripSyncSecrets`) and `pushAccount`'s image
 * budget, so they are a description of the code rather than a promise beside it.
 *
 * If you change what `forEgress` withholds, change this list in the same
 * commit. `egress.contract.test.ts` guards that the call happens; nothing but
 * this comment guards that the words stay true.
 */
export const SYNCED: readonly string[] = [
  'Every entry, task and note, with its day',
  'Habits, trackers and their whole history',
  'Workouts, meals, readings and sessions',
  'Goals, plans, collections and settings',
]

export const WITHHELD: readonly string[] = [
  'Your cycle log — never uploaded by anything, on any path',
  "This device's sync tokens: self-host, GitHub and Drive",
  'Your passcode, which exists only on this device',
  'Photos beyond the upload budget, which stay on this device',
]
