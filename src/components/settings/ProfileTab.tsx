import { useJournal } from '../../store'
import { Card, Segmented } from '../ui'
import { CardGrid } from '../shell/CardGrid'
import { Row, Toggle } from './shared'
import type { Gender } from '../../lib/types'

/**
 * Who this journal is for, when it nudges, and how its numbers are spelled.
 *
 * Two cards, not one: units are not a profile fact — they are how every figure
 * in the app reads — and as a third rule-separated block inside Profile they
 * left ~500px of the wide tier empty beside a 672px column.
 *
 * The daily reminder arrived here when the Reminders tab was retired. It was
 * the only thing on that tab that does NOT reach outside this device — an in-app
 * banner and one browser notification, no push server — while its three
 * neighbours (weather, food lookup, the local model) all do and belong with
 * cloud sync under one "what does this app talk to" question.
 *
 * It is a block inside this card and not a third card, measured: on its own it
 * was a 324×95 band at **44% fill** on the phone, the only card the space audit
 * flagged as thin on this whole view — one switch cannot pay for a card's
 * padding. Which is the opposite conclusion to the units note above, and for
 * the opposite reason: units are four controls that fill a band, this is one.
 */
export function ProfileTab() {
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
          <CardGrid>
      <Card band title="Profile" subtitle="Who this journal is for, and when it nudges you">
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
        {/* Moved verbatim from the retired Reminders tab. The switch is also in
            the account menu, because whether you want the nudge is a decision
            you revisit; the time is one you set once, which is why it is only
            here. An in-app banner plus one browser notification a day — there
            is no push server, so this reaches nothing outside the device, which
            is why it did not travel with weather and the food lookup. */}
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

      {/* Units were the third rule-separated block inside the Profile card and
          are not profile at all — they are how every number in the app is
          spelled. Their own band, so the two fill the grid's two columns
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
  )
}
