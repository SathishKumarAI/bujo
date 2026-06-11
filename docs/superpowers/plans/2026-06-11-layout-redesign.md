# Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `bujo` app shell and reflow all 13 views onto a unified, responsive layout with one control vocabulary (shadcn/ui re-themed to Catppuccin), keeping all journal logic and tests unchanged.

**Architecture:** A new presentation layer (`components/shell/`) wraps the existing `view` switch in `App.tsx`: a sticky `TopBar` (title · contextual date-nav · quick-add · ⌘K · overflow menu), a rebuilt `Sidebar`, a shared `DateCursor` context so the top bar can drive each date view, a `viewChrome` registry, and a `<Page>` grid primitive every view opts into. shadcn primitives install into `components/ui/` and are mapped onto existing Catppuccin theme tokens; `ui.tsx` becomes thin wrappers so current imports keep working (wrap + gradual migration).

**Tech Stack:** Vite 8 · React 19 · TypeScript (strict) · Tailwind CSS v4 (CSS-vars, no config file) · shadcn/ui + Radix · lucide-react · Recharts (lazy) · vitest.

**Spec:** `docs/superpowers/specs/2026-06-11-layout-redesign-design.md`

**Conventions for this plan**
- This is presentation/IA work. "Tests" for each task = (a) `npm test` stays green (logic untouched), (b) `npm run build` type-checks + builds, (c) chrome-devtools MCP screenshot confirms the visual. Do NOT fabricate pixel unit tests.
- Dev server: `npm run dev` (http://localhost:5173). Seed + bypass Welcome with `?demo=1`. Switch view with `?view=<id>`.
- Commit after every task. Keep TypeScript strict; no `any`.
- Budget gate: after Phase 0 and at the end, `npm run build` and confirm the initial JS chunk stays **< 200 KB gzip** (current ~80 KB).

---

## File structure (created / modified)

**Created**
- `components.json` — shadcn config (Tailwind v4, CSS vars, alias `@/`).
- `src/lib/cn.ts` — `cn()` class-merge helper (clsx + tailwind-merge).
- `src/components/ui/button.tsx`, `switch.tsx`, `tabs.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `popover.tsx`, `separator.tsx`, `scroll-area.tsx`, `resizable.tsx`, `sonner.tsx` — shadcn primitives (generated, then re-themed).
- `src/components/shell/AppShell.tsx` — layout grid owner.
- `src/components/shell/Sidebar.tsx` — grouped, collapsible nav.
- `src/components/shell/TopBar.tsx` — sticky header.
- `src/components/shell/viewChrome.ts` — per-view title/subtitle/date-nav descriptor.
- `src/components/shell/cursor.tsx` — `DateCursor` context (shared day/month state).
- `src/components/shell/Page.tsx` — responsive `main`/`aside` grid + segmented control vocabulary helper.
- `docs/redesign/00-overview.mdx` … `05-before-after.mdx` — MDX rationale.

**Modified**
- `src/index.css` — add shadcn CSS-var aliases mapped to Catppuccin (Mocha + Latte).
- `src/components/ui.tsx` — `Card`/`Button`/`Input`/`Textarea`/`Slider` become wrappers over shadcn primitives (same public props).
- `src/App.tsx` — render `AppShell`; remove floating undo/redo + zoom clusters; pass cursor + chrome.
- `src/views/Today.tsx` — dashboard reflow; consume `DateCursor` instead of local `useState`.
- `src/views/Monthly.tsx`, `Trackers.tsx`, `Cycle.tsx` — consume `DateCursor` for their month/day cursor; adopt `<Page>`.
- `src/views/Settings.tsx`, `Fitness.tsx`, `Gym.tsx`, `Insights.tsx`, `Stats.tsx`, `Collections.tsx`, `Plan.tsx`, `NoFap.tsx`, `Help.tsx` — adopt `<Page>` + unified controls.
- `package.json` — new deps (added by shadcn).
- Docs: `FRONTEND_SPEC.md`, `ARCHITECTURE.md`, `FEATURES.md`, `DECISIONS.md`, `TICKETS.md`, `WORKLOG.md`.

---

## Phase 0 — shadcn + Catppuccin substrate

### Task 0.1: Baseline the bundle budget

- [ ] **Step 1: Build and record current gzip size**

Run: `npm run build`
Expected: build succeeds. Note the largest entry chunk gzip size from the output table (baseline ≈ 80 KB). Record it in the commit message.

- [ ] **Step 2: Run the test suite to capture a green baseline**

Run: `npm test`
Expected: all suites pass.

- [ ] **Step 3: Commit the baseline note** (no code change yet — skip if nothing to commit)

### Task 0.2: Add `cn()` helper + deps

**Files:** Create `src/lib/cn.ts`. Modify `package.json` (via install).

- [ ] **Step 1: Install the merge helpers**

Run: `npm i clsx tailwind-merge class-variance-authority`
Expected: installs without peer-dep errors.

- [ ] **Step 2: Write `src/lib/cn.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely (later classes win on conflict). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: builds (cn.ts unused yet is fine — it's exported).

- [ ] **Step 4: Commit**

```bash
git add src/lib/cn.ts package.json package-lock.json
git commit -m "build: add cn() class-merge helper + clsx/tailwind-merge/cva"
```

### Task 0.3: Configure shadcn for Tailwind v4 + path alias

**Files:** Create `components.json`. Modify `vite.config.ts`, `tsconfig.app.json` (add `@/*` alias).

- [ ] **Step 1: Add the `@/` path alias to `tsconfig.app.json`**

Under `compilerOptions`, add:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 2: Add the matching Vite resolve alias in `vite.config.ts`**

Add `import { fileURLToPath, URL } from 'node:url'` and inside the config object:

```ts
resolve: {
  alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
},
```

- [ ] **Step 3: Create `components.json`** (Tailwind v4, CSS vars, no tailwind config)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/cn",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 4: Verify the alias resolves**

Run: `npm run build`
Expected: builds. If `@/` fails to resolve, re-check Steps 1–2.

- [ ] **Step 5: Commit**

```bash
git add components.json vite.config.ts tsconfig.app.json
git commit -m "build: configure shadcn (tailwind v4, css vars) + @/ alias"
```

### Task 0.4: Map shadcn CSS variables onto Catppuccin

shadcn primitives reference semantic vars (`--background`, `--foreground`, `--primary`, `--border`, `--ring`, …). Map them to existing Catppuccin tokens so there is **zero color regression**.

**Files:** Modify `src/index.css`.

- [ ] **Step 1: Add a `:root` semantic-alias block** right after the `@theme { … }` block (these reference the Catppuccin Mocha values):

```css
/* shadcn semantic aliases → Catppuccin. Dark (Mocha) defaults. */
:root {
  --background: var(--color-base);
  --foreground: var(--color-text);
  --card: var(--color-mantle);
  --card-foreground: var(--color-text);
  --popover: var(--color-mantle);
  --popover-foreground: var(--color-text);
  --primary: var(--color-mauve);
  --primary-foreground: var(--color-crust);
  --secondary: var(--color-surface0);
  --secondary-foreground: var(--color-text);
  --muted: var(--color-surface0);
  --muted-foreground: var(--color-subtext0);
  --accent: var(--color-surface1);
  --accent-foreground: var(--color-text);
  --destructive: var(--color-red);
  --destructive-foreground: var(--color-crust);
  --border: var(--color-surface0);
  --input: var(--color-surface1);
  --ring: var(--color-mauve);
  --radius: 0.75rem;
}
```

- [ ] **Step 2: Register the aliases as Tailwind theme colors** so `bg-background`, `text-foreground`, `border-border` etc. exist. Add inside the existing `@theme` block (so utilities are generated):

```css
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-popover: var(--popover);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-lg: var(--radius);
```

- [ ] **Step 3: Latte already overrides the Catppuccin vars** (`:root[data-theme='latte']`) so the semantic aliases inherit light values automatically — no extra Latte block needed. Verify by reading the existing `:root[data-theme='latte']` block; do not duplicate.

- [ ] **Step 4: Type-check + visual smoke**

Run: `npm run build` (expected: pass).
Then `npm run dev`, screenshot `http://localhost:5173/?demo=1&view=today` via chrome-devtools — colors must look identical to before (no regression).

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "style: map shadcn semantic css vars onto Catppuccin tokens"
```

### Task 0.5: Generate the primitive set

**Files:** Create `src/components/ui/*.tsx` (generated).

- [ ] **Step 1: Add primitives via the shadcn CLI**

Run: `npx shadcn@latest add button switch tabs dialog dropdown-menu tooltip popover separator scroll-area resizable sonner --yes`
Expected: files land in `src/components/ui/`; Radix deps install into `package.json`.

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: builds. Fix any import path that didn't use `@/lib/cn`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui package.json package-lock.json
git commit -m "feat: add shadcn primitives (button/switch/tabs/dialog/menu/etc.)"
```

---

## Phase 1 — `ui.tsx` wrappers (no view changes)

Make the bespoke primitives delegate to shadcn so every existing `import { Card, Button } from '../components/ui'` keeps working but renders the new substrate. Public props unchanged.

### Task 1.1: Wrap `Button`

**Files:** Modify `src/components/ui.tsx`.

- [ ] **Step 1:** Replace the `Button` implementation, mapping the old `variant` union onto shadcn variants while keeping the same props signature:

```tsx
import { Button as SButton } from './ui/button'
// ...
export function Button({
  children, onClick, variant = 'ghost', type = 'button',
  className = '', title, 'aria-label': ariaLabel,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  className?: string
  title?: string
  'aria-label'?: string
}) {
  const v = variant === 'primary' ? 'default' : variant === 'danger' ? 'ghost' : 'secondary'
  return (
    <SButton
      type={type}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      variant={v}
      className={cn('press-3d', variant === 'danger' && 'text-red hover:text-red', className)}
    >
      {children}
    </SButton>
  )
}
```

(Add `import { cn } from '../lib/cn'` at the top.)

- [ ] **Step 2: Tests + build**

Run: `npm test && npm run build`
Expected: green + builds.

- [ ] **Step 3: Visual check** — screenshot `?demo=1&view=today`; buttons (Add, Today, ←/→) must look right and press.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui.tsx
git commit -m "refactor: Button delegates to shadcn (props unchanged)"
```

### Task 1.2: Keep `Card`/`Input`/`Textarea`/`Slider`/`Pill`/`Empty` as-is, but tokenize

These already use Catppuccin classes and render fine. To unify, swap raw color classes for the new semantic ones where it doesn't change appearance.

- [ ] **Step 1:** In `Card`, change `border-surface0 bg-mantle` → `border-border bg-card` (identical values, semantic names). Leave `card-3d` and padding.

- [ ] **Step 2:** In `Input`/`Textarea`, change `border-surface1` → `border-input`, `bg-base` → `bg-background`, focus ring `ring-mauve` → `ring-ring`. Identical values.

- [ ] **Step 3: Tests + build + visual**

Run: `npm test && npm run build`
Expected: green; screenshot unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui.tsx
git commit -m "refactor: tokenize ui.tsx primitives onto semantic vars"
```

---

## Phase 2 — App shell

### Task 2.1: Shared `DateCursor` context

The top bar must drive the active date view. Lift the day/month cursor out of individual views into one context.

**Files:** Create `src/components/shell/cursor.tsx`.

- [ ] **Step 1: Write the context + provider + hook**

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react'
import { todayISO } from '../../lib/date'

interface Cursor {
  /** ISO day for day-views (Today). */
  day: string
  setDay: (d: string) => void
  /** YYYY-MM for month-views (Monthly, Trackers, Cycle). */
  month: string
  setMonth: (m: string) => void
}

const Ctx = createContext<Cursor | null>(null)

export function CursorProvider({ children }: { children: ReactNode }) {
  const [day, setDay] = useState(todayISO())
  const [month, setMonth] = useState(() => todayISO().slice(0, 7))
  return <Ctx.Provider value={{ day, setDay, month, setMonth }}>{children}</Ctx.Provider>
}

export function useCursor() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCursor must be used within CursorProvider')
  return c
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: builds (unused until wired).

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/cursor.tsx
git commit -m "feat: shared DateCursor context for top-bar date-nav"
```

### Task 2.2: `viewChrome` registry

**Files:** Create `src/components/shell/viewChrome.ts`.

- [ ] **Step 1: Write the descriptor map.** Titles/subtitles move out of views into one place; `dateNav` declares which cursor the top bar drives.

```ts
export type ViewId =
  | 'today' | 'monthly' | 'trackers' | 'fitness' | 'gym' | 'plan' | 'collections'
  | 'insights' | 'stats' | 'cycle' | 'nofap' | 'help' | 'settings'

export interface ViewChrome {
  title: string
  subtitle?: string
  dateNav?: 'day' | 'month'
}

export const VIEW_CHROME: Record<ViewId, ViewChrome> = {
  today: { title: 'Today', subtitle: 'Your daily log', dateNav: 'day' },
  monthly: { title: 'Monthly', subtitle: 'Events show as dots', dateNav: 'month' },
  trackers: { title: 'Trackers', subtitle: 'Tap a cell to mark the day', dateNav: 'month' },
  fitness: { title: 'Fitness', subtitle: 'Workout log & totals' },
  gym: { title: 'Gym', subtitle: 'Sessions & exercises' },
  plan: { title: 'Plan', subtitle: 'Recurring tasks & routines' },
  collections: { title: 'Collections', subtitle: 'Future log & lists' },
  insights: { title: 'Insights', subtitle: 'Streaks, search & reflection' },
  stats: { title: 'Stats', subtitle: 'Charts at a glance' },
  cycle: { title: 'Cycle', subtitle: 'Temperature & phase', dateNav: 'month' },
  nofap: { title: 'Streak', subtitle: 'Abstinence journal' },
  help: { title: 'Help', subtitle: 'Guide & bullet legend' },
  settings: { title: 'Settings', subtitle: 'Theme, profile, data' },
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/components/shell/viewChrome.ts
git commit -m "feat: viewChrome registry (titles + date-nav descriptors)"
```

### Task 2.3: `<Page>` grid primitive

**Files:** Create `src/components/shell/Page.tsx`.

- [ ] **Step 1: Write the responsive main/aside grid.** `aside` sits beside `main` at `xl` and wraps under it below — no dead void.

```tsx
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Page layout. `aside` (optional) sits in a right rail at xl and wraps under
 * `main` at narrower widths. Width is capped for readable line lengths.
 */
export function Page({
  children, aside, className = '',
}: {
  children: ReactNode
  aside?: ReactNode
  className?: string
}) {
  if (!aside) {
    return <div className={cn('mx-auto w-full max-w-6xl', className)}>{children}</div>
  }
  return (
    <div className={cn('mx-auto grid w-full max-w-[1400px] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]', className)}>
      <div className="min-w-0 space-y-5">{children}</div>
      <aside className="space-y-5">{aside}</aside>
    </div>
  )
}
```

- [ ] **Step 2: Build + commit**

```bash
npm run build
git add src/components/shell/Page.tsx
git commit -m "feat: Page grid primitive (main + wrapping aside)"
```

### Task 2.4: `Sidebar`

Extract the existing sidebar markup from `App.tsx` into a component, keeping grouped nav + gating + collapse, on the new tokens.

**Files:** Create `src/components/shell/Sidebar.tsx`.

- [ ] **Step 1:** Move the `<nav>…</nav>` block from `App.tsx` (lines ~111–168) into `Sidebar.tsx` as a component with this signature, replacing `surface0/mantle` with `border/card` semantic classes:

```tsx
import type { LucideIcon } from 'lucide-react'
import type { ViewId } from './viewChrome'

export interface NavItem { id: ViewId; label: string; icon: LucideIcon; group: string }

export function Sidebar({
  items, groupOrder, view, collapsed, navOpen,
  onNavigate, onToggleCollapse,
}: {
  items: NavItem[]
  groupOrder: string[]
  view: ViewId
  collapsed: boolean
  navOpen: boolean
  onNavigate: (id: ViewId) => void
  onToggleCollapse: () => void
}) {
  // (same markup as the current App.tsx nav, with onNavigate(n.id) on click
  //  and onToggleCollapse for the pin button; swap bg-mantle→bg-card,
  //  border-surface0→border-border. Keep aria-current + accent rail.)
}
```

Keep the exact JSX from `App.tsx` for the nav; only the props wiring and token names change.

- [ ] **Step 2:** In `App.tsx`, import and render `<Sidebar … />`, deleting the inlined nav.

- [ ] **Step 3: Build + tests + visual**

Run: `npm run build && npm test`
Expected: green. Screenshot `?demo=1&view=today` — sidebar identical, nav works.

- [ ] **Step 4: Commit**

```bash
git add src/components/shell/Sidebar.tsx src/App.tsx
git commit -m "refactor: extract Sidebar from App, tokenize"
```

### Task 2.5: `TopBar`

**Files:** Create `src/components/shell/TopBar.tsx`.

- [ ] **Step 1: Write the sticky bar.** Title/subtitle from `viewChrome`; date-nav rendered only when `dateNav` is set, driving `useCursor`; right side: Quick Add (opens a dialog), ⌘K trigger, overflow menu (theme/zoom/undo/redo/toggles).

```tsx
import { ChevronLeft, ChevronRight, Plus, Command, MoreHorizontal } from 'lucide-react'
import { Button } from '../ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import { useJournal } from '../../store'
import { useCursor } from './cursor'
import { VIEW_CHROME, type ViewId } from './viewChrome'
import { addDays, prettyDay, monthLabel, addMonths, todayISO } from '../../lib/date'

export function TopBar({
  view, onQuickAdd, onCommand,
}: {
  view: ViewId
  onQuickAdd: () => void
  onCommand: () => void
}) {
  const { data, setSettings, undo, redo, canUndo, canRedo } = useJournal()
  const { day, setDay, month, setMonth } = useCursor()
  const chrome = VIEW_CHROME[view]
  const zoom = data.settings.zoom ?? 1
  const clamp = (z: number) => Math.min(1.5, Math.max(0.7, Math.round(z * 100) / 100))

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-2.5 backdrop-blur">
      <div className="min-w-0">
        <h1 className="font-display text-lg font-semibold leading-tight text-foreground">{chrome.title}</h1>
        {chrome.subtitle && <p className="truncate text-xs text-muted-foreground">{chrome.subtitle}</p>}
      </div>

      {chrome.dateNav && (
        <div className="ml-2 flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Previous"
            onClick={() => chrome.dateNav === 'day' ? setDay(addDays(day, -1)) : setMonth(addMonths(month, -1))}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="secondary" size="sm"
            onClick={() => chrome.dateNav === 'day' ? setDay(todayISO()) : setMonth(todayISO().slice(0, 7))}>
            {chrome.dateNav === 'day' ? prettyDay(day) : monthLabel(month)}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Next"
            onClick={() => chrome.dateNav === 'day' ? setDay(addDays(day, 1)) : setMonth(addMonths(month, 1))}>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="default" size="sm" onClick={onQuickAdd} className="gap-1.5">
          <Plus size={15} /> Quick add
        </Button>
        <Button variant="ghost" size="icon" aria-label="Command palette (⌘K)" onClick={onCommand}>
          <Command size={16} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More"><MoreHorizontal size={16} /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setSettings({ theme: data.settings.theme === 'mocha' ? 'latte' : 'mocha' })}>
              {data.settings.theme === 'mocha' ? 'Light theme' : 'Dark theme'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSettings({ zoom: clamp(zoom - 0.1) })}>Zoom out</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettings({ zoom: 1 })}>Reset zoom ({Math.round(zoom * 100)}%)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettings({ zoom: clamp(zoom + 0.1) })}>Zoom in</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!canUndo} onClick={undo}>Undo</DropdownMenuItem>
            <DropdownMenuItem disabled={!canRedo} onClick={redo}>Redo</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSettings({ paperMode: !data.settings.paperMode })}>Toggle paper</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettings({ handwriting: !data.settings.handwriting })}>Toggle handwriting</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettings({ bookMode: !data.settings.bookMode })}>Toggle book frame</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Add the two date helpers** to `src/lib/date.ts` if missing: `addMonths(ym: string, n: number): string` and `monthLabel(ym: string): string`. Check first with `grep -n "addMonths\|monthLabel" src/lib/date.ts`. If absent, add:

```ts
/** Shift a YYYY-MM string by n months. */
export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
/** "June 2026" from YYYY-MM. */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
```

If `addMonths`/`monthLabel` already exist under other names, reuse them and adjust the import in `TopBar.tsx`.

- [ ] **Step 3: Confirm `Button` from `ui/button` supports `size="icon"|"sm"`** (shadcn default does). Build.

Run: `npm run build`
Expected: builds.

- [ ] **Step 4: Commit**

```bash
git add src/components/shell/TopBar.tsx src/lib/date.ts
git commit -m "feat: sticky TopBar (title, hoisted date-nav, quick-add, menu)"
```

### Task 2.6: `AppShell` + rewire `App.tsx`

**Files:** Create `src/components/shell/AppShell.tsx`; modify `src/App.tsx`.

- [ ] **Step 1: Write `AppShell`** owning the grid (sidebar + (topbar/content)) and the global quick-add dialog state:

```tsx
import { useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Sidebar, type NavItem } from './Sidebar'
import { TopBar } from './TopBar'
import { QuickAdd } from '../QuickAdd'
import { useCursor } from './cursor'
import type { ViewId } from './viewChrome'

export function AppShell({
  items, groupOrder, view, collapsed, onNavigate, onToggleCollapse, onCommand, children,
}: {
  items: NavItem[]
  groupOrder: string[]
  view: ViewId
  collapsed: boolean
  onNavigate: (id: ViewId) => void
  onToggleCollapse: () => void
  onCommand: () => void
  children: ReactNode
}) {
  const [quickOpen, setQuickOpen] = useState(false)
  const { day } = useCursor()
  const [navOpen, setNavOpen] = useState(false)
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        items={items} groupOrder={groupOrder} view={view} collapsed={collapsed}
        navOpen={navOpen} onNavigate={(id) => { onNavigate(id); setNavOpen(false) }}
        onToggleCollapse={onToggleCollapse}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar view={view} onQuickAdd={() => setQuickOpen(true)} onCommand={onCommand} />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Quick add</DialogTitle></DialogHeader>
          <QuickAdd date={day} onAdded={() => setQuickOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 2: Extend `QuickAdd`** to accept an optional `onAdded` callback (close the dialog after submit). In `src/components/QuickAdd.tsx`, add `onAdded?: () => void` to props and call it after `addEntry(date, val); setVal('')`.

- [ ] **Step 3: Rewrite `App.tsx`'s return** to use `AppShell`, removing: the inlined `<nav>`, the mobile `<header>`, the floating undo/redo cluster, and the floating `ZoomControl`. Keep: `Welcome` gate, `CommandPalette` (now opened via a `ref`/state passed as `onCommand`), `ReminderBanner`, the `book`/`zoom` wrappers around `<Current/>`. Wrap the tree in `CursorProvider`. Sketch:

```tsx
return (
  <CursorProvider>
    <CommandPalette ref={paletteRef} onNavigate={(id) => setView(id as ViewId)} navItems={items.map((n) => ({ id: n.id, label: n.label }))} />
    <ReminderBanner />
    <AppShell
      items={items} groupOrder={GROUP_ORDER} view={view} collapsed={collapsed}
      onNavigate={setView} onToggleCollapse={() => setSettings({ sidebarCollapsed: !collapsed })}
      onCommand={() => paletteRef.current?.open()}
    >
      <div className="mx-auto max-w-[1600px]" style={{ zoom }}>
        <Suspense fallback={<p className="py-10 text-center text-muted-foreground">Loading…</p>}>
          {book ? <div className="book"><div key={view} className="book-inner page-in"><Current /></div></div>
                : <div key={view} className="page-in"><Current /></div>}
        </Suspense>
      </div>
    </AppShell>
  </CursorProvider>
)
```

- [ ] **Step 4: Make `CommandPalette` open via a ref** — convert it to expose an imperative `open()` via `forwardRef`/`useImperativeHandle`, OR (simpler) lift its `open` state into `App.tsx` and pass `open`/`onOpenChange` props. Choose the lift: add `open: boolean; onOpenChange: (o:boolean)=>void` props to `CommandPalette`, remove its internal `open` state, keep the ⌘K listener calling `onOpenChange(!open)`. Update `App.tsx` to own `const [paletteOpen, setPaletteOpen] = useState(false)` and pass `onCommand={() => setPaletteOpen(true)}`.

- [ ] **Step 5: Build + tests + visual**

Run: `npm run build && npm test`
Expected: green. Screenshot `?demo=1&view=today` and `&view=monthly`: top bar present, date-nav drives the view, quick-add dialog opens, ⌘K works, no floating clusters.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/shell/AppShell.tsx src/components/QuickAdd.tsx src/components/CommandPalette.tsx
git commit -m "feat: AppShell wires TopBar+Sidebar; remove floating controls"
```

---

## Phase 3 — Today dashboard reflow (showcase)

### Task 3.1: Consume cursor + reflow Today

**Files:** Modify `src/views/Today.tsx`.

- [ ] **Step 1: Replace local date state** — delete `const [date, setDate] = useState(todayISO())` and the in-card `right={…}` date buttons (now in the top bar). Read the date from the cursor:

```tsx
import { useCursor } from '../components/shell/Page' // re-export, or '../components/shell/cursor'
// ...
const { day: date } = useCursor()
```

- [ ] **Step 2: Reflow with `<Page>`.** Wrap content: `main` = capture + daily log card (above fold) + a 2-col grid (`sm:grid-cols-2`) for Gratitude / Daily memory / Reflection / Stickers; `aside` = Wellbeing + On-this-day. Remove the bespoke `lg:grid-cols-3` wrapper. The card bodies stay identical — only the container changes:

```tsx
return (
  <Page
    aside={
      <>
        <Card title="Wellbeing" subtitle="Rate today 0–10">{/* unchanged body */}</Card>
        {hasFlash && <Card title="On this day" subtitle="From earlier in your journal">{/* unchanged */}</Card>}
      </>
    }
  >
    <Card title={prettyDay(date)} subtitle={/* weather span, no date buttons */}>
      <QuickAdd date={date} />
      {/* carryover + entries unchanged */}
    </Card>
    <div className="grid gap-5 sm:grid-cols-2">
      <Card title="Gratitude" /* unchanged */ />
      <Card title="Daily memory" /* unchanged */ />
      {data.settings.reflectionPrompts && <Card title="Reflection" /* unchanged */ />}
      <Card title="Stickers" /* unchanged */ />
    </div>
  </Page>
)
```

- [ ] **Step 3: Build + tests + visual (before/after).** Capture `?demo=1&view=today` at 1440px. Confirm: no right-side void, daily log above fold, secondary cards in a balanced 2-col grid.

Run: `npm run build && npm test`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add src/views/Today.tsx src/components/shell/Page.tsx
git commit -m "feat: Today dashboard reflow on Page grid + cursor"
```

---

## Phase 4 — Remaining views

Each task is the same mechanical pattern: (1) if the view owned a month/day cursor, consume `useCursor` instead; (2) drop the in-view date buttons + the duplicated title/subtitle (now in the top bar) — keep the `<Card>` only where it groups content; (3) wrap the body in `<Page>` (with `aside` where there was a right rail); (4) replace ad-hoc toggles/segmented controls with the vocabulary rule: **on/off → shadcn `Switch`; mutually-exclusive enum → segmented `Tabs`**. Build + test + screenshot + commit per view.

### Task 4.1: Monthly
- [ ] Consume `useCursor().month`/`setMonth`; remove in-view month buttons + title. Wrap calendar in `<Page aside={<>Location, Goals, Photo cards</>}>`. Build/test/screenshot `?view=monthly`. Commit `"feat: Monthly on Page grid + cursor"`.

### Task 4.2: Trackers
- [ ] Consume `useCursor().month`; remove in-view month nav + title. Wrap in `<Page>` (full-width, no aside); fix the `%` column right gutter (add `pr-2`). Keep the lazy chart. Build/test/screenshot. Commit `"feat: Trackers on Page grid + cursor"`.

### Task 4.3: Settings
- [ ] Wrap in `<Page>`; make the card grid equal-height (`grid auto-rows-fr gap-5 lg:grid-cols-3`). Convert the on/off rows (cycle tracker, nofap, paper, handwriting, reflection, reminder, weather) to `Switch`; keep enum choices (theme, weight/distance/temp unit, week-start) as segmented `Tabs`. Build/test/screenshot. Commit `"feat: Settings unified controls + equal-height grid"`.

### Task 4.4: Cycle
- [ ] Consume `useCursor().month`; remove in-view nav/title; `<Page>` wrap. Build/test/screenshot (enable via Settings → Cycle). Commit `"feat: Cycle on Page grid + cursor"`.

### Task 4.5: Fitness, Gym, Insights, Stats, Collections, Plan, NoFap, Help
- [ ] For each: remove the duplicated view title/subtitle, wrap body in `<Page>` (use `aside` only where a genuine secondary rail exists — Insights search/streak summary, otherwise full-width), apply the control vocabulary. One commit per view: `"feat: <View> on Page grid"`. Build + test + screenshot each at `?view=<id>`.

---

## Phase 5 — Docs (MDX) + updates + Help

### Task 5.1: Capture before/after screenshots
- [ ] Using chrome-devtools MCP at 1440×900, save paired shots into `docs/redesign/img/` for today, monthly, trackers, settings (before shots already exist in `docs/screenshot-*.png`; reference those as "before").

### Task 5.2: Write the MDX rationale set
**Files:** Create `docs/redesign/00-overview.mdx` … `05-before-after.mdx`.
- [ ] `00-overview.mdx` — goals, the 6 problems, the locked decisions table (from the spec).
- [ ] `01-audit.mdx` — the audit findings + before screenshots.
- [ ] `02-design-system.mdx` — shadcn adoption, Catppuccin var mapping, control vocabulary (Switch vs segmented), `cn()`.
- [ ] `03-shell.mdx` — AppShell/Sidebar/TopBar/cursor/viewChrome architecture + the date-nav hoist.
- [ ] `04-views.mdx` — `<Page>` grid + per-view reflow table.
- [ ] `05-before-after.mdx` — side-by-side images + bundle-budget result.
- [ ] Commit `"docs: redesign rationale in MDX"`.

### Task 5.3: Update existing docs
- [ ] `FRONTEND_SPEC.md` §3/§4/§6/§7 — new shell, `<Page>` grid, shadcn primitives, top-bar nav, control vocabulary.
- [ ] `ARCHITECTURE.md` — add the `components/shell/` layer + cursor context.
- [ ] `FEATURES.md` — note unified shell + quick-add-everywhere + consolidated controls.
- [ ] `DECISIONS.md` — new ADR: "Adopt shadcn/ui re-themed to Catppuccin (wrap + gradual)".
- [ ] `TICKETS.md` — add the redesign epic with the task list above (checked).
- [ ] Commit `"docs: update specs for layout redesign"`.

### Task 5.4: Update in-app Help view
- [ ] In `src/views/Help.tsx`, add a short section: top-bar controls (date-nav, quick-add, ⌘K, overflow menu) and where zoom/undo/theme moved. Build/screenshot. Commit `"docs: Help covers the new shell"`.

---

## Phase 6 — Final verification

### Task 6.1: Budget + tests + a11y pass
- [ ] **Step 1:** `npm run build` — confirm largest entry chunk gzip < 200 KB (compare to the Task 0.1 baseline; record the delta). If over, identify the heaviest new primitive and lazy-load or drop it.
- [ ] **Step 2:** `npm test` — all green.
- [ ] **Step 3:** chrome-devtools: tab through the top bar + sidebar — focus rings visible, `aria-current` on active nav, dialog/menu keyboard-operable, ⌘K + ⌘Z still work.
- [ ] **Step 4:** Toggle Latte theme via the top-bar menu — confirm no color regression in light mode.
- [ ] **Step 5: Final commit** `"chore: redesign final build + budget check"`.

### Task 6.2: Worklog
- [ ] Run the `/document` skill to append a dated entry to `docs/WORKLOG.md` summarizing the redesign.

---

## Self-review notes
- **Spec coverage:** §4 shell → Phase 2; §5 components → Phase 0–1; §6 views → Phase 3–4; §7 guardrails → Task 6.1; §8 docs → Phase 5. All covered.
- **Date-nav hoist (§4.1):** handled by `DateCursor` (Task 2.1) + `viewChrome.dateNav` (2.2) + TopBar wiring (2.5); views switch from local `useState` to `useCursor` (3.1, 4.1, 4.2, 4.4).
- **Type consistency:** `ViewId` defined once in `viewChrome.ts` and imported everywhere (App.tsx re-uses it); `NavItem` defined in `Sidebar.tsx`; `useCursor()` returns `{day,setDay,month,setMonth}` used identically in TopBar + views.
- **Budget risk:** flagged in Task 0.1 baseline + Task 6.1 gate, with rollback instruction.
