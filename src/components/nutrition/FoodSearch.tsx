import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlass } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Input } from '../ui'
import { Button } from '../ui/button'
import { useJournal } from '../../store'
import { lookupFood, scaleHit } from '../../lib/food/lookup'
import type { FoodHit } from '../../lib/food/providers'
import type { Food } from '../../lib/foods'
import { ChipPick } from '../ui/quickpick'

/**
 * SEARCH A FOOD · Open Food Facts, USDA behind it, manual entry underneath.
 *
 * Asked for as MyFitnessPal, which has **no public API** — it was closed years
 * ago. Open Food Facts is the open-data equivalent and the better fit here:
 * ODbL, 3M+ products, barcode lookup, no key, no account.
 *
 * **Renders nothing unless the user turned lookup on.** A search box that
 * appears before consent is a network call advertised as a feature, and this
 * app's whole claim is that it makes none until you say so. Off is the
 * default, and the switch is in Settings beside the weather one, because
 * "may this app talk to something outside itself" is one decision.
 *
 * The portion field is the part that is easy to get wrong and expensive to
 * miss: providers report **per 100g**, so adding a hit unscaled logs 100g of
 * everything. A 30g slice of cheese would enter the day as 100g — quietly, in
 * the total, in the direction that flatters nobody.
 */
export function FoodSearch({ onAdd }: { onAdd: (f: Food) => void }) {
  const { data } = useJournal()
  const on = data.settings.foodLookup === true
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<FoodHit[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [grams, setGrams] = useState(100)
  const [picked, setPicked] = useState<FoodHit | null>(null)
  const abort = useRef<AbortController | null>(null)

  // A search in flight when the component goes away, or when a second search
  // starts, is a response that will arrive and overwrite newer state.
  useEffect(() => () => abort.current?.abort(), [])

  if (!on) return null

  async function run() {
    const query = q.trim()
    if (!query) return
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    setBusy(true)
    setNote(null)
    setPicked(null)
    try {
      const r = await lookupFood(query, { usdaKey: data.settings.usdaKey, signal: ctrl.signal })
      if (ctrl.signal.aborted) return
      setHits(r.hits)
      setNote(
        r.error
          ? `Could not reach the food databases — ${r.error}. You can still type the numbers below.`
          : r.hits.length === 0
            ? `Nothing found for “${query}”. Try a simpler word, or type the numbers below.`
            : r.cached
              ? 'From this device — no request made.'
              : `${r.hits.length} result${r.hits.length === 1 ? '' : 's'} from ${r.tried.join(' and ')}.`,
      )
    } finally {
      if (!ctrl.signal.aborted) setBusy(false)
    }
  }

  return (
    <div className="mb-3 border-b border-line pb-3">
      <label htmlFor="food-search" className="mb-1 block text-body text-fg-1">Search a food</label>
      <div className="flex gap-2">
        <span className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-fg-2">
            <Icon as={MagnifyingGlass} size="sm" />
          </span>
          <Input
            id="food-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void run() }}
            placeholder="oats, greek yoghurt, or a barcode…"
            className="pl-8"
          />
        </span>
        <Button variant="secondary" onClick={() => void run()} disabled={busy || !q.trim()}>
          {busy ? 'Searching…' : 'Search'}
        </Button>
      </div>

      {note && <p className="mt-1.5 text-label text-fg-2">{note}</p>}

      {hits && hits.length > 0 && (
        <ul className="mt-2 max-h-56 space-y-1 overflow-auto">
          {hits.map((h) => {
            const on = picked?.id === h.id
            return (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => { setPicked(h); setGrams(100) }}
                  aria-pressed={on}
                  className={`w-full rounded-control px-2.5 py-1.5 text-left transition-colors ${on ? 'bg-brand-wash' : 'hover:bg-ink-2'}`}
                >
                  <span className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-body text-fg-1">{h.name}</span>
                    <span className="shrink-0 text-label tabular-nums text-fg-2">{h.kcal} kcal /100g</span>
                  </span>
                  <span className="block truncate text-label text-fg-2">
                    {[h.detail, `P ${h.protein} · C ${h.carbs} · F ${h.fat}`].filter(Boolean).join(' · ')}
                    {' · '}
                    {/* Say where it came from. Open data is uneven, and a user
                        who can see the source can judge the number. */}
                    <span className="text-fg-3">{h.source === 'off' ? 'Open Food Facts' : 'USDA'}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {picked && (
        <div className="mt-2 rounded-card border border-brand/30 bg-brand-wash/30 p-2.5">
          <ChipPick
            label={`How much ${picked.name}?`}
            value={grams}
            onChange={setGrams}
            options={[30, 50, 100, 150, 200].map((g) => ({ value: g, label: `${g}g` }))}
            after={
              <input
                type="number"
                min={1}
                max={2000}
                inputMode="numeric"
                aria-label="Portion in grams"
                value={![30, 50, 100, 150, 200].includes(grams) ? grams : ''}
                placeholder="…"
                onChange={(e) => e.target.value && setGrams(Number(e.target.value))}
                className="w-16 rounded-pill border border-line-strong bg-ink-2 px-2 py-1.5 text-center text-label tabular-nums text-fg-1"
              />
            }
          />
          {(() => {
            const s = scaleHit(picked, grams)
            return (
              <>
                <p className="mt-2 text-body text-fg-1">
                  <strong className="tabular-nums">{s.kcal} kcal</strong>
                  <span className="text-fg-2"> · P {s.protein} · C {s.carbs} · F {s.fat}</span>
                </p>
                <Button
                  variant="primary"
                  className="mt-2 w-full"
                  onClick={() => { onAdd(s); setPicked(null); setHits(null); setQ(''); setNote(null) }}
                >
                  Add {s.serving} to today
                </Button>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
