import {
  Crosshair, Hourglass, NotePencil, Shield, TrendUp, Wind, HandFist, ListChecks, Users,
  type Icon,
} from '@/components/icons'
import type { MindsetCategory } from '../../lib/mindset'

/**
 * One glyph per mindset category.
 *
 * Lives here rather than beside the categories in `lib/mindset.ts` because that
 * module is data — it is imported by tests and by the practice arithmetic, and
 * neither should pull a React component into its graph.
 *
 * The categories are the page's only repeating vocabulary: a principle carries
 * one, the filter bar lists them, the balance chart is nine rows of them, and a
 * focus slot now names one. Nine words repeated in four places is exactly the
 * case an icon earns — it makes a row scannable without reading it, and it ties
 * the same category together across bands that otherwise share no styling.
 *
 * Drawn, from the app's own registry, at one weight. No emoji: the rest of the
 * app's chrome is Phosphor, and a coloured emoji in a row of line glyphs reads
 * as a different system pasted in.
 *
 * The mapping is deliberate, not decorative:
 *
 * | Category | Glyph | Why |
 * |---|---|---|
 * | Focus & presence | Crosshair | aim at one thing |
 * | Deep work | Hourglass | attention across a span, not a moment |
 * | Craft & scholarship | NotePencil | the work is writing it down |
 * | Resilience | Shield | what you carry into a setback |
 * | Growth mindset | TrendUp | ability as a slope, not a level |
 * | Composure | Wind | the breath, which is the lever |
 * | Confidence | HandFist | posture, the thing you can change directly |
 * | Discipline | ListChecks | the default you designed |
 * | Connection | Users | other people |
 *
 * `Target` is deliberately NOT used for Focus: Goals owns it app-wide, and two
 * sections sharing a glyph is worse than either having none.
 */
export const CATEGORY_ICON: Record<MindsetCategory, Icon> = {
  'Focus & presence': Crosshair,
  'Deep work': Hourglass,
  'Craft & scholarship': NotePencil,
  Resilience: Shield,
  'Growth mindset': TrendUp,
  Composure: Wind,
  Confidence: HandFist,
  Discipline: ListChecks,
  Connection: Users,
}

/** Falls back rather than throwing: a journal can hold a category this build
 *  no longer ships, and a missing glyph must not take the page down. */
export const categoryIcon = (name: string): Icon =>
  CATEGORY_ICON[name as MindsetCategory] ?? Crosshair
