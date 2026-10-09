import { useJournal } from '../../store'
import { Card, Segmented } from '../ui'
import { CardGrid } from '../shell/CardGrid'
import { Row, Toggle } from './shared'
import { AccountCard } from '../account/AccountCard'
import { LocalAccountCard } from '../account/LocalAccountCard'
import type { Gender } from '../../lib/types'

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
 * ── Order, and why it is not alphabetical ──────────────────────────────────
 *
 * Act first: `AccountCard` carries this tab's single primary button (sign in,
 * or sign out). Then review, narrowing from checked identity to pure
 * formatting:
 *
 *   1. the Google account — verified, and what syncing actually means
 *   2. the local name and emoji — a label, nothing checked
 *   3. what the app tracks about you — gender, the wellbeing gates, the nudge
 *   4. how numbers read — units and week start
 *
 * `AccountCard` renders nothing when the build has no Supabase project, so a
 * clone of this public repo opens on (2) and the tab is still coherent: a local
 * account is an account.
 *
 * Cards 3 and 4 are moved markup, not retyped — including their comments, which
 * record measurements (the 44%-fill reminder band, the 500px of empty wide tier)
 * that would otherwise be re-litigated. The reminder's switch is also in the
 * header menu because whether you want a nudge is a decision you revisit; the
 * *time* is set once, so it is only here.
 */
export function AccountTab({ onGoToSync }: { onGoToSync?: () => void }) {
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

  return (
    <>
      {/* The act zone, and the only full-bleed card on the tab: it is the one
          thing you came here to do. `onGoToSync` is a tab switch now rather
          than a navigation — the passphrase it sends you to is two tabs away in
          the same place, which is the entire point of this change. */}
      <AccountCard onGoToSync={onGoToSync} />

      <div className="mt-5">
        <CardGrid>
          <LocalAccountCard />

          <Card band title="About you" subtitle="What this journal tracks, and when it nudges you">
            <Row label="Gender">
              {/* `Row` renders its label as a <span>, so it names nothing — hence
                  the `aria-label` below. Settings IS scanned: it is in the gate's
                  COMPANIONS list (that is how COD-94 was found), and the note here
                  claiming otherwise had gone stale. */}
              <select
                value={s.gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                aria-label="Gender"
                className="rounded-control border border-ctl-ring bg-ink-2 px-2 py-1.5 text-body text-fg-1"
              >
                <option value="prefer-not">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="nonbinary">Non-binary</option>
              </select>
            </Row>
            <div className="mt-3 space-y-2 border-t border-line pt-3">
              <Toggle label="Cycle / fertility tracker" on={s.cycleTrackerEnabled} onChange={(v) => setSettings({ cycleTrackerEnabled: v })} />
              <Toggle label="Abstinence / NoFap journal" on={s.nofapEnabled} onChange={(v) => setSettings({ nofapEnabled: v })} />
            </div>
            {/* One switch cannot pay for a card's padding: on its own this was a
                324×95 band at 44% fill on the phone, the only card the space
                audit flagged as thin on this view. A block inside a card, not a
                card — the opposite conclusion to units below, for the opposite
                reason: units are four controls that fill a band, this is one. */}
            <div className="mt-3 space-y-2 border-t border-line pt-3">
              <Toggle label="Daily journaling reminder" on={s.reminderEnabled} onChange={(v) => setSettings({ reminderEnabled: v })} />
              {s.reminderEnabled && (
                <Row label="Remind me at">
                  {/* `Row` renders its label as a <span>, which names nothing — and
                      this field only exists once the toggle above is on, a branch
                      the demo seed never takes (`reminderEnabled: false`), so no
                      rendering gate had ever seen it. Same shape as the yellow that
                      sat at 2.02:1 behind a count the seed never produced. */}
                  <input
                    type="time"
                    value={s.reminderTime}
                    onChange={(e) => setSettings({ reminderTime: e.target.value })}
                    aria-label="Reminder time"
                    className="rounded-control border border-ctl-ring bg-ink-2 px-2 py-1.5 text-body text-fg-1"
                  />
                </Row>
              )}
            </div>
          </Card>

          {/* Units were once the third rule-separated block inside Profile and
              are not a fact about you at all — they are how every number in the
              app is spelled. Their own band, so the grid's two columns fill
              instead of one 672px column leaving ~500px of the wide tier empty. */}
          <Card band title="Units & week" subtitle="How numbers and dates are spelled everywhere">
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              <Row label="Weight">
                <Segmented value={s.weightUnit} onChange={(v) => setSettings({ weightUnit: v })} options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} />
              </Row>
              <Row label="Distance">
                <Segmented value={s.distanceUnit} onChange={(v) => setSettings({ distanceUnit: v })} options={[{ value: 'km', label: 'km' }, { value: 'mi', label: 'mi' }]} />
              </Row>
              <Row label="Week starts">
                <Segmented value={s.weekStart ?? 0} onChange={(v) => setSettings({ weekStart: v })} options={[{ value: 0, label: 'Sun' }, { value: 1, label: 'Mon' }]} />
              </Row>
              <Row label="Temperature">
                <Segmented value={s.tempUnit} onChange={(v) => setSettings({ tempUnit: v })} options={[{ value: 'F', label: '°F' }, { value: 'C', label: '°C' }]} />
              </Row>
            </div>
          </Card>
        </CardGrid>
      </div>
    </>
  )
}
