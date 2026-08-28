import { useMemo, useState } from 'react'
import { useJournal } from '../store'
import { Card, Input, Segmented, Textarea } from '../components/ui'
import { Button } from '../components/ui/button'
import { CollapsibleSection } from '../components/CollapsibleSection'
import { ProgramTracker } from '../components/program'
import { VideoLink } from '../components/VideoLink'
import {
  PageLayout, StatBar, SummaryStrip, CalendarHeatmap, NumField, EmptyFrame,
} from '../components/page'
import { cat } from '../lib/colors'
import { dayDiff, prettyDay, todayISO } from '../lib/date'
import {
  pullupAbility, ladder, pyramid, repScheme, setLines, repsOf, bestSet,
  PULLUP_ABILITY, PULLUP_WORKOUTS, PULLUP_PROGRESSIONS, PULLUP_FORM,
  PULLUP_PRINCIPLES, PULLUP_EQUIPMENT, PULLUP_METHODS, type PullupMethod,
} from '../lib/pullups'

/**
 * PULL-UPS · the training manual, and the place a pull-up session is recorded.
 *
 * A Body tab, not a Fitness companion. The rule `shell/sections.ts` states is
 * "does the target hold anything the Fitness activity form does not", and this
 * holds the six-week program tracker, the ability calculator, the rep-scheme
 * builder and the whole guide — none of which a duration field can carry. It
 * was reachable only by selecting Pull-ups on the Fitness activity picker and
 * then finding a link, which is the same shape of hole Strength and Pickleball
 * were in.
 *
 * On the three-zone contract:
 * - ORIENT  · what to pull today, and what is left in the week.
 * - ACT     · your training set, then the session recorder, then the program.
 *             All three are acts; the calculator is first because it is what
 *             fills the form in.
 * - REVIEW  · history, analytics, and the manual below them.
 *
 * The manual is reference, and the contract says there is no zone 4. It sits at
 * the bottom of REVIEW, collapsed, rather than on a page of its own — this page
 * *is* the manual, and a guide split from the log it teaches you to fill in is
 * a guide nobody opens. Every fold is closed by default so the act stays the
 * top of the page; re-run `npm run a11y` with them OPEN, because axe cannot see
 * inside a closed fold.
 *
 * A session is stored as a plain `Workout` with `activity: 'pullups'` — the
 * scheme is written out one `Pull-up 1xN @ 0kg` line per set, so the existing
 * strength analytics, CSV export and search read it without knowing this page
 * exists. See `lib/pullups.ts` `setLines` for why one line per set.
 */
export function Pullups() {
  const { data, addWorkout, removeWorkout } = useJournal()
  const today = todayISO()

  const sessions = useMemo(
    () => data.workouts.filter((w) => w.activity === 'pullups').sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.workouts],
  )

  // Your max is the biggest set you have logged — a fact, not a field you have
  // to remember to update. The input below overrides it for "what if", and
  // deliberately does not persist: a typed number that outlived the session
  // would quietly outrank the real one.
  const logged = useMemo(() => bestSet(sessions), [sessions])
  const [maxInput, setMaxInput] = useState('')
  const max = maxInput === '' ? logged : Number(maxInput) || 0
  const ability = pullupAbility(max)

  const weekReps = sessions
    .filter((s) => { const d = dayDiff(s.date, today); return d >= 0 && d < 7 })
    .reduce((a, s) => a + repsOf(s.sets), 0)
  const last = sessions[0]

  const facts = [
    { label: 'Training set', value: `${ability.trainingSet} rep${ability.trainingSet === 1 ? '' : 's'}` },
    { label: 'This week', value: `${weekReps} reps` },
    { label: 'Weekly target', value: ability.weekly, prose: true },
    {
      label: 'Last session',
      value: last ? `${repsOf(last.sets)} reps · ${prettyDay(last.date)}` : 'None yet',
      prose: true,
    },
  ]

  const totalReps = sessions.reduce((a, s) => a + repsOf(s.sets), 0)
  const heat = useMemo(
    () => sessions.map((s) => ({ date: s.date, value: repsOf(s.sets) })),
    [sessions],
  )

  return (
    <PageLayout
      tier={1180}
      zone1={<StatBar facts={facts} />}
      zone2={
        <>
          <TrainingSetCard max={max} maxInput={maxInput} onMax={setMaxInput} logged={logged} />
          <LogSessionCard defaultTop={ability.trainingSet} onSave={addWorkout} />
        </>
      }
      zone3={
        <>
          {/* The programme moved out of zone 2. It is 637px of the act column's
              1600, against a review column of 649 — 951px of empty page beside
              a form squeezed into 442px — and it is not the act: "Starting From
              Zero" is a twelve-week plan you check off and read your position
              in, which is reviewing. Measured after the move: 963 against 1286,
              and it reads better at 722px than at 442. */}
          <ProgramTracker only="pullup-zero" />
          <section>
            <h2 className="mb-1 border-b border-line pb-1 text-label text-fg-2">History</h2>
            {sessions.length === 0 ? (
              <EmptyFrame>Log a session and it appears here, newest first.</EmptyFrame>
            ) : (
              <ul>
                {sessions.slice(0, 12).map((w) => (
                  <li key={w.id} className="group flex items-center justify-between gap-2 border-b border-line py-2 last:border-b-0">
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span className="truncate font-medium text-fg-1">{w.notes.split('\n')[0] || 'Pull-ups'}</span>
                      <span className="shrink-0 text-label text-fg-2">{prettyDay(w.date)}</span>
                    </span>
                    <span className="num flex shrink-0 items-center gap-2 text-label text-fg-2">
                      <span>{repsOf(w.sets)} reps</span>
                      {w.durationMin != null && <span>{w.durationMin}m</span>}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeWorkout(w.id)}
                        aria-label={`Delete pull-up session on ${prettyDay(w.date)}`}
                        className="text-fg-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red"
                      >×</Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-1 border-b border-line pb-1 text-label text-fg-2">Analytics</h2>
            <SummaryStrip items={[
              { label: 'Sessions', value: sessions.length, empty: sessions.length === 0 },
              { label: 'Total reps', value: totalReps, empty: sessions.length === 0 },
              { label: 'Best set', value: logged, empty: logged === 0 },
            ]} />
            {/* Same stranded grid as Fitness — measured at 188px in a 708px
                column — and the same fix. See `DayGrid`'s `fluid`. */}
            <div className="mt-3">
              <CalendarHeatmap weeks={26} fluid data={heat} unit="reps" label="Pull-up reps per day over the last twenty-six weeks" />
            </div>
          </section>

          <Manual />
        </>
      }
    />
  )
}

/** Zone 2 · max strict pull-ups → the set, the schemes and the volume target. */
function TrainingSetCard({
  max, maxInput, onMax, logged,
}: {
  max: number
  maxInput: string
  onMax: (v: string) => void
  logged: number
}) {
  const a = pullupAbility(max)
  const set = a.trainingSet
  return (
    <Card band title="Your training set" subtitle={`${a.group} · max ${a.range}`}>
      <label className="mb-3 flex items-center justify-between gap-3 text-body text-fg-1">
        Max strict pull-ups
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          value={maxInput}
          placeholder={String(logged)}
          onChange={(e) => onMax(e.target.value)}
          className="num w-20 py-1 text-right"
        />
      </label>
      <div className="space-y-1.5 text-body">
        <Row label="Training set"><span style={{ color: cat('mauve') }}>{set} rep{set === 1 ? '' : 's'}/set</span></Row>
        <Row label="Ladder"><span className="num text-fg-1">{ladder(set).join(', ')}</span></Row>
        <Row label="Pyramid"><span className="num text-fg-1">{pyramid(set).join(', ')}</span></Row>
        <Row label="Daily" divide><span className="text-fg-1">{a.daily}</span></Row>
        <Row label="Weekly"><span className="text-fg-1">{a.weekly}</span></Row>
      </div>
      {logged === 0 && maxInput === '' && (
        <p className="mt-3 text-label text-fg-2">
          Nothing logged yet, so this reads as a beginner. Type your max above, or log a set and it takes the number from your history.
        </p>
      )}
    </Card>
  )
}

function Row({ label, children, divide = false }: { label: string; children: React.ReactNode; divide?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${divide ? 'border-t border-line pt-1.5' : ''}`}>
      <span className="text-fg-2">{label}</span>
      {children}
    </div>
  )
}

/**
 * Zone 2 · the act. Method + top set + rounds is the whole session, because
 * that is how these workouts are actually prescribed — "three ladders to four"
 * is one sentence and six numbers, and typing the six numbers is the reason
 * nobody logs them.
 *
 * There is no rest field. Rest is prescribed by the method (10–20s inside a
 * ladder, 3+ min between) and `Workout` has nowhere to put it; the minutes the
 * session took is a real field and feeds the analytics, so that is asked
 * instead.
 */
function LogSessionCard({
  defaultTop, onSave,
}: {
  defaultTop: number
  onSave: (w: Parameters<ReturnType<typeof useJournal>['addWorkout']>[0]) => void
}) {
  const [date, setDate] = useState(todayISO())
  const [method, setMethod] = useState<PullupMethod>('straight')
  const [top, setTop] = useState('')
  const [rounds, setRounds] = useState('3')
  const [duration, setDuration] = useState('')
  const [rpe, setRpe] = useState('')
  const [notes, setNotes] = useState('')

  const topN = top === '' ? defaultTop : Number(top) || 0
  const reps = repScheme(method, topN, Number(rounds) || 0)
  const total = reps.reduce((a, r) => a + r, 0)
  const hint = PULLUP_METHODS.find((m) => m.value === method)?.hint ?? ''

  function save() {
    if (reps.length === 0) return
    onSave({
      date,
      activity: 'pullups',
      durationMin: duration ? Number(duration) : undefined,
      rpe: rpe ? Number(rpe) : undefined,
      sets: setLines(reps),
      notes: notes.trim(),
    })
    setTop('')
    setDuration('')
    setRpe('')
    setNotes('')
  }

  return (
    <Card band title="Log a pull-up session" subtitle={hint}>
      <div className="space-y-3">
        <label className="block text-body text-fg-1">
          Date
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="control-max mt-1" />
        </label>

        <div>
          <span className="mb-1 block text-body text-fg-1" id="pullup-method">Method</span>
          <div aria-labelledby="pullup-method">
            <Segmented
              value={method}
              onChange={setMethod}
              options={PULLUP_METHODS.map((m) => ({ value: m.value, label: m.label }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumField label="Top set" value={top} onChange={setTop} suffix="reps" placeholder={String(defaultTop)} />
          <NumField label={method === 'emom' ? 'Minutes' : 'Rounds'} value={rounds} onChange={setRounds} suffix="×" />
          <NumField label="Duration" value={duration} onChange={setDuration} suffix="min" />
          <NumField label="Effort" value={rpe} onChange={setRpe} suffix="rpe" step="0.5" />
        </div>

        {/* The scheme, spelled out. A ladder to 4 and a straight 4×4 both read
            as "4" in the form and are different sessions; showing the reps is
            what makes the difference visible before it is stored. */}
        <p className="num text-label text-fg-2" aria-live="polite">
          {reps.length === 0
            ? 'Set a top set and rounds to see the scheme.'
            : `${reps.join(', ')} · ${total} reps in ${reps.length} sets`}
        </p>

        <label className="block text-body text-fg-1">
          Notes
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Grip, how the last set felt…" className="mt-1" />
        </label>

        <Button onClick={save} disabled={reps.length === 0} className="w-full">Log session</Button>
      </div>
    </Card>
  )
}

/**
 * Zone 3 · the guide, every section collapsed. Six folds rather than six cards:
 * this is what you read once and come back to twice, and it should not push
 * the history and the calendar off the screen every day in between.
 */
function Manual() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-label text-fg-2">Manual</h2>

      <CollapsibleSection variant="quiet" defaultOpen={false} stickyKey="pullups.form" title="Form" subtitle="Set-up & execution">
        <div className="space-y-3">
          {PULLUP_FORM.map((f) => (
            <div key={f.phase}>
              <p className="text-body text-fg-1">{f.phase}</p>
              <ul className="mt-1 space-y-1 text-label text-fg-2">
                {f.cues.map((c) => <li key={c}>· {c}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection variant="quiet" defaultOpen={false} stickyKey="pullups.principles" title="Principles" subtitle="How the program is meant to be run">
        <ul className="space-y-2 text-label text-fg-2">
          {PULLUP_PRINCIPLES.map((p) => (
            <li key={p.name}>
              <strong style={{ color: cat(p.color) }}>{p.name}:</strong> {p.body}
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      <CollapsibleSection variant="quiet" defaultOpen={false} stickyKey="pullups.ability" title="Ability ladder" subtitle="Max → training set → volume">
        <table className="w-full text-left text-label">
          <caption className="sr-only">Ability group by max strict pull-ups, with the training set and daily and weekly volume targets for each.</caption>
          <thead>
            <tr className="text-fg-2">
              <th scope="col" className="py-1 pr-2 font-normal">Group</th>
              <th scope="col" className="py-1 pr-2 font-normal">Max</th>
              <th scope="col" className="py-1 pr-2 font-normal">Set</th>
              <th scope="col" className="py-1 pr-2 font-normal">Daily</th>
              <th scope="col" className="py-1 font-normal">Weekly</th>
            </tr>
          </thead>
          <tbody>
            {PULLUP_ABILITY.map((a) => (
              <tr key={a.group} className="border-t border-line">
                <th scope="row" className="py-1 pr-2 text-left font-normal text-fg-1">{a.group}</th>
                <td className="num py-1 pr-2 text-fg-2">{a.range}</td>
                <td className="num py-1 pr-2" style={{ color: cat('mauve') }}>{a.trainingSet}</td>
                <td className="py-1 pr-2 text-fg-2">{a.daily}</td>
                <td className="py-1 text-fg-2">{a.weekly}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleSection>

      <CollapsibleSection variant="quiet" defaultOpen={false} stickyKey="pullups.formats" title="Workout formats" subtitle={`${PULLUP_WORKOUTS.length} session structures`}>
        <ul className="space-y-2 text-label text-fg-2">
          {PULLUP_WORKOUTS.map((w) => (
            <li key={w.name} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
              <p className="text-body text-fg-1">{w.name}</p>
              <p>{w.profile}</p>
              <p className="mt-1">{w.how}</p>
              <p className="mt-1">
                <span className="text-green">RX:</span> {w.rx} · <span className="text-blue">Scale:</span> {w.scale}
              </p>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      <CollapsibleSection variant="quiet" defaultOpen={false} stickyKey="pullups.progressions" title="Progressions" subtitle="Building toward a first strict rep">
        <ul className="space-y-2 text-label text-fg-2">
          {PULLUP_PROGRESSIONS.map((p) => (
            <li key={p.name} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-body text-fg-1">{p.name}</span>
                <VideoLink name={p.name} size="sm" />
              </div>
              <p><strong>Why:</strong> {p.why}</p>
              <p className="mt-1"><strong>How:</strong> {p.how}</p>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      <CollapsibleSection variant="quiet" defaultOpen={false} stickyKey="pullups.equipment" title="Equipment" subtitle="Bar heights and what is worth buying">
        <ul className="space-y-2 text-label text-fg-2">
          {PULLUP_EQUIPMENT.map((e) => (
            <li key={e.item} className="border-t border-line pt-2 first:border-t-0 first:pt-0">
              <span className="text-body text-fg-1">{e.item}</span>
              <p>{e.spec}</p>
              {e.url && (
                <a href={e.url} target="_blank" rel="noreferrer" className="text-blue hover:underline">
                  {e.item} · suppliers
                </a>
              )}
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </section>
  )
}
