import { useState } from 'react'
import { Card, Input } from '../components/ui'
import { Page } from '../components/shell/Page'
import { useNav } from '../components/shell/nav'
import { cat } from '../lib/colors'
import {
  pullupAbility, ladder, pyramid, PULLUP_WORKOUTS, PULLUP_PROGRESSIONS, PULLUP_ABILITY,
} from '../lib/programs'

/**
 * Dedicated pull-up hub: your ability/training-set calculator, the workout-format
 * library, and the progression exercises. The trackable multi-week pull-up program
 * lives in the Gym's program tracker (logging happens there).
 */
export function Pullups() {
  const navigate = useNav()
  return (
    <Page aside={<PullupGuideCard />}>
      <Card title="Pull-up ability ladder" subtitle="Where you stand → what to train (max strict pull-ups)">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-overlay0">
                <th className="py-1 pr-3 font-normal">Group</th>
                <th className="py-1 pr-3 font-normal">Max</th>
                <th className="py-1 pr-3 font-normal">Set</th>
                <th className="py-1 pr-3 font-normal">Daily</th>
                <th className="py-1 font-normal">Weekly</th>
              </tr>
            </thead>
            <tbody>
              {PULLUP_ABILITY.map((a) => (
                <tr key={a.group} className="border-t border-surface0">
                  <td className="py-1.5 pr-3 text-subtext1">{a.group}</td>
                  <td className="py-1.5 pr-3 text-overlay1">{a.range}</td>
                  <td className="py-1.5 pr-3" style={{ color: cat('mauve') }}>{a.trainingSet}</td>
                  <td className="py-1.5 pr-3 text-overlay1">{a.daily}</td>
                  <td className="py-1.5 text-overlay1">{a.weekly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-overlay0">
          Want the structured 6-week program with day-by-day check-off?{' '}
          <button onClick={() => navigate('gym')} className="text-mauve hover:underline">Open it in the Gym tracker →</button>
        </p>
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <PullupWorkoutsCard />
        <ProgressionsCard />
      </div>
    </Page>
  )
}

/** Library of pull-up workout formats (Ladders, Pyramids, EMOMs, …). */
function PullupWorkoutsCard() {
  const [open, setOpen] = useState<string | null>(PULLUP_WORKOUTS[0].name)
  return (
    <Card title="Pull-up workouts" subtitle="Session formats — tap one for how to run it">
      <ul className="space-y-1">
        {PULLUP_WORKOUTS.map((w) => {
          const isOpen = open === w.name
          return (
            <li key={w.name} className="border-t border-surface0 first:border-t-0">
              <button onClick={() => setOpen(isOpen ? null : w.name)} className="flex w-full items-center justify-between py-1.5 text-left text-sm">
                <span className={isOpen ? 'text-text' : 'text-subtext1'}>{w.name}</span>
                <span className="text-[10px] text-overlay0">{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div className="pb-2 text-xs text-subtext0">
                  <p className="text-overlay1">{w.profile}</p>
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

/** How to build toward a first pull-up — progression exercises with form cues. */
function ProgressionsCard() {
  return (
    <Card title="Pull-up progressions" subtitle="Build the first rep safely — why & how for each">
      <ul className="space-y-2">
        {PULLUP_PROGRESSIONS.map((p) => (
          <li key={p.name} className="border-t border-surface0 pt-2 first:border-t-0 first:pt-0">
            <p className="text-sm text-subtext1">{p.name}</p>
            <p className="text-xs text-overlay1"><span className="text-mauve">Why:</span> {p.why}</p>
            <p className="text-xs text-subtext0"><span className="text-green">How:</span> {p.how}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** Pull-up training guide: your max → ability group, training set & rep schemes. */
function PullupGuideCard() {
  const [max, setMax] = useState('5')
  const n = Number(max) || 0
  const a = pullupAbility(n)
  const set = a.trainingSet
  return (
    <Card title="Pull-up training set" subtitle="From your max strict pull-ups">
      <label className="mb-3 flex items-center justify-between text-sm text-subtext1">
        Max strict pull-ups
        <Input type="number" value={max} onChange={(e) => setMax(e.target.value)} className="w-20 py-1 text-right" />
      </label>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-overlay0">Ability</span><span className="text-subtext1">{a.group} ({a.range})</span></div>
        <div className="flex justify-between"><span className="text-overlay0">Training set</span><span style={{ color: cat('mauve') }}>{set} rep{set === 1 ? '' : 's'}/set</span></div>
        <div className="flex justify-between"><span className="text-overlay0">Ladder</span><span className="font-mono text-subtext1">{ladder(set).join(', ')}</span></div>
        <div className="flex justify-between"><span className="text-overlay0">Pyramid</span><span className="font-mono text-subtext1">{pyramid(set).join(', ')}</span></div>
        <div className="flex justify-between border-t border-surface0 pt-1.5"><span className="text-overlay0">Daily</span><span className="text-subtext1">{a.daily}</span></div>
        <div className="flex justify-between"><span className="text-overlay0">Weekly</span><span className="text-subtext1">{a.weekly}</span></div>
      </div>
    </Card>
  )
}
