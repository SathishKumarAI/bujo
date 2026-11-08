import { useState } from 'react'
import { useJournal } from '../../store'
import { cachedFoodCount, clearFoodCache } from '../../lib/food/lookup'
import { Cells, FieldCell, ToggleCell } from '../ui/cells'

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

  // The two switches as grouped rows, each explanation cut to one line.
  return (
    <Cells title="Weather & food lookup" aside="off by default">
      <ToggleCell title="Auto-log weather & location" subtitle="open-meteo · your browser location" on={s.weatherEnabled} onChange={(v) => setSettings({ weatherEnabled: v })} />
      <ToggleCell title="Look food up online" subtitle="Only the words you type are sent" on={s.foodLookup === true} onChange={(v) => setSettings({ foodLookup: v })} />
      {s.foodLookup && (
        <>
          <FieldCell label="USDA key" value={s.usdaKey ?? ''} onChange={(v) => setSettings({ usdaKey: v })} placeholder="optional" />
          <button type="button" className="cell" onClick={() => { clearFoodCache(); setFoodCache(0) }}>
            <span className="flex-1 text-body text-fg-1">Clear food cache</span>
            <span className="text-body text-fg-2">{foodCache} cached</span>
          </button>
        </>
      )}
    </Cells>
  )
}
