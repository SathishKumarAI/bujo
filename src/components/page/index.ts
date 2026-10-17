/**
 * The page-contract primitives. Every Body-cluster page is built from these and
 * consumes them unmodified — needing a new variant means this layer
 * under-abstracted, and the fix is to change it here rather than fork at the
 * call site.
 */
export { PageLayout } from './PageLayout'
export { StatBar, type StatFact } from './StatBar'
export { SummaryStrip, type SummaryItem } from './SummaryStrip'
export { CalendarHeatmap, type HeatDatum } from './CalendarHeatmap'
export { DisclosureRow } from './DisclosureRow'
export { SectionRail, type RailRow } from './SectionRail'
export { ActivityForm } from './ActivityForm'
export { NumField } from './NumField'
export { useActivityDraft, emptyDraft, draftOf, workoutOf, draftIsEmpty, type ActivityDraft } from './draft'
export { EmptyFrame } from './EmptyFrame'
/**
 * TWO GRIDS, AND THE NAMES SAY WHICH IS WHICH.
 *
 * `PanelGrid` is a `<ul>` of reference items — a named thing with a short body
 * — and breaks at `@lg/page` (512px), because two of those read fine in a
 * narrow column. `StatGrid` holds analytics CARDS, whose steps are solved from
 * a ~450px floor (58/88/116rem), because a card carrying four stat tiles and a
 * sentence reads as a column below that.
 *
 * Picking the wrong one is visible: `PanelGrid` on stat cards gives 353px
 * columns in a 678px panel, which is the measurement in `StatGrid`'s docstring.
 */
export { PanelGrid, PanelCard, DefList, Tag } from './Panel'
export { StatGrid, SPAN_PANEL } from './StatGrid'
export { BarList, type BarRow } from './BarList'
export { ResetField } from './ResetField'
export { SearchField } from './SearchField'
export { ActStrip } from './ActStrip'
export { useActColumn } from './useActColumn'
export { NextStepBlock } from './NextStepBlock'
export { CardDeck } from './CardDeck'
