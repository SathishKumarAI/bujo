export type ViewId =
  | 'today' | 'monthly' | 'trackers' | 'fitness' | 'gym' | 'pullups' | 'pickleball' | 'homeworkout' | 'challenges' | 'focus'
  | 'plan' | 'collections' | 'reading' | 'goals' | 'insights' | 'stats' | 'cycle' | 'nofap' | 'coaching' | 'account' | 'help' | 'settings'

export interface ViewChrome {
  title: string
  subtitle?: string
  /** Which cursor the top bar's date-nav drives, if any. */
  dateNav?: 'day' | 'month'
  /** Contextual help blurb shown from the top-bar "?" (from the Feature Guide). */
  help?: string
}

export const VIEW_CHROME: Record<ViewId, ViewChrome> = {
  today: { title: 'Today', subtitle: 'Your daily log', dateNav: 'day', help: 'Your daily log. Add tasks/events/notes with the bullet grammar (t/e/n · * important · ^ memory · #tag), rate mood/stress/sleep, and write a gratitude line and a daily memory. The top cards summarise what you covered yesterday and any penalty for slips.' },
  monthly: { title: 'Monthly', subtitle: 'Events show as dots', dateNav: 'month', help: 'A calendar of the month. Events appear as dots; a ribbon shows each day’s habit completion and mood tints the cell. Tap any day to open it. Below: this month’s location, goals, and photo.' },
  trackers: { title: 'Trackers', subtitle: 'Tap a cell to mark the day', dateNav: 'month', help: 'A habit dot-grid · tap a cell to mark a day (count habits increment toward a target). Drag the grip to reorder, open a habit for its streak/consistency detail. Below are charts: completion heatmap, streak board, weekday consistency, monthly trend.' },
  fitness: { title: 'Fitness', subtitle: 'Cardio & strength', help: 'One home for training, in two tabs. Cardio logs general sessions with totals, history, and a nutrition macro diary (American + Indian foods). Strength is structured lifting with programs, anatomy, plate calculator, body weight, and progress photos.' },
  gym: { title: 'Fitness', subtitle: 'Strength', help: 'The Strength tab of Fitness: searchable exercise picker, per-set weight/reps/RPE/type, 1RM hints, the 12-week program tracker, training-volume charts, plate calculator, muscle map with form/injury cues, and progress photos.' },
  pullups: { title: 'Pull-ups', subtitle: 'Ability, workouts & progressions', help: 'A dedicated pull-up hub: the "Starting From Zero" program with day-by-day check-off, an ability calculator (your max → training set, ladder & pyramid), a workout-format library, and progression exercises with form cues.' },
  pickleball: { title: 'Pickleball', subtitle: 'Games, win-rate & play-safe tips', help: 'Log pickleball sessions (singles/doubles, games won/lost, duration, RPE). See your record · sessions, games, win %, day streak · plus a win-rate trend, win/loss split, games-per-week, and physio/trainer injury-prevention notes.' },
  homeworkout: { title: 'Home Workout', subtitle: 'Bodyweight exercises · demos · log', help: 'A no-equipment home workout hub. Browse a curated bodyweight library · each exercise has a target muscle, how-to cues, a professional YouTube demo, and a YouTube search fallback. Build a session, log reps/sets/time, and save it as a Home workout that feeds your Fitness totals and history (synced to your account).' },
  challenges: { title: 'Challenges', subtitle: '75 Hard, 90-day & custom challenges', help: 'Fixed-length disciplines (75 Hard/Soft, 90-day, custom). Check in against each day’s rules; a progress ring and week calendar track you. Strict mode resets to Day 1 on a miss.' },
  focus: { title: 'Focus', subtitle: 'Coding time · flow · stress', help: 'A developer work tracker. Log coding sessions (time, project, flow, stress, interruptions, languages) and see weekly hours, a streak, a minutes chart, cumulative hours, language bars, and a focus↔stress insight.' },
  plan: { title: 'Plan', subtitle: 'Recurring tasks & routines', help: 'The migration workhorse: clear overdue open tasks (sort by date/priority, star the important ones, move or drop them). Define recurring daily/weekly tasks, and import .ics calendar events onto your Monthly.' },
  collections: { title: 'Collections', subtitle: 'Future log & lists', help: 'Free-form pages and lists: the Future Log (everything dated ahead), Friends/contacts (manual + opt-in GitHub enrich), Birthdays, and custom collection pages using the same bullets.' },
  reading: { title: 'Reading', subtitle: 'Want · reading · finished', help: 'Your reading log as three shelves · want-to-read, currently-reading (with a page-progress bar), and finished (with a 1–5 star rating). Set a yearly book goal; pages read and books finished this year roll up into Insights and Goals.' },
  goals: { title: 'Goals', subtitle: 'Every active target in one place', help: 'A cross-view rollup of every active target · habit weekly goals, fitness minutes, challenges, training-program days, and your streak · as progress bars. Tap a row to jump to its home view.' },
  insights: { title: 'Insights', subtitle: 'Streaks, search & reflection', help: 'Reflection hub: streaks, task completion, correlation patterns, a month index, and full-text search (filter by type). The Weekly Review walks you through migrate → review → reflect; the Tag manager renames/merges #tags.' },
  stats: { title: 'Stats', subtitle: 'Charts at a glance', help: 'Your analytics wall: activity heatmap, weekly radar, sleep↔mood scatter, workout bars, task donut, mood calendar, mood-by-weekday, workout-split, year-in-pixels, and a tag cloud.' },
  cycle: { title: 'Cycle', subtitle: 'Temperature & phase', dateNav: 'month', help: 'An opt-in, private basal-temperature and cycle chart with free-form flags. Honours your °F/°C unit. Nothing is shared or predicted · just a calm record.' },
  nofap: { title: 'Recovery', subtitle: 'Streak, urges & resilience', help: 'An opt-in abstinence streak: current streak, personal best, milestones, an urge-surfing counter, and a judgement-free relapse log. Stays entirely on your device.' },
  coaching: { title: 'Coaching', subtitle: 'Pickleball academy · beginner to pro', help: 'A full pickleball coaching curriculum, not just tracking: a 12-week beginner→4.0 program with a day-by-day practice schedule, a skill ladder (2.0→4.5+), a drill library by skill, and a mental-game track to build the right mindset. Start the program to track your week.' },
  account: { title: 'Account', subtitle: 'Sign in, sign up & sync', help: 'Your account home: sign in or create an account (email or Google), explore as a guest, sign out, and push a manual save to the cloud. When configured, signing in syncs your journal across devices in real time.' },
  help: { title: 'Help', subtitle: 'Guide & bullet legend', help: 'The in-app guide to every feature, written in plain language · a lighter companion to the full Feature Guide in the docs.' },
  settings: { title: 'Settings', subtitle: 'Theme, profile, data', help: 'Profile/units, journal feel (paper, handwriting, accent, Today-dashboard cards), reminders, and Data & Cloud · storage meter, JSON/Markdown/CSV export, print, passcode encryption, and cloud sync.' },
}
