import { Check } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Pill } from '../ui'
import { cat, onAccent, onRaised } from '../../lib/colors'
import { STREAK_MILESTONES, type Milestone } from '../../lib/streak'
import { RefBlock } from './RefBlock'

/** Recovery ladder · what clears as the streak grows, with the reached rungs ticked. */
export function LadderBlock({ current, next }: { current: number; next?: Milestone }) {
  return (
    <RefBlock title="Recovery ladder" subtitle="What clears as the streak grows">
      <ol className="relative ml-3 space-y-3 border-l border-line-strong pl-5">
        {STREAK_MILESTONES.map((m) => {
          const reached = current >= m.day
          const isNext = next?.day === m.day
          return (
            <li key={m.day} className="relative">
              {/* `crust` is the light-on-dark half of a saturated fill.
                  On the neutral `surface0` chip of an unreached
                  milestone it was dark-on-dark and failed contrast — the
                  day numbers you are counting towards, unreadable. Third
                  instance of this exact pairing in the cluster, so it is
                  a pattern rather than a slip: a foreground chosen for
                  one background and then applied to all three. */}
              <span className="absolute -left-[27px] grid h-5 w-5 place-items-center rounded-control text-micro"
                style={
                  reached ? { background: cat('green'), color: onAccent(cat('green')) }
                    : isNext ? { background: cat('teal'), color: onAccent(cat('teal')) }
                      : { background: cat('surface0'), color: onRaised('text') }
                }>
                {reached ? <Icon as={Check} size="sm" /> : m.day}
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-body font-medium ${reached ? 'text-fg-1' : isNext ? 'text-teal' : 'text-fg-2'}`}>{m.label}</span>
                <span className="text-caption text-fg-2">{m.day}d</span>
                {isNext && <Pill color="teal" size="micro">next</Pill>}
              </div>
              <p className={`text-label ${reached || isNext ? 'text-fg-2' : 'text-fg-2'}`}>{m.benefit}</p>
            </li>
          )
        })}
      </ol>
    </RefBlock>
  )
}
