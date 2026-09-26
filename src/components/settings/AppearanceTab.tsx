import { ArrowsClockwise } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../../store'
import { Card, Segmented } from '../ui'
import { Button } from '../ui/button'
import { MasonryGrid } from '../shell/CardGrid'
import { useConfirm } from '../ConfirmDialog'
import { cat } from '../../lib/colors'
import { THEMES } from '../../lib/themes'
import { Row, Toggle } from './shared'

/**
 * How the app looks. Four bands and one reset, all of which write `settings`
 * and nothing else — this tab cannot touch journal data, which is why the
 * reset button can be a plain destructive without an export offer.
 */
export function AppearanceTab() {
  const confirm = useConfirm()
  const { data, setSettings } = useJournal()
  const s = data.settings

  return (
    <>
          {/* Masonry, not CardGrid: Theme is ~350px and Shape & size ~250px, and
              a grid row is as tall as its tallest cell — so the short card's
              column held a gap until the next row began. Peer cards in no
              particular order, which is the one case column-major reading is
              fine. */}
          <MasonryGrid>
      <Card band title="Theme" subtitle="The palette, and the accent that runs through it">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {THEMES.map((t) => {
            const active = (s.theme ?? 'mocha') === t.value
            return (
              <button
                key={t.value}
                onClick={() => setSettings({ theme: t.value })}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-control border px-2.5 py-2 text-left transition-colors ${active ? 'border-primary bg-secondary/50' : 'border-line hover:border-line-strong'}`}
              >
                <span className="flex shrink-0 overflow-hidden rounded-card border border-line" aria-hidden>
                  {t.swatch.map((c, i) => <span key={i} className="h-7 w-2.5" style={{ background: c }} />)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-body text-fg-1">{t.label}</span>
                  <span className="block text-caption text-fg-2">{t.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
        {/* The accent is a property of the theme, not a ninth unrelated block.
            It used to sit six rules below the swatches it modifies, with the
            dashboard-card toggles in between. */}
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-2 text-body text-fg-1">Accent color</p>
          <div className="flex flex-wrap gap-2">
            {['mauve', 'blue', 'green', 'pink', 'peach', 'teal', 'sky', 'lavender'].map((c) => {
              const active = (s.accent ?? 'mauve') === c
              return (
                <button key={c} onClick={() => setSettings({ accent: c })} aria-label={c} title={c} className="h-7 w-7 rounded-control transition-transform hover:scale-110" style={{ background: cat(c), outline: active ? `2px solid ${cat('text')}` : 'none', outlineOffset: 2 }} />
              )
            })}
          </div>
        </div>
      </Card>

      <Card band title="Shape & size" subtitle="How much of a day is on screen, and how big it reads">
        {/* Two shapes for Today, both maintained. Not a migration and not an
            experiment — some people want the whole day on one page, and that is
            a legitimate way to run a journal. It stopped choosing a navigation
            when the sidebar was deleted; see `Settings.layout` in lib/types.ts. */}
        <div className="mb-3 border-b border-line pb-3">
          <p className="mb-2 text-body text-fg-1">Today layout</p>
          <Segmented
            value={s.layout ?? 'focused'}
            onChange={(v) => setSettings({ layout: v })}
            options={[{ value: 'focused', label: 'Focused' }, { value: 'classic', label: 'Classic' }]}
          />
          <p className="mt-1 text-label text-fg-2">
            <b className="font-medium text-fg-1">Focused</b> · Today split into Morning / Day / Evening.{' '}
            <b className="font-medium text-fg-1">Classic</b> · the whole day on one page.
          </p>
        </div>
        <div>
          <p className="mb-2 text-body text-fg-1">Text size</p>
          <Segmented
            value={s.fontScale ?? 1}
            onChange={(v) => setSettings({ fontScale: v })}
            options={[{ value: 0.9, label: 'S' }, { value: 1, label: 'M' }, { value: 1.1, label: 'L' }, { value: 1.25, label: 'XL' }]}
          />
          <p className="mt-1 text-label text-fg-2">Scales all text &amp; controls across every screen. Charts and figures keep their natural size.</p>
        </div>
      </Card>

      <Card band title="Journal feel" subtitle="Make it look & behave like real paper">
        <div className="space-y-2">
          <Toggle label="Open-book frame (spine & page edges)" on={s.bookMode} onChange={(v) => setSettings({ bookMode: v })} />
          <Toggle label="Dot-grid paper texture" on={s.paperMode} onChange={(v) => setSettings({ paperMode: v })} />
          <Toggle label="Handwriting font" on={s.handwriting} onChange={(v) => setSettings({ handwriting: v })} />
          <Toggle label="Daily reflection prompt" on={s.reflectionPrompts} onChange={(v) => setSettings({ reflectionPrompts: v })} />
        </div>
        <div className="mt-3 border-t border-line pt-3">
          <Row label="Penalty difficulty">
            <Segmented
              value={s.penaltyLevel ?? 'beginner'}
              onChange={(v) => setSettings({ penaltyLevel: v })}
              options={[{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Inter' }, { value: 'hard', label: 'Hard' }]}
            />
          </Row>
          <p className="mt-1 text-label text-fg-2">Scales the make-up drills to a doable level.</p>
        </div>
      </Card>

      <Card band title="Today dashboard cards" subtitle="What the Today page offers you unasked">
        <div className="space-y-2">
          {([['plan', "Today's plan"], ['habits', "Today's habits"], ['penalty', 'Make-up work'], ['onThisDay', 'On this day']] as const).map(([key, label]) => {
            const hidden = s.hideToday ?? []
            return (
              <Toggle
                key={key}
                label={label}
                on={!hidden.includes(key)}
                onChange={(v) => setSettings({ hideToday: v ? hidden.filter((k) => k !== key) : [...hidden, key] })}
              />
            )
          })}
        </div>
      </Card>
          </MasonryGrid>

          {/* SET-4: one-tap return to the default look. Below the grid, not
              inside one of the four bands — it resets all four, and a reset
              button parked in the last card reads as belonging to that card. */}
          <div className="mt-5 border-t border-line pt-4">
            <Button
              variant="danger"
              onClick={async () => { if (await confirm({
                title: 'Reset appearance to defaults?',
                description: 'Restores the theme, accent, text size, paper and dashboard toggles. Your journal data is untouched.',
                confirmLabel: 'Reset appearance', destructive: true,
              })) setSettings({ theme: 'mocha', accent: undefined, fontScale: 1, bookMode: false, paperMode: false, handwriting: false, reflectionPrompts: true, penaltyLevel: 'beginner', hideToday: [] }) }}
              className="inline-flex items-center gap-1.5"
            >
              <Icon as={ArrowsClockwise} size="sm" /> Reset appearance to defaults
            </Button>
          </div>
    </>
  )
}
