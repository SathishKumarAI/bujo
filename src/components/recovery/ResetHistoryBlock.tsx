import { X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Empty } from '../ui'
import { cat, onRaised } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import type { Relapse } from '../../lib/types'
import { RefBlock } from './RefBlock'

/** Reset history · every logged reset, newest first, with its reason and reflection. */
export function ResetHistoryBlock({ relapses }: { relapses: Relapse[] }) {
  return (
    <RefBlock title="Reset history" subtitle={relapses.length ? `${relapses.length} reset${relapses.length === 1 ? '' : 's'} · no shame, patterns are data` : 'No shame · patterns are data'}>
      {relapses.length === 0 ? (
        <Empty>No resets logged. Keep going.</Empty>
      ) : (
        <ul className="space-y-2 text-body">
          {[...relapses].reverse().map((r) => (
            <li key={r.id} className="rounded-card border p-2" style={{ borderColor: cat('red') + '55', background: cat('red') + '12' }}>
              {/* `count` shown only when it says something: a bare row
                  means "once", and "×1" on every line before this field
                  existed would be a number the user never entered. */}
              <div className="flex items-center gap-1.5 font-medium" style={{ color: onRaised('red') }}><Icon as={X} size="sm" /> Reset · {prettyDay(r.date)}{(r.count ?? 1) > 1 && <span className="text-fg-2">· ×{r.count}</span>}</div>
              {r.trigger && <div className="mt-0.5 text-fg-1"><span className="text-fg-2">Reason:</span> {r.trigger}</div>}
              {r.note && <div className="text-fg-2 italic">{r.note}</div>}
            </li>
          ))}
        </ul>
      )}
    </RefBlock>
  )
}
