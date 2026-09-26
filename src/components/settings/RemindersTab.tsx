import { useState } from 'react'
import { useJournal } from '../../store'
import { Card, Input } from '../ui'
import { Button } from '../ui/button'
import { CardGrid } from '../shell/CardGrid'
import { cachedFoodCount, clearFoodCache } from '../../lib/food/lookup'
import { Row, Toggle } from './shared'
import { VoiceModelCard } from './VoiceModelCard'

/**
 * Everything that may reach outside this device, in one place.
 *
 * Weather, the food lookup and the local model are grouped on purpose: "may
 * this app talk to something that is not me" is one decision, and answering it
 * per-feature means hunting for the next switch you did not know existed.
 */
export function RemindersTab() {
  const { data, setSettings } = useJournal()
  const s = data.settings
  const [foodCache, setFoodCache] = useState(() => cachedFoodCount())

  return (
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
          {/* The second and last thing in the app that may touch the network.
              Grouped with weather on purpose: "may this app talk to something
              outside itself" is one decision, and it should be answerable in
              one place rather than hunted for per feature. */}
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

      <VoiceModelCard />
          </CardGrid>
  )
}
