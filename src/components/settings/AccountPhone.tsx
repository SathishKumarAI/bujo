import { useJournal } from '../../store'
import { Cells, ToggleCell } from '../ui/cells'
import { Seg } from '../ui/seg'
import type { Gender } from '../../lib/types'

/**
 * SETTINGS › ACCOUNT ON A PHONE — "About you" and "Units & week" as iOS
 * grouped rows.
 *
 * OWNS: the phone drawing of those two cards. Every write is the same
 * `setSettings` call the desktop card makes; `setGender` is handed in so the
 * auto-surface rule (female → cycle tracker, male → recovery) lives once, in
 * `AccountTab`.
 * DOES NOT OWN: the account and local-name cards (forms, drawn as they are) or
 * the desktop (`AccountTab.tsx`, untouched).
 *
 * A setting added to either desktop card goes here too — this is a second
 * drawing of the same fields.
 */
export function AboutYouCells({ setGender }: { setGender: (g: Gender) => void }) {
  const { data, setSettings } = useJournal()
  const s = data.settings
  return (
    <Cells title="About you">
      {/* A value row: the native select draws the iOS wheel, its current value
          sits right-aligned where iOS puts it. The row is the label. */}
      <label className="cell">
        <span className="flex-1 text-body text-fg-1">Gender</span>
        <select className="cell-select" value={s.gender} onChange={(e) => setGender(e.target.value as Gender)}>
          <option value="prefer-not">Prefer not to say</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="nonbinary">Non-binary</option>
        </select>
      </label>
      <ToggleCell title="Cycle / fertility tracker" on={s.cycleTrackerEnabled} onChange={(v) => setSettings({ cycleTrackerEnabled: v })} />
      <ToggleCell title="Abstinence / NoFap journal" on={s.nofapEnabled} onChange={(v) => setSettings({ nofapEnabled: v })} />
      {s.nofapEnabled && (
        <ToggleCell
          title="Discreet labels on Recovery"
          subtitle="Display only — exports keep the real names"
          on={s.discreetRecovery === true}
          onChange={(v) => setSettings({ discreetRecovery: v })}
        />
      )}
      <ToggleCell title="Daily journaling reminder" on={s.reminderEnabled} onChange={(v) => setSettings({ reminderEnabled: v })} />
      {s.reminderEnabled && (
        <label className="cell">
          <span className="flex-1 text-body text-fg-1">Remind me at</span>
          <input type="time" className="cell-select" value={s.reminderTime} onChange={(e) => setSettings({ reminderTime: e.target.value })} />
        </label>
      )}
    </Cells>
  )
}

export function UnitsCells() {
  const { data, setSettings } = useJournal()
  const s = data.settings
  // Every unit arrives chosen, so no `allowNone`: tapping the lit option to
  // confirm it must not clear it. `v != null` and not `v &&` — Sunday is 0.
  return (
    <Cells title="Units & week">
      <SegRow label="Weight" value={s.weightUnit} onChange={(v) => setSettings({ weightUnit: v })} options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} />
      <SegRow label="Distance" value={s.distanceUnit} onChange={(v) => setSettings({ distanceUnit: v })} options={[{ value: 'km', label: 'km' }, { value: 'mi', label: 'mi' }]} />
      <SegRow label="Week starts" value={s.weekStart ?? 0} onChange={(v) => setSettings({ weekStart: v })} options={[{ value: 0, label: 'Sun' }, { value: 1, label: 'Mon' }]} />
      <SegRow label="Temperature" value={s.tempUnit} onChange={(v) => setSettings({ tempUnit: v })} options={[{ value: 'F', label: '°F' }, { value: 'C', label: '°C' }]} />
    </Cells>
  )
}

/** A label on the left, a short one-tap choice at the right edge. */
export function SegRow<T extends string | number>({ label, value, onChange, options }: {
  label: string
  value: T
  onChange: (v: T) => void
  options: readonly { value: T; label: string }[]
}) {
  return (
    <div className="cell">
      <span className="flex-1 text-body text-fg-1">{label}</span>
      <Seg label={label} value={value} onChange={(v) => { if (v != null) onChange(v) }} options={options} className="cell-seg" />
    </div>
  )
}
