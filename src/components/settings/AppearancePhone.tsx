import { ArrowsClockwise, Check } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../store'
import { Cells, ControlCell, ToggleCell } from '../ui/cells'
import { Seg } from '../ui/seg'
import { cat } from '../../lib/colors'
import { ACCENTS, THEMES, TODAY_CARDS } from '../../lib/themes'
import { SegRow } from './AccountPhone'

/**
 * SETTINGS › APPEARANCE ON A PHONE — the four desktop bands as iOS grouped
 * rows: a theme list with a check on the one in use, accents as 44px swatches,
 * short choices as one-tap segments, switches at the row's right.
 *
 * OWNS: the phone drawing. DOES NOT OWN: any write (each is the desktop's
 * `setSettings` call) or the reset (`onReset`, which still asks first and
 * names what it restores — `AppearanceTab.tsx`).
 *
 * A field added to `AppearanceTab` goes here too: same fields, second drawing.
 */
export function AppearancePhone({ onReset }: { onReset: () => void }) {
  const { data, setSettings } = useJournal()
  const s = data.settings
  const hidden = s.hideToday ?? []

  return (
    <div className="flex flex-col gap-5">
      <Cells title="Theme">
        {THEMES.map((t) => {
          const active = (s.theme ?? 'mocha') === t.value
          return (
            <button key={t.value} type="button" className="cell" aria-pressed={active} onClick={() => setSettings({ theme: t.value })}>
              <span className="flex shrink-0 overflow-hidden rounded-control border border-line" aria-hidden>
                {t.swatch.map((c, i) => <span key={i} className="h-8 w-2.5" style={{ background: c }} />)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium text-fg-1">{t.label}</span>
                <span className="block truncate text-label text-fg-2">{t.hint}</span>
              </span>
              {active && <Icon as={Check} size="sm" className="shrink-0 text-fg-1" />}
            </button>
          )
        })}
        <ControlCell label="Accent color">
          <div className="grid grid-cols-4 justify-items-center gap-2 sm:flex sm:gap-3">
            {ACCENTS.map((c) => {
              const active = (s.accent ?? 'mauve') === c
              return (
                <button key={c} type="button" onClick={() => setSettings({ accent: c })} aria-label={c} aria-pressed={active}
                  className="size-11 rounded-pill" style={{ background: cat(c), outline: active ? `2px solid ${cat('text')}` : 'none', outlineOffset: 2 }} />
              )
            })}
          </div>
        </ControlCell>
      </Cells>

      <Cells title="Shape & size">
        <SegRow label="Today layout" value={s.layout ?? 'focused'} onChange={(v) => setSettings({ layout: v })}
          options={[{ value: 'focused', label: 'Focused' }, { value: 'classic', label: 'Classic' }]} />
        <SegRow label="Text size" value={s.fontScale ?? 1} onChange={(v) => setSettings({ fontScale: v })}
          options={[{ value: 0.9, label: 'S' }, { value: 1, label: 'M' }, { value: 1.1, label: 'L' }, { value: 1.25, label: 'XL' }]} />
      </Cells>

      <Cells title="Journal feel">
        <ToggleCell title="Open-book frame" on={s.bookMode} onChange={(v) => setSettings({ bookMode: v })} />
        <ToggleCell title="Dot-grid paper texture" on={s.paperMode} onChange={(v) => setSettings({ paperMode: v })} />
        <ToggleCell title="Handwriting font" on={s.handwriting} onChange={(v) => setSettings({ handwriting: v })} />
        <ToggleCell title="Daily reflection prompt" on={s.reflectionPrompts} onChange={(v) => setSettings({ reflectionPrompts: v })} />
        <ControlCell label="Penalty difficulty" hint="scales the make-up drills">
          <Seg label="Penalty difficulty" value={s.penaltyLevel ?? 'beginner'} onChange={(v) => { if (v) setSettings({ penaltyLevel: v }) }}
            options={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Inter' }, { value: 'hard', label: 'Hard' }]} />
        </ControlCell>
      </Cells>

      <Cells title="Today cards">
        {TODAY_CARDS.map(([key, label]) => (
          <ToggleCell key={key} title={label} on={!hidden.includes(key)}
            onChange={(v) => setSettings({ hideToday: v ? hidden.filter((k) => k !== key) : [...hidden, key] })} />
        ))}
      </Cells>

      {/* Destructive, so it is a row of its own and asks first (`onReset`). */}
      <div className="cells">
        <button type="button" className="cell cell-danger" onClick={onReset}>
          <Icon as={ArrowsClockwise} size="sm" /> Reset appearance to defaults
        </button>
      </div>
    </div>
  )
}
