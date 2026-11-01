import { useJournal } from '../../store'
import type { Gender } from '../../lib/types'
import { AboutYouCells, UnitsCells } from './AccountPhone'
import { SyncAccountCells, YouCells } from '../account/AccountPhoneCells'

/**
 * Who this journal belongs to — the verified account, the name on it, what it
 * tracks about you, and how its numbers are spelled.
 *
 * ── This tab is the merge of two destinations (COD-297) ────────────────────
 *
 * There used to be a whole `views/Account.tsx` as well as this Settings tab,
 * and between them they answered one question twice. `LocalAccountCard` was
 * titled **"You"** over there and edited a name and an emoji; `ProfileTab` was
 * titled **"Profile"** here and edited gender, the wellbeing gates and the
 * reminder. Two nouns for one person, on two pages, neither of which held the
 * Google sign-in *and* the thing it signs you into.
 *
 * Reported as: *"everything needs to be at one place."* So the account page is
 * retired and this is where it went; `lib/deepLink.ts` keeps `?view=account`
 * working.
 *
 * **Four tabs, still.** `README.md` in this directory forbids a fifth without a
 * per-tab measurement showing it fills a screen, and Profile was the emptiest
 * surface in the whole view at 378px of content in a 743px viewport. So Account
 * absorbs it rather than sitting beside it — which is also the right answer on
 * the merits: "which account" and "what do we call you" are the same question
 * asked of a verified and an unverified identity.
 *
 * ── Order ─────────────────────────────────────────────────────────────────
 *
 * Grouped rows on every device (`account/AccountPhoneCells.tsx`,
 * `AccountPhone.tsx`), narrowing from identity to pure formatting:
 *
 *   1. You — the local name and face, a label, nothing checked
 *   2. Sync across devices — the Google account; renders nothing when the
 *      build has no Supabase project, so a clone opens on (1) and still works
 *   3. About you — gender, the wellbeing gates, the nudge
 *   4. Units & week
 *
 * The desktop cards (`AccountCard`, `LocalAccountCard`) drew the same hooks
 * in three columns of prose until the owner asked the desktop to follow the
 * phone (2026-11-01).
 */
export function AccountTab() {
  const { data, setSettings } = useJournal()
  const s = data.settings

  function setGender(gender: Gender) {
    // Auto-surface the relevant wellbeing tool, but let the user override after.
    setSettings({
      gender,
      cycleTrackerEnabled: gender === 'female' ? true : s.cycleTrackerEnabled,
      nofapEnabled: gender === 'male' ? true : s.nofapEnabled,
    })
  }

  // Every device draws the tab as grouped rows (phone since COD-562, desktop
  // since the owner asked it to "follow the mobile version"): who you are
  // first, then the account that syncs it, then the settings.
  return (
    <div className="flex flex-col gap-5">
      <YouCells />
      <SyncAccountCells />
      <AboutYouCells setGender={setGender} />
      <UnitsCells />
    </div>
  )
}
