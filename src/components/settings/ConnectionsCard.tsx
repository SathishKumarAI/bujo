import { useState } from 'react'
import { useJournal } from '../../store'
import { Card, Input } from '../ui'
import { Button } from '../ui/button'
import { cachedFoodCount, clearFoodCache } from '../../lib/food/lookup'
import { Row, Toggle } from './shared'

/**
 * Everything that may reach outside this device — the half of it that is not
 * sync.
 *
 * This file was `RemindersTab`, a tab of its own whose docstring claimed to put
 * "may this app talk to something that is not me" in one place. It did not:
 * cloud sync, the self-host API and Drive — the three connections that carry the
 * whole journal rather than a search term — were a tab away under Sync &
 * privacy, and the tab measured **351px of content in a 743px viewport**. The
 * claim is true now because the cards are on one tab; the tab that said so is
 * gone, and the daily reminder (the one local thing on it) moved to Profile.
 *
 * Weather and the food lookup stay together for the original reason: answering
 * "may this app talk out" per feature means hunting for the next switch you did
 * not know existed.
 */
export function ConnectionsCard() {
  const { data, setSettings } = useJournal()
  const s = data.settings
  const [foodCache, setFoodCache] = useState(() => cachedFoodCount())

  return (
    <Card band title="Weather & food lookup" subtitle="Both off until you turn them on">
      <div className="space-y-3">
        <div>
          <Toggle label="Auto-log weather & location" on={s.weatherEnabled} onChange={(v) => setSettings({ weatherEnabled: v })} />
          <p className="mt-1 text-label text-fg-2">Uses open-meteo and your browser location. When off, the app makes no network calls.</p>
        </div>
        {/* The second and last thing in the app that may touch the network for
            a lookup. Grouped with weather on purpose: "may this app talk to
            something outside itself" is one decision, and it should be
            answerable in one place rather than hunted for per feature. */}
        <div className="border-t border-line pt-3">
          <Toggle label="Look food up online" on={s.foodLookup === true} onChange={(v) => setSettings({ foodLookup: v })} />
          <p className="mt-1 text-label text-fg-2">
            Searches <strong className="font-medium text-fg-1">Open Food Facts</strong> (open data, no account) and falls
            back to <strong className="font-medium text-fg-1">USDA FoodData Central</strong> for whole foods. Only the words you
            type are sent — never your journal. Results are cached on this device, so a food you have looked up once works offline.
          </p>
          {s.foodLookup && (
            <div className="mt-2">
              <Row label="USDA key">
                <Input
                  value={s.usdaKey ?? ''}
                  onChange={(e) => setSettings({ usdaKey: e.target.value })}
                  placeholder="optional"
                  aria-label="USDA FoodData Central API key"
                  className="control-max"
                />
              </Row>
              <p className="mt-1 text-label text-fg-2">
                Optional. Blank uses a shared demo key that is rate-limited hard — a free one from
                <code className="mx-1">fdc.nal.usda.gov/api-key-signup</code> makes whole-food search reliable.
                Open Food Facts needs no key at all.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button variant="secondary" onClick={() => { clearFoodCache(); setFoodCache(0) }}>Clear food cache</Button>
                <span className="text-label text-fg-2">{foodCache} food{foodCache === 1 ? '' : 's'} cached on this device</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
