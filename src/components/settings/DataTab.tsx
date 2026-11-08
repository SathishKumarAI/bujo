import { TagManager } from '../TagManager'
import { YourDataCard } from './YourDataCard'
import { BackupCard } from './BackupCard'
import { DemoResetCard } from './DemoResetCard'
import { AppleHealthCard } from './AppleHealthCard'
import { ProjectLinks } from '../account/ProjectLinks'

/**
 * What is here, how to get it out, and how to destroy it — in that order.
 *
 * Groups of rows, one under another on a phone and packed into two columns
 * on a desktop by `.settings-cols` (`styles/phone-settings.css`). "Your data
 * at a glance" and "Journal summary" once counted the same journal twice and
 * disagreed about "Habits"; `YourDataCard` is the merge, and `dataSummary()`
 * is the only thing that computes any of it.
 */
export function DataTab() {
  return (
    <>
      <YourDataCard />
      <BackupCard />
        {/* Tags moved here from Insights (BUJO-281). It is a maintenance tool —
            it rewrites every entry that carries a tag — not an analysis, so it
            was the one thing on that page you could *change* something with, and
            it sat behind a fold at the bottom of six. Between export and the
            danger zone is where data you edit in bulk belongs. */}
      <AppleHealthCard />
      <TagManager />
      <DemoResetCard />
        {/* From the retired Account page. There is no support inbox — the issue
            tracker is the whole channel — so it belongs on the tab people reach
            for when something about their data looks wrong, which is this one
            rather than a page about who you are signed in as. */}
      <ProjectLinks />
    </>
  )
}
