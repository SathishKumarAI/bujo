import { ProgramTracker } from '../components/ProgramTracker'
import { Page } from '../components/shell/Page'
import { useNav } from '../components/shell/nav'
import { setPendingSession } from '../lib/pendingSession'

/**
 * The 12-Week Hypertrophy Block · a Body tab of its own.
 *
 * It used to be one line inside Strength's "Program & progress" fold, which
 * meant a twelve-week commitment lived two clicks down a page whose job is
 * logging today's sets — and behind a collapsible, so it was invisible until
 * you went looking. A programme you follow six days a week for three months is
 * a destination, the same argument that made Pickleball a tab rather than an
 * activity.
 *
 * **Only the tracker moved.** `ProgressPhotos` shared that fold and stayed in
 * Strength: it is not programme data, and quietly relocating a feature while
 * moving its neighbour is how content goes missing in a refactor.
 *
 * The pull-up programme keeps its own home in `views/Pullups.tsx` — same
 * component, `only="pullup-zero"`. `ProgramTracker` hides its programme picker
 * whenever `only` is set, so neither page offers the other's block.
 */
export function Program() {
  const navigate = useNav()

  return (
    <Page>
      <ProgramTracker
        only="hyper12"
        // Strength shows the muscle map in its right rail, driven by the lift
        // you are logging. This page has no rail, and a checklist alone never
        // shows what the day works — so the tracker maps the whole day here.
        anatomy
        // The logger lives on another tab now, and its rows are local state, so
        // this hands the day's lifts over and follows them there. See
        // `lib/pendingSession`.
        onLoad={(exercises) => {
          setPendingSession(exercises)
          navigate('gym')
        }}
      />
    </Page>
  )
}
