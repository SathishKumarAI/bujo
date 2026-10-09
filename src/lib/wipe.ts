// Erasing this device, truthfully. COD-299.
//
// ── The bug this exists for ────────────────────────────────────────────────
//
// "Erase everything and start fresh?" promised it deletes every entry, habit,
// workout "and every photo and memory on this device. It cannot be undone."
// What it did was `replaceAll(emptyJournal())` — which rewrites ONE
// localStorage key. There was no `localStorage.clear()` and no
// `indexedDB.deleteDatabase()` anywhere in the application; every occurrence of
// either was in a test file.
//
// So after "erasing everything", a device still held:
//
//   bujo:sync                   the cloud-sync passphrase, in PLAINTEXT
//   sb-<ref>-auth-token         the Supabase access AND refresh token
//   bujo-images (IndexedDB)     every progress photo — the exact thing the
//                               dialog named, and `imageStore.ts` has no bulk
//                               delete, only per-id, so nothing could reach them
//   bujo-fs (IndexedDB)         a live handle to the user's sync folder
//   bujo:food-cache             30 days of the user's own food SEARCH QUERIES
//   bujo:device-id              the self-host row owner
//   bujo.ui.*, the per-day flags
//
// `lib/cyclePrivacy.ts` already states the rule this broke: *a dialog that
// overstates what it destroys is the same defect as one that understates it.*
// This is the dangerous direction — you hand someone the laptop believing it is
// wiped, and your journal's credentials are still in it.
//
// ── Why a prefix sweep and not a list of keys ──────────────────────────────
//
// A hand-written key list resolved against another source is the single most
// repeated mistake in this repo: `BottomNav.PRIMARY` silently dropped a phone
// tab, `a11y-axe`'s VIEWS meant "the pages that happened to be opened", and
// `scripts/view-ids.mjs` drifted until a test caught it. A wipe list would be
// worse than any of those, because its failure is silent AND it is the failure
// the user is trusting with their privacy.
//
// So this sweeps by PREFIX. Three families cover everything the app and its one
// persisting dependency write, and a key added tomorrow is covered the day it
// is added rather than the day someone remembers this file:
//
//   `bujo:`      app data, credentials, caches, per-day flags
//   `bujo.ui.`   sticky view state (a dot, not a colon — the odd one out)
//   `sb-`        Supabase's own session key, `sb-<project-ref>-auth-token`
//
// ── What is deliberately kept, and why ─────────────────────────────────────
//
// `bujo:onboarded` survives. The dialog's sibling button is "Back to start
// screen", which exists precisely to re-run that choice; erasing the flag here
// would silently do the sibling's job too and drop someone into onboarding they
// did not ask for. Erasing data and changing which screen you are on are two
// decisions and the UI already separates them.
//
// Workbox's caches are not touched either: they hold the app shell — JS, CSS,
// HTML, SVG and a font copy — and no user data. Clearing them would force a
// re-download to achieve nothing, and on a bad connection would leave someone
// staring at a blank app right after they pressed the scary red button.
import { clearSyncPassphrase } from './syncSecret'

/** Written so the UI can report what actually happened instead of asserting it. */
export interface WipeReport {
  /** localStorage keys removed, sorted. */
  keys: string[]
  /** IndexedDB databases deleted. */
  databases: string[]
  /** True when the Supabase session key was among the keys. */
  signedOut: boolean
}

/** Survives the wipe. See the note above — this is a decision, not an oversight. */
const KEEP = new Set(['bujo:onboarded'])

/** Everything this origin persists starts with one of these. */
const PREFIXES = ['bujo:', 'bujo.ui.', 'sb-']

/** The app's two IndexedDB databases — `imageStore.ts` and `fscloud.ts`. */
const DATABASES = ['bujo-images', 'bujo-fs']

function store(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** Which keys a wipe would remove. Exported so the UI can show them BEFORE asking. */
export function wipeableKeys(): string[] {
  const s = store()
  if (!s) return []
  return Object.keys(s)
    .filter((k) => PREFIXES.some((p) => k.startsWith(p)) && !KEEP.has(k))
    .sort()
}

/**
 * Erase every trace of this journal from this device.
 *
 * Deliberately tolerant: each step is independently guarded, because a wipe
 * that throws half way through is worse than one that reports what it managed
 * — the user has already been told their data is gone, and a thrown error
 * leaves credentials behind with nothing on screen saying which.
 *
 * `deleteDatabase` can block forever when another tab holds the database open,
 * so each one is raced against a timeout and reported honestly rather than
 * hanging the dialog. A database that did not delete is absent from the report,
 * which is the point of returning one.
 */
export async function eraseDevice(now = Date.now()): Promise<WipeReport> {
  void now
  const s = store()
  const keys = wipeableKeys()
  const signedOut = keys.some((k) => k.startsWith('sb-'))

  for (const k of keys) {
    try { s?.removeItem(k) } catch { /* keep going; report what went */ }
  }
  // The in-memory copy of the passphrase outlives localStorage — it is a module
  // variable by design (`syncSecret.ts`), so removing the key is not enough.
  try { clearSyncPassphrase() } catch { /* already gone */ }

  const databases: string[] = []
  for (const name of DATABASES) {
    if (typeof indexedDB === 'undefined') break
    const gone = await new Promise<boolean>((resolve) => {
      let settled = false
      const done = (ok: boolean) => { if (!settled) { settled = true; resolve(ok) } }
      // Another tab with the DB open fires `onblocked` and never completes.
      const timer = setTimeout(() => done(false), 3000)
      try {
        const req = indexedDB.deleteDatabase(name)
        req.onsuccess = () => { clearTimeout(timer); done(true) }
        req.onerror = () => { clearTimeout(timer); done(false) }
        req.onblocked = () => { clearTimeout(timer); done(false) }
      } catch {
        clearTimeout(timer)
        done(false)
      }
    })
    if (gone) databases.push(name)
  }

  return { keys, databases, signedOut }
}

/** One sentence naming what was actually removed. The UI must not invent this. */
export function wipeSummary(r: WipeReport): string {
  const parts = [`${r.keys.length} stored item${r.keys.length === 1 ? '' : 's'}`]
  if (r.databases.includes('bujo-images')) parts.push('every photo')
  if (r.signedOut) parts.push('your signed-in session')
  const tail = r.databases.length < DATABASES.length
    ? ' Close any other tab with this app open and press it again to finish.'
    : ''
  return `Removed ${parts.join(', ')} from this device.${tail}`
}
