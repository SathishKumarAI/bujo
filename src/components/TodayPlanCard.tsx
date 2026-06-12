import { CheckSquare, Dumbbell, ListTodo, ArrowUpToLine } from 'lucide-react'
import { useJournal } from '../store'
import { useNav } from './shell/nav'
import { cat } from '../lib/colors'
import { todayISO } from '../lib/date'
import { dayCompletion } from '../lib/stats'
import { PROGRAMS } from '../lib/programs'
import { Card } from './ui'

/**
 * "Today's plan" — a compact daily command-centre. It *summarises and links*
 * (habits left · workout status · tasks due · pull-up program day) instead of
 * re-rendering those views, so the day is actionable from one screen without
 * duplicating the dedicated views (see DECISIONS D-34). Tap a chip to jump in.
 */
export function TodayPlanCard() {
  const { data } = useJournal()
  const navigate = useNav()
  const today = todayISO()

  const cov = dayCompletion(data, today)
  const habitsLeft = cov.total - cov.done
  const tasksDue = data.entries.filter((e) => e.type === 'task' && e.status === 'open' && e.date && e.date <= today).length
  const workedOut = data.workouts.some((w) => w.date === today)

  // Pull-up program progress (days fully checked off).
  const done = data.settings.programDone ?? []
  const pullup = PROGRAMS.find((p) => p.id === 'pullup-zero')
  let pullDone = 0
  let pullTotal = 0
  if (pullup) {
    for (const w of pullup.weeks) for (const d of w.days) {
      pullTotal++
      if (d.exercises.length && d.exercises.every((_, i) => done.includes(`${pullup.id}-w${w.week}d${d.day}-e${i}`))) pullDone++
    }
  }

  const chips: { label: string; color: string; icon: typeof CheckSquare; to: Parameters<typeof navigate>[0]; done: boolean }[] = [
    { label: habitsLeft > 0 ? `${habitsLeft} habit${habitsLeft === 1 ? '' : 's'} left` : 'Habits done', color: 'green', icon: CheckSquare, to: 'trackers', done: cov.total > 0 && habitsLeft === 0 },
    { label: workedOut ? 'Workout logged' : 'No workout yet', color: 'teal', icon: Dumbbell, to: 'fitness', done: workedOut },
    { label: tasksDue > 0 ? `${tasksDue} task${tasksDue === 1 ? '' : 's'} due` : 'Tasks clear', color: 'mauve', icon: ListTodo, to: 'plan', done: tasksDue === 0 },
  ]
  if (pullDone > 0 && pullDone < pullTotal) chips.push({ label: `Pull-ups ${pullDone}/${pullTotal}`, color: 'peach', icon: ArrowUpToLine, to: 'pullups', done: false })

  return (
    <Card title="Today’s plan" subtitle="Your whole day at a glance — tap to jump in">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const Icon = c.icon
          return (
            <button
              key={c.label}
              onClick={() => navigate(c.to)}
              className="press-3d inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
              style={{ borderColor: cat(c.color) + '55', background: cat(c.color) + (c.done ? '14' : '22'), color: c.done ? cat('overlay1') : cat(c.color) }}
            >
              <Icon size={14} /> {c.label}{c.done ? ' ✓' : ''}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
