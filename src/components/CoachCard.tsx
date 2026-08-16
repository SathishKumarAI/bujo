import { ArrowRight, Barbell, CheckCircle, Compass, Sparkle } from '@/components/icons'
import { Icon as AppIcon } from '@/components/Icon'
import { useJournal } from '../store'
import { useNav } from './shell/nav'
import { Card } from './ui'
import { cat } from '../lib/colors'
import { coachTips } from '../lib/coach'
import { todayISO } from '../lib/date'
import type { ViewId } from './shell/viewChrome'

const TONE = {
  do: { color: 'mauve', Icon: ArrowRight },
  win: { color: 'green', Icon: CheckCircle },
  info: { color: 'blue', Icon: Barbell },
} as const

/**
 * The coach: a few proactive "do this next" prompts derived from your data, so
 * the app guides the next action instead of only recording the past. Only shown
 * when there's something useful to say.
 */
export function CoachCard() {
  const { data } = useJournal()
  const nav = useNav()
  const tips = coachTips(data, todayISO())
  if (tips.length === 0) return null

  return (
    <Card band title={<span className="inline-flex items-center gap-2"><AppIcon as={Compass} size="md" className="text-mauve" /> Your coach</span>} hideInfo>
      <ul className="space-y-2">
        {tips.map((t) => {
          const { color, Icon } = TONE[t.tone]
          return (
            <li key={t.id}>
              <button onClick={() => nav(t.to as ViewId)} className="press-3d flex w-full items-start gap-2.5 rounded-card border border-line bg-ink-0 p-3 text-left hover:border-mauve">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-pill" style={{ background: cat(color) + '22' }}>
                  <AppIcon as={Icon} size="sm" style={{ color: cat(color) }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-medium text-fg-1">{t.title}</span>
                  <span className="block text-label text-fg-2">{t.detail}</span>
                </span>
                <AppIcon as={Sparkle} size="sm" className="mt-1 shrink-0 text-fg-2" />
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
