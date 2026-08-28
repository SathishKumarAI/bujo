import { Plus, Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../store'
import { Card, Empty, Input, Pill, Segmented, StatTile, Textarea } from '../components/ui'
import { Button } from '../components/ui/button'
import { Checkbox, CheckRow } from '../components/ui/checkbox'
import { Switch } from '../components/ui/switch'
import { Ring } from '../components/ui/ring'
import { Page } from '../components/shell/Page'
import { Stepper } from '../components/fields/Stepper'
import {
  ActivityForm, CalendarHeatmap, DisclosureRow, EmptyFrame, StatBar, SummaryStrip,
  useActivityDraft,
} from '../components/page'
import { PartnerChemistryCard } from '../components/pickleball/MatchupCards'
import type { Mode } from '../domain/activities'
import { addDays, todayISO } from '../lib/date'

/**
 * Heatmap sample with one deliberate outlier: a single 180-minute day among
 * 25–40 minute ones. Under linear scaling every ordinary day collapses to the
 * lightest step; under quartiles the shape of the habit survives. That contrast
 * is the reason this sample is not just random noise.
 */
const demoHeat = (() => {
  const today = todayISO()
  const out: { date: string; value: number }[] = []
  for (let i = 0; i < 84; i += 1) {
    if (i % 3 === 1) continue // rest days
    out.push({ date: addDays(today, -i), value: i === 12 ? 180 : 25 + ((i * 7) % 16) })
  }
  return out
})()

/**
 * A year of pickleball, played roughly three days a week with a tournament
 * weekend at day 40. Same outlier logic as `demoHeat` — the point of showing it
 * at 52 weeks is that the overflow case is where a heatmap breaks, and it is
 * the width no real journal reaches for months.
 */
const picklePlay = (() => {
  const today = todayISO()
  const out: { date: string; value: number }[] = []
  for (let i = 0; i < 364; i += 1) {
    if (i % 7 === 2 || i % 7 === 4 || i % 7 === 6) continue // days off
    out.push({ date: addDays(today, -i), value: i === 40 ? 14 : 2 + (i % 4) })
  }
  return out
})()

/**
 * Partner list long enough to prove the card scrolls rather than clips, with one
 * name deliberately past the truncation width — a partner is free text, so the
 * overflow case is a name someone actually typed, not a synthetic one.
 */
const picklePartners = [
  { partner: 'Ravi', sessions: 22, games: 71, gamesWon: 45, gamesLost: 26, winPct: 63 },
  { partner: 'Meera', sessions: 14, games: 48, gamesWon: 26, gamesLost: 22, winPct: 54 },
  { partner: 'Dan', sessions: 9, games: 31, gamesWon: 19, gamesLost: 12, winPct: 61 },
  { partner: 'Priya', sessions: 6, games: 20, gamesWon: 9, gamesLost: 11, winPct: 45 },
  { partner: 'Tom', sessions: 4, games: 13, gamesWon: 10, gamesLost: 3, winPct: 77 },
  { partner: 'Alex', sessions: 3, games: 9, gamesWon: 3, gamesLost: 6, winPct: 33 },
  { partner: 'Jordan from the Tuesday morning open-play group', sessions: 1, games: 4, gamesWon: 2, gamesLost: 2, winPct: 50 },
]

/**
 * `/kitchen-sink` — every primitive, variant and state on one page.
 *
 * Asked for by the redesign brief (step 2) so the design system can be reviewed
 * in one place instead of hunting for a screen that happens to render a given
 * variant. Deep-link: `?view=kitchen-sink`.
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
  const [barMode, setBarMode] = useState<'cardio' | 'strength'>('cardio')
  const [formMode, setFormMode] = useState<Mode>('cardio')
  const { draft, patch, reset } = useActivityDraft('cardio')
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

      {/* The band variant, shown as itself. This page stays cards elsewhere on
          purpose — it is the reference for both looks while the Modernist
          redesign lands one page at a time, and a showcase that only shows the
          new thing cannot answer "what did this replace?". */}
      <Card title="Card vs band" subtitle="Same component, two chromes. `<Card band>` is the Modernist section.">
        <div className="space-y-4">
          <Card title="A card" subtitle="Radius, fill, border, padding. An object on the page.">
            <p className="text-label text-fg-2">Cards are for things that compete for attention.</p>
          </Card>
          <Card band title="A band" subtitle="No radius, no fill, one 2px rule, flush left. A section of the page.">
            <p className="text-label text-fg-2">
              Bands are for a page that reads top to bottom. The heading stays at `heading` on every
              width, and a band never draws the ⓘ — a label that needs a “?” gets rewritten instead.
            </p>
          </Card>
        </div>
      </Card>

      <Card title="Checkbox vs switch" subtitle="An event and a setting are not the same control.">
        <Row label="checkbox · this happened">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-body text-fg-1">
            <Checkbox defaultChecked />Workout 1
          </label>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-body text-fg-1">
            <Checkbox />Read 10 pages
          </label>
          <Checkbox disabled aria-label="Disabled, unchecked" />
          <Checkbox disabled defaultChecked aria-label="Disabled, checked" />
        </Row>
        <Row label="tone · danger is checked-and-bad, not indeterminate">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-body text-fg-1">
            <Checkbox tone="danger" defaultChecked />Alcohol
          </label>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-body text-fg-1">
            <Checkbox tone="danger" />Doomscrolling
          </label>
          <span className="text-caption text-fg-3">
            Ticking an avoid habit records a slip. A green ✓ and a struck-through label read as “well
            done, handled”, which is the opposite of what the tick means.
          </span>
        </Row>
        <Row label="check row · the row is the control">
          {/* Empty, typical and overflow, on one 22rem column — the widths a
              rail actually gives it. `defaultChecked` rather than
              `checked` + `readOnly`: Radix rejects that pairing. */}
          <div className="w-full max-w-[22rem] divide-y divide-line border border-line px-3">
            <CheckRow>Read 10 pages</CheckRow>
            <CheckRow defaultChecked>
              <span className="text-fg-2 line-through">🏃 Exercise</span>
            </CheckRow>
            <CheckRow
              tone="danger"
              defaultChecked
              right={<span className="shrink-0 text-label text-red">slipped</span>}
            >
              🍺 Alcohol
            </CheckRow>
            <CheckRow right={<span className="shrink-0 text-label text-green">clean</span>}>
              A habit with a name long enough that the row has to truncate it somewhere
            </CheckRow>
          </div>
        </Row>
        <Row label="switch · this is on">
          <Switch defaultChecked aria-label="Strict mode, on" />
          <Switch aria-label="Strict mode, off" />
          <span className="text-caption text-fg-3">
            Tick a rule for today and tomorrow starts blank; a switch stays where you left it. Challenges
            used switches for its daily rules, so a 75 Hard check-in read as a preferences pane.
          </span>
        </Row>
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
          <StatTile label="Best ever" value="31 days" />
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

      {/* PAGE-CONTRACT PRIMITIVES · every Body-cluster page is built from these
          six and consumes them unmodified. Each is shown empty, typical and
          overflowing, because the empty state is a design decision here rather
          than an afterthought — a zone-3 visual that vanishes at zero data is
          the bug this set was written to remove. */}
      <Card title="StatBar · zone 1" subtitle="One bar, at most four facts, neutral active segment.">
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-caption text-fg-3">Typical · mode toggle + three facts</p>
            <StatBar
              mode={barMode}
              onModeChange={setBarMode}
              segments={[{ value: 'cardio', label: 'Cardio' }, { value: 'strength', label: 'Strength' }]}
              facts={[
                { label: 'This week', value: '90 / 150 min' },
                { label: 'Next up', value: 'Push day' },
                { label: 'Last session', value: 'Tue' },
              ]}
            />
          </div>
          <div>
            <p className="mb-1 text-caption text-fg-3">Empty · no history yet</p>
            <StatBar facts={[{ label: 'This week', value: '0 / 150 min' }, { label: 'Next up', value: 'Any session' }]} />
          </div>
          <div>
            <p className="mb-1 text-caption text-fg-3">Overflow · long values truncate, they never wrap the bar past 64px</p>
            <StatBar
              facts={[
                { label: 'A very long fact label that will not fit', value: 'An equally unreasonable value' },
                { label: 'Second', value: '1,234,567' },
                { label: 'Third', value: 'Interval session — 8×400m' },
                { label: 'Fourth', value: '42' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card title="SummaryStrip · zone 3" subtitle="Exactly three tiles, inset surface, no border, “—” when empty.">
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-caption text-fg-3">Typical</p>
            <SummaryStrip items={[
              { label: 'Sessions', value: 12 },
              { label: 'Total time', value: '6h 20m' },
              { label: 'Best pace', value: '7:42 /mi' },
            ]} />
          </div>
          <div>
            <p className="mb-1 text-caption text-fg-3">Empty · an em dash, never a zero</p>
            <SummaryStrip items={[
              { label: 'Sessions', value: 0, empty: true },
              { label: 'Total time', value: 0, empty: true },
              { label: 'Best pace', value: 0, empty: true },
            ]} />
          </div>
        </div>
      </Card>

      <Card title="CalendarHeatmap · signature visual" subtitle="12 weeks, quartile intensity, renders its frame at zero data.">
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-caption text-fg-3">Typical · one long session does not flatten the rest</p>
            <CalendarHeatmap weeks={12} data={demoHeat} unit="min" />
          </div>
          <div>
            <p className="mb-1 text-caption text-fg-3">Empty · the grid still draws, which is the whole point</p>
            <CalendarHeatmap weeks={12} data={[]} unit="min" />
            <EmptyFrame>Log a session to start your history.</EmptyFrame>
          </div>
          <div>
            <p className="mb-1 text-caption text-fg-3">
              Fluid · cells divide the container instead of taking 11px, for a grid that has a
              column to itself. Fixed at 12 weeks it is a 188px table in Fitness&rsquo;s 708px
              review column; this is what fills it. Resize the window — the cells follow.
            </p>
            <CalendarHeatmap weeks={26} fluid data={demoHeat} unit="min" />
          </div>
        </div>
      </Card>

      <Card title="Pickleball · page states" subtitle="Empty, typical and overflow for the two parts of /body/pickleball that grow without bound.">
        <div className="space-y-5">
          <div>
            <p className="mb-1 text-caption text-fg-3">Empty · no sessions logged. The grid draws its frame; the card does not.</p>
            <CalendarHeatmap weeks={13} data={[]} unit="games" label="Pickleball games per day, no sessions logged" />
            <EmptyFrame>Log a session above to start your record.</EmptyFrame>
          </div>
          <div>
            <p className="mb-1 text-caption text-fg-3">Typical · a season of play at 13 weeks</p>
            <CalendarHeatmap weeks={13} data={picklePlay} unit="games" label="Pickleball games per day over 13 weeks" />
            <PartnerChemistryCard partners={picklePartners.slice(0, 3)} />
          </div>
          <div>
            <p className="mb-1 text-caption text-fg-3">Overflow · a year of sessions and a long partner list, one of them with a name that has to truncate</p>
            <CalendarHeatmap weeks={52} data={picklePlay} unit="games" label="Pickleball games per day over 52 weeks" />
            <PartnerChemistryCard partners={picklePartners} />
          </div>
        </div>
      </Card>

      <Card title="DisclosureRow" subtitle="One per page, at the bottom of the form, never above the fold.">
        <DisclosureRow label="More">
          <p className="text-body text-fg-2">Fields filled less than half the time live here.</p>
        </DisclosureRow>
      </Card>

      <Card title="ActivityForm · zone 2" subtitle="Fields derive from the activity registry — switch the activity and watch them change.">
        <ActivityForm
          mode={formMode}
          draft={draft}
          onChange={patch}
          onSubmit={() => {}}
          unit={data.settings.distanceUnit}
        />
        <div className="mt-3 border-t border-line pt-3">
          <Segmented
            tone="neutral"
            value={formMode}
            onChange={(m) => { setFormMode(m); reset(m) }}
            options={[{ value: 'cardio' as const, label: 'Cardio' }, { value: 'strength' as const, label: 'Strength' }]}
          />
          <p className="mt-1 text-caption text-fg-3">
            Cardio → duration + distance. Pickleball → duration only. Strength → sets. No component decides this.
          </p>
        </div>
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
