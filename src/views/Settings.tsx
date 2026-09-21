import { ArrowsClockwise, Bell, CalendarBlank, CaretDown, CaretRight, Cloud, Database, Download, FileText, Palette, Sparkle, Trash, Upload, User, Warning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useRef, useState } from 'react'
import { useJournal } from '../store'
import { notify } from '../lib/notify'
import { Card, Input, Segmented, StatTile } from '../components/ui'
import { Button } from '../components/ui/button'
import { cat, onRaised } from '../lib/colors'
import { Switch } from '../components/ui/switch'
import { DEFAULT_ENDPOINT, DEFAULT_MODEL, isLocalEndpoint, listModels } from '../lib/voice/model'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Page } from '../components/shell/Page'
import { CardGrid, MasonryGrid } from '../components/shell/CardGrid'
import { DriveSync } from '../components/DriveSync'
import { CloudStorage } from '../components/CloudStorage'
import { TagManager } from '../components/TagManager'
import { emptyJournal, exportJSON, exportMarkdown, importJSON, migrate } from '../lib/storage'
import { pushJournalToServer, pullJournalFromServer, serverConfigured } from '../lib/serverSync'
import { generateDemoData } from '../lib/demo'
import { entriesCsv, habitsCsv, metricsCsv, workoutsCsv, parseMetricsCsv, stripSyncSecrets, daysSinceBackup, habitLogCsv, pickleballCsv, recoveryCsv, personalRecordsCsv, collectionCsv, redactSensitive, devSessionsCsv, dataSummary, verifyChecksum, withChecksum } from '../lib/csv'
import { journalToICS, habitRemindersToICS, tasksToICS, completionsToICS } from '../lib/ics'
import { inlineImages } from '../lib/imageStore'
import { todayISO } from '../lib/date'
import type { Gender } from '../lib/types'
import { THEMES } from '../lib/themes'
import { useConfirm } from '../components/ConfirmDialog'
import { CloudSyncCard } from '../components/account/CloudSyncCard'


function download(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Self-managed collapsible settings section (SET-5) — one disclosure primitive
 *  instead of the three ad-hoc toggle buttons this page used to repeat. */
function Disclosure({ title, subtitle, defaultOpen = true, children }: {
  title: string; subtitle?: string; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        /* `flex-wrap`: at 390px the title and the subtitle each wrapped to two
           lines *beside each other*, reading as two ragged columns. The
           subtitle is a clarifier — it drops to its own line instead. */
        className="flex w-full flex-wrap items-center gap-x-2 rounded-control px-1 py-1 text-left hover:text-fg-1"
      >
        <span className="text-fg-2">{open ? <Icon as={CaretDown} size="md" /> : <Icon as={CaretRight} size="md" />}</span>
        <span className="font-display text-heading font-medium text-fg-1">{title}</span>
        {subtitle && <span className="text-label text-fg-2">{subtitle}</span>}
      </button>
      {open && children}
    </section>
  )
}

export function Settings() {
  const confirm = useConfirm()
  const { data, setSettings, replaceAll, setMetric } = useJournal()
  const fileRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)
  const verifyRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState('profile')

  function onVerifyBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const r = verifyChecksum(String(reader.result))
      if (!r.ok) {
        notify.error('Integrity check failed', 'This backup looks truncated or corrupted. Do not rely on it — keep an older copy.')
      } else if (!r.stamped) {
        notify.info('No checksum in this file', 'An older or plain export. It looks readable, but can’t be verified.')
      } else {
        notify.success('Integrity check passed', 'This backup is intact.')
      }
    }
    reader.readAsText(file)
    if (verifyRef.current) verifyRef.current.value = ''
  }

  function onMetricsCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseMetricsCsv(String(reader.result))
      rows.forEach((r) => setMetric(r.date, r.patch))
      notify.success(`Imported metrics for ${rows.length} day${rows.length === 1 ? '' : 's'}`)
    }
    reader.readAsText(file)
    if (csvRef.current) csvRef.current.value = ''
  }
  const s = data.settings

  function setGender(gender: Gender) {
    // Auto-surface the relevant wellbeing tool, but let the user override after.
    setSettings({
      gender,
      cycleTrackerEnabled: gender === 'female' ? true : s.cycleTrackerEnabled,
      nofapEnabled: gender === 'male' ? true : s.nofapEnabled,
    })
  }

  async function doExport() {
    // Inline IndexedDB-stored photos so the backup is self-contained, then strip
    // device-/account-specific sync secrets so the file is safe to share/move.
    const full = await inlineImages(data)
    download(`cadence-backup-${todayISO()}.json`, exportJSON(stripSyncSecrets(full)))
    setSettings({ lastBackup: todayISO() })
  }

  async function doRedactedExport() {
    // Privacy-safe share copy (BUJO-308): inline photos, strip sync secrets, then
    // redact the sensitive domains (Recovery, Cycle) and free-text entry bodies.
    const full = await inlineImages(data)
    download(`cadence-shared-${todayISO()}.json`, exportJSON(redactSensitive(stripSyncSecrets(full))))
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        replaceAll(importJSON(String(reader.result)), { stamp: true })
        notify.success('Backup imported')
      } catch {
        notify.error('Could not read that file', 'Is it a valid bujo backup?')
      }
    }
    reader.readAsText(file)
  }

  // `flex-none` is load-bearing: TabsTrigger ships `flex-1`, which stretched
  // these five pills to 209px each across the wide tier. They are labels, not
  // a segmented control — they should be as wide as their text.
  const tabClass = 'flex-none gap-1.5 whitespace-nowrap rounded-card border border-transparent px-3.5 py-2 text-body text-fg-2 hover:text-fg-1 data-[state=active]:border-line data-[state=active]:bg-card data-[state=active]:text-fg-1 data-[state=active]:shadow-sm'
  return (
    <Page width="wide" className="gap-0 sm:gap-0">
      {/* No page header here. The top bar already renders `Settings · Theme,
          profile, data` as the page's h1; a second designed header repeated the
          word 110px lower and gave the document two h1s — the only view in the
          app that did. The tab bar is the first thing now. */}
      <Tabs value={tab} onValueChange={setTab}>
        {/* Horizontal pill bar — every section visible at once, wraps on narrow
            screens. No sidebar rail, no clipped scroller.

            `h-auto` alone did NOT make it wrap safely. `tabsListVariants` sets
            `group-data-[orientation=horizontal]/tabs:h-9`, and tailwind-merge
            does not treat a group-variant class and a bare `h-auto` as the same
            utility — so both shipped, the variant won, and the list stayed
            locked at 36px while its content wrapped to three rows at 390px.
            The overflowing rows rendered *on top of* the panel below: "Data"
            and the "Profile" card heading drew over each other, a text
            collision on the live phone build. Neither rendering gate saw it —
            `clipped-text.mjs` asks whether an element shows less than it holds
            (it showed everything) and `a11y` asks whether the tree is sound (it
            was). Overridden with the same specificity it is set at. */}
        <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1.5 bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto">
          <TabsTrigger value="profile" className={tabClass}><Icon as={User} size="sm" /> Profile</TabsTrigger>
          <TabsTrigger value="feel" className={tabClass}><Icon as={Palette} size="sm" /> Appearance</TabsTrigger>
          <TabsTrigger value="reminders" className={tabClass}><Icon as={Bell} size="sm" /> Reminders</TabsTrigger>
          {/* "& privacy" is the half that wraps a five-pill row onto a third
              line at 390px. It is a clarifier, not the name. */}
          <TabsTrigger value="sync" className={tabClass}><Icon as={Cloud} size="sm" /> Sync<span className="hidden sm:inline">&amp; privacy</span></TabsTrigger>
          <TabsTrigger value="data" className={tabClass}><Icon as={Database} size="sm" /> Data</TabsTrigger>
        </TabsList>

        {/* `key={tab}` remounts the panel wrapper on every switch, which is
            what replays the grids' `page-enter` stagger. A CSS animation fires
            on mount, not on re-render, so without the key the first tab you
            land on animates and the other four appear instantly — the tab
            switch is the one moment on this page where motion carries meaning
            (it says "this is a different set of things", not "the page
            reloaded"). Reduced-motion users get the same instant swap they got
            before: `bujo-rise` is inside a `prefers-reduced-motion:
            no-preference` block. */}
        <div key={tab} className="min-w-0">
        <TabsContent value="profile">
          <CardGrid>
      <Card band title="Profile" subtitle="Tailors the wellbeing tools shown">
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
        </TabsContent>

        {/* Appearance was one card of eight rule-separated blocks — a 1,000px
            scroll in a 672px column with half the page empty beside it. Same
            blocks, four bands, two columns. */}
        <TabsContent value="feel">
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
        </TabsContent>

        <TabsContent value="reminders">
          <CardGrid>
      <Card band title="Reminders & weather" subtitle="Weather is off until you turn it on">
        <div className="space-y-3">
          <Toggle label="Daily journaling reminder" on={s.reminderEnabled} onChange={(v) => setSettings({ reminderEnabled: v })} />
          {s.reminderEnabled && (
            <Row label="Remind me at">
              <input
                type="time"
                value={s.reminderTime}
                onChange={(e) => setSettings({ reminderTime: e.target.value })}
                className="rounded-control border border-ctl-ring bg-ink-2 px-2 py-1.5 text-body text-fg-1"
              />
            </Row>
          )}
          <div className="border-t border-line pt-3">
            <Toggle label="Auto-log weather & location" on={s.weatherEnabled} onChange={(v) => setSettings({ weatherEnabled: v })} />
            <p className="mt-1 text-label text-fg-2">Uses open-meteo and your browser location. When off, the app makes no network calls.</p>
          </div>
        </div>
      </Card>

      <VoiceModelCard />
          </CardGrid>
        </TabsContent>

        <TabsContent value="sync">
          {/* Recommended path: account + E2E cloud sync, plus at-rest passcode.
              In a grid, not a stack: full-bleed these gave a 1,160px-wide
              passphrase field and ~150-character paragraph lines, the widest
              measure anywhere in the app on the page that asks for a secret. */}
          <CardGrid>
            <CloudSyncCard />
            <PasscodeCard />
          </CardGrid>
          {/* Advanced · BYO-storage / self-host, collapsed to cut option
              overload. `Disclosure` defaults to OPEN, so this comment and the
              three below it described an intent the page never had: every fold
              on Settings shipped expanded, which is why Sync ran to 1,900px and
              Data to 3,000. */}
          <div className="mt-5">
            <Disclosure title="Advanced sync" subtitle="self-host & bring-your-own storage" defaultOpen={false}>
              <CardGrid>
                <SelfHostCard />
                <CloudStorage />
                <DriveSync />
              </CardGrid>
            </Disclosure>
          </div>
        </TabsContent>

        <TabsContent value="data">
          <Card band title="Your data at a glance" subtitle="Everything stored on this device" className="mb-5">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <StatTile compact label="Entries" value={data.entries.length} />
              <StatTile compact label="Habits" value={data.habits.filter((h) => !h.archived).length} />
              <StatTile compact label="Workouts" value={data.workouts.length} />
              <StatTile compact label="Memories" value={data.memories.length} />
              <StatTile compact label="Photos" value={(data.progressPhotos?.length ?? 0) + data.memories.filter((m) => m.photo).length} />
              <StatTile compact label="KB stored" value={Math.round((JSON.stringify(data).length / 1024))} />
            </div>
            {(() => {
              // localStorage budget is ~5 MB. This measures the JSON blob only,
              // which is the right number for THAT budget — photos moved to
              // IndexedDB (`imageStore.ts`) and are neither in this count nor on
              // this quota. The old copy here blamed photos for filling a bar
              // they no longer contribute a byte to.
              const bytes = JSON.stringify(data).length
              const budget = 5 * 1024 * 1024
              const pct = Math.min(100, Math.round((bytes / budget) * 100))
              const warn = pct >= 80
              return (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-label">
                    <span className="text-fg-2">Browser storage used</span>
                    <span style={{ color: warn ? cat('peach') : cat('subtext1') }}>{pct}% of ~5 MB</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-pill bg-ink-2">
                    <div className="h-full rounded-pill" style={{ width: `${pct}%`, background: cat(warn ? 'peach' : 'green') }} />
                  </div>
                  {warn && (
                    <p className="mt-1.5 text-label text-peach">
                      Getting full. Export a backup now. Photos are NOT counted here — they live in
                      IndexedDB, off this budget — so this is journal text: trim old collections or entries.
                    </p>
                  )}
                </div>
              )
            })()}
          </Card>
          {/* `auto-rows-fr` made both rows as tall as the tallest card in them.
              Backup & data is ~1,300px and Tags is ~90px, so Tags was stretched
              to match and the tab carried ~1,200px of empty column — under Tags
              and again beside Demo & reset, which sat alone in row two. The
              shared `CardGrid` is `items-start` for exactly this reason. */}
          <MasonryGrid>
      <Card band title="Backup & data" subtitle="Back it up regularly">
        {(() => {
          const stale = daysSinceBackup(s.lastBackup, todayISO())
          if (stale == null) {
            return (
              <p className="mb-3 flex items-center gap-1.5 rounded-card border border-yellow/30 bg-ink-0 p-2 text-label text-yellow">
                <Icon as={Warning} size="sm" /> You haven't backed up yet. Browsers can clear local storage · export a copy.
              </p>
            )
          }
          if (stale >= 7) {
            return (
              <p className="mb-3 flex items-center gap-1.5 rounded-card border border-yellow/30 bg-ink-0 p-2 text-label text-yellow">
                <Icon as={Warning} size="sm" /> Not backed up in {stale} day{stale === 1 ? '' : 's'} · export a fresh copy to be safe.
              </p>
            )
          }
          return null
        })()}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={doExport} className="inline-flex items-center gap-1.5"><Icon as={Download} size="sm" /> Export JSON</Button>
          <Button variant="secondary" onClick={() => download(`cadence-${todayISO()}.md`, exportMarkdown(data), 'text/markdown')} className="inline-flex items-center gap-1.5"><Icon as={FileText} size="sm" /> Export Markdown</Button>
          <Button variant="secondary" onClick={() => download(`cadence-calendar-${todayISO()}.ics`, journalToICS(data), 'text/calendar')} className="inline-flex items-center gap-1.5"><Icon as={CalendarBlank} size="sm" /> Export calendar</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5"><Icon as={Upload} size="sm" /> Import JSON</Button>
          <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
        </div>
        <p className="mt-1.5 text-label text-fg-2">JSON backups omit your sync tokens so the file is safe to share. Calendar export gives an .ics of your events &amp; birthdays.</p>
        <div className="mt-2">
          <Button variant="secondary" onClick={doRedactedExport} className="inline-flex items-center gap-1.5"><Icon as={Download} size="sm" /> Export shareable (redacted) JSON</Button>
          <p className="mt-1 text-label text-fg-2">A privacy-safe copy that omits Recovery &amp; Cycle data and blanks your entry text — for handing to a coach or support tool.</p>
        </div>
        {s.lastBackup && <p className="mt-2 text-label text-fg-2">Last backup: {s.lastBackup}</p>}
        {/* SET-2: power-user exports fold away so Export/Import JSON stays the hero. */}
        <div className="mt-3 space-y-3 border-t border-line pt-3">
          <Disclosure title="Export for spreadsheets (CSV)" subtitle="one file per section" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => download(`cadence-entries-${todayISO()}.csv`, entriesCsv(data), 'text/csv')}>Entries</Button>
              <Button variant="secondary" onClick={() => download(`cadence-habits-${todayISO()}.csv`, habitsCsv(data), 'text/csv')}>Habits</Button>
              <Button variant="secondary" onClick={() => download(`cadence-habit-log-${todayISO()}.csv`, habitLogCsv(data), 'text/csv')}>Habit log</Button>
              <Button variant="secondary" onClick={() => download(`cadence-metrics-${todayISO()}.csv`, metricsCsv(data), 'text/csv')}>Metrics</Button>
              <Button variant="secondary" onClick={() => download(`cadence-workouts-${todayISO()}.csv`, workoutsCsv(data), 'text/csv')}>Workouts</Button>
              {(data.devSessions?.length ?? 0) > 0 && <Button variant="secondary" onClick={() => download(`cadence-focus-${todayISO()}.csv`, devSessionsCsv(data), 'text/csv')}>Focus sessions</Button>}
              <Button variant="secondary" onClick={() => download(`cadence-pickleball-${todayISO()}.csv`, pickleballCsv(data), 'text/csv')}>Pickleball</Button>
              <Button variant="secondary" onClick={() => download(`cadence-records-${todayISO()}.csv`, personalRecordsCsv(data), 'text/csv')}>PR leaderboard</Button>
              {s.nofapEnabled && <Button variant="secondary" onClick={() => download(`cadence-recovery-${todayISO()}.csv`, recoveryCsv(data), 'text/csv')}>Recovery</Button>}
            </div>
            {data.collections.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-label text-fg-2">Export one collection's entries as CSV:</p>
                <div className="flex flex-wrap gap-2">
                  {data.collections.map((c) => (
                    <Button key={c.id} variant="secondary" onClick={() => download(`cadence-collection-${c.name.replace(/[^\w-]+/g, '-').toLowerCase()}-${todayISO()}.csv`, collectionCsv(data, c.id), 'text/csv')}>
                      {c.icon} {c.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-2">
              <Button variant="secondary" onClick={() => csvRef.current?.click()} className="inline-flex items-center gap-1.5"><Icon as={Upload} size="sm" /> Import metrics CSV</Button>
              <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={onMetricsCsv} className="hidden" />
            </div>
          </Disclosure>
          <Disclosure title="Calendar feeds (.ics)" subtitle="habits, tasks & wins in any calendar" defaultOpen={false}>
            <div className="space-y-2">
              <div>
                <Button variant="secondary" onClick={() => download(`cadence-habit-reminders-${todayISO()}.ics`, habitRemindersToICS(data), 'text/calendar')} className="inline-flex items-center gap-1.5"><Icon as={CalendarBlank} size="sm" /> Habit reminders (.ics)</Button>
                <p className="mt-1 text-label text-fg-2">Adds each active habit to your calendar as a recurring reminder at {s.reminderTime || '09:00'}.</p>
              </div>
              <div>
                <Button variant="secondary" onClick={() => download(`cadence-tasks-${todayISO()}.ics`, tasksToICS(data), 'text/calendar')} className="inline-flex items-center gap-1.5"><Icon as={CalendarBlank} size="sm" /> Open tasks (.ics)</Button>
                <p className="mt-1 text-label text-fg-2">Puts your open, dated to-dos on the calendar as all-day deadlines.</p>
              </div>
              <div>
                <Button variant="secondary" onClick={() => download(`cadence-completions-${todayISO()}.ics`, completionsToICS(data), 'text/calendar')} className="inline-flex items-center gap-1.5"><Icon as={CalendarBlank} size="sm" /> Completions feed (.ics)</Button>
                <p className="mt-1 text-label text-fg-2">Every completed habit and logged workout as an all-day “✓” event — see your wins in any external calendar.</p>
              </div>
            </div>
          </Disclosure>
          <Disclosure title="Backup integrity" subtitle="checksum & verify a file" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={async () => { const full = await inlineImages(data); download(`cadence-verified-${todayISO()}.json.txt`, withChecksum(exportJSON(stripSyncSecrets(full)))) }} className="inline-flex items-center gap-1.5"><Icon as={Download} size="sm" /> Export checksummed backup</Button>
              <Button variant="secondary" onClick={() => verifyRef.current?.click()} className="inline-flex items-center gap-1.5"><Icon as={Upload} size="sm" /> Verify a backup file</Button>
              <input ref={verifyRef} type="file" accept=".txt,.json,application/json,text/plain" onChange={onVerifyBackup} className="hidden" />
            </div>
            <p className="mt-1 text-label text-fg-2">Stamps an export with a checksum so you can later confirm the file wasn’t truncated or corrupted in storage. Verify reports intact / corrupted without changing your data.</p>
          </Disclosure>
          <p className="text-label text-fg-2">Or open any view and <button onClick={() => window.print()} className="text-mauve hover:underline">print / save as PDF</button> · the app chrome is hidden automatically.</p>
        </div>
      </Card>

      {/* Tags moved here from Insights (BUJO-281). It is a maintenance tool —
          it rewrites every entry that carries a tag — not an analysis, so it
          was the one thing on that page you could *change* something with, and
          it sat behind a fold at the bottom of six. Between export and the
          danger zone is where data you edit in bulk belongs. */}
      <TagManager />

      <Card band title="Demo & reset" subtitle="Sample data, or start fresh">
        <div className="flex flex-wrap gap-2">
          {/* Hidden, not disabled, when demo data is switched off: a greyed
              button invites a click and then explains why it will not work.
              The switch below is the place that answers "why is this gone". */}
          {!data.settings.demoDisabled && (
          <Button
            variant="secondary"
            onClick={async () => {
              if (data.entries.length === 0 || await confirm({
                title: 'Load demo data?',
                description: 'This replaces your current journal with about 30 days of sample entries.',
                confirmLabel: 'Load demo data', destructive: true, onBackup: doExport,
              })) {
                replaceAll(generateDemoData())
              }
            }}
            className="inline-flex items-center gap-1.5"
          >
            <Icon as={Sparkle} size="sm" /> Load demo data
          </Button>
          )}
          {/* Only offered when the journal actually IS the samples. Without the
              marker this button could not exist: nothing distinguishes a demo
              entry from a real one, so "remove the demo" on a journal that has
              since been written in would have meant erasing the real work too.
              That is why the confirm still names the counts — anything typed
              since the seed goes with it. */}
          {data.settings.demoSeeded && (
          <Button
            variant="secondary"
            onClick={async () => {
              if (await confirm({
                title: 'Remove the demo data?',
                description: `This journal was filled with samples. Removing them clears all ${data.entries.length} entries and starts you on an empty journal — including anything you have added since.`,
                // No `onBackup`, unlike every other destructive action here.
                // Demo data is generated by `lib/demo.ts` from a fixed seed —
                // it is in the code, reproducible on demand, and identical for
                // everyone. Offering to download a copy of it implies it is
                // yours and worth keeping, which is the opposite of what this
                // button is for.
                confirmLabel: 'Remove the samples', destructive: true,
              })) {
                replaceAll(emptyJournal())
                setSettings({ storageMode: 'local', demoSeeded: false, explore: false })
                notify.success('Demo data removed', 'You are starting from an empty journal.')
              }
            }}
            className="inline-flex items-center gap-1.5"
          >
            <Icon as={Trash} size="sm" /> Remove demo data
          </Button>
          )}
          <Button
            variant="danger"
            onClick={async () => {
              if (await confirm({
                title: 'Erase everything and start fresh?',
                description: `This deletes all ${data.entries.length} entries, ${data.habits.length} habits, ${data.workouts.length} workouts, and every photo and memory on this device. It cannot be undone.`,
                confirmLabel: 'Erase everything', destructive: true, onBackup: doExport,
              })) {
                replaceAll(emptyJournal())
              }
            }}
            className="inline-flex items-center gap-1.5"
          >
            <Icon as={Trash} size="sm" /> Clear all data
          </Button>
          <Button
            variant="secondary"
            onClick={async () => { if (await confirm({
              title: 'Return to the start screen?',
              description: 'Your data is kept, and you can choose guest, account, or device again.',
              confirmLabel: 'Go to start screen',
            })) setSettings({ storageMode: undefined }) }}
            className="inline-flex items-center gap-1.5"
          >
            Back to start screen
          </Button>
        </div>
        <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 border-t border-line pt-3 text-body text-fg-1">
          <span>
            Allow demo data
            <span className="block text-label text-fg-2">
              Off: <code>?demo=1</code> links are ignored and the sample journal cannot be loaded. If this journal is samples, you are asked whether to clear them too.
            </span>
          </span>
          <Switch
            checked={!data.settings.demoDisabled}
            onCheckedChange={async (on) => {
              setSettings({ demoDisabled: !on })
              if (on) {
                notify.success('Demo data allowed', 'You can load the sample journal again.')
                return
              }
              // Switching it off only stopped *future* seeding, which is not
              // what "disable demo data" means to someone looking at a journal
              // full of samples. If this journal is the samples, offer to clear
              // them in the same gesture rather than leaving the switch looking
              // like it did nothing.
              if (!data.settings.demoSeeded) {
                notify.success('Demo data switched off', 'Sample data can no longer be loaded.')
                return
              }
              if (await confirm({
                title: 'Clear the samples already loaded?',
                description: `New samples can no longer load. This journal is still holding ${data.entries.length} of them — clearing now starts you on an empty journal, including anything you have added since.`,
                confirmLabel: 'Clear them now',
                cancelLabel: 'Keep them for now',
                destructive: true,
              })) {
                replaceAll(emptyJournal())
                setSettings({ storageMode: 'local', demoSeeded: false, explore: false, demoDisabled: true })
                notify.success('Demo data removed', 'You are starting from an empty journal.')
              } else {
                notify.info('Demo data switched off', 'The samples already here are untouched; you can remove them any time.')
              }
            }}
          />
        </label>
        <p className="mt-2 text-label text-fg-2">
          Demo data fills ~30 days of correlated entries so charts have something to show. <strong>Back to start screen</strong> keeps your data and lets you re-pick how it's stored; <strong>Clear all data</strong> wipes everything.
        </p>
      </Card>

          {/* Journal summary · read-only coverage analytics. It was a
              `Disclosure` whose title and subtitle were repeated verbatim by
              the `Card` inside it, so the page drew the same heading and the
              same sentence twice, 40px apart, differing only in the capital T.
              `Card` folds on its own — one heading, one caret. */}
          {(() => {
            const sum = dataSummary(data)
            if (sum.totalRecords === 0) return null
            return (
                  <Card band collapsible defaultCollapsed title="Journal summary" subtitle="The span and shape of everything you've tracked">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <StatTile compact label="First day" value={sum.firstDay ?? '—'} />
                      <StatTile compact label="Latest day" value={sum.lastDay ?? '—'} />
                      <StatTile compact label="Days span" value={sum.spanDays} />
                      <StatTile compact label="Active days" value={sum.activeDays} />
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-label">
                        <span className="text-fg-2">Days with data (coverage)</span>
                        <span style={{ color: onRaised('subtext1') }}>{sum.coveragePct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-pill bg-ink-2">
                        <div className="h-full rounded-pill" style={{ width: `${sum.coveragePct}%`, background: cat('teal') }} />
                      </div>
                    </div>
                    {sum.counts.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {sum.counts.map((c) => (
                          <span key={c.label} className="inline-flex items-center gap-1 rounded-pill bg-ink-2 px-2 py-0.5 text-label text-fg-1">
                            {c.label} <span className="font-medium text-fg-1">{c.count}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-label text-fg-2">{sum.totalRecords} records across {sum.counts.length} {sum.counts.length === 1 ? 'domain' : 'domains'} · coverage is how many days in your tracked span have at least one record.</p>
                  </Card>
            )
          })()}
          </MasonryGrid>
        </TabsContent>
        </div>
      </Tabs>
    </Page>
  )
}

/** A labeled settings row: label on the left, control on the right. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-body text-fg-1">{label}</span>
      {children}
    </div>
  )
}

/**
 * The local model the Talk panel can fall back to.
 *
 * It lives beside the weather toggle because they are the same kind of decision
 * — "may this app talk to something outside itself" — and the answer here is
 * narrower: **only to this machine**. `lib/voice/model.ts` refuses any other
 * host outright rather than warning about it, so this form cannot be used to
 * point a health journal at someone else's server.
 *
 * The model list is fetched rather than typed. A field asking a person to spell
 * `llama3.1:8b` from memory is a field that mostly holds typos, and the server
 * already knows the answer.
 */
function VoiceModelCard() {
  const { data, setSettings } = useJournal()
  const vm = data.settings.voiceModel ?? {}
  const endpoint = vm.endpoint ?? DEFAULT_ENDPOINT
  const [models, setModels] = useState<string[] | null>(null)
  const [checking, setChecking] = useState(false)
  const local = isLocalEndpoint(endpoint)

  async function check() {
    setChecking(true)
    try { setModels(await listModels(endpoint)) } finally { setChecking(false) }
  }

  return (
    <Card band title="Local model" subtitle="Understands the sentences the Talk panel's own rules miss">
      <div className="space-y-3">
        <Toggle
          label="Use a model on this machine"
          on={vm.enabled === true}
          onChange={(v) => setSettings({ voiceModel: { ...vm, enabled: v } })}
        />
        <p className="text-label text-fg-2">
          Off by default, and only ever a fallback: a sentence the app already understands never waits for a model.
          It proposes — you still confirm before anything is saved.
        </p>

        {vm.enabled && (
          <div className="space-y-3 border-t border-line pt-3">
            <Row label="Server">
              <input
                value={endpoint}
                onChange={(e) => setSettings({ voiceModel: { ...vm, endpoint: e.target.value } })}
                placeholder={DEFAULT_ENDPOINT}
                className="w-56 rounded-control border border-ctl-ring bg-ink-2 px-2 py-1.5 text-body text-fg-1"
              />
            </Row>
            {!local && (
              <p className="text-label" style={{ color: onRaised('red') }}>
                That is not this machine, so it will not be used. Only localhost and 127.0.0.1 are allowed —
                a journal of health data does not get a field that can send it anywhere.
              </p>
            )}
            <Row label="Model">
              {models && models.length > 0 ? (
                <select
                  value={vm.model ?? DEFAULT_MODEL}
                  onChange={(e) => setSettings({ voiceModel: { ...vm, model: e.target.value } })}
                  className="w-56 rounded-control border border-ctl-ring bg-ink-2 px-2 py-1.5 text-body text-fg-1"
                >
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <input
                  value={vm.model ?? DEFAULT_MODEL}
                  onChange={(e) => setSettings({ voiceModel: { ...vm, model: e.target.value } })}
                  className="w-56 rounded-control border border-ctl-ring bg-ink-2 px-2 py-1.5 text-body text-fg-1"
                />
              )}
            </Row>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={check} disabled={checking || !local}>
                {checking ? 'Looking…' : 'Find models'}
              </Button>
              {models && (
                <span className="text-label text-fg-2">
                  {models.length > 0
                    ? `${models.length} model${models.length === 1 ? '' : 's'} on this machine`
                    : 'Nothing answered — is Ollama running?'}
                </span>
              )}
            </div>
            <p className="text-label text-fg-3">
              Built against Ollama&apos;s API. Anything speaking it works; nothing leaves this machine either way.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex w-full cursor-pointer items-center justify-between text-body text-fg-1">
      <span>{label}</span>
      <Switch checked={on} onCheckedChange={onChange} />
    </label>
  )
}



/** Encrypt the journal at rest behind a passcode (Web Crypto, local-only). */
function PasscodeCard() {
  const confirm = useConfirm()
  const { setPasscode, encrypted } = useJournal()
  const [pc, setPc] = useState('')
  const [pc2, setPc2] = useState('')
  const [err, setErr] = useState('')
  function enable() {
    if (pc.length < 4) { setErr('Use at least 4 characters.'); return }
    if (pc !== pc2) { setErr('Passcodes don’t match.'); return }
    setPasscode(pc); setPc(''); setPc2(''); setErr('')
  }
  return (
    <Card band title="Passcode lock" subtitle="Encrypt this journal at rest (Web Crypto, stays on this device)">
      {encrypted ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-green/30 bg-green/10 px-3 py-1.5 text-body text-green">🔒 Journal is encrypted</span>
          <Button variant="danger" onClick={async () => { if (await confirm({
            title: 'Remove the passcode?',
            description: 'The journal will be stored unencrypted on this device. Anyone with access to this browser can read it.',
            confirmLabel: 'Remove passcode', destructive: true,
          })) setPasscode(null) }}>Remove passcode</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input type="password" value={pc} onChange={(e) => setPc(e.target.value)} placeholder="New passcode" aria-label="New passcode" />
            <Input type="password" value={pc2} onChange={(e) => setPc2(e.target.value)} placeholder="Confirm passcode" aria-label="Confirm passcode" />
          </div>
          {err && <p className="text-label text-red">{err}</p>}
          <Button variant="secondary" onClick={enable}>Encrypt journal</Button>
          <p className="text-label text-fg-2">There is no recovery. If you forget the passcode the data cannot be decrypted, so keep a JSON export as a backup.</p>
        </div>
      )}
    </Card>
  )
}

/** Self-host sync: point at the Docker stack's now-SECURED PostgREST API. The
 *  journal is pulled on load and pushed on every change + on tab close (see
 *  ServerSync). The API requires HTTPS + a Bearer JWT (role=bujo_user,
 *  sub=<this device id>); mint one with the helper in
 *  docs/security/postgrest-hardening.md. */
function SelfHostCard() {
  const confirm = useConfirm()
  const { data, setSettings, replaceAll } = useJournal()
  const s = data.settings
  const [msg, setMsg] = useState('')
  const configured = serverConfigured(s.selfHostUrl, s.selfHostToken)

  async function test() {
    if (!configured) { setMsg('Enter both an HTTPS URL and a Bearer token first.'); return }
    const ok = await pushJournalToServer(s.selfHostUrl ?? '', data, s.selfHostToken)
    setMsg(ok ? 'Pushed to the server.' : 'Could not reach the server (check URL, token, and TLS cert).')
  }
  async function pull() {
    if (!configured) { setMsg('Enter both an HTTPS URL and a Bearer token first.'); return }
    const r = await pullJournalFromServer(s.selfHostUrl ?? '', s.selfHostToken)
    if (r && await confirm({
      title: 'Load the server copy onto this device?',
      description: 'Everything currently on this device is replaced by the copy on your server.',
      confirmLabel: 'Load from server', destructive: true,
    })) { replaceAll(migrate(r)); setMsg('Loaded from the server.') }
    else setMsg(r ? 'Cancelled.' : 'Nothing on the server yet (or auth failed).')
  }

  return (
    <Card band title="Self-host sync" subtitle="Sync your journal with your own secured PostgREST API (the Docker stack)">
      <div className="space-y-2">
        <label className="block text-body text-fg-1">API URL
          <Input value={s.selfHostUrl ?? ''} onChange={(e) => setSettings({ selfHostUrl: e.target.value || undefined })} placeholder="https://localhost:8443" className="mt-1" />
        </label>
        <label className="block text-body text-fg-1">Bearer token <span className="text-fg-2">(HS256 JWT · required)</span>
          <Input value={s.selfHostToken ?? ''} onChange={(e) => setSettings({ selfHostToken: e.target.value || undefined })} placeholder="paste your minted JWT (role=bujo_user, sub=device id)" className="mt-1" />
        </label>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={test}>Test / Push now</Button>
          <Button variant="secondary" onClick={pull}>Pull from server</Button>
        </div>
        {msg && <p className="text-label text-fg-2">{msg}</p>}
        <p className="text-label text-fg-2">The API is secured: use the <code>https://…:8443</code> origin and paste a minted JWT (see docs/security/postgrest-hardening.md). Once set, the journal auto-syncs on change, on tab close, and pulls on load. Run the stack with <code>docker compose up -d</code>.</p>
      </div>
    </Card>
  )
}
