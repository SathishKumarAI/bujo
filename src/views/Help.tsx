import { Card } from '../components/ui'
import { BULLET_LEGEND } from '../lib/bullets'
import { cat } from '../lib/colors'

export function Help() {
  return (
    <div className="space-y-4">
      <Card title="How to use your bullet journal" subtitle="A 2-minute guide to every feature">
        <p className="text-sm text-subtext1">
          This is a digital take on the <strong>Bullet Journal method</strong> by Ryder Carroll,
          in the minimal one-pen style. Everything you write is saved automatically in this browser
          only — nobody else can see it, and there are no accounts. Below is what each section does.
        </p>
      </Card>

      <Card title="Rapid logging — the bullets">
        <p className="mb-3 text-sm text-subtext1">
          On the <strong>Today</strong> page, type into the add bar and press Enter. Start a line with a
          letter to choose the kind, and click the glyph on any task to cycle its status.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {BULLET_LEGEND.map((b) => (
            <li key={b.label} className="flex items-center gap-3 rounded-lg border border-surface0 bg-base px-3 py-1.5 text-sm">
              <span className="w-5 text-center font-mono" style={{ color: cat('mauve') }}>{b.glyph}</span>
              <span className="text-subtext1">{b.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 rounded-lg bg-base p-3 text-sm text-subtext0">
          <p className="font-medium text-subtext1">Quick-capture prefixes</p>
          <p className="mt-1"><code>t</code> task · <code>e</code> event · <code>n</code> note · <code>*</code> important · <code>^</code> memory · <code>#tag</code> to tag.</p>
          <p className="mt-1 text-overlay0">Example: <code>* t book the campsite #travel</code> → an important task, tagged travel.</p>
        </div>
      </Card>

      <Section
        title="Today"
        body="Your daily log. Add tasks/events/notes, rate mood, stress and sleep (0–10), mark how you broke your fast, and write one gratitude line and one daily memory. The 'On this day' card resurfaces entries from the same date in past months."
      />
      <Section
        title="Monthly"
        body="A calendar of the month. Events appear as colored dots. On the right, record where you are this month (great for travelers), your goals, and a caption for your photo of the month."
      />
      <Section
        title="Trackers"
        body="A dot-grid: rows are habits / foods / stimulants, columns are days. Tap a cell to mark that you did it. The % column shows your 30-day consistency. Below it, a line chart overlays mood, stress and sleep so you can see how they move together."
      />
      <Section
        title="Fitness"
        body="Log workouts: activity, duration, distance, calories, RPE, and strength sets (one per line). Totals and full history are shown alongside."
      />
      <Section
        title="Plan"
        body="Set recurring tasks/events that auto-appear each day they apply. Run the migration flow to clear overdue open tasks — move them to today/tomorrow or drop them. Import a .ics file to bring calendar events onto your monthly."
      />
      <Section
        title="Realism & reminders"
        body="In Settings you can turn on a dot-grid paper texture, a handwriting font, and a daily reflection prompt; decorate days with stickers; opt into a daily reminder (with browser notification) and auto weather + location. Install the app to your home screen for offline use."
      />
      <Section
        title="Collections"
        body="Your Future Log lists everything dated ahead of today, and the Birthday list keeps important dates handy."
      />
      <Section
        title="Insights"
        body="Streaks (current & longest), task-completion rate, and a full-text search across every entry, memory, gratitude line and workout."
      />
      <Section
        title="Cycle & NoFap"
        body="Optional, gender-based wellbeing tools you can toggle in Settings. The Cycle tracker is a private, neutral basal-temperature chart with flags. The NoFap journal is an abstinence streak counter with milestones and a judgement-free relapse log."
      />
      <Section
        title="Settings & backups"
        body="Switch between dark (Mocha) and light (Latte) themes, set your profile, and — importantly — export a JSON or Markdown backup. Because data lives only in your browser, export regularly so you never lose it. Import restores a backup on any device."
      />
    </div>
  )
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <Card title={title}>
      <p className="text-sm text-subtext1">{body}</p>
    </Card>
  )
}
