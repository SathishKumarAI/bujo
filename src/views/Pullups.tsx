import { useState } from 'react'
import { Card, Input } from '../components/ui'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { Page } from '../components/shell/Page'
import { CardGrid } from '../components/shell/CardGrid'
import { ProgramTracker } from '../components/ProgramTracker'
import { VideoLink } from '../components/VideoLink'
import { cat } from '../lib/colors'
import {
  pullupAbility, ladder, pyramid, PULLUP_ABILITY,
} from '../lib/pullups'

/**
 * Enhanced pull-up hub with training guide content: volume tracking, performance tips,
 * training principles, equipment guide, progression exercises.
 */
export function Pullups() {
  return (
    <Page width="wide" className="gap-0 sm:gap-0">
      <CardGrid>
        {/* DATA-FIRST LAYOUT */}

        {/* 1) Program tracker - headline action */}
        <ProgramTracker only="pullup-zero" />

        {/* 2) Training guide & ability calculator */}
        <PullupGuideCard />

        {/* 3a) Volume tracking card - what you should be doing today */}
        <VolumeTrackerCard />

        {/* 3b) Performance tips card - form standards */}
        <PerformanceTipsCard />

        {/* 4) Training principles - educational content */}
        <TrainingPrinciplesCard />

        {/* 5) Progression exercises with video links */}
        <ProgressionsCard />

        {/* 6) Equipment guide */}
        <EquipmentGuideCard />

        {/* 7) Static reference - collapsed section */}
        <CollapsibleSection
          title="Reference"
          subtitle="Workout formats & rep schemes"
        >
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <PullupWorkoutsCard />
            <EquipmentTable />
          </div>
        </CollapsibleSection>

        {/* 8) History - view past workouts */}
        <EmptyHistoryCard />
      </CardGrid>
    </Page>
  )
}

/** Training set calculator from max pull-ups */
function PullupGuideCard() {
  const [max, setMax] = useState('5')
  const n = Number(max) || 0
  const a = pullupAbility(n)
  const set = a.trainingSet

  return (
    <Card band title="Training Set Calculator" subtitle="From your max strict pull-ups">
      <label className="mb-3 flex items-center justify-between text-body text-fg-1">
        Max strict pull-ups
        <Input type="number" value={max} onChange={(e) => setMax(e.target.value)} className="w-20 py-1 text-right" />
      </label>
      <div className="space-y-1.5 text-body">
        <div className="flex justify-between"><span className="text-fg-2">Ability</span><span className="text-fg-1">{a.group} ({a.range})</span></div>
        <div className="flex justify-between"><span className="text-fg-2">Training set</span><span style={{ color: cat('mauve') }}>{set} rep{set === 1 ? '' : 's'}/set</span></div>
        <div className="flex justify-between"><span className="text-fg-2">Ladder scheme</span><span className="font-mono text-fg-1">{ladder(set).join(', ')}</span></div>
        <div className="flex justify-between"><span className="text-fg-2">Pyramid scheme</span><span className="font-mono text-fg-1">{pyramid(set).join(', ')}</span></div>
        <div className="flex justify-between border-t border-line pt-1.5"><span className="text-fg-2">Daily volume</span><span className="text-fg-1">{a.daily}</span></div>
        <div className="flex justify-between"><span className="text-fg-2">Weekly volume</span><span className="text-fg-1">{a.weekly}</span></div>
      </div>
    </Card>
  )
}

/** Volume guidelines based on max level */
function VolumeTrackerCard() {
  const a = pullupAbility(5)

  return (
    <Card band title="Volume Guidelines" subtitle={`${a.daily} daily · ${a.weekly} weekly`}>
      <p className="text-label text-fg-2 mb-2">Target volume by max level:</p>
      <div className="space-y-1.5 text-label text-fg-2">
        {PULLUP_ABILITY.map((level) => (
          <div key={level.group} className="flex justify-between border-b border-line py-1 last:border-b-0">
            <span>{level.group}</span>
            <span>Daily: {level.daily}</span>
            <span>Weekly: {level.weekly}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-micro text-fg-2">
        *Track daily/weekly/monthly volume. Example: if 100 pull-ups in a week over 4 days, instead of 25×4, do 22,35,28,15.
      </p>
    </Card>
  )
}

/** Performance tips from training guide */
function PerformanceTipsCard() {
  return (
    <Card band title="Performance Tips" subtitle="Setup & execution form cues">
      <div className="space-y-3 text-label text-fg-2">
        <div>
          <strong className="text-mauve">Set up:</strong> Tuck your pelvis, tighten abs (maintain tightness), mount the bar, tightly grip the bar (with pinky knuckle over top), pull arms down into shoulder sockets, pull shoulders down with lats (opposite of shrugging), squeeze glutes, re-tighten abs if necessary, keep legs straight and head neutral.
        </div>
        <div>
          <strong className="text-mauve">Execution:</strong> Stay tight, lean back, pull with your elbows (not hands), pull your elbows to your ribs, pull chin all way over bar (do not lift chin), lower completely.
        </div>
      </div>
    </Card>
  )
}

/** Training principles from the guide */
function TrainingPrinciplesCard() {
  return (
    <CollapsibleSection
      title="Training Principles"
      subtitle="SAID principle & quality over quantity"
    >
      <ul className="space-y-2 text-label text-fg-2">
        <li>
          <strong className="text-mauve">Specificity:</strong> Do pull-ups and progressions. During sessions, expend energy on the bar, not supplementary exercises.
        </li>
        <li>
          <strong className="text-green">Quality over quantity:</strong> Always strive for perfect quality. The number of repetitions is secondary. Poor quality work prevents maximum benefit. Quality = tight body, legs uncrossed, knees unbent; head neutral, do not jerk/kip; come all way up and down.
        </li>
        <li>
          <strong className="text-blue">Frequency:</strong> Aim for 3-5 times per day, 3-5 days per week. Performing throughout the day allows more reps without burning out.
        </li>
        <li>
          <strong className="text-sky">Volume:</strong> Aim for high volume during most workouts. Too little volume risks insufficient stimulus. Track daily/weekly/monthly volume. As you get stronger and more efficient, increase the volume you accomplish. Vary the volume by doing more on some days and less on others to optimize results.
        </li>
      </ul>
    </CollapsibleSection>
  )
}

/** Progression exercises with video links */
function ProgressionsCard() {
  const progressionItems = [
    { name: 'Partner-assisted', why: 'Full ROM with proper timing, safer than machines', how: 'Spot on mid/upper back while you pull up. Wait until no upward momentum before assisting.' },
    { name: 'Partial ROM Pull-ups', why: 'Target sticking points or build strength where needed', how: 'Bottom position: dead-hang, pull half way up; Top position: chin above bar, pause, lower half way' },
    { name: 'Body-Weight Negatives', why: 'Builds CNS learning and strength exceptionally well', how: 'Start with partner/chair to get chin over bar. Controlled 3-7 second descent.' },
    { name: 'Jumping Pull-ups', why: 'Strengthens explosive concentric power', how: 'Ensure adequate height. Jump up without pause, pull-up, lower slowly and completely.' },
    { name: 'Hanging Leg Raises', why: 'Develops grip, forearm, midsection strength', how: 'Grip bar with arms fully extended. Pull shoulders down/back. Body in hollow position.' },
    { name: 'L-Sits', why: 'Builds static hold strength and core control', how: 'Hollow body from dead-hang. Legs at 90° angle or straight. Hold for 5-10 seconds.' },
    { name: 'Dead-Hangs', why: 'Fundamental grip, forearm, midsection strength', how: 'Neutral hollow-body position. Time how long you can hang. Aim for 15+ seconds.' },
  ]

  return (
    <Card band title="Progression Exercises" subtitle="Build toward first pull-up safely">
      <ul className="space-y-2">
        {progressionItems.map((p) => (
          <li key={p.name} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-body text-fg-1">{p.name}</span>
              <VideoLink name={p.name} size="sm" />
            </div>
            <p className="text-label text-fg-2"><strong>Why:</strong> {p.why}</p>
            <p className="text-label text-fg-2 mt-1"><strong>How:</strong> {p.how}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Equipment guide */
function EquipmentGuideCard() {
  return (
    <Card band title="Equipment Guide" subtitle="Essential gear for pull-up training">
      <ul className="space-y-1 text-label text-fg-2">
        <li><strong>Ideal bar height:</strong> 5'8" - 6'6" (accommodates progressions)</li>
        <li><strong>Door-mounted bars:</strong> Cheap, easy install, low enough for progressions</li>
        <li><strong>Adjustable bars:</strong> 72" or 66" height options available ($500-650)</li>
        <li><strong>Plyo boxes:</strong> Make high bars usable (12", 18", 24", 30", 36")</li>
        <li><strong>Thick bar grips:</strong> Promotes grip strength and forearm training</li>
      </ul>
    </Card>
  )
}

/** Equipment reference table */
function EquipmentTable() {
  const equipmentData = [
    { type: 'Pull-up bar', notes: "Height: 5'8\" - 6'6\"\nDoor-mounted: cheap, easy install\nAdjustable: $500-650", links: ['https://shop.steelfitstore.com', 'https://torqueathletic.com/collections/pullup-systems'] },
    { type: 'Thick grip', notes: 'Promotes forearm training', links: [] },
    { type: 'Plyo boxes', notes: 'Place under high bars (12", 18", 24", 30", 36")', links: [] },
    { type: 'Gymnastics rings/TRX', notes: 'For supplementary exercises', links: [] },
    { type: 'Pull-up bands', notes: 'Optional - part rubber, part cloth (red/black)', links: [] },
  ]

  return (
    <Card band title="Equipment Reference" subtitle="Tools and gear">
      <table className="w-full text-left text-label">
        <thead>
          <tr className="text-fg-2">
            <th className="py-1 pr-2 font-normal">Type</th>
            <th className="py-1 pr-2 font-normal">Notes</th>
            <th className="py-1 font-normal">Links</th>
          </tr>
        </thead>
        <tbody>
          {equipmentData.map((eq) => (
            <tr key={eq.type} className="border-t border-line">
              <td className="py-1 pr-2 text-fg-1">{eq.type}</td>
              <td className="py-1 pr-2 text-fg-2 whitespace-pre-line">{eq.notes}</td>
              <td className="py-1 text-fg-2 text-micro">{eq.links.map((l, i) => (
                <a key={i} href={l.startsWith('http') ? l : 'https://' + l} target="_blank" rel="noreferrer" className="text-blue hover:underline truncate max-w-full block">🔗</a>
              ))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

/** Workout format library */
function PullupWorkoutsCard() {
  const [open, setOpen] = useState<string | null>('Ladder')
  const workouts = [
    { name: 'Ladder', profile: 'Ascending sets: 1,2,3,4... reps\nPavel\'s method for high volume', how: '1 pull-up, add one rep to next set. Recover 10-20 seconds.', rx: '5 sets per ladder', scale: 'Start at top rung of your training set' },
    { name: 'Pyramid', profile: 'Ascending then descending: 1,2,3,4,3,2,1\nHigh volume with structure', how: '1,2,3,2,1 pull-ups. Wait 10-20s between sets.', rx: '3 reps at top', scale: 'Start 1 rep below your training set' },
    { name: 'EMOM', profile: 'Every minute on the minute\nFlexible volume accumulation', how: 'Set work each minute. Rest remainder.', rx: 'Accumulate daily target', scale: 'Adjust to hit goal' },
  ]

  return (
    <Card band title="Workout Formats" subtitle="Session structures">
      <ul className="space-y-1">
        {workouts.map((w) => {
          const isOpen = open === w.name
          return (
            <li key={w.name} className="border-t border-line first:border-t-0">
              <button onClick={() => setOpen(isOpen ? null : w.name)} aria-expanded={isOpen} className="flex w-full items-center justify-between py-1.5 text-left text-body">
                <span className={isOpen ? 'text-fg-1' : 'text-fg-2'}>{w.name}</span>
                <span className="caret-turn caret-turn-quarter inline-block text-micro text-fg-2">▸</span>
              </button>
              {isOpen && (
                <div className="collapse-in pb-2 text-label text-fg-2">
                  <p>{w.profile}</p>
                  <p className="mt-1">{w.how}</p>
                  <p className="mt-1"><span className="text-green">RX:</span> {w.rx} · <span className="text-blue">Scale:</span> {w.scale}</p>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/** Empty history card */
function EmptyHistoryCard() {
  return (
    <Card band title="Workout History" subtitle="Log your workouts to track progress">
      <div className="space-y-3 text-label text-fg-2">
        <Empty>No workouts logged yet.</Empty>
        <p>Tip: Start with straight sets. Once comfortable, try ladders or pyramids for higher volume training.</p>
        <p className="text-micro text-fg-2">See Volume Guidelines card above for your daily/weekly targets based on max pull-ups.</p>
      </div>
    </Card>
  )
}

/** Helper: Empty component */
function Empty({ children }: { children?: React.ReactNode }) {
  if (children) return <div className="text-label text-fg-2">{children}</div>
  return null
}