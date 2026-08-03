import { Check, Flame, HandFist, Heart, Lifebuoy, Shield, Sparkle, Warning, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState, useEffect, useRef } from 'react'
import { useJournal } from '../store'
import { Card, Empty, Input, Pill, Textarea } from '../components/ui'
import { Button } from '../components/ui/button'
import { cat } from '../lib/colors'
import { addDays, prettyDay, todayISO, dayDiff } from '../lib/date'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { streakStats, addictionStats, STREAK_MILESTONES, URGE_PRESETS, urgesByType, haltTally, HALT_STATES, moneySaved, type HaltState } from '../lib/streak'
import { techniqueRanking, matchPlanForTrigger, streakVsBest, comebackStatus, urgeHourHistogram, peakUrgeHour, relapseWeekdayPattern, peakRelapseWeekday, urgeConversion, paceToRecord, urgeFrequencyTrend, streaksSaved, intensityStats, cleanRollup, timeReclaimed, recordApproach, urgeQuietStretch } from '../lib/urge'
import type { TriggerPlan } from '../lib/types'
import { PageLayout, StatBar, SummaryStrip } from '../components/page'
import { useConfirm } from '../components/ConfirmDialog'
import { useFocusTrap } from '../lib/useFocusTrap'
import {
  StreakVsBestCard,
  SelfEfficacyCard,
  StreaksSavedCard,
  TimeReclaimedCard,
  MoneySavedCard,
  CalmStretchCard,
  UrgeTrendCard,
  UrgeIntensityCard,
  CleanRollupCard,
  HighRiskHoursCard,
  RiskiestDaysCard,
  TriggerPatternsCard,
} from '../components/recovery'

const TECHNIQUES: { id: 'surf' | 'delay' | 'halt' | 'reach-out'; label: string }[] = [
  { id: 'surf', label: 'Surf it' },
  { id: 'delay', label: 'Delay 10 min' },
  { id: 'halt', label: 'HALT check' },
  { id: 'reach-out', label: 'Reach out' },
]
const TECH_LABEL: Record<'surf' | 'delay' | 'halt' | 'reach-out', string> = {
  surf: 'Surf it', delay: 'Delay 10 min', halt: 'HALT check', 'reach-out': 'Reach out',
}

/**
 * Streak (abstinence) hub · a progress-ring hero to the next milestone, lifetime
 * stats, the recovery-benefits ladder, trigger patterns, urge-surfing, and a
 * judgement-free reset log. Private, local-only.
 */
const URGE_COLORS = ['mauve', 'teal', 'peach', 'sky', 'green', 'pink', 'yellow', 'lavender', 'sapphire', 'flamingo']

const SOS_SECONDS = 10 * 60 // 10-minute "ride it out" timer
// 4-7-8 style breathing pacer: inhale 4s · hold 7s · exhale 8s (one 19s cycle).
const BREATH_PHASES = [
  { label: 'Breathe in', secs: 4, scale: 1.35, color: 'teal' as const },
  { label: 'Hold', secs: 7, scale: 1.35, color: 'mauve' as const },
  { label: 'Breathe out', secs: 8, scale: 0.8, color: 'sky' as const },
]
const BREATH_CYCLE = BREATH_PHASES.reduce((n, p) => n + p.secs, 0)

/** Phase of the breathing pacer at `elapsed` seconds into the SOS session. */
function breathPhase(elapsed: number) {
  let t = elapsed % BREATH_CYCLE
  for (const p of BREATH_PHASES) {
    if (t < p.secs) return p
    t -= p.secs
  }
  return BREATH_PHASES[0]
}

/**
 * Panic / SOS overlay — a full-screen "ride it out" companion: a 10-minute
 * countdown (urges peak and pass in ~15 min), a 4-7-8 breathing pacer, and the
 * user's own coping line for the matching trigger plan. All local state.
 */
function SosOverlay({ plans, onClose }: { plans: TriggerPlan[]; onClose: () => void }) {
  // Full-screen overlay: without a trap, Tab walks into the page underneath it,
  // which is exactly the moment a user should not be able to wander off.
  const trap = useFocusTrap<HTMLDivElement>()
  const [elapsed, setElapsed] = useState(0)
  const [trigger, setTrigger] = useState('')
  const startRef = useRef<number | null>(null)
  const matched = matchPlanForTrigger(plans, trigger)

  useEffect(() => {
    startRef.current = Date.now()
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000))
    }, 250)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { clearInterval(id); window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const remaining = Math.max(0, SOS_SECONDS - elapsed)
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const done = remaining === 0
  const phase = breathPhase(elapsed)

  return (
    <div ref={trap} role="dialog" aria-modal="true" aria-label="Urge SOS"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6"
      style={{ background: cat('crust') + 'f2', backdropFilter: 'blur(6px)' }}>
      <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close SOS" className="absolute right-4 top-4 rounded-pill text-fg-2 hover:text-fg-1" style={{ background: cat('surface0') }}><Icon as={X} size="lg" /></Button>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-body" style={{ color: cat('peach') }}><Icon as={Lifebuoy} size="md" /> Ride it out · this is a wave, not a command</div>
        <div className="mt-1 font-mono text-display font-medium tabular-nums" style={{ color: done ? cat('green') : cat('text') }}>{mm}:{ss}</div>
        <p className="mt-1 text-label text-fg-2">{done ? 'The peak has passed. You made it.' : 'Stay until the timer ends · the urge will crest and fall.'}</p>
      </div>

      {/* Breathing pacer */}
      <div className="grid h-44 w-44 place-items-center">
        <div className="grid h-32 w-32 place-items-center rounded-pill text-center text-body font-medium"
          aria-live="polite"
          style={{
            background: cat(phase.color) + '22',
            border: `2px solid ${cat(phase.color)}`,
            color: cat(phase.color),
            transform: `scale(${phase.scale})`,
            transition: `transform ${phase.secs}s ease-in-out`,
          }}>
          {phase.label}
        </div>
      </div>

      {/* Coping line from the matching trigger plan */}
      <div className="w-full max-w-md">
        <Input value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="What's triggering it? (finds your plan)" aria-label="Current trigger" />
        {matched ? (
          <div className="mt-2 rounded-control p-3 text-body" style={{ background: cat('teal') + '14', border: `1px solid ${cat('teal')}44` }}>
            <span className="font-medium" style={{ color: cat('teal') }}>Your plan for “{matched.trigger}”:</span>{' '}
            <span className="text-fg-2">{matched.coping || 'name it and let it pass.'}</span>
          </div>
        ) : (
          <p className="mt-2 text-center text-label text-fg-2">No matching plan yet, try “Surf it”: name the urge and watch it pass without acting.</p>
        )}
      </div>

      <Button variant="secondary" onClick={onClose} className="inline-flex items-center gap-1.5"><Icon as={Shield} size="sm" /> I'm okay now</Button>
    </div>
  )
}

export function NoFap() {
  const confirm = useConfirm()
  const { data, logRelapse, resistUrge, removeUrge, addTriggerPlan, removeTriggerPlan, addAddiction, removeAddiction, relapseAddiction, setStreakCost, setAddictionCost, setCommitment } = useJournal()
  const currency = data.settings.currencySymbol || '$'
  const [newAddiction, setNewAddiction] = useState('')
  const [trigger, setTrigger] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [urge, setUrge] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [technique, setTechnique] = useState<'surf' | 'delay' | 'halt' | 'reach-out' | undefined>(undefined)
  const [halt, setHalt] = useState<HaltState[]>([])
  const [plan, setPlan] = useState({ addiction: '', trigger: '', coping: '' })
  const [sosOpen, setSosOpen] = useState(false)
  const [hoursPerDay, setHoursPerDay] = useState(1) // #344 reclaimed-time rate (view-local)
  const [editingCommit, setEditingCommit] = useState(false) // #316 commitment editor toggle
  const plans = data.nofap.plans ?? []
  const matchedPlan = matchPlanForTrigger(plans, urge)
  const techRank = techniqueRanking(data.nofap.urgeLog ?? [])
  function savePlan() {
    if (!plan.addiction.trim() || !plan.trigger.trim()) return
    addTriggerPlan({ addiction: plan.addiction.trim(), trigger: plan.trigger.trim(), coping: plan.coping.trim() || undefined })
    setPlan({ addiction: '', trigger: '', coping: '' })
  }
  const urgeLog = [...(data.nofap.urgeLog ?? [])].sort((a, b) => (a.at ?? a.date) < (b.at ?? b.date) ? 1 : -1)

  function logUrge() {
    resistUrge({ trigger: urge.trim() || undefined, intensity: intensity as 1 | 2 | 3 | 4 | 5, technique, halt: halt.length ? halt : undefined })
    setUrge(''); setIntensity(3); setTechnique(undefined); setHalt([])
  }
  const haltRank = haltTally(data)
  const fmtTime = (iso?: string) => { try { return iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '' } catch { return '' } }
  const s = data.nofap
  const today = todayISO()
  const stats = streakStats(data, today)
  const vsBest = streakVsBest(stats.current, stats.best)
  const comeback = comebackStatus(s.relapses, s.startedOn, today)
  const byType = urgesByType(data)
  const relapsedToday = s.relapses.some((r) => r.date === today)
  const nextBenefit = stats.next
  // #114 high-risk hour heatmap · #263 weekday relapse pattern · #76 conversion · #298 pace
  const hourHist = urgeHourHistogram(s.urgeLog ?? [])
  const peakHour = peakUrgeHour(s.urgeLog ?? [])
  const weekdayPattern = relapseWeekdayPattern(s.relapses)
  const peakWeekday = peakRelapseWeekday(s.relapses)
  const conversion = urgeConversion(s.urgeLog ?? [], s.relapses, s.urgesResisted ?? 0)
  const pace = paceToRecord(stats.current, stats.best, today)
  // #348 urge frequency trend · #334 streaks saved · #74 intensity · #322 clean rollup
  const urgeTrend = urgeFrequencyTrend(s.urgeLog ?? [], 8, today)
  const saved = streaksSaved(s.urgeLog ?? [], s.urgesResisted ?? 0, today)
  const intensity9 = intensityStats(s.urgeLog ?? [])
  const rollup = cleanRollup(s.relapses, s.startedOn, today)
  // #344 time reclaimed · #321 record-approach · urge-quiet stretch
  const reclaimed = timeReclaimed(stats.totalClean, hoursPerDay)
  const approach = recordApproach(stats.current, stats.best)
  const quiet = urgeQuietStretch(s.urgeLog ?? [], today)
  const APPROACH_COPY: Record<typeof approach.tier, { color: string; text: string } | null> = {
    record: null, far: null,
    near: { color: 'peach', text: `Closing in · ${approach.daysToBeat} day${approach.daysToBeat === 1 ? '' : 's'} from your all-time best. Hold the line.` },
    close: { color: 'peach', text: `So close · just ${approach.daysToBeat} day${approach.daysToBeat === 1 ? '' : 's'} from a new personal record. Don't trade it away now.` },
    edge: { color: 'red', text: `One day from your record. Whatever the urge offers, it isn't worth your best streak ever. Ride it out.` },
  }
  const approachCopy = APPROACH_COPY[approach.tier]
  // #123 money saved · clean days × the primary streak's cost/day
  const savedMoney = moneySaved(stats.totalClean, s.costPerDay)
  // #316 commitment contract · quit date + personal reason, shown prominently
  const commitment = s.commitment
  const hasCommitment = !!(commitment?.quitDate || commitment?.reason)
  // Days since the quit date (clamped at 0; future quit dates read as 0 so far).
  const daysSinceQuit = commitment?.quitDate ? Math.max(0, dayDiff(commitment.quitDate, today)) : null

  function relapse() {
    if (!trigger.trim()) { setErr('Add the reason behind it first, patterns are data.'); return }
    logRelapse({ date: today, trigger: trigger.trim(), note: note.trim() })
    setTrigger(''); setNote(''); setErr('')
  }

  // SVG ring geometry.
  const R = 54, C = 2 * Math.PI * R
  const ringColor = relapsedToday ? cat('red') : cat('mauve')

  return (
    <>
      {/* Panic / SOS · floating button + full-screen ride-it-out overlay.
          Outside the zones on purpose: it is a fixed-position lifeline that has
          to be reachable from anywhere on the page, which is exactly the case
          the three-zone rule is not about. */}
      <button onClick={() => setSosOpen(true)} aria-label="Panic, open urge SOS"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-pill px-4 py-3 text-body font-medium shadow-lg transition-transform hover:scale-105"
        style={{ background: cat('red'), color: cat('crust'), boxShadow: `0 6px 24px ${cat('red')}55` }}>
        <Icon as={Lifebuoy} size="md" /> SOS
      </button>
      {sosOpen && <SosOverlay plans={plans} onClose={() => setSosOpen(false)} />}

      <PageLayout
        tier={1180}
        zone1={
          <StatBar facts={[
            { label: 'Days clean', value: stats.current },
            { label: 'Personal best', value: stats.best },
            {
              label: 'Next milestone',
              value: nextBenefit ? `${nextBenefit.label} · ${stats.daysToNext}d` : 'All cleared',
            },
            { label: 'Today', value: relapsedToday ? 'Reset logged' : 'Clean' },
          ]} />
        }
        zone2={<>
        {/* The hero ring stays: on this page the streak IS the object, and the
            ring is the only accent-filled thing here — there is no primary
            button competing with it, because logging an urge and logging a
            reset are two different commitments and neither outranks the
            other. */}
        <Card className="glow-mauve">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative grid h-40 w-40 shrink-0 place-items-center">
              <svg width="160" height="160" viewBox="0 0 128 128" className="-rotate-90">
                <circle cx="64" cy="64" r={R} fill="none" stroke={cat('surface0')} strokeWidth="9" />
                <circle cx="64" cy="64" r={R} fill="none" stroke={ringColor} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={C - (C * stats.progressPct) / 100}
                  style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
              </svg>
              <div className="absolute text-center">
                <div className="text-display font-medium leading-none" style={{ color: ringColor }}>{stats.current}</div>
                <div className="mt-1 text-caption tracking-wide text-fg-2 uppercase">days clean</div>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-body text-fg-1"><Icon as={Shield} size="sm" style={{ color: ringColor }} /> Your main streak · since {prettyDay(s.startedOn)}</div>
              <p className="mt-0.5 text-label text-fg-2">The ring &amp; ladder track this one streak. Other urges (smoking, scrolling…) are logged + planned below.</p>
              {relapsedToday && (
                <div className="mt-1.5 rounded-control p-2 text-left text-label" style={{ background: cat('red') + '12', border: `1px solid ${cat('red')}44` }}>
                  <span className="inline-flex items-center gap-1 font-medium" style={{ color: cat('red') }}><Icon as={X} size="sm" /> Reset today · and that’s okay.</span>
                  <p className="mt-0.5 text-fg-1">You didn’t lose everything: your <strong style={{ color: cat('green') }}>{stats.totalClean} total clean days</strong> and <strong style={{ color: cat('peach') }}>{stats.best}-day best</strong> are kept. One slip is a stumble, not a restart · log the reason below and keep going.</p>
                </div>
              )}
              {nextBenefit ? (
                <>
                  <p className="mt-3 text-body text-fg-2">
                    Next: <span className="font-medium" style={{ color: cat('teal') }}>{nextBenefit.label}</span> · <span className="text-fg-2">{stats.daysToNext} day{stats.daysToNext === 1 ? '' : 's'} to go</span>
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-pill bg-ink-2">
                    <div className="h-full rounded-pill transition-[width] duration-500" style={{ width: `${stats.progressPct}%`, background: cat('teal') }} />
                  </div>
                  <p className="mt-2 text-label text-fg-2 italic">“{nextBenefit.benefit}”</p>
                </>
              ) : (
                <p className="mt-3 text-body" style={{ color: cat('peach') }}>Every milestone cleared. You’re writing your own ladder now.</p>
              )}
            </div>
          </div>
        </Card>

        {/* Urge surfing · pick what it was, log the win with date + time.
            Promoted above analytics: the primary "cope & log" action. */}
        <Card title="Urge surfing" subtitle="Feeling an urge? Pick what it is and mark the win, it crests and passes in minutes.">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {URGE_PRESETS.map((u) => (
              <button key={u} onClick={() => setUrge(u)}
                className="rounded-pill border px-2.5 py-1 text-label transition-colors"
                style={{ borderColor: urge === u ? cat('mauve') : cat('surface1'), background: urge === u ? cat('mauve') + '22' : 'transparent', color: urge === u ? cat('text') : cat('subtext0') }}>
                {u}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input value={urge} onChange={(e) => setUrge(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && logUrge()} placeholder="…or type your own" list="urge-presets" className="min-w-[10rem] flex-1" />
            <datalist id="urge-presets">{URGE_PRESETS.map((u) => <option key={u} value={u} />)}</datalist>
          </div>
          {/* Trigger-plan match · surfaced as the user types/picks a trigger (U9) */}
          {matchedPlan && (
            <div className="mt-2 rounded-control p-2 text-label" style={{ background: cat('teal') + '14', border: `1px solid ${cat('teal')}44` }}>
              <span className="font-medium" style={{ color: cat('teal') }}>Your plan for “{matchedPlan.trigger}”:</span>{' '}
              <span className="text-fg-2">{matchedPlan.coping || 'name it and let it pass.'}</span>
            </div>
          )}
          {/* Intensity 1–5 (U8) */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-label text-fg-1">
              <label htmlFor="urge-intensity">Intensity</label>
              <span className="font-medium" style={{ color: cat('peach') }}>{intensity}/5</span>
            </div>
            <input id="urge-intensity" type="range" min={1} max={5} step={1} value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="mt-1 w-full accent-mauve" style={{ accentColor: cat('mauve') }} aria-label="Urge intensity, 1 to 5" />
          </div>
          {/* Technique chips (U8) */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TECHNIQUES.map((t) => (
              <button key={t.id} onClick={() => setTechnique(technique === t.id ? undefined : t.id)}
                className="rounded-pill border px-2.5 py-1 text-label transition-colors"
                style={{ borderColor: technique === t.id ? cat('teal') : cat('surface1'), background: technique === t.id ? cat('teal') + '22' : 'transparent', color: technique === t.id ? cat('text') : cat('subtext0') }}>
                {t.label}
              </button>
            ))}
          </div>
          {/* HALT quick-check · which unmet need is driving the urge? */}
          <div className="mt-2">
            <p className="mb-1 text-label text-fg-2">HALT check, tap any that fit</p>
            <div className="flex flex-wrap gap-1.5">
              {HALT_STATES.map((hs) => {
                const on = halt.includes(hs.id)
                return (
                  <button key={hs.id} onClick={() => setHalt((cur) => cur.includes(hs.id) ? cur.filter((x) => x !== hs.id) : [...cur, hs.id])}
                    aria-pressed={on}
                    className="rounded-pill border px-2.5 py-1 text-label transition-colors"
                    style={{ borderColor: on ? cat('peach') : cat('surface1'), background: on ? cat('peach') + '22' : 'transparent', color: on ? cat('text') : cat('subtext0') }}>
                    {hs.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="secondary" onClick={logUrge} className="inline-flex items-center gap-1.5"><Icon as={HandFist} size="sm" /> I resisted it</Button>
          </div>
          <div className="mt-3 flex items-center justify-between text-body">
            <span className="text-fg-1">Urges resisted: <span className="font-medium" style={{ color: cat('green') }}>{stats.urges}</span></span>
          </div>
          {/* Most-effective technique tally (U8) */}
          {techRank.length > 0 && (
            <div className="mt-2 rounded-card border border-line bg-ink-0 p-2.5 text-label">
              <div className="mb-1 text-fg-1">Most-used technique: <span className="font-medium" style={{ color: cat('teal') }}>{TECH_LABEL[techRank[0].technique]}</span> · {techRank[0].count}×</div>
              <div className="flex flex-wrap gap-1.5">
                {techRank.map((t) => (
                  <Pill key={t.technique} tone="muted">{TECH_LABEL[t.technique]} {t.count}</Pill>
                ))}
              </div>
            </div>
          )}
          {/* HALT pattern tally · which unmet need accompanies urges most */}
          {haltRank.length > 0 && (
            <div className="mt-2 rounded-card border border-line bg-ink-0 p-2.5 text-label">
              <div className="mb-1 text-fg-1">HALT pattern: <span className="font-medium" style={{ color: cat('peach') }}>{haltRank[0].label}</span> most often · {haltRank[0].count}×</div>
              <div className="flex flex-wrap gap-1.5">
                {haltRank.map((h) => (
                  <Pill key={h.state} tone="muted">{h.label} {h.count}</Pill>
                ))}
              </div>
            </div>
          )}
          {urgeLog.length > 0 && (
            <ul className="mt-2 max-h-56 space-y-1.5 overflow-auto">
              {urgeLog.map((u) => (
                <li key={u.id} className="group flex items-center gap-2 rounded-card border border-line bg-ink-0 px-2.5 py-1.5 text-body">
                  <Icon as={HandFist} size="sm" style={{ color: cat('green') }} className="shrink-0" />
                  <span className="text-fg-1">{u.trigger || 'Urge'}</span>
                  <span className="ml-auto text-label text-fg-2">{prettyDay(u.date)}{fmtTime(u.at) ? ` · ${fmtTime(u.at)}` : ''}</span>
                  <Button variant="ghost" size="icon-sm" onClick={() => removeUrge(u.id)} aria-label="Remove" className="text-fg-2 opacity-0 group-hover:opacity-100 hover:text-red">×</Button>
                </li>
              ))}
            </ul>
          )}
          {(data.nofap.urgesResisted ?? 0) > 0 && <p className="mt-2 text-label text-fg-2">+ {data.nofap.urgesResisted} earlier wins (before dated logging).</p>}
        </Card>

        {/* Log a reset · moved up from the rail · the second primary action */}
        <Card title="Log a reset" subtitle="Reflect, learn, restart the counter">
          <div className="space-y-3">
            <label className="block text-body text-fg-1">
              Reason <span style={{ color: cat('red') }}>*</span>
              <Input value={trigger} onChange={(e) => { setTrigger(e.target.value); if (err) setErr('') }} placeholder="What led to it? (required)" className="mt-1" />
            </label>
            <label className="block text-body text-fg-1">
              Reflection
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What will you do differently next time?" rows={4} className="mt-1" />
            </label>
            {err && <p className="text-label" style={{ color: cat('red') }}>{err}</p>}
            <Button variant="danger" onClick={relapse} className="w-full">Log reset &amp; restart</Button>
            <p className="text-label text-fg-2">Records the reason today, then restarts the days-clean counter. Your best ({stats.best}d) and total ({stats.totalClean}d) are kept.</p>
          </div>
        </Card>

        </>}
        zone3={<>
        {/* Lifetime totals · the record, not the next action. */}
        <SummaryStrip items={[
          { label: 'Total clean days', value: stats.totalClean, empty: stats.totalClean === 0 },
          { label: 'Urges resisted', value: stats.urges, empty: stats.urges === 0 },
          { label: 'Resets', value: s.relapses.length, empty: s.relapses.length === 0 },
        ]} />

        {/* SIGNATURE VISUAL · urges resisted against resets, week by week.
            The brief specified a paired sleep + soreness sparkline here, on the
            assumption that Recovery meant physical recovery. In this app it is
            abstinence recovery, and there is no soreness field in the data
            model at all — so the pairing that would have been invented is
            replaced by the correlation this page actually exists to reveal:
            whether resisting urges is holding the resets down. */}
        <section>
          <h2 className="mb-2 text-label text-fg-2">Urges resisted vs resets</h2>
          <PairedSparkline weeks={urgeTrend.weeks} relapses={s.relapses} today={today} />
        </section>

        {/* Per-addiction streaks (BUJO-199) · each tracked as its own streak + best */}
        <Card title="Per-addiction streaks" subtitle="Track each habit separately, its own counter, best & resets">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Input value={newAddiction} onChange={(e) => setNewAddiction(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addAddiction(newAddiction); setNewAddiction('') } }} placeholder="Add an addiction (e.g. Sugar)" list="urge-presets" aria-label="New addiction name" className="min-w-[10rem] flex-1" />
            <Button variant="secondary" onClick={() => { addAddiction(newAddiction); setNewAddiction('') }}>Add</Button>
          </div>
          {(data.nofap.addictions ?? []).length === 0 ? (
            <Empty>No separate addictions yet · add one to track it on its own streak.</Empty>
          ) : (
            <ul className="space-y-2">
              {(data.nofap.addictions ?? []).map((a) => {
                const st = addictionStats(a, today)
                const reset = a.relapses.some((r) => r.date === today)
                const aSaved = moneySaved(st.totalClean, a.costPerDay)
                return (
                  <li key={a.id} className="group rounded-card border border-line bg-ink-0 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <Icon as={Flame} size="md" style={{ color: reset ? cat('red') : cat('peach') }} className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate font-medium text-fg-1">{a.name}</span>
                          <span className="text-label text-fg-2">best {st.best}d</span>
                          {a.costPerDay && aSaved > 0 && <span className="text-label" style={{ color: cat('green') }}>{currency}{aSaved.toLocaleString()} saved</span>}
                        </div>
                        <span className="text-body text-fg-1"><span className="font-medium" style={{ color: cat('mauve') }}>{st.current}</span> day{st.current === 1 ? '' : 's'} clean{st.relapseCount ? ` · ${st.relapseCount} reset${st.relapseCount === 1 ? '' : 's'}` : ''}</span>
                      </div>
                      <Button variant="ghost" onClick={async () => { if (await confirm({
                        title: `Reset the ${a.name} streak?`,
                        description: 'Your current streak goes back to zero. Your total clean days and best streak are kept.',
                        confirmLabel: 'Reset streak', destructive: true,
                      })) relapseAddiction(a.id, { date: today, trigger: '', note: '' }) }} className="h-auto shrink-0 p-0 text-label text-red hover:text-red">Reset</Button>
                      <Button variant="ghost" size="icon-sm" onClick={async () => { if (await confirm({
                        title: `Stop tracking ${a.name}?`,
                        description: 'Its streak and full reset history are deleted. This cannot be undone.',
                        confirmLabel: 'Stop tracking', destructive: true,
                      })) removeAddiction(a.id) }} aria-label={`Remove ${a.name}`} className="shrink-0 text-fg-2 opacity-0 group-hover:opacity-100 hover:text-red">×</Button>
                    </div>
                    {/* #123 per-addiction cost/day → money saved */}
                    <div className="mt-2 flex items-center gap-2 pl-7 text-label text-fg-2">
                      <span>{currency}/day</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        value={a.costPerDay ?? ''}
                        onChange={(e) => setAddictionCost(a.id, e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder="0"
                        className="w-20 !py-1 text-label"
                        aria-label={`Cost per day for ${a.name}`}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* ── Setup · set-once contract + if-then plans──── */}
        <section>
          <h2 className="border-b border-line pb-1 text-label text-fg-2">Setup <span className="text-fg-3">· Your commitment contract & if-then trigger plans</span></h2>
          <div className="mt-2 flex flex-col gap-4">
          {/* My commitment (#316) · quit-date contract + personal "why" */}
          <Card title={<span className="inline-flex items-center gap-2"><Icon as={Heart} size="md" className="text-mauve" /> My commitment</span>}
            subtitle="Your quit-date contract, the reason you’re doing this"
            right={hasCommitment && !editingCommit ? <Button variant="secondary" size="sm" onClick={() => setEditingCommit(true)} className="text-label">Edit</Button> : undefined}>
            {hasCommitment && !editingCommit ? (
              <div>
                {commitment?.reason && (
                  <blockquote className="border-l-2 pl-3 text-heading font-medium italic" style={{ borderColor: cat('mauve'), color: cat('text') }}>
                    “{commitment.reason}”
                  </blockquote>
                )}
                {commitment?.quitDate && (
                  <p className="mt-3 text-body text-fg-2">
                    Committed on <span className="font-medium text-fg-1">{prettyDay(commitment.quitDate)}</span>
                    {daysSinceQuit != null && daysSinceQuit > 0 && <> · <span className="font-medium" style={{ color: cat('mauve') }}>{daysSinceQuit}</span> day{daysSinceQuit === 1 ? '' : 's'} ago</>}
                    {daysSinceQuit === 0 && <> · <span style={{ color: cat('mauve') }}>today</span></>}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-body text-fg-1">Quit date
                  <Input type="date" value={commitment?.quitDate ?? ''} max={today} onChange={(e) => setCommitment({ quitDate: e.target.value })} className="mt-1" aria-label="Quit date" />
                </label>
                <label className="block text-body text-fg-1">Why I quit
                  <Textarea value={commitment?.reason ?? ''} onChange={(e) => setCommitment({ reason: e.target.value })} placeholder="The reason that matters most to you…" rows={2} className="mt-1" aria-label="Reason for quitting" />
                </label>
                {editingCommit && <div className="flex justify-end"><Button variant="secondary" onClick={() => setEditingCommit(false)}>Done</Button></div>}
              </div>
            )}
          </Card>

          {/* Trigger plans · if-then for each addiction's trigger points */}
          <Card title="Trigger plans" subtitle="Name each addiction’s trigger point + your if-then response">
            <div className="grid gap-2 rounded-card border border-line bg-ink-0 p-3 sm:grid-cols-2">
              <Input value={plan.addiction} onChange={(e) => setPlan({ ...plan, addiction: e.target.value })} placeholder="Addiction (e.g. Smoking)" list="urge-presets" aria-label="Addiction" />
              <Input value={plan.trigger} onChange={(e) => setPlan({ ...plan, trigger: e.target.value })} placeholder="Trigger point (e.g. after meals)" aria-label="Trigger point" />
              <Input value={plan.coping} onChange={(e) => setPlan({ ...plan, coping: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && savePlan()} placeholder="Then I will… (e.g. chew gum, walk 10 min)" aria-label="Coping response" className="sm:col-span-2" />
              <Button variant="secondary" onClick={savePlan} className="sm:col-span-2">Add trigger plan</Button>
            </div>
            {plans.length > 0 && (
              <ul className="mt-3 space-y-2">
                {plans.map((pl) => (
                  <li key={pl.id} className="group rounded-card border border-line bg-ink-0 p-2.5 text-body">
                    <div className="flex items-center gap-2">
                      <Pill color="mauve" size="caption">{pl.addiction}</Pill>
                      <span className="text-fg-1"><span className="text-fg-2">when</span> {pl.trigger}</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeTriggerPlan(pl.id)} aria-label="Remove plan" className="ml-auto text-fg-2 opacity-0 group-hover:opacity-100 hover:text-red">×</Button>
                    </div>
                    {pl.coping && <p className="mt-0.5 text-label text-fg-2"><span className="text-teal">→ then</span> {pl.coping}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        </section>

        {/* ── Secondary analytics, grouped + (card-density UX) ──── */}
        {/* Insights · motivational / progress cards */}
        <section>
          <h2 className="border-b border-line pb-1 text-label text-fg-2">Insights & progress <span className="text-fg-3">· Streak vs. best, self-efficacy, money & time saved</span></h2>
          <div className="mt-2 flex flex-col gap-4">
          <StreakVsBestCard vsBest={vsBest} comeback={comeback} pace={pace} approachCopy={approachCopy} />
          {conversion.total > 0 && <SelfEfficacyCard conversion={conversion} />}
          {saved.saved > 0 && <StreaksSavedCard saved={saved} />}
          {stats.totalClean > 0 && (
            <TimeReclaimedCard reclaimed={reclaimed} totalClean={stats.totalClean} hoursPerDay={hoursPerDay} onHoursPerDayChange={setHoursPerDay} />
          )}
          <MoneySavedCard currency={currency} costPerDay={s.costPerDay} savedMoney={savedMoney} totalClean={stats.totalClean} onCostChange={setStreakCost} />
          {!quiet.empty && quiet.days >= 1 && <CalmStretchCard quiet={quiet} />}
        </div>
        </section>

        {/* Deep analytics · trends, distributions, heatmaps, patterns */}
        <section>
          <h2 className="border-b border-line pb-1 text-label text-fg-2">Deep analytics <span className="text-fg-3">· Trends, intensity, clean windows, high-risk hours & days, urge mix</span></h2>
          <div className="mt-2 flex flex-col gap-4">
          {urgeTrend.total > 0 && <UrgeTrendCard urgeTrend={urgeTrend} />}
          {intensity9.rated > 0 && <UrgeIntensityCard intensity9={intensity9} />}
          {rollup.totalWeeks > 0 && <CleanRollupCard rollup={rollup} />}
          {peakHour && <HighRiskHoursCard hourHist={hourHist} peakHour={peakHour} />}
          {peakWeekday && <RiskiestDaysCard weekdayPattern={weekdayPattern} peakWeekday={peakWeekday} />}
          {/* Trigger patterns · aggregated relapse triggers */}
          {stats.topTriggers.length > 0 && (
            <TriggerPatternsCard topTriggers={stats.topTriggers} relapseCount={stats.relapseCount} avgGap={stats.avgGap} />
          )}
          {/* Urges by addiction · moved from the rail (strands on mobile) */}
          {byType.length > 0 && (
            <Card title="Urges by addiction" subtitle="What you resist most" enlargeable>
              <div className="h-52 w-full" role="img" aria-label={`Bar chart of urges resisted by type: ${byType.map((b) => `${b.count} ${b.type}`).join(', ')}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byType} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 4 }}>
                    <CartesianGrid stroke={cat('surface0')} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} stroke={cat('overlay0')} fontSize={11} />
                    <YAxis type="category" dataKey="type" width={84} stroke={cat('overlay0')} fontSize={11} />
                    <Tooltip contentStyle={{ background: cat('mantle'), border: `1px solid ${cat('surface0')}`, borderRadius: 8, color: cat('text') }} cursor={{ fill: cat('surface0') }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {byType.map((_, i) => <Cell key={i} fill={cat(URGE_COLORS[i % URGE_COLORS.length])} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
        </section>

        {/* ── Reference · static guides & history────────── */}
        <section>
          <h2 className="border-b border-line pb-1 text-label text-fg-2">Reference <span className="text-fg-3">· Coping techniques, recovery ladder & reset history</span></h2>
          <div className="mt-2 flex flex-col gap-4">
          {/* Beat the urge · coping techniques (merged here from the rail; the SOS overlay carries the in-crisis version) */}
          <Card title={<span className="inline-flex items-center gap-2"><Icon as={Sparkle} size="md" className="text-mauve" /> Beat the urge</span>} subtitle="Proven techniques, an urge peaks and passes in ~15–20 min">
            <ol className="space-y-2 text-body text-fg-1">
              <li className="flex gap-2"><span className="font-medium text-teal">Surf it</span> · name it (“this is an urge, it will pass”) and watch it rise and fall without acting.</li>
              <li className="flex gap-2"><span className="font-medium text-teal">Delay 10 min</span> · set a timer; move, cold water, walk, push-ups. The peak passes.</li>
              <li className="flex gap-2"><span className="font-medium text-teal">HALT check</span> · Hungry? Angry? Lonely? Tired? Fix the real need instead.</li>
              <li className="flex gap-2"><span className="font-medium text-teal">Play it forward</span> · picture how you’ll feel 1 hour after giving in vs. resisting.</li>
              <li className="flex gap-2"><span className="font-medium text-teal">Remove the cue</span> · leave the room, phone in another room, block the site.</li>
              <li className="flex gap-2"><span className="font-medium text-teal">Reach out</span> · text someone; saying it out loud drains the urge’s power.</li>
              <li className="flex gap-2"><span className="font-medium text-teal">Log the win</span> · tap <strong>I resisted it</strong> above; evidence beats willpower.</li>
            </ol>
            {plans.length > 0 && (
              <div className="mt-3 rounded-control bg-secondary/50 p-2 text-label text-fg-2">
                <span className="font-medium text-mauve">Your plan:</span> {plans.map((pl) => `${pl.addiction} → ${pl.coping || pl.trigger}`).slice(0, 2).join(' · ')}
              </div>
            )}
            {nextBenefit && <p className="mt-2 inline-flex items-center gap-1.5 rounded-control bg-peach/10 p-2 text-label text-fg-2"><Icon as={Warning} size="sm" className="text-peach" /> You’re {stats.daysToNext} day{stats.daysToNext === 1 ? '' : 's'} from {nextBenefit.label}. Don’t trade weeks of progress for 10 minutes.</p>}
          </Card>

          {/* Benefits ladder */}
          <Card title="Recovery ladder" subtitle="What clears as the streak grows">
            <ol className="relative ml-3 space-y-3 border-l border-line-strong pl-5">
              {STREAK_MILESTONES.map((m) => {
                const reached = stats.current >= m.day
                const isNext = nextBenefit?.day === m.day
                return (
                  <li key={m.day} className="relative">
                    <span className="absolute -left-[27px] grid h-5 w-5 place-items-center rounded-pill text-micro"
                      style={{ background: reached ? cat('green') : isNext ? cat('teal') : cat('surface0'), color: cat('crust') }}>
                      {reached ? <Icon as={Check} size="sm" /> : m.day}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-body font-medium ${reached ? 'text-fg-1' : isNext ? 'text-teal' : 'text-fg-2'}`}>{m.label}</span>
                      <span className="text-caption text-fg-2">{m.day}d</span>
                      {isNext && <Pill color="teal" size="micro">next</Pill>}
                    </div>
                    <p className={`text-label ${reached || isNext ? 'text-fg-2' : 'text-fg-2'}`}>{m.benefit}</p>
                  </li>
                )
              })}
            </ol>
          </Card>

          {/* Relapse log */}
          <Card title="Reset history" subtitle={s.relapses.length ? `${s.relapses.length} reset${s.relapses.length === 1 ? '' : 's'} · no shame, patterns are data` : 'No shame · patterns are data'}>
            {s.relapses.length === 0 ? (
              <Empty>No resets logged. Keep going.</Empty>
            ) : (
              <ul className="space-y-2 text-body">
                {[...s.relapses].reverse().map((r) => (
                  <li key={r.id} className="rounded-control border p-2" style={{ borderColor: cat('red') + '55', background: cat('red') + '12' }}>
                    <div className="flex items-center gap-1.5 font-medium" style={{ color: cat('red') }}><Icon as={X} size="sm" /> Reset · {prettyDay(r.date)}</div>
                    {r.trigger && <div className="mt-0.5 text-fg-1"><span className="text-fg-2">Reason:</span> {r.trigger}</div>}
                    {r.note && <div className="text-fg-2 italic">{r.note}</div>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        </section>
        </>}
      />
    </>
  )
}

/**
 * Two series over the same eight weeks: urges resisted (bars) and resets
 * (marks). Paired rather than stacked, because the question is whether one
 * moves against the other — a stack would hide exactly the comparison.
 *
 * Neutral fill for urges, and the reset marks carry the only colour, because
 * they are the thing you are looking for.
 */
function PairedSparkline({ weeks, relapses, today }: {
  weeks: { weekStart: string; count: number }[]
  relapses: { date: string }[]
  today: string
}) {
  const max = Math.max(1, ...weeks.map((w) => w.count))
  const resetsIn = (weekStart: string) => {
    const end = addDays(weekStart, 6)
    return relapses.filter((r) => r.date >= weekStart && r.date <= end).length
  }
  return (
    <div>
      {/* The frame draws at zero data — an empty axis says "this is where the
          comparison goes", where a hidden chart says nothing at all. */}
      <div className="flex h-24 items-end gap-1.5 border-b border-line" role="img" aria-label={
        weeks.length === 0
          ? 'Urges and resets by week: nothing logged yet'
          : `Urges resisted and resets over ${weeks.length} weeks: ${weeks.map((w) => `week of ${prettyDay(w.weekStart)}, ${w.count} urges, ${resetsIn(w.weekStart)} resets`).join('; ')}`
      }>
        {weeks.map((w) => {
          const resets = resetsIn(w.weekStart)
          return (
            <div key={w.weekStart} className="relative flex flex-1 flex-col justify-end" title={`Week of ${prettyDay(w.weekStart)}: ${w.count} urges resisted, ${resets} reset${resets === 1 ? '' : 's'}`}>
              {resets > 0 && (
                <span className="mx-auto mb-0.5 block h-1.5 w-1.5 rounded-pill" style={{ background: cat('red') }} />
              )}
              <div className="rounded-t bg-ink-3" style={{ height: `${Math.max(2, (w.count / max) * 100)}%` }} />
            </div>
          )
        })}
      </div>
      <p className="mt-1 text-micro text-fg-2">
        Bars are urges resisted per week{today ? '' : ''} · a dot marks a week with a reset
      </p>
    </div>
  )
}
