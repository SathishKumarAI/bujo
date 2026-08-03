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
export { ActivityForm } from './ActivityForm'
export { useActivityDraft, emptyDraft, draftOf, workoutOf, type ActivityDraft } from './draft'
export { EmptyFrame } from './EmptyFrame'
