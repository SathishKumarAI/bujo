import { Sparkle, Warning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import type { Milestone } from '../../lib/streak'
import type { TriggerPlan } from '../../lib/types'
import { RefBlock } from './RefBlock'

/**
 * Beat the urge · the coping techniques, as reference.
 *
 * The in-crisis version of this list lives in `SosOverlay`, behind a fixed
 * floating button reachable from any scroll position — which is the only reason
 * it is allowed to sit in a rail group you have to pick rather than on the page
 * at all times. A page someone opens mid-urge must not put its coping list
 * behind a click; this one does not.
 */
export function TechniquesBlock({ plans, next, daysToNext }: {
  plans: TriggerPlan[]
  next?: Milestone
  daysToNext: number
}) {
  return (
    <RefBlock
      title={<span className="inline-flex items-center gap-2"><Icon as={Sparkle} size="md" className="text-mauve" /> Beat the urge</span>}
      subtitle="Proven techniques, an urge peaks and passes in ~15–20 min"
    >
      <ol className="space-y-2 text-body text-fg-1">
        <li className="flex gap-2"><span className="font-medium text-teal">Surf it</span> · name it (“this is an urge, it will pass”) and watch it rise and fall without acting.</li>
        <li className="flex gap-2"><span className="font-medium text-teal">Delay 10 min</span> · set a timer; move, cold water, walk, push-ups. The peak passes.</li>
        <li className="flex gap-2"><span className="font-medium text-teal">HALT check</span> · Hungry? Angry? Lonely? Tired? Fix the real need instead.</li>
        <li className="flex gap-2"><span className="font-medium text-teal">Play it forward</span> · picture how you’ll feel 1 hour after giving in vs. resisting.</li>
        <li className="flex gap-2"><span className="font-medium text-teal">Remove the cue</span> · leave the room, phone in another room, block the site.</li>
        <li className="flex gap-2"><span className="font-medium text-teal">Reach out</span> · text someone; saying it out loud drains the urge’s power.</li>
        <li className="flex gap-2"><span className="font-medium text-teal">Log the win</span> · tap <strong>I resisted it</strong> above; evidence beats willpower.</li>
      </ol>
      {plans.length > 0 && (
        <div className="mt-3 rounded-card bg-secondary/50 p-2 text-label text-fg-2">
          <span className="font-medium text-mauve">Your plan:</span> {plans.map((pl) => `${pl.addiction} → ${pl.coping || pl.trigger}`).slice(0, 2).join(' · ')}
        </div>
      )}
      {next && <p className="mt-2 inline-flex items-center gap-1.5 rounded-card bg-peach/10 p-2 text-label text-fg-2"><Icon as={Warning} size="sm" className="text-peach" /> You’re {daysToNext} day{daysToNext === 1 ? '' : 's'} from {next.label}. Don’t trade weeks of progress for 10 minutes.</p>}
    </RefBlock>
  )
}
