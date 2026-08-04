import { useState } from 'react'
import { Card, Input } from '../components/ui'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { Page } from '../components/shell/Page'
import { CardGrid } from '../components/shell/CardGrid'
import { ProgramTracker } from '../components/ProgramTracker'
import { VideoLink } from '../components/VideoLink'
import { cat } from '../lib/colors'
import {
  pullupAbility, ladder, pyramid, PULLUP_WORKOUTS, PULLUP_PROGRESSIONS, PULLUP_ABILITY,
} from '../lib/programs'

/**
 * Dedicated pull-up hub: the "Starting From Zero" program tracker, your
 * ability/training-set calculator (right rail), the ability ladder, the
 * workout-format library, and the progression exercises · laid out to minimise
 * scrolling, with the data-entry calculator pinned on the right.
 */
export function Pullups() {
  return (
    <Page width="wide">
      {/* Three across: the program and the ability calculator were two 620px
          cards of near-identical weight, stacked. */}
      <CardGrid>
      {/* 1) The trackable program is the headline · check off days right here. */}
      <ProgramTracker only="pullup-zero" />

      {/* 2) Your personalised training set (pulled in from the rail), with the
          ability-ladder reference merged in beside the calculator it supports. */}
      <PullupGuideCard />

      {/* 3) Static reference · session formats + progressions, collapsed below. */}
      <CollapsibleSection title="Reference" subtitle="Workout formats & progression exercises">
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <PullupWorkoutsCard />
          <ProgressionsCard />
        </div>
      </CollapsibleSection>
      </CardGrid>
    </Page>
  )
}

/** Reference: ability group → training set + daily/weekly volume targets.
 *  Rendered inside the training-set guide it supports. */
function AbilityLadderTable() {
  return (
    <div className="mt-4 border-t border-line pt-3">
      <p className="mb-2 text-label text-fg-1">Ability ladder <span className="text-fg-2">· max strict pull-ups → what to train</span></p>
      <table className="w-full text-left text-label">
        <thead>
          <tr className="text-fg-2">
            <th className="py-1 pr-2 font-normal">Group</th>
            <th className="py-1 pr-2 font-normal">Max</th>
            <th className="py-1 pr-2 font-normal">Set</th>
            <th className="py-1 font-normal">Weekly</th>
          </tr>
        </thead>
        <tbody>
          {PULLUP_ABILITY.map((a) => (
            <tr key={a.group} className="border-t border-line">
              <td className="py-1 pr-2 text-fg-1">{a.group}</td>
              <td className="py-1 pr-2 text-fg-2">{a.range}</td>
              <td className="py-1 pr-2" style={{ color: cat('mauve') }}>{a.trainingSet}</td>
              <td className="py-1 text-fg-2">{a.weekly}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Library of pull-up workout formats (Ladders, Pyramids, EMOMs, …). */
function PullupWorkoutsCard() {
  const [open, setOpen] = useState<string | null>(PULLUP_WORKOUTS[0].name)
  return (
    <Card title="Pull-up workouts" subtitle="Session formats, tap one for how to run it">
      <ul className="space-y-1">
        {PULLUP_WORKOUTS.map((w) => {
          const isOpen = open === w.name
          return (
            <li key={w.name} className="border-t border-line first:border-t-0">
              <button onClick={() => setOpen(isOpen ? null : w.name)} aria-expanded={isOpen} className="flex w-full items-center justify-between py-1.5 text-left text-body">
                <span className={isOpen ? 'text-fg-1' : 'text-fg-1'}>{w.name}</span>
                <span className="caret-turn caret-turn-quarter inline-block text-micro text-fg-2" data-open={isOpen}>▸</span>
              </button>
              {isOpen && (
                <div className="collapse-in pb-2 text-label text-fg-2">
                  <p className="text-fg-2">{w.profile}</p>
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

/** How to build toward a first pull-up · progression exercises with form cues. */
function ProgressionsCard() {
  return (
    <Card title="Pull-up progressions" subtitle="Build the first rep safely, why & how for each">
      <ul className="space-y-2">
        {PULLUP_PROGRESSIONS.map((p) => (
          <li key={p.name} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-body text-fg-1">{p.name}</p>
              <VideoLink name={p.name} size="sm" />
            </div>
            <p className="text-label text-fg-2"><span className="text-mauve">Why:</span> {p.why}</p>
            <p className="text-label text-fg-2"><span className="text-green">How:</span> {p.how}</p>
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
      <label className="mb-3 flex items-center justify-between text-body text-fg-1">
        Max strict pull-ups
        <Input type="number" value={max} onChange={(e) => setMax(e.target.value)} className="w-20 py-1 text-right" />
      </label>
      <div className="space-y-1.5 text-body">
        <div className="flex justify-between"><span className="text-fg-2">Ability</span><span className="text-fg-1">{a.group} ({a.range})</span></div>
        <div className="flex justify-between"><span className="text-fg-2">Training set</span><span style={{ color: cat('mauve') }}>{set} rep{set === 1 ? '' : 's'}/set</span></div>
        <div className="flex justify-between"><span className="text-fg-2">Ladder</span><span className="font-mono text-fg-1">{ladder(set).join(', ')}</span></div>
        <div className="flex justify-between"><span className="text-fg-2">Pyramid</span><span className="font-mono text-fg-1">{pyramid(set).join(', ')}</span></div>
        <div className="flex justify-between border-t border-line pt-1.5"><span className="text-fg-2">Daily</span><span className="text-fg-1">{a.daily}</span></div>
        <div className="flex justify-between"><span className="text-fg-2">Weekly</span><span className="text-fg-1">{a.weekly}</span></div>
      </div>
      <AbilityLadderTable />
    </Card>
  )
}
