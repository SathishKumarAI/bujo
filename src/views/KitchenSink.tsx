import { Plus, Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Empty, Input, Pill, Segmented, StatTile, Textarea } from '../components/ui'
import { Button } from '../components/ui/button'
import { Ring } from '../components/ui/ring'
import { Page } from '../components/shell/Page'
import { Stepper } from '../components/fields/Stepper'

/**
 * `/kitchen-sink` — every primitive, variant and state on one page.
 *
 * Asked for by the redesign brief (step 2) so the design system can be reviewed
 * in one place instead of hunting for a screen that happens to render a given
 * variant. Deep-link: `#/kitchen-sink`.
 *
 * Keep this honest: when a primitive gains a variant, add it here. A kitchen
 * sink that lags the system is worse than none, because it looks authoritative.
 */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-b-0">
      <span className="w-40 shrink-0 text-label text-fg-3">{label}</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function KitchenSink() {
  const [seg, setSeg] = useState<'a' | 'b' | 'c'>('a')
  const [n, setN] = useState(3)
  const { data, setSettings } = useJournal()
  const theme = data.settings.theme ?? 'mocha'
  const scale = data.settings.fontScale ?? 1

  return (
    <Page width="read">
      {/* REVIEW CONTROLS · the two axes every stage has to be checked against,
          on the page being reviewed rather than three clicks away in Settings.
          They drive the real settings, not a local copy — a theme switcher that
          only fakes it would let a desynced JS palette (§I2) pass unnoticed. */}
      <Card title="Review controls" subtitle="Both axes drive the real settings, not a preview.">
        <Row label="Theme">
          <Segmented
            value={theme}
            onChange={(v) => setSettings({ theme: v })}
            options={[
              { value: 'mocha', label: 'Mocha' },
              { value: 'latte', label: 'Latte' },
              { value: 'neon', label: 'Neon' },
              { value: 'vscode', label: 'VS Code' },
              { value: 'dawn', label: 'Dawn' },
            ]}
          />
        </Row>
        <Row label="Text size">
          <Segmented
            value={scale}
            onChange={(v) => setSettings({ fontScale: v })}
            options={[
              { value: 0.9, label: 'S' },
              { value: 1, label: 'M' },
              { value: 1.1, label: 'L' },
              { value: 1.25, label: 'XL' },
            ]}
          />
          <span className="text-caption text-fg-3">
            Everything below is sized in rem, so it grows with this. If a control clips at XL, it is wrong.
          </span>
        </Row>
      </Card>

      <Card title="Type scale" subtitle="Seven steps. Nothing outside this scale.">
        <div className="space-y-2">
          <p className="font-display text-display">Display 32 — Fraunces</p>
          <p className="font-display text-title">Title 22 — Fraunces</p>
          <p className="text-heading">Heading 17 — Instrument Sans</p>
          <p className="text-body">Body 15 — the workhorse. Most prose and UI text lands here.</p>
          <p className="text-label text-fg-2">Label 13 — form labels, secondary UI</p>
          <p className="text-caption text-fg-3">Caption 11 — captions and metadata</p>
          <p className="text-micro text-fg-3">Micro 10 — data chrome only: heatmap cells, axis labels. Never prose.</p>
        </div>
      </Card>

      <Card title="Numerals" subtitle="Every number is mono + tabular, so digits never change width.">
        <div className="space-y-2">
          <p className="num text-title">01:23:45</p>
          <p className="num text-body">1,204 steps · 87.5 kg · 12 reps × 3 sets</p>
          <p className="text-body">Without .num — 1,204 steps · 87.5 kg (proportional, jitters on change)</p>
        </div>
      </Card>

      <Card title="Foreground tiers" subtitle="All three clear WCAG AA on both page and card, in all five themes.">
        <div className="space-y-1">
          <p className="text-body text-fg-1">fg-1 — primary text</p>
          <p className="text-body text-fg-2">fg-2 — secondary text</p>
          <p className="text-body text-fg-3">fg-3 — tertiary text (dawn collapses this to fg-2; see TASKS.md §H14)</p>
        </div>
      </Card>

      {/* Stage 1 of the icon/button pass. Every token added there is rendered
          here, because a token you cannot see in all five themes is a token
          nobody can review. Switch themes in Settings and re-read this card. */}
      <Card title="Accent wash" subtitle="The tonal surface. There is no solid-fill accent button in this app.">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-control bg-brand-wash px-3 py-2 text-body font-medium text-brand-text">
              wash 14% · rest
            </span>
            <span className="inline-flex items-center rounded-control bg-brand-wash-hover px-3 py-2 text-body font-medium text-brand-text">
              wash 20% · hover
            </span>
            <span className="inline-flex items-center rounded-control bg-danger-wash px-3 py-2 text-body font-medium text-danger-text">
              danger wash
            </span>
          </div>
          <p className="text-label text-fg-2">
            Mixed in oklab, not srgb — srgb drags a mix toward grey through the middle of
            the range, worst in dawn, whose accent is an amber rather than a violet.
          </p>
          <p className="text-label text-fg-2">
            The label uses <span className="text-brand-text">brand-text</span>, not{' '}
            <span className="text-brand">brand</span>: the accent as a surface and the accent
            as text are not the same colour. On this wash the raw accent measures 4.39:1 in
            latte and 4.07:1 in dawn — both under AA — so those two themes darken it.
          </p>
        </div>
      </Card>

      <Card title="Shape & size" subtitle="Three radii, three control heights. Everything else is drift.">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-control border border-line-strong px-3 py-2 text-label">rounded-control · 8px</span>
            <span className="rounded-card border border-line-strong px-3 py-2 text-label">rounded-card · 14px</span>
            <span className="rounded-pill border border-line-strong px-3 py-2 text-label">rounded-pill</span>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <span className="inline-flex h-[var(--h-control-sm)] items-center rounded-control bg-ink-2 px-3 text-label">28 · sm</span>
            <span className="inline-flex h-[var(--h-control)] items-center rounded-control bg-ink-2 px-3 text-label">36 · md</span>
            <span className="inline-flex h-[var(--h-control-lg)] items-center rounded-control bg-ink-2 px-3 text-label">44 · lg</span>
          </div>
          <p className="text-label text-fg-2">
            Heights are in rem, so they track the global text-size setting. A control sized
            in px stops matching its own label the moment someone bumps the font scale —
            which is exactly the person who needs the target to stay big.
          </p>
        </div>
      </Card>

      <Card title="Surfaces">
        {/* Classes are written out, not interpolated — Tailwind scans source
            text, so a computed `bg-${s}` produces no CSS at all. */}
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['ink-0', 'bg-ink-0'],
              ['ink-1', 'bg-ink-1'],
              ['ink-2', 'bg-ink-2'],
              ['ink-3', 'bg-ink-3'],
            ] as const
          ).map(([name, cls]) => (
            <div key={name} className={`grid h-16 w-28 place-items-center rounded-card border border-line ${cls}`}>
              <span className="text-caption text-fg-2">{name}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Buttons" subtitle="Four variants, three heights, and no solid accent fill anywhere.">
        <Row label="variant">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
        </Row>
        <Row label="size">
          <Button variant="secondary" size="sm">28 · sm</Button>
          <Button variant="secondary">36 · md</Button>
          <Button variant="secondary" size="lg">44 · lg</Button>
        </Row>
        <Row label="icon-only">
          <Button variant="ghost" size="icon-sm" aria-label="Delete entry"><Icon as={Trash} size="sm" /></Button>
          <Button variant="ghost" size="icon" aria-label="Add entry"><Icon as={Plus} /></Button>
          <span className="text-caption text-fg-3">Both carry an aria-label — an icon is not a name.</span>
        </Row>
        <Row label="disabled">
          <Button variant="primary" disabled>Primary</Button>
          <Button variant="secondary" disabled>Secondary</Button>
          <Button variant="danger" disabled>Delete</Button>
        </Row>
        <Row label="keyboard focus">
          <span className="text-caption text-fg-3">Tab through the rows above — every control shows the focus ring, at 2px offset.</span>
        </Row>
        <Row label="the rule">
          <span className="text-caption text-fg-3">
            One primary per screen. A dev-only check warns in the console when a route mounts two.
          </span>
        </Row>
      </Card>

      <Card title="Inputs">
        <Row label="Input">
          <Input placeholder="Placeholder text" />
        </Row>
        <Row label="Input (disabled)">
          <Input placeholder="Disabled" disabled />
        </Row>
        <Row label="Textarea">
          <Textarea placeholder="Multi-line…" rows={2} />
        </Row>
        <Row label="Stepper">
          <Stepper label="Reps" value={n} onChange={(v) => setN(v ?? 0)} min={0} max={20} />
        </Row>
        <Row label="Segmented">
          <Segmented
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'a', label: 'Day' },
              { value: 'b', label: 'Week' },
              { value: 'c', label: 'Month' },
            ]}
          />
        </Row>
      </Card>

      <Card title="Data display">
        <Row label="StatTile">
          <StatTile label="Streak" value="12 days" />
          <StatTile label="Best ever" value="31 days" color="green" />
        </Row>
        <Row label="Ring">
          <Ring value={72} label="Today" suffix="%" />
          <Ring value={30} max={100} color="green" label="Week" suffix="%" />
        </Row>
        <Row label="Pill · tone">
          <Pill>neutral</Pill>
          <Pill color="green">success</Pill>
          <Pill color="peach">warning</Pill>
          <Pill color="red">danger</Pill>
          <Pill color="mauve" tone="muted">muted</Pill>
          <Pill color="mauve" tone="solid">solid</Pill>
        </Row>
        <Row label="Pill · size">
          <Pill color="sky" size="micro">micro</Pill>
          <Pill color="sky" size="caption">caption</Pill>
          <Pill color="sky">label (default)</Pill>
        </Row>
      </Card>

      <Card title="Empty state">
        <Empty>Nothing logged yet. Add your first entry to see it here.</Empty>
      </Card>

      <Card title="Container tiers" subtitle="Two maxima, one rhythm.">
        <div className="space-y-2 text-body">
          <p>
            <span className="num">820px</span> — <code className="text-label">read</code>: journal, plan, logging, prose.
          </p>
          <p>
            <span className="num">1180px</span> — <code className="text-label">wide</code>: Insights, Stats, Monthly, Trackers, Collections, Settings.
          </p>
          <p className="text-caption text-fg-3">This page is on the read tier.</p>
        </div>
      </Card>
    </Page>
  )
}
