import { useJournal } from '../../../store'
import { recommendations } from '../../../lib/recommend'

/**
 * How many suggestions are waiting — the count the corner badge shows.
 *
 * Its own file because `HelpMenu.tsx` exports a component, and a file that
 * exports both a component and a hook breaks fast refresh
 * (`react-refresh/only-export-components`, an error under `npm run verify`).
 * Third time that rule has been met in this codebase; see
 * `components/gym/setRow.ts` and `ui/quickpick.options.ts`.
 */
export function useSuggestionCount(): number {
  const { data } = useJournal()
  return recommendations(data).length
}
