import { Compass, ArrowRight, CheckCircle2, Dumbbell, Sparkles } from 'lucide-react'
import { useJournal } from '../store'
import { useNav } from './shell/nav'
import { Card } from './ui'
import { cat } from '../lib/colors'
import { coachTips } from '../lib/coach'
import { todayISO } from '../lib/date'
import type { ViewId } from './shell/viewChrome'

const TONE = {
  do: { color: 'mauve', Icon: ArrowRight },
  win: { color: 'green', Icon: CheckCircle2 },
  info: { color: 'blue', Icon: Dumbbell },
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
    <Card title={<span className="inline-flex items-center gap-2"><Compass size={18} className="text-mauve" /> Your coach</span>} subtitle="What to focus on next, from your data">
      <ul className="space-y-2">
        {tips.map((t) => {
          const { color, Icon } = TONE[t.tone]
          return (
            <li key={t.id}>
              <button onClick={() => nav(t.to as ViewId)} className="press-3d flex w-full items-start gap-2.5 rounded-lg border border-surface0 bg-base p-3 text-left hover:border-mauve">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: cat(color) + '22' }}>
                  <Icon size={13} style={{ color: cat(color) }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-text">{t.title}</span>
                  <span className="block text-xs text-overlay1">{t.detail}</span>
                </span>
                <Sparkles size={13} className="mt-1 shrink-0 text-overlay0" />
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
