import { MasonryGrid } from '../shell/CardGrid'
import { TagManager } from '../TagManager'
import { YourDataCard } from './YourDataCard'
import { BackupCard } from './BackupCard'
import { DemoResetCard } from './DemoResetCard'
import { AppleHealthCard } from './AppleHealthCard'
import { ProjectLinks } from '../account/ProjectLinks'

/**
 * What is here, how to get it out, and how to destroy it — in that order.
 *
 * Three cards, down from four. "Your data at a glance" and "Journal summary"
 * counted the same journal at opposite ends of a 3,000px tab and disagreed
 * about what "Habits" meant; `YourDataCard` is the merge, and `dataSummary()`
 * is the only thing that computes any of it now.
 *
 * `MasonryGrid`, not `CardGrid`: Backup is ~1,300px and Tags is ~90px, so a
 * row sized to its tallest cell stretched Tags to match and left ~1,200px of
 * empty column under it and again beside Demo & reset.
 */
export function DataTab() {
  return (
    <>
      <YourDataCard />
      <MasonryGrid>
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
      </MasonryGrid>
    </>
  )
}
