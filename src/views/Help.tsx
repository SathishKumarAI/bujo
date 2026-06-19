import { Card } from '../components/ui'
import { BULLET_LEGEND } from '../lib/bullets'
import { cat } from '../lib/colors'

export function Help() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-5">
      <Card title="How to use your bullet journal" subtitle="A 2-minute guide to every feature">
        <div className="prose-doc text-sm">
          <p>
            This is a digital take on the <strong>Bullet Journal method</strong> by Ryder Carroll,
            in the minimal one-pen style. Everything you write is saved automatically in this browser
            only · nobody else can see it, and there are no accounts. Below is what each section does.
          </p>
        </div>
      </Card>

      <Section
        title="Getting around · the top bar"
        body="Every screen has a sticky bar at the top. It shows where you are, and on date screens (Today, Monthly, Trackers, Cycle) a ← date → control to move through days or months. On the right: Quick add (capture an entry from anywhere), ⌘K (jump to any view or run a command), and the ⋯ menu · that's where theme, zoom, undo/redo, and the paper/handwriting/book toggles now live."
      />

      <Card title="Rapid logging · the bullets">
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
        body="Log workouts: activity, duration, distance, calories, RPE, and strength sets (one per line). Compact totals + personal-bests sit up top; the full history (with show-all/less) is on the right. The Nutrition card lets you add American & Indian foods to auto-sum macros, or fill a sample day."
      />
      <Section
        title="Gym"
        body="Structured strength logging with a searchable exercise picker, per-set RPE/type, previous-session + live-1RM hints, a plate calculator (kg/lb), muscle map with form-cue + injury-watch guidance, training-volume charts, the 12-week hypertrophy program tracker, and progress photos (with first-vs-latest compare)."
      />
      <Section
        title="Pull-ups"
        body="A dedicated hub: the 'Starting From Zero' program with day-by-day check-off, an ability calculator (your max → training set, ladder & pyramid schemes), the ability ladder, a library of workout formats (Ladders, Pyramids, EMOMs…), and progression exercises with why/how form cues."
      />
      <Section
        title="Challenges & Focus"
        body="Challenges runs fixed-length disciplines (75 Hard, 90-day, custom) with a progress ring and streak. Focus is a developer work tracker · log coding sessions (time, project, flow, stress, interruptions, languages) and see weekly hours, a minutes chart and a focus↔stress insight."
      />
      <Section
        title="Training penalties"
        body="Skip a habit streak, an overdue task, or a challenge day and the Today page surfaces an anime-style 'training penalty' scaled to how badly you slipped · a fun, dismissible nudge to keep the chain alive. Re-roll for a different drill."
      />
      <Section
        title="Plan"
        body="Set recurring tasks/events that auto-appear each day they apply. Run the migration flow to clear overdue open tasks · move them to today/tomorrow or drop them. Import a .ics file to bring calendar events onto your monthly."
      />
      <Section
        title="Realism & reminders"
        body="In Settings you can turn on a dot-grid paper texture, a handwriting font, and a daily reflection prompt; decorate days with stickers; opt into a daily reminder (with browser notification) and auto weather + location. Install the app to your home screen for offline use."
      />
      <Section
        title="Collections"
        body="Your Future Log lists everything dated ahead of today, the Birthday list keeps important dates handy, and Custom Collections are free-form pages (book lists, packing, projects) that use the same bullets."
      />
      <Section
        title="Command palette & book mode"
        body="Press ⌘K (or Ctrl-K) anywhere to jump to a view or run an action (toggle theme, export, load demo). Turn on the open-book frame in Settings → Journal feel to make the app read like a real bound notebook. New here? Settings → Load demo data fills a month of sample entries."
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
        body="Switch between dark (Mocha) and light (Latte) themes, set your profile, and · importantly · export a JSON or Markdown backup. Because data lives only in your browser, export regularly so you never lose it. Import restores a backup on any device."
      />
    </div>
  )
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <Card title={title}>
      <div className="prose-doc text-sm"><p>{body}</p></div>
    </Card>
  )
}
