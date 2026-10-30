import { useState, type ReactNode } from 'react'
import { CaretDown, Minus, PushPin, PencilSimple, Plus, SlidersHorizontal, Trash } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Cells } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { DayStrip } from '../ui/dayStrip'
import { SearchField } from '../page'
import { useConfirm } from '../ConfirmDialog'
import { addDays, prettyDay } from '../../lib/date'
import { cat, onRaised } from '../../lib/colors'
import { MACROS, type Targets } from '../../lib/nutritionReview'
import { FOODS, foodMatches, type Food } from '../../lib/foods'
import type { DailyMetric, LoggedFood } from '../../lib/types'
import { FoodEditor } from './DayLog'

type Patch = Pick<LoggedFood, 'name' | 'kcal' | 'protein' | 'carbs' | 'fat'>

/**
 * NUTRITION ON A PHONE — the day as a scoreboard, food as rows, Add in a dock.
 *
 * OWNS: the phone drawing. The shared `DayStrip` picks the day; one card
 * shows calories against the ceiling and the three macros against theirs;
 * "Your usual" is one row per food with a + (one tap logs it); the day's
 * foods are rows that open in place to servings, edit and remove (Program's
 * row); the dock holds Targets and "Add food", whose sheet carries the whole
 * library, the online lookup, a food of your own and the typed totals.
 * DOES NOT OWN: any arithmetic or guard. Adding, editing and the 5,000 kcal
 * mis-tap check all stay in `views/Nutrition.tsx`, which hands them in — so a
 * phone tap and a desktop chip go through the same door.
 *
 * Charts (trend, calendar, patterns) are desktop-only: a phone logs.
 */
export function NutritionPhone({
  date, setDate, today, metricOn, targets, setTargets, usual, mine, pinned, onPin, calorie, streak,
  onAdd, onEdit, onRemove, onServings, extras,
}: {
  date: string
  setDate: (d: string) => void
  today: string
  /** The day's metric row, for the strip's totals. */
  metricOn: (d: string) => DailyMetric | undefined
  targets: Targets
  setTargets: (patch: Partial<Targets>) => void
  usual: Food[]
  /** Foods the person added themselves. */
  mine: Food[]
  /** Names pinned to the top of Your usual, and the toggle. */
  pinned: string[]
  onPin: (name: string) => void
  /** The view's one verdict on the calories: tone and sentence together. */
  calorie: { color: string; line: string }
  streak: number
  onAdd: (f: Food) => void | Promise<void>
  onEdit: (entry: LoggedFood, patch: Patch) => Promise<boolean> | boolean
  onRemove: (entry: LoggedFood) => void
  onServings: (entry: LoggedFood, servings: number) => void
  /** Under the library in the Add sheet: online lookup, a food of your own, typed totals. */
  extras: ReactNode
}) {
  const confirm = useConfirm()
  const [adding, setAdding] = useState(false)
  const [goals, setGoals] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [source, setSource] = useState<Source>('usual')
  const m = metricOn(date)
  const foods = m?.foodLog ?? []
  const kcal = m?.calories ?? 0
  const dayName = date === today ? 'Today' : date === addDays(today, -1) ? 'Yesterday' : prettyDay(date)
  const countOf = (f: Food) => foods.filter((x) => x.name === f.name).reduce((s, x) => s + (x.servings ?? 1), 0)
  const row = (f: Food) => <FoodRow key={f.name} food={f} n={countOf(f)} to={dayName} onAdd={onAdd} pinned={pinned.includes(f.name)} onPin={onPin} />
  const list = q.trim() ? FOODS.concat(mine).filter((f) => foodMatches(f, q)) : sourceList(source, usual, mine)
  const pct = (had: number, target: number) => (target > 0 ? Math.min(100, (had / target) * 100) : 0)

  return (
    <div className="flex flex-col gap-4 pb-2">
      <h1 className="sr-only">Nutrition</h1>

      {/* THE DAY: the shared strip, each chip with that day's calories. */}
      <DayStrip value={date} onChange={(d) => { setDate(d); setOpen(null); setEditing(null) }} today={today} label="Day to log"
        mark={(d) => { const c = metricOn(d)?.calories ?? 0; return c ? <>{c >= 1000 ? `${(c / 1000).toFixed(1)}k` : c}<span className="sr-only"> kcal</span></> : <span aria-hidden>·</span> }} />

      {/* THE SCOREBOARD: the ceiling, big, then the three macros under it. */}
      <section aria-label={`${dayName} so far`} className="cells px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="score-num text-fg-1">{kcal}</span>
          <span className="text-label text-fg-2">of {targets.calories} kcal · {dayName}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-pill bg-ink-2" role="progressbar" aria-label="Calories against target" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct(kcal, targets.calories))}>
          <div className="h-full rounded-pill transition-[width]" style={{ width: `${pct(kcal, targets.calories)}%`, background: cat(calorie.color) }} />
        </div>
        <p className="mt-1.5 text-label text-fg-2">
          {calorie.line}
          {streak > 1 && <span style={{ color: onRaised('green') }}> · {streak} days in target</span>}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
          {MACROS.map((mac) => {
            const had = m?.[mac.key] ?? 0
            const target = targets[mac.key]
            return (
              <div key={mac.key} className="min-w-0">
                <span className="block text-label text-fg-2">{mac.label}</span>
                <span className="block text-body font-semibold text-fg-1 tabular-nums">{had}<span className="font-normal text-fg-2">/{target} g</span></span>
                <div className="mt-1 h-1 overflow-hidden rounded-pill bg-ink-2" aria-hidden>
                  <div className="h-full rounded-pill" style={{ width: `${pct(had, target)}%`, background: cat(mac.color) }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ONE TAP LOGS IT: what you actually eat, from the fortnight. */}
      {usual.length > 0 && (
        <Cells title="Your usual" aside={pinned.length ? `${pinned.length} pinned` : "pin what you eat most"}>
          {usual.map(row)}
        </Cells>
      )}

      {/* THE DAY'S FOODS: a row each, opening in place to change it. */}
      <Cells title={`Logged ${dayName === 'Today' ? 'today' : `· ${dayName}`}`} aside={foods.length ? `${foods.length} item${foods.length === 1 ? '' : 's'}` : undefined}>
        {foods.length === 0 && <p className="cell text-label text-fg-2">Nothing yet. Tap + on a usual, or Add food.</p>}
        {foods.map((f) => {
          const isOpen = open === f.id
          const servings = f.servings ?? 1
          return (
            <div key={f.id} className="lift-row">
              <button type="button" className="cell" aria-expanded={isOpen} onClick={() => { setOpen(isOpen ? null : f.id); setEditing(null) }}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium text-fg-1">{f.name}{servings > 1 && <span className="font-normal text-fg-2"> ×{servings}</span>}</span>
                  <span className="block truncate text-label text-fg-2">{f.protein} g protein · {f.carbs} g carbs · {f.fat} g fat</span>
                </span>
                <span className="shrink-0 text-body font-semibold text-fg-1 tabular-nums">{f.kcal}<span className="text-label font-normal text-fg-2"> kcal</span></span>
                <Icon as={CaretDown} size="sm" className={`shrink-0 text-fg-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (editing === f.id ? (
                <div className="px-4 pb-3">
                  <FoodEditor entry={f} onCancel={() => setEditing(null)} onSave={async (p) => { if (await onEdit(f, p)) setEditing(null) }} />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 pb-3">
                  <button type="button" className="round-btn" aria-label={`One fewer serving of ${f.name}`} disabled={servings <= 1} onClick={() => onServings(f, servings - 1)}><Icon as={Minus} size="sm" /></button>
                  <output aria-live="polite" className="min-w-[2.5rem] text-center text-body font-semibold tabular-nums text-fg-1">×{servings}</output>
                  <button type="button" className="round-btn" aria-label={`One more serving of ${f.name}`} onClick={() => onServings(f, servings + 1)}><Icon as={Plus} size="sm" /></button>
                  <span className="flex-1" />
                  <button type="button" className="round-btn" aria-label={`Edit ${f.name}`} onClick={() => setEditing(f.id)}><Icon as={PencilSimple} size="sm" /></button>
                  <button type="button" className="round-btn" aria-label={`Remove ${f.name}`} onClick={async () => {
                    if (await confirm({
                      title: `Remove ${f.name}?`,
                      description: `${f.kcal} kcal comes back off ${dayName === 'Today' ? 'today' : dayName}.`,
                      confirmLabel: 'Remove it',
                      destructive: true,
                    })) { onRemove(f); setOpen(null) }
                  }}><Icon as={Trash} size="sm" /></button>
                </div>
              ))}
            </div>
          )
        })}
      </Cells>

      <div className="log-dock">
        <button type="button" className="round-btn" aria-label="Daily targets" onClick={() => setGoals(true)}>
          <Icon as={SlidersHorizontal} size="md" />
        </button>
        <button type="button" className="cta cta-compact" onClick={() => setAdding(true)}>
          <Icon as={Plus} size="md" />Add food
        </button>
      </div>

      <Sheet open={adding} onOpenChange={setAdding} title="Add food" description={`To ${dayName} · ${kcal} of ${targets.calories} kcal`}>
        <div className="flex flex-col gap-3">
          <SearchField value={q} onChange={setQ} label="Search every food" placeholder={`Search ${FOODS.length + mine.length} foods`} />
          {!q.trim() && (
            <label className="select-pill">
              <span className="sr-only">Show</span>
              <select value={source} onChange={(e) => setSource(e.target.value as Source)}>
                {SOURCES.filter((x) => x.id !== 'mine' || mine.length).map((x) => <option key={x.id} value={x.id}>{x.label} · {sourceList(x.id, usual, mine).length}</option>)}
              </select>
              <Icon as={CaretDown} size="sm" className="pointer-events-none text-fg-2" />
            </label>
          )}
          <div className="cells">
            {list.length ? list.map(row) : <p className="cell text-label text-fg-2">Nothing matches “{q.trim()}”. Add it as a food of your own below.</p>}
          </div>
          {extras}
        </div>
      </Sheet>

      <Sheet open={goals} onOpenChange={setGoals} title="Daily targets" description="What each day is judged against">
        <Cells>
          {([['calories', 'Calories', 'kcal'], ...MACROS.map((x) => [x.key, x.label, 'g'] as const)] as const).map(([key, label, unit]) => (
            <label key={key} className="cell">
              <span className="flex-1 text-body text-fg-1">{label}</span>
              <input type="number" min={0} inputMode="numeric" defaultValue={targets[key]} aria-label={`${label} target, ${unit === 'g' ? 'grams' : 'kcal'}`}
                onChange={(e) => { const v = Number(e.target.value); if (v > 0) setTargets({ [key]: v }) }}
                className="cell-input w-24 tabular-nums" />
              <span className="w-8 text-label text-fg-2">{unit}</span>
            </label>
          ))}
        </Cells>
      </Sheet>
    </div>
  )
}

type Source = 'usual' | 'mine' | 'indian' | 'american'
const SOURCES: { id: Source; label: string }[] = [
  { id: 'usual', label: 'Your usual' },
  { id: 'mine', label: 'Your own foods' },
  { id: 'indian', label: 'Indian' },
  { id: 'american', label: 'American' },
]
const sourceList = (id: Source, usual: Food[], mine: Food[]): Food[] =>
  id === 'usual' ? usual : id === 'mine' ? mine : FOODS.filter((f) => f.cuisine === id)

/** One food: name, what a serving is, a pin, and + to log it. `n` is how many are already on the day. */
function FoodRow({ food: f, n, to, onAdd, pinned, onPin }: {
  food: Food; n: number; to: string; onAdd: (f: Food) => void | Promise<void>; pinned: boolean; onPin: (name: string) => void
}) {
  return (
    <div className="cell">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-medium text-fg-1">{f.name}{n > 0 && <span className="font-normal text-fg-2"> · ×{n}</span>}</span>
        <span className="block truncate text-label text-fg-2">{f.kcal} kcal · {f.protein} g protein · {f.serving}</span>
      </span>
      {/* Pinned foods stay at the top of Your usual whatever the fortnight says. */}
      <button type="button" className="pin-btn" aria-pressed={pinned} aria-label={`Pin ${f.name} to Your usual`} onClick={() => onPin(f.name)}>
        <Icon as={PushPin} size="sm" active={pinned} />
      </button>
      <button type="button" className="round-btn" style={{ color: 'var(--color-brand-text)' }} aria-label={`Add ${f.name}, ${f.kcal} kcal, to ${to}`} onClick={() => onAdd(f)}>
        <Icon as={Plus} size="md" />
      </button>
    </div>
  )
}
