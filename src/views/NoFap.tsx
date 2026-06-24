import { useState, useEffect, useRef } from 'react'
import { Check, X, Shield, Flame, Trophy, CalendarCheck, HandMetal, Sparkles, AlertTriangle, LifeBuoy, Heart, Hourglass, ShieldCheck } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card, Empty, Input, StatTile, Textarea } from '../components/ui'
import { cat } from '../lib/colors'
import { prettyDay, todayISO, dayDiff } from '../lib/date'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { streakStats, addictionStats, STREAK_MILESTONES, URGE_PRESETS, urgesByType, haltTally, HALT_STATES, moneySaved, type HaltState } from '../lib/streak'
import { techniqueRanking, matchPlanForTrigger, streakVsBest, comebackStatus, urgeHourHistogram, peakUrgeHour, relapseWeekdayPattern, peakRelapseWeekday, urgeConversion, paceToRecord, urgeFrequencyTrend, streaksSaved, intensityStats, cleanRollup, timeReclaimed, addictionPortfolio, recordApproach, urgeQuietStretch } from '../lib/urge'
import type { TriggerPlan } from '../lib/types'
import {
  CollapsibleSection,
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
  RecoveryPortfolioCard,
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
    <div role="dialog" aria-modal="true" aria-label="Urge SOS"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-6"
      style={{ background: cat('crust') + 'f2', backdropFilter: 'blur(6px)' }}>
      <button onClick={onClose} aria-label="Close SOS" className="absolute right-4 top-4 rounded-full p-2 text-overlay0 hover:text-text" style={{ background: cat('surface0') }}><X size={20} /></button>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-sm" style={{ color: cat('peach') }}><LifeBuoy size={16} /> Ride it out · this is a wave, not a command</div>
        <div className="mt-1 font-mono text-6xl font-extrabold tabular-nums" style={{ color: done ? cat('green') : cat('text') }}>{mm}:{ss}</div>
        <p className="mt-1 text-xs text-overlay0">{done ? 'The peak has passed. You made it.' : 'Stay until the timer ends · the urge will crest and fall.'}</p>
      </div>

      {/* Breathing pacer */}
      <div className="grid h-44 w-44 place-items-center">
        <div className="grid h-32 w-32 place-items-center rounded-full text-center text-sm font-medium"
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
          <div className="mt-2 rounded-lg p-3 text-sm" style={{ background: cat('teal') + '14', border: `1px solid ${cat('teal')}44` }}>
            <span className="font-medium" style={{ color: cat('teal') }}>Your plan for “{matched.trigger}”:</span>{' '}
            <span className="text-subtext0">{matched.coping || 'name it and let it pass.'}</span>
          </div>
        ) : (
          <p className="mt-2 text-center text-xs text-overlay0">No matching plan yet · try “Surf it”: name the urge and watch it pass without acting.</p>
        )}
      </div>

      <Button variant="primary" onClick={onClose} className="inline-flex items-center gap-1.5"><Shield size={15} /> I'm okay now</Button>
    </div>
  )
}

export function NoFap() {
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
  // #344 time reclaimed · #408 portfolio · #321 record-approach · urge-quiet stretch
  const reclaimed = timeReclaimed(stats.totalClean, hoursPerDay)
  const portfolio = addictionPortfolio([
    { id: 'main', name: 'Main streak', startedOn: s.startedOn, best: s.best, relapses: s.relapses },
    ...(s.addictions ?? []).map((a) => ({ id: a.id, name: a.name, startedOn: a.startedOn, best: a.best, relapses: a.relapses })),
  ], today)
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
    if (!trigger.trim()) { setErr('Add the reason behind it first · patterns are data.'); return }
    logRelapse({ date: today, trigger: trigger.trim(), note: note.trim() })
    setTrigger(''); setNote(''); setErr('')
  }

  // SVG ring geometry.
  const R = 54, C = 2 * Math.PI * R
  const ringColor = relapsedToday ? cat('red') : cat('mauve')

  return (
    <div className="mx-auto grid max-w-[1400px] items-start gap-5 lg:grid-cols-3">
      {/* Panic / SOS · floating button + full-screen ride-it-out overlay */}
      <button onClick={() => setSosOpen(true)} aria-label="Panic · open urge SOS"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg transition-transform hover:scale-105"
        style={{ background: cat('red'), color: cat('crust'), boxShadow: `0 6px 24px ${cat('red')}55` }}>
        <LifeBuoy size={18} /> SOS
      </button>
      {sosOpen && <SosOverlay plans={plans} onClose={() => setSosOpen(false)} />}

      <div className="space-y-4 lg:col-span-2">
        {/* Hero: progress ring to next milestone */}
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
                <div className="text-5xl font-extrabold leading-none" style={{ color: ringColor }}>{stats.current}</div>
                <div className="mt-1 text-[11px] tracking-wide text-overlay0 uppercase">days clean</div>
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-sm text-subtext1"><Shield size={15} style={{ color: ringColor }} /> Your main streak · since {prettyDay(s.startedOn)}</div>
              <p className="mt-0.5 text-xs text-overlay0">The ring &amp; ladder track this one streak. Other urges (smoking, scrolling…) are logged + planned below.</p>
              {relapsedToday && (
                <div className="mt-1.5 rounded-lg p-2 text-left text-xs" style={{ background: cat('red') + '12', border: `1px solid ${cat('red')}44` }}>
                  <span className="inline-flex items-center gap-1 font-medium" style={{ color: cat('red') }}><X size={13} /> Reset today · and that’s okay.</span>
                  <p className="mt-0.5 text-subtext1">You didn’t lose everything: your <strong style={{ color: cat('green') }}>{stats.totalClean} total clean days</strong> and <strong style={{ color: cat('peach') }}>{stats.best}-day best</strong> are kept. One slip is a stumble, not a restart · log the reason below and keep going.</p>
                </div>
              )}
              {nextBenefit ? (
                <>
                  <p className="mt-3 text-sm text-subtext0">
                    Next: <span className="font-medium" style={{ color: cat('teal') }}>{nextBenefit.label}</span> · <span className="text-overlay1">{stats.daysToNext} day{stats.daysToNext === 1 ? '' : 's'} to go</span>
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface0">
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${stats.progressPct}%`, background: cat('teal') }} />
                  </div>
                  <p className="mt-2 text-xs text-overlay1 italic">“{nextBenefit.benefit}”</p>
                </>
              ) : (
                <p className="mt-3 text-sm" style={{ color: cat('peach') }}>Every milestone cleared. You’re writing your own ladder now.</p>
              )}
            </div>
          </div>
        </Card>

        {/* My commitment (#316) · quit-date contract + personal "why" */}
        <Card title={<span className="inline-flex items-center gap-2"><Heart size={16} className="text-mauve" /> My commitment</span>}
          subtitle="Your quit-date contract · the reason you’re doing this"
          help="Set the day you committed and a personal reason in your own words. Seeing your own ‘why’ — and how long you’ve held the line — is one of the strongest defenses against an urge."
          right={hasCommitment && !editingCommit ? <Button onClick={() => setEditingCommit(true)} className="text-xs">Edit</Button> : undefined}>
          {hasCommitment && !editingCommit ? (
            <div>
              {commitment?.reason && (
                <blockquote className="border-l-2 pl-3 text-lg font-medium italic" style={{ borderColor: cat('mauve'), color: cat('text') }}>
                  “{commitment.reason}”
                </blockquote>
              )}
              {commitment?.quitDate && (
                <p className="mt-3 text-sm text-subtext0">
                  Committed on <span className="font-medium text-text">{prettyDay(commitment.quitDate)}</span>
                  {daysSinceQuit != null && daysSinceQuit > 0 && <> · <span className="font-semibold" style={{ color: cat('mauve') }}>{daysSinceQuit}</span> day{daysSinceQuit === 1 ? '' : 's'} ago</>}
                  {daysSinceQuit === 0 && <> · <span style={{ color: cat('mauve') }}>today</span></>}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm text-subtext1">Quit date
                <Input type="date" value={commitment?.quitDate ?? ''} max={today} onChange={(e) => setCommitment({ quitDate: e.target.value })} className="mt-1" aria-label="Quit date" />
              </label>
              <label className="block text-sm text-subtext1">Why I quit
                <Textarea value={commitment?.reason ?? ''} onChange={(e) => setCommitment({ reason: e.target.value })} placeholder="The reason that matters most to you…" rows={2} className="mt-1" aria-label="Reason for quitting" />
              </label>
              {editingCommit && <div className="flex justify-end"><Button variant="primary" onClick={() => setEditingCommit(false)}>Done</Button></div>}
            </div>
          )}
        </Card>

        {/* Lifetime stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile compact label="Current" value={stats.current} color="mauve" icon={<Flame size={14} />} />
          <StatTile compact label="Personal best" value={stats.best} color="peach" icon={<Trophy size={14} />} />
          <StatTile compact label="Total clean days" value={stats.totalClean} color="green" icon={<CalendarCheck size={14} />} />
          <StatTile compact label="Urges resisted" value={stats.urges} color="teal" icon={<HandMetal size={14} />} />
        </div>

        {/* Urge surfing · pick what it was, log the win with date + time.
            Promoted above analytics: the primary "cope & log" action. */}
        <Card title="Urge surfing" subtitle="Feeling an urge? Pick what it is and mark the win · it crests and passes in minutes." help="Tap a type (or type your own) then log it. Each win is saved with the day and time, so you can see exactly what you resisted and when · and spot your high-risk hours.">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {URGE_PRESETS.map((u) => (
              <button key={u} onClick={() => setUrge(u)}
                className="rounded-full border px-2.5 py-1 text-xs transition-colors"
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
            <div className="mt-2 rounded-lg p-2 text-xs" style={{ background: cat('teal') + '14', border: `1px solid ${cat('teal')}44` }}>
              <span className="font-medium" style={{ color: cat('teal') }}>Your plan for “{matchedPlan.trigger}”:</span>{' '}
              <span className="text-subtext0">{matchedPlan.coping || 'name it and let it pass.'}</span>
            </div>
          )}
          {/* Intensity 1–5 (U8) */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-subtext1">
              <label htmlFor="urge-intensity">Intensity</label>
              <span className="font-semibold" style={{ color: cat('peach') }}>{intensity}/5</span>
            </div>
            <input id="urge-intensity" type="range" min={1} max={5} step={1} value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="mt-1 w-full accent-mauve" style={{ accentColor: cat('mauve') }} aria-label="Urge intensity, 1 to 5" />
          </div>
          {/* Technique chips (U8) */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TECHNIQUES.map((t) => (
              <button key={t.id} onClick={() => setTechnique(technique === t.id ? undefined : t.id)}
                className="rounded-full border px-2.5 py-1 text-xs transition-colors"
                style={{ borderColor: technique === t.id ? cat('teal') : cat('surface1'), background: technique === t.id ? cat('teal') + '22' : 'transparent', color: technique === t.id ? cat('text') : cat('subtext0') }}>
                {t.label}
              </button>
            ))}
          </div>
          {/* HALT quick-check · which unmet need is driving the urge? */}
          <div className="mt-2">
            <p className="mb-1 text-xs text-overlay0">HALT check · tap any that fit</p>
            <div className="flex flex-wrap gap-1.5">
              {HALT_STATES.map((hs) => {
                const on = halt.includes(hs.id)
                return (
                  <button key={hs.id} onClick={() => setHalt((cur) => cur.includes(hs.id) ? cur.filter((x) => x !== hs.id) : [...cur, hs.id])}
                    aria-pressed={on}
                    className="rounded-full border px-2.5 py-1 text-xs transition-colors"
                    style={{ borderColor: on ? cat('peach') : cat('surface1'), background: on ? cat('peach') + '22' : 'transparent', color: on ? cat('text') : cat('subtext0') }}>
                    {hs.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="primary" onClick={logUrge} className="inline-flex items-center gap-1.5"><HandMetal size={15} /> I resisted it</Button>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-subtext1">Urges resisted: <span className="font-semibold" style={{ color: cat('green') }}>{stats.urges}</span></span>
          </div>
          {/* Most-effective technique tally (U8) */}
          {techRank.length > 0 && (
            <div className="mt-2 rounded-lg border border-surface0 bg-base p-2.5 text-xs">
              <div className="mb-1 text-subtext1">Most-used technique: <span className="font-medium" style={{ color: cat('teal') }}>{TECH_LABEL[techRank[0].technique]}</span> · {techRank[0].count}×</div>
              <div className="flex flex-wrap gap-1.5">
                {techRank.map((t) => (
                  <span key={t.technique} className="rounded-full px-2 py-0.5" style={{ background: cat('surface0'), color: cat('subtext0') }}>{TECH_LABEL[t.technique]} {t.count}</span>
                ))}
              </div>
            </div>
          )}
          {/* HALT pattern tally · which unmet need accompanies urges most */}
          {haltRank.length > 0 && (
            <div className="mt-2 rounded-lg border border-surface0 bg-base p-2.5 text-xs">
              <div className="mb-1 text-subtext1">HALT pattern: <span className="font-medium" style={{ color: cat('peach') }}>{haltRank[0].label}</span> most often · {haltRank[0].count}×</div>
              <div className="flex flex-wrap gap-1.5">
                {haltRank.map((h) => (
                  <span key={h.state} className="rounded-full px-2 py-0.5" style={{ background: cat('surface0'), color: cat('subtext0') }}>{h.label} {h.count}</span>
                ))}
              </div>
            </div>
          )}
          {urgeLog.length > 0 && (
            <ul className="mt-2 max-h-56 space-y-1.5 overflow-auto">
              {urgeLog.map((u) => (
                <li key={u.id} className="group flex items-center gap-2 rounded-lg border border-surface0 bg-base px-2.5 py-1.5 text-sm">
                  <HandMetal size={13} style={{ color: cat('green') }} className="shrink-0" />
                  <span className="text-subtext1">{u.trigger || 'Urge'}</span>
                  <span className="ml-auto text-xs text-overlay0">{prettyDay(u.date)}{fmtTime(u.at) ? ` · ${fmtTime(u.at)}` : ''}</span>
                  <button onClick={() => removeUrge(u.id)} aria-label="Remove" className="text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
                </li>
              ))}
            </ul>
          )}
          {(data.nofap.urgesResisted ?? 0) > 0 && <p className="mt-2 text-xs text-overlay0">+ {data.nofap.urgesResisted} earlier wins (before dated logging).</p>}
        </Card>

        {/* ── Secondary analytics, grouped + collapsible (card-density UX) ──── */}
        {/* Insights · motivational / progress cards · default OPEN */}
        <CollapsibleSection
          title="Insights & progress"
          subtitle="Streak vs. best, self-efficacy, money & time saved"
          icon={<ShieldCheck size={18} className="text-green" />}
          defaultOpen
        >
          <StreakVsBestCard vsBest={vsBest} comeback={comeback} pace={pace} approachCopy={approachCopy} />
          {conversion.total > 0 && <SelfEfficacyCard conversion={conversion} />}
          {saved.saved > 0 && <StreaksSavedCard saved={saved} />}
          {stats.totalClean > 0 && (
            <TimeReclaimedCard reclaimed={reclaimed} totalClean={stats.totalClean} hoursPerDay={hoursPerDay} onHoursPerDayChange={setHoursPerDay} />
          )}
          <MoneySavedCard currency={currency} costPerDay={s.costPerDay} savedMoney={savedMoney} totalClean={stats.totalClean} onCostChange={setStreakCost} />
          {!quiet.empty && quiet.days >= 1 && <CalmStretchCard quiet={quiet} />}
        </CollapsibleSection>

        {/* Deep analytics · trends, distributions, heatmaps · default COLLAPSED */}
        <CollapsibleSection
          title="Deep analytics"
          subtitle="Trends, intensity, clean windows, high-risk hours & days"
          icon={<Hourglass size={18} className="text-teal" />}
        >
          {urgeTrend.total > 0 && <UrgeTrendCard urgeTrend={urgeTrend} />}
          {intensity9.rated > 0 && <UrgeIntensityCard intensity9={intensity9} />}
          {rollup.totalWeeks > 0 && <CleanRollupCard rollup={rollup} />}
          {peakHour && <HighRiskHoursCard hourHist={hourHist} peakHour={peakHour} />}
          {peakWeekday && <RiskiestDaysCard weekdayPattern={weekdayPattern} peakWeekday={peakWeekday} />}
          {(s.addictions ?? []).length > 0 && <RecoveryPortfolioCard portfolio={portfolio} />}
        </CollapsibleSection>

        {/* Per-addiction streaks (BUJO-199) · each tracked as its own streak + best */}
        <Card title="Per-addiction streaks" subtitle="Track each habit separately · its own counter, best & resets" help="The ring above is your main streak. Add any other addiction here to give it its own independent counter, personal best and reset log — quitting two things at once shouldn't share one streak.">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Input value={newAddiction} onChange={(e) => setNewAddiction(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { addAddiction(newAddiction); setNewAddiction('') } }} placeholder="Add an addiction (e.g. Sugar)" list="urge-presets" aria-label="New addiction name" className="min-w-[10rem] flex-1" />
            <Button variant="primary" onClick={() => { addAddiction(newAddiction); setNewAddiction('') }}>Add</Button>
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
                  <li key={a.id} className="group rounded-lg border border-surface0 bg-base px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <Flame size={16} style={{ color: reset ? cat('red') : cat('peach') }} className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate font-medium text-text">{a.name}</span>
                          <span className="text-xs text-overlay0">best {st.best}d</span>
                          {a.costPerDay && aSaved > 0 && <span className="text-xs" style={{ color: cat('green') }}>{currency}{aSaved.toLocaleString()} saved</span>}
                        </div>
                        <span className="text-sm text-subtext1"><span className="font-semibold" style={{ color: cat('mauve') }}>{st.current}</span> day{st.current === 1 ? '' : 's'} clean{st.relapseCount ? ` · ${st.relapseCount} reset${st.relapseCount === 1 ? '' : 's'}` : ''}</span>
                      </div>
                      <Button onClick={() => { if (confirm(`Reset the ${a.name} streak to today?`)) relapseAddiction(a.id, { date: today, trigger: '', note: '' }) }} className="shrink-0 text-xs">Reset</Button>
                      <button onClick={() => { if (confirm(`Stop tracking ${a.name}? Its history is removed.`)) removeAddiction(a.id) }} aria-label={`Remove ${a.name}`} className="shrink-0 text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
                    </div>
                    {/* #123 per-addiction cost/day → money saved */}
                    <div className="mt-2 flex items-center gap-2 pl-7 text-xs text-overlay1">
                      <span>{currency}/day</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        value={a.costPerDay ?? ''}
                        onChange={(e) => setAddictionCost(a.id, e.target.value === '' ? undefined : Number(e.target.value))}
                        placeholder="0"
                        className="w-20 !py-1 text-xs"
                        aria-label={`Cost per day for ${a.name}`}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Trigger plans · if-then for each addiction's trigger points */}
        <Card title="Trigger plans" subtitle="Name each addiction’s trigger point + your if-then response" help="Pre-deciding what to do beats willpower in the moment. For each addiction, add a trigger (the situation) and a coping response. When the urge hits, you already have the plan.">
          <div className="grid gap-2 rounded-lg border border-surface0 bg-base p-3 sm:grid-cols-2">
            <Input value={plan.addiction} onChange={(e) => setPlan({ ...plan, addiction: e.target.value })} placeholder="Addiction (e.g. Smoking)" list="urge-presets" aria-label="Addiction" />
            <Input value={plan.trigger} onChange={(e) => setPlan({ ...plan, trigger: e.target.value })} placeholder="Trigger point (e.g. after meals)" aria-label="Trigger point" />
            <Input value={plan.coping} onChange={(e) => setPlan({ ...plan, coping: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && savePlan()} placeholder="Then I will… (e.g. chew gum, walk 10 min)" aria-label="Coping response" className="sm:col-span-2" />
            <Button variant="primary" onClick={savePlan} className="sm:col-span-2">Add trigger plan</Button>
          </div>
          {plans.length > 0 && (
            <ul className="mt-3 space-y-2">
              {plans.map((pl) => (
                <li key={pl.id} className="group rounded-lg border border-surface0 bg-base p-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: cat('mauve') + '22', color: cat('mauve') }}>{pl.addiction}</span>
                    <span className="text-subtext1"><span className="text-overlay0">when</span> {pl.trigger}</span>
                    <button onClick={() => removeTriggerPlan(pl.id)} aria-label="Remove plan" className="ml-auto text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
                  </div>
                  {pl.coping && <p className="mt-0.5 text-xs text-overlay1"><span className="text-teal">→ then</span> {pl.coping}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Benefits ladder */}
        <Card title="Recovery ladder" subtitle="What clears as the streak grows" help="A motivational timeline of what typically improves at each milestone. Reached rungs are lit; the next is highlighted.">
          <ol className="relative ml-3 space-y-3 border-l border-surface1 pl-5">
            {STREAK_MILESTONES.map((m) => {
              const reached = stats.current >= m.day
              const isNext = nextBenefit?.day === m.day
              return (
                <li key={m.day} className="relative">
                  <span className="absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full text-[10px]"
                    style={{ background: reached ? cat('green') : isNext ? cat('teal') : cat('surface0'), color: cat('crust') }}>
                    {reached ? <Check size={11} /> : m.day}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-sm font-medium ${reached ? 'text-text' : isNext ? 'text-teal' : 'text-overlay0'}`}>{m.label}</span>
                    <span className="text-[11px] text-overlay0">{m.day}d</span>
                    {isNext && <span className="rounded-full px-1.5 py-0.5 text-[10px]" style={{ background: cat('teal') + '22', color: cat('teal') }}>next</span>}
                  </div>
                  <p className={`text-xs ${reached || isNext ? 'text-overlay1' : 'text-overlay0'}`}>{m.benefit}</p>
                </li>
              )
            })}
          </ol>
        </Card>

        {/* Trigger patterns */}
        {stats.topTriggers.length > 0 && (
          <TriggerPatternsCard topTriggers={stats.topTriggers} relapseCount={stats.relapseCount} avgGap={stats.avgGap} />
        )}

        {/* Relapse log */}
        <Card title="Reset history" subtitle={s.relapses.length ? `${s.relapses.length} reset${s.relapses.length === 1 ? '' : 's'} · no shame, patterns are data` : 'No shame · patterns are data'} collapsible defaultCollapsed={s.relapses.length > 4}>
          {s.relapses.length === 0 ? (
            <Empty>No resets logged. Keep going.</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {[...s.relapses].reverse().map((r) => (
                <li key={r.id} className="rounded-lg border p-2" style={{ borderColor: cat('red') + '55', background: cat('red') + '12' }}>
                  <div className="flex items-center gap-1.5 font-medium" style={{ color: cat('red') }}><X size={13} /> Reset · {prettyDay(r.date)}</div>
                  {r.trigger && <div className="mt-0.5 text-subtext1"><span className="text-overlay0">Reason:</span> {r.trigger}</div>}
                  {r.note && <div className="text-overlay1 italic">{r.note}</div>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Right rail: the visualization (fits here) + actions + tips */}
      <div className="space-y-4">
        {byType.length > 0 && (
          <Card title="Urges by addiction" subtitle="What you resist most" enlargeable help="Every logged urge counted by type. Tall bars are your battleground habits; a steady count means you're catching and surfing them, not giving in.">
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
        <Card title="Log a reset" subtitle="Reflect, learn, restart the counter">
          <div className="space-y-3">
            <label className="block text-sm text-subtext1">
              Reason <span style={{ color: cat('red') }}>*</span>
              <Input value={trigger} onChange={(e) => { setTrigger(e.target.value); if (err) setErr('') }} placeholder="What led to it? (required)" className="mt-1" />
            </label>
            <label className="block text-sm text-subtext1">
              Reflection
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What will you do differently next time?" rows={4} className="mt-1" />
            </label>
            {err && <p className="text-xs" style={{ color: cat('red') }}>{err}</p>}
            <Button variant="danger" onClick={relapse} className="w-full">Log reset &amp; restart</Button>
            <p className="text-xs text-overlay0">Records the reason today, then restarts the days-clean counter. Your best ({stats.best}d) and total ({stats.totalClean}d) are kept.</p>
          </div>
        </Card>

        <Card title={<span className="inline-flex items-center gap-2"><Sparkles size={16} className="text-mauve" /> Beat the urge</span>} subtitle="Proven techniques · an urge peaks and passes in ~15–20 min" help="Urges are waves, not commands. They crest and fall whether or not you act. These are evidence-based techniques; pick one and start the clock.">
          <ol className="space-y-2 text-sm text-subtext1">
            <li className="flex gap-2"><span className="font-medium text-teal">Surf it</span> · name it (“this is an urge, it will pass”) and watch it rise and fall without acting.</li>
            <li className="flex gap-2"><span className="font-medium text-teal">Delay 10 min</span> · set a timer; move, cold water, walk, push-ups. The peak passes.</li>
            <li className="flex gap-2"><span className="font-medium text-teal">HALT check</span> · Hungry? Angry? Lonely? Tired? Fix the real need instead.</li>
            <li className="flex gap-2"><span className="font-medium text-teal">Play it forward</span> · picture how you’ll feel 1 hour after giving in vs. resisting.</li>
            <li className="flex gap-2"><span className="font-medium text-teal">Remove the cue</span> · leave the room, phone in another room, block the site.</li>
            <li className="flex gap-2"><span className="font-medium text-teal">Reach out</span> · text someone; saying it out loud drains the urge’s power.</li>
            <li className="flex gap-2"><span className="font-medium text-teal">Log the win</span> · tap <strong>I resisted it</strong> above; evidence beats willpower.</li>
          </ol>
          {plans.length > 0 && (
            <div className="mt-3 rounded-lg bg-secondary/50 p-2 text-xs text-subtext0">
              <span className="font-medium text-mauve">Your plan:</span> {plans.map((pl) => `${pl.addiction} → ${pl.coping || pl.trigger}`).slice(0, 2).join(' · ')}
            </div>
          )}
          {nextBenefit && <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-peach/10 p-2 text-xs text-subtext0"><AlertTriangle size={13} className="text-peach" /> You’re {stats.daysToNext} day{stats.daysToNext === 1 ? '' : 's'} from {nextBenefit.label}. Don’t trade weeks of progress for 10 minutes.</p>}
        </Card>
      </div>
    </div>
  )
}
