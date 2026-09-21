import { Lightbulb } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { DropdownMenuItem, DropdownMenuSeparator } from '../../ui/dropdown-menu'
import { useJournal } from '../../../store'
import { recommendations } from '../../../lib/recommend'
import { VIEW_CHROME, type ViewId } from '../viewChrome'

/**
 * Help and suggestions, merged.
 *
 * Both answer "what should I do on this page?" — the blurb statically, the
 * recommendations from your data — so they share one door, with the count badge
 * on it when there is something waiting. Two adjacent icons wearing one hat was
 * one affordance too many.
 *
 * Renders nothing when the view has no blurb and the journal has no
 * suggestions, so the bar does not carry a dead button.
 */
/**
 * The page's help blurb and the journal's suggestions, as MENU ITEMS.
 *
 * This used to be its own header button — a `?` with a yellow count on it,
 * beside the feedback button, beside the account menu: three controls in the
 * corner answering "what is this and who do I tell". It is now a submenu of
 * the one corner menu, which is the same consolidation #240 did to the avatar
 * and the ⋯, finished.
 *
 * Returns `null` when the view has no blurb and the journal has no
 * suggestions, so the parent can decide not to draw a submenu at all rather
 * than open one onto nothing.
 */
export function PageHelpItems({ view, onNavigate }: { view: ViewId; onNavigate: (id: ViewId) => void }) {
  const { data } = useJournal()
  const chrome = VIEW_CHROME[view]
  const recs = recommendations(data)
  if (!chrome.help && recs.length === 0) return null

  return (
    <>
      {chrome.help && (
        <>
          <div className="px-2 py-1.5">
            <p className="mb-1 font-display text-body font-medium text-foreground">{chrome.title}</p>
            <p className="text-label leading-relaxed text-fg-2">{chrome.help}</p>
          </div>
          <DropdownMenuItem onClick={() => onNavigate('help')} className="text-label text-blue">Open the full guide →</DropdownMenuItem>
        </>
      )}
      {recs.length > 0 && (
        <>
          {chrome.help && <DropdownMenuSeparator />}
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-micro tracking-wider text-fg-2 uppercase">
            <Icon as={Lightbulb} size="sm" className="text-yellow" /> Suggestions
          </div>
          {recs.map((r) => (
            <DropdownMenuItem key={r.id} onClick={() => r.action && onNavigate(r.action.view)} className="flex-col items-start gap-1 py-2">
              <span className="text-body text-fg-1">{r.text}</span>
              {r.action && <span className="text-label text-blue">→ {r.action.label}</span>}
            </DropdownMenuItem>
          ))}
        </>
      )}
    </>
  )
}
