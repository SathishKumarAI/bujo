import { MEMBERS, SECTIONS, type SectionId } from '../components/shell/sections'
import { VIEW_CHROME, type ViewId } from '../components/shell/viewChrome'

/**
 * THE GUIDE · one catalogue of everything this app can do, and why.
 *
 * `docs/pages/help.md` recorded the bug this file exists to kill: every screen
 * was documented three times — in its card ⓘ, in `VIEW_CHROME.help` behind the
 * top bar's "?", and again in hand-written prose inside `views/Help.tsx`. Three
 * copies drift, and they had: Help named fifteen screens while the app has
 * twenty-four, so Goals, Program, Nutrition, Coaching, Reading, Mindset, Stats,
 * Pickleball and Home workout were undocumented in the one place a lost user
 * goes looking.
 *
 * So this module holds **only what `VIEW_CHROME` does not**:
 *
 * - `what` is `VIEW_CHROME[view].help` — never restated here.
 * - `title` is `VIEW_CHROME[view].title`.
 * - the grouping comes from `SECTIONS` / `MEMBERS`, so moving a tab between
 *   sections moves it in the guide with no edit here.
 * - `why` and `how` are the two things nothing else in the app records, and are
 *   therefore the only prose this file owns.
 *
 * `guide.test.ts` asserts the cover both ways — an entry for every navigable
 * view, and no entry for a view that no longer exists. That test is the point:
 * a guide that silently stops covering a page is worse than no guide, because
 * it still reads as complete.
 */

export interface GuideEntry {
  /** Why the page exists — the payoff, not the mechanism. One sentence. */
  why: string
  /** First moves, in order. Each is something you can do right now. */
  how: string[]
  /** Search terms the title and the `help` blurb do not already contain. */
  keywords?: string[]
}

/** Real surfaces that belong to no nav section. */
const SETUP: ViewId[] = ['account', 'settings']

/**
 * Deliberately uncovered, listed rather than left absent so the test can tell
 * "decided" from "forgotten": `help` is this page, and `kitchen-sink` is a
 * design-system review surface reachable only by typing its id.
 */
export const UNGUIDED: ViewId[] = [
  'help',
  'kitchen-sink',
  /* A redirect, not a page: the habit grid is Today's `habits` surface now, so
     its guidance lives in Today's entry rather than under a heading that opens
     a forwarding component. The id survives because fifteen places link to it
     — see `views/Trackers.tsx`. */
  'trackers',
]

export const ENTRIES: Partial<Record<ViewId, GuideEntry>> = {
  today: {
    why: 'A day you did not write down is a day you cannot learn from — this page is what the habit is actually made of.',
    how: [
      'Type one line and press Enter. Start it with t, e or n to pick task, event or note; * makes it important, #tag files it.',
      'Click a bullet glyph to cycle its status — open, done, migrated, dropped.',
      'Before bed, set mood, stress and sleep. Every chart in Insights is built from those three numbers.',
      'Write one gratitude line and one memory. That is the whole daily ritual, and it takes about a minute.',
      'The Habits tab is the month grid: add a habit, then tap a cell to mark the day. Count habits increment toward a target instead of just toggling.',
      'Read the consistency percentage rather than the current streak — a streak forgives nothing and teaches less.',
    ],
    keywords: ['log', 'capture', 'diary', 'entry', 'bullet', 'rapid logging', 'gratitude', 'memory', 'habits', 'dot grid', 'streak', 'consistency', 'tracking', 'trackers', 'water', 'stimulants'],
  },
  plan: {
    why: 'Open tasks that quietly roll forward forever are how a journal dies; migration forces exactly one decision per task.',
    how: [
      'Open Plan at the end of a week or a month — that is when it earns its place.',
      'Work the overdue list: move each task to today or tomorrow, or drop it. Dropping is a valid answer and half the point of the ritual.',
      'Add recurring tasks so the things you do every day stop needing to be typed.',
      'Import a .ics file to bring an existing calendar onto your Monthly.',
    ],
    keywords: ['migration', 'overdue', 'recurring', 'routine', 'ics', 'calendar import', 'weekly'],
  },
  monthly: {
    why: 'A month at a glance is the only view that shows shape — which weeks you lost, and whether the gaps line up with anything.',
    how: [
      'Tap any day to open it in Today.',
      'Record where you are this month and what you want out of it.',
      'Add the photo of the month with a caption — it is the thing you will actually come back for.',
    ],
    keywords: ['calendar', 'month', 'spread', 'location', 'travel', 'photo'],
  },
  goals: {
    why: 'Targets scattered across seven pages are targets nobody reads; this is the single list, and it is read-only on purpose.',
    how: [
      'Read the bars top to bottom. Each one is an active target you set somewhere else.',
      'Tap a row to jump to the page that owns it, and change it there.',
      'A target you expected and cannot find has not been set yet — set it on its home page.',
    ],
    keywords: ['targets', 'progress', 'rollup', 'overview'],
  },
  fitness: {
    why: 'The week, not the session, is the unit that decides whether training is working — and you cannot judge a week from memory.',
    how: [
      'Pick the mode first. Cardio asks for duration and distance; strength asks for sets. The facts and the copy follow it.',
      'Log the session while you are still warm. A session reconstructed at night is a session of guesses.',
      'Check the week against its minutes target before deciding whether today is a rest day.',
    ],
    keywords: ['workout', 'exercise', 'cardio', 'run', 'training', 'session', 'rpe'],
  },
  gym: {
    why: 'Sets, reps and load only mean something next to what you lifted last time — holding that comparison is the whole job of this page.',
    how: [
      'Search the exercise picker and log your sets: weight, reps, RPE, set type.',
      'Use the previous-session and live-1RM hints to choose today’s load instead of guessing it.',
      'Open the muscle map for form cues and injury watch-outs before a lift that is new to you.',
      'Take a progress photo now and again — the first-vs-latest compare is the only honest one.',
    ],
    keywords: ['strength', 'lifting', 'sets', 'reps', 'plate calculator', '1rm', 'personal record', 'pr', 'muscle map'],
  },
  program: {
    why: 'Twelve weeks is longer than motivation lasts; something you can put down and resume is what carries you across the gap.',
    how: [
      'Pick the phase and the day — six days a week, three four-week phases.',
      'Check exercises off as you go. A partial day is recorded as a partial day, not a failure.',
      'Type what you actually managed against each target. The tracker keeps both numbers, which is what makes the block reviewable later.',
      'Use “Load into session” to hand the day’s lifts to Strength so you do not retype them.',
    ],
    keywords: ['hypertrophy', '12 week', 'ppl', 'push pull legs', 'block', 'phase'],
  },
  pickleball: {
    why: 'A pickleball session is a match record — format, partner, games won and lost — and none of that survives being logged as a duration.',
    how: [
      'Log the session: singles or doubles, games won and lost, duration, RPE.',
      'Read win % and the win-rate trend rather than the session count. Playing more is not the same as playing better.',
      'Read the physio notes before you decide to play through something.',
    ],
    keywords: ['sport', 'match', 'games', 'win rate', 'doubles', 'singles', 'partner'],
  },
  pullups: {
    why: 'A pull-up session is a workout, but this page is the program, the calculator and the manual — none of which fit behind a duration field.',
    how: [
      'Enter your current max. It sets your training set, your ladder and your pyramid for you.',
      'Record a session in the scheme’s own words — “three ladders to four” — and it stores the real sets underneath.',
      'Work the manual below when you stall: form, the ability ladder, fourteen workout formats, nine progressions with demos.',
    ],
    keywords: ['pull up', 'chin up', 'bodyweight', 'ladder', 'pyramid', 'emom', 'progression'],
  },
  coaching: {
    why: 'Tracking tells you what happened. A curriculum tells you what to do on Tuesday, which is the harder and more useful question.',
    how: [
      'Find your level on the skill ladder honestly (2.0 → 4.5+) before picking a week.',
      'Start the 12-week beginner→4.0 program to track your week against a day-by-day schedule.',
      'Pull drills from the library by the skill you are missing, not the one you enjoy.',
    ],
    keywords: ['academy', 'drills', 'curriculum', 'skill ladder', 'mental game', 'pickleball coaching'],
  },
  nutrition: {
    why: 'A calorie total cannot tell you the day was wrong. The ratio between protein, carbs and fat can.',
    how: [
      'Pick foods from the library (American and Indian staples), or set calories and macros directly.',
      'Read the macro bar against the target ratio rather than the totals.',
      'Log as you eat. A day reassembled from memory at 11pm is fiction with decimal places.',
    ],
    keywords: ['food', 'macros', 'calories', 'protein', 'carbs', 'fat', 'diet', 'eating'],
  },
  challenges: {
    why: 'A fixed-length discipline with rules is a different animal from a habit, and pretending otherwise is why most attempts at 75 Hard end quietly.',
    how: [
      'Pick 75 Hard, 75 Soft, the 90-day block, or write your own rules.',
      'Check in against each day’s rules — the ring and the week calendar do the counting.',
      'Choose strict mode deliberately: it resets you to Day 1 on a miss, which is either the point or the thing that ends the attempt.',
    ],
    keywords: ['75 hard', '90 day', 'discipline', 'streak', 'challenge'],
  },
  nofap: {
    why: 'A streak counter with nowhere to write the relapse is a counter you stop opening after the first bad day.',
    how: [
      'Turn it on in Settings → Profile. It is off unless you ask for it.',
      'Read the current streak beside the personal best; milestones mark the ones worth noticing.',
      'Use the urge counter when it passes, and the relapse log when it does not. There is no judgement written into either.',
    ],
    keywords: ['recovery', 'abstinence', 'nofap', 'urges', 'relapse', 'milestones'],
  },
  cycle: {
    why: 'A basal-temperature record is only useful as an unbroken line — a missed week is a gap that cannot be filled in later.',
    how: [
      'Turn it on in Settings → Profile.',
      'Enter today’s temperature. It honours the °F/°C unit you set.',
      'Add free-form flags for anything worth remembering. Nothing here is predicted, scored or shared.',
    ],
    keywords: ['period', 'fertility', 'temperature', 'bbt', 'phase', 'menstrual'],
  },
  mindset: {
    why: 'How you talk to yourself about a bad week decides whether there is a good one after it — and that is trainable.',
    how: [
      'Browse the principles across focus, resilience, growth, composure, confidence, discipline and connection.',
      'Pick two or three to actively work on. Ten is the same as none.',
      'Write how you will apply each in your own words. A principle you cannot phrase yourself is one you have not taken.',
    ],
    keywords: ['mental', 'psychology', 'resilience', 'discipline', 'composure', 'thinking'],
  },
  reading: {
    why: 'Three shelves is the entire model — what you want, what you are inside, what you finished — and it is enough.',
    how: [
      'Add a book to want-to-read the moment you hear about it.',
      'Move it to reading and nudge the page count; the progress bar is what gets books finished.',
      'Rate it 1–5 on the way out. Set a yearly goal and pages and books roll up into Insights and Goals.',
    ],
    keywords: ['books', 'shelf', 'pages', 'rating', 'library'],
  },
  collections: {
    why: 'Not everything belongs to a date. A collection is the page for everything that does not.',
    how: [
      'Open the Future Log to see everything you have dated ahead of today, in one list.',
      'Keep birthdays and people here rather than scattered through daily entries where you will never find them again.',
      'Make a custom collection — a book list, a packing list, a project — using the same bullets as Today.',
    ],
    keywords: ['future log', 'lists', 'birthdays', 'friends', 'contacts', 'custom pages'],
  },
  focus: {
    why: 'Deep work never shows up in a habit grid, because the number that matters is not that it happened but how it went.',
    how: [
      'Log a coding session: time, project, flow, stress, interruptions, languages.',
      'Read the weekly hours and the minutes chart rather than the streak.',
      'Check the focus↔stress insight. It is the one on this page that changes what you do next week.',
    ],
    keywords: ['deep work', 'coding', 'flow', 'pomodoro', 'interruptions', 'developer', 'work'],
  },
  insights: {
    why: 'A journal you never read back is a diary, not a tool. This is the page that reads it back to you — and some things are only visible as a shape, which is why every chart lives here too.',
    how: [
      'Pick a domain chip first — Overview, Mood & sleep, Habits, Body, Tasks, Records. It is faster than scrolling, and the count on each chip tells you what is down there.',
      'Scan the activity heatmap before anything else. The empty weeks are the finding.',
      'Read the correlation matrix. A weak cell is a result: "sleep does nothing for my mood" is exactly what a list of strong correlations can never tell you.',
      'Search once for both — the box matches your entries AND the panels on this page, so "sleep debt" finds the chart and "gym" finds the entries.',
      'Run the Weekly Review once a week: migrate → review → reflect, in that order.',
    ],
    keywords: ['search', 'filter', 'sort', 'streaks', 'weekly review', 'correlation', 'charts', 'analytics', 'heatmap', 'scatter', 'radar', 'year in pixels', 'stats', 'index', 'reflection'],
  },
  homeworkout: {
    why: '“No equipment” is the most common reason a session does not happen. This removes the excuse rather than arguing with it.',
    how: [
      'Reach it from Fitness → Bodyweight exercise library.',
      'Pick exercises — each has its target muscle, how-to cues and a demo video.',
      'Log reps, sets and time. It feeds your Fitness totals and history like any other session.',
    ],
    keywords: ['bodyweight', 'no equipment', 'home', 'calisthenics', 'demos'],
  },
  account: {
    why: 'There is no account here. This page exists to say so — and to offer the one thing an account is normally for: getting this journal onto a second device.',
    how: [
      'Set a local name and face. It is stored in this journal, on this device, and checked against nothing.',
      'Turn on end-to-end encrypted sync with a single passphrase only if you want this journal elsewhere.',
      'To lock the journal itself, use the passcode in Settings → Sync & privacy. That is a different thing from sync.',
    ],
    keywords: ['login', 'sign in', 'sync', 'passphrase', 'devices', 'profile'],
  },
  settings: {
    why: 'Your journal lives in this browser and nowhere else. Nothing else in this app matters if you have not exported a backup.',
    how: [
      'Export JSON today, and again every month. Clearing browser data deletes the journal, and there is no copy to ask anyone for.',
      'Set units, theme and the journal feel — paper texture, handwriting, accent, and which cards Today shows.',
      'Turn on the Cycle or Recovery tracker here if you want them. Both are off unless you ask.',
      '“Load demo data” fills about thirty days of samples so every chart has something in it. It replaces the current journal, and offers you a backup first.',
    ],
    keywords: ['export', 'import', 'backup', 'theme', 'dark mode', 'units', 'privacy', 'passcode', 'demo data', 'reminders'],
  },
}

export interface GuideCard {
  view: ViewId
  /** From `VIEW_CHROME` — never written twice. */
  title: string
  subtitle?: string
  /** What it is. `VIEW_CHROME[view].help`, the app's single source for this. */
  what: string
  why: string
  how: string[]
  /** Which nav section it lives under, or `setup` for Account and Settings. */
  group: SectionId | 'setup'
  groupLabel: string
  /** The tab's own label, which is not always the page title — `nofap` is "Recovery". */
  navLabel: string
}

const GROUP_LABEL: Record<SectionId | 'setup', string> = {
  today: 'Today',
  plan: 'Plan',
  body: 'Body',
  mind: 'Mind',
  insights: 'Insights',
  setup: 'Your journal',
}

/** Tab labels, keyed by view, read off the nav rather than re-typed. */
const NAV_LABEL: Partial<Record<ViewId, string>> = (() => {
  const m: Partial<Record<ViewId, string>> = {}
  for (const s of SECTIONS) for (const t of s.tabs) m[t.view] = t.label
  return m
})()

/**
 * Every navigable view, in nav order, with Home workout after its section's
 * tabs and Account/Settings last. Built once at module load — it is a pure
 * function of three constants and never changes at runtime.
 */
export const GUIDE: GuideCard[] = (() => {
  const ordered: ViewId[] = [
    ...SECTIONS.flatMap((s) => s.tabs.map((t) => t.view)),
    'homeworkout',
    ...SETUP,
  ]
  return ordered.flatMap((view) => {
    const entry = ENTRIES[view]
    const chrome = VIEW_CHROME[view]
    // A view with no entry is a bug `guide.test.ts` catches at build time. At
    // runtime, skip it — a missing paragraph is not a reason to white-screen
    // somebody's journal.
    if (!entry || !chrome?.help) return []
    const group = SETUP.includes(view) ? 'setup' : (MEMBERS[view] ?? 'setup')
    return [{
      view,
      title: chrome.title,
      subtitle: chrome.subtitle,
      what: chrome.help,
      why: entry.why,
      how: entry.how,
      group,
      groupLabel: GROUP_LABEL[group],
      navLabel: NAV_LABEL[view] ?? chrome.title,
    }]
  })
})()

/** The groups in nav order, each with its cards. Empty groups are dropped. */
export function guideByGroup(cards: GuideCard[] = GUIDE) {
  const order: (SectionId | 'setup')[] = [...SECTIONS.map((s) => s.id), 'setup']
  return order
    .map((id) => ({ id, label: GROUP_LABEL[id], cards: cards.filter((c) => c.group === id) }))
    .filter((g) => g.cards.length > 0)
}

/**
 * Substring search over everything a card holds, plus its keywords.
 *
 * Deliberately not fuzzy. The corpus is twenty-four cards; a fuzzy matcher over
 * a corpus that small returns most of it for most queries, which is the same as
 * returning nothing. Multi-word queries match on ALL words across ANY field —
 * "log workout" has to find Fitness even though no single field holds the
 * phrase.
 */
export function searchGuide(query: string): GuideCard[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return GUIDE
  return GUIDE.filter((c) => {
    const hay = [
      c.title, c.navLabel, c.subtitle ?? '', c.what, c.why, c.how.join(' '), c.groupLabel,
      (ENTRIES[c.view]?.keywords ?? []).join(' '),
    ].join(' ').toLowerCase()
    return words.every((w) => hay.includes(w))
  })
}

// ── Tutorials ───────────────────────────────────────────────────────────────

export interface TutorialStep {
  title: string
  body: string
  /** Where to go to do it. Omitted when the step is a decision, not a screen. */
  to?: ViewId
}

export interface Tutorial {
  id: string
  title: string
  /** What you will have at the end — an outcome, not a topic list. */
  blurb: string
  /** Honest, not aspirational. */
  effort: string
  steps: TutorialStep[]
}

/**
 * Three tutorials at three time-scales, because the failure mode of a journal
 * is not "I could not find the button" — it is abandonment in week two.
 *
 * The first-run tour (`components/Onboarding.tsx`) shows four cards once and is
 * dismissed forever. These stay, and can be picked up on day nine when the
 * question is no longer "what is this" but "what do I do with it now".
 */
export const TUTORIALS: Tutorial[] = [
  {
    id: 'first-five-minutes',
    title: 'Your first five minutes',
    blurb: 'One day logged end to end, so the app has something real in it.',
    effort: '5 minutes, once',
    steps: [
      {
        title: 'Load the demo and look around',
        body: 'Settings → Demo & reset → Load demo data fills about thirty days, so every chart has something in it. Do this before you write anything of your own: it replaces the journal.',
        to: 'settings',
      },
      {
        title: 'Write three lines in Today',
        body: 'One task, one event, one note. Type "t buy milk", then "e dentist 3pm", then "n slept badly". Enter after each.',
        to: 'today',
      },
      {
        title: 'Close a task',
        body: 'Click the · glyph beside a task and it becomes ✕. Click again to cycle through migrated and dropped. The status is the glyph — there is no separate checkbox anywhere in this app.',
        to: 'today',
      },
      {
        title: 'Rate the day',
        body: 'Set mood, stress and sleep on the 0–10 scales. Three taps. These are what every correlation and chart is built from, so a day without them is a blank in Stats.',
        to: 'today',
      },
      {
        title: 'Export a backup',
        body: 'Settings → Data → Export JSON. Your journal exists only in this browser. Do it now, while it costs nothing, so the habit is in place before the journal is worth losing.',
        to: 'settings',
      },
    ],
  },
  {
    id: 'first-week',
    title: 'Your first week',
    blurb: 'A daily loop that survives a bad day, and two habits you can actually see.',
    effort: 'about a minute a day',
    steps: [
      {
        title: 'Pick two habits. Two.',
        body: 'Trackers → add habit. Two is not a soft start, it is the right number — a grid with eleven rows is a grid you stop filling in on day four.',
        to: 'trackers', // redirects to Today → Habits
      },
      {
        title: 'Anchor the log to something you already do',
        body: 'Decide when you write: with coffee, or before bed. A journal with no fixed time is one you do at 1am once a week and then stop.',
      },
      {
        title: 'Tick the grid and rate the day, every day',
        body: 'Tap the habit cells, set mood/stress/sleep. Under a minute. Skipping the written entries is fine; skipping the three numbers is what leaves holes in every chart later.',
        to: 'trackers', // redirects to Today → Habits
      },
      {
        title: 'Log one session of whatever you train',
        body: 'Fitness for anything timed, Strength for sets and reps. One session is enough to make the week view mean something.',
        to: 'fitness',
      },
      {
        title: 'On day seven, run the Weekly Review',
        body: 'Insights → Weekly Review walks you through migrate → review → reflect. This is the step that turns a pile of entries into something you have actually read.',
        to: 'insights',
      },
    ],
  },
  {
    id: 'first-month',
    title: 'Your first month',
    blurb: 'The migration ritual, the charts that finally have enough data, and a backup you trust.',
    effort: 'twenty minutes at month end',
    steps: [
      {
        title: 'Migrate, and drop things on purpose',
        body: 'Plan → work the overdue list. Move each task to today or tomorrow, or drop it. Dropping is not failure: a task carried for five weeks was never going to happen, and was costing you attention every time you read past it.',
        to: 'plan',
      },
      {
        title: 'Read the heatmap before anything else',
        body: 'Insights → filter to Habits → activity heatmap. The empty weeks are the finding. Everything else on that page is detail about the weeks that were not empty.',
        to: 'insights',
      },
      {
        title: 'Check the sleep↔mood scatter',
        body: 'Insights → filter to Mood & sleep. Thirty days is roughly where this becomes readable. Most people are confidently wrong about their own answer, which is the reason to look rather than guess.',
        to: 'insights',
      },
      {
        title: 'Set the new month up',
        body: 'Monthly → record where you are, what you want from the month, and the photo. Two minutes, and it is what makes the month findable a year from now.',
        to: 'monthly',
      },
      {
        title: 'Export again, and keep the file',
        body: 'Settings → Export JSON, and Export Markdown if you want it readable in Obsidian or Logseq. A monthly export is the entire backup strategy, and it is yours to run — no server is holding a copy.',
        to: 'settings',
      },
    ],
  },
]
