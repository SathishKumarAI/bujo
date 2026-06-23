import { useState, useEffect, useRef } from 'react'
import { Check, X, Shield, Flame, Trophy, CalendarCheck, HandMetal, Sparkles, AlertTriangle, LifeBuoy, RotateCcw, Clock, CalendarX, ShieldCheck, Target, TrendingDown, TrendingUp, Activity, CalendarRange, Hourglass, ListOrdered, Wind } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card, Empty, Input, StatTile, Textarea } from '../components/ui'
import { cat } from '../lib/colors'
import { prettyDay, todayISO } from '../lib/date'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts'
import { streakStats, addictionStats, STREAK_MILESTONES, URGE_PRESETS, urgesByType, haltTally, HALT_STATES, type HaltState } from '../lib/streak'
import { techniqueRanking, matchPlanForTrigger, streakVsBest, comebackStatus, urgeHourHistogram, peakUrgeHour, relapseWeekdayPattern, peakRelapseWeekday, urgeConversion, paceToRecord, urgeFrequencyTrend, streaksSaved, intensityStats, cleanRollup, timeReclaimed, addictionPortfolio, recordApproach, urgeQuietStretch } from '../lib/urge'
import type { TriggerPlan } from '../lib/types'

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
  const { data, logRelapse, resistUrge, removeUrge, addTriggerPlan, removeTriggerPlan, addAddiction, removeAddiction, relapseAddiction } = useJournal()
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
  const INTENSITY_LABELS = ['Faint', 'Mild', 'Moderate', 'Strong', 'Intense']
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

        {/* Lifetime stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile compact label="Current" value={stats.current} color="mauve" icon={<Flame size={14} />} />
          <StatTile compact label="Personal best" value={stats.best} color="peach" icon={<Trophy size={14} />} />
          <StatTile compact label="Total clean days" value={stats.totalClean} color="green" icon={<CalendarCheck size={14} />} />
          <StatTile compact label="Urges resisted" value={stats.urges} color="teal" icon={<HandMetal size={14} />} />
        </div>

        {/* Streak vs personal best · ghost bar (current overlaid on best) */}
        <Card title="Current vs your best" subtitle={vsBest.isRecord ? 'You’re writing a new record right now' : `${vsBest.daysToBeat} day${vsBest.daysToBeat === 1 ? '' : 's'} to match your best`} help="The faint bar is your longest streak ever; the solid bar is your current run climbing toward it. Once it fills, you’re in record territory.">
          <div className="relative h-4 overflow-hidden rounded-full" style={{ background: cat('surface0') }}>
            {/* ghost = personal best (full width reference) */}
            <div className="absolute inset-0 rounded-full" style={{ background: cat('peach') + '2e' }} />
            {/* solid = current run, proportional to best */}
            <div className="relative h-full rounded-full transition-[width] duration-500"
              style={{ width: `${vsBest.pct}%`, background: vsBest.isRecord ? cat('green') : cat('mauve') }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span style={{ color: vsBest.isRecord ? cat('green') : cat('mauve') }}><span className="font-semibold">{vsBest.current}</span>d now</span>
            <span className="text-overlay1 inline-flex items-center gap-1"><Trophy size={12} style={{ color: cat('peach') }} /> best {vsBest.best}d</span>
          </div>
          {comeback.isComeback && (
            <div className="mt-3 inline-flex w-full items-center gap-2 rounded-lg p-2.5 text-sm" style={{ background: cat('green') + '14', border: `1px solid ${cat('green')}44` }}>
              <RotateCcw size={16} style={{ color: cat('green') }} className="shrink-0" />
              <span className="text-subtext0"><span className="font-semibold" style={{ color: cat('green') }}>Comeback unlocked.</span> This run beats your last streak ({comeback.prevStreak}d) by <strong style={{ color: cat('green') }}>{comeback.by} day{comeback.by === 1 ? '' : 's'}</strong> · the slip didn’t win.</span>
            </div>
          )}
          {/* Pace-to-record projection (#298) · concrete calendar target */}
          {!pace.alreadyRecord && pace.matchDate && (
            <div className="mt-3 inline-flex w-full items-center gap-2 rounded-lg p-2.5 text-xs" style={{ background: cat('mauve') + '12', border: `1px solid ${cat('mauve')}33` }}>
              <Target size={15} style={{ color: cat('mauve') }} className="shrink-0" />
              <span className="text-subtext0">Stay clean and you’ll <strong style={{ color: cat('mauve') }}>match your best on {prettyDay(pace.matchDate)}</strong> · a new record the very next day ({pace.beatDate && prettyDay(pace.beatDate)}). {pace.daysToMatch} day{pace.daysToMatch === 1 ? '' : 's'} away.</span>
            </div>
          )}
          {/* Record-approach escalation (#321) · the cost of slipping rises near your best */}
          {approachCopy && (
            <div className="mt-3 inline-flex w-full items-center gap-2 rounded-lg p-2.5 text-xs" style={{ background: cat(approachCopy.color) + '14', border: `1px solid ${cat(approachCopy.color)}44` }}>
              <AlertTriangle size={15} style={{ color: cat(approachCopy.color) }} className="shrink-0" />
              <span className="text-subtext0">{approachCopy.text}</span>
            </div>
          )}
        </Card>

        {/* Urge-to-relapse conversion (#76) · self-efficacy from the urge log */}
        {conversion.total > 0 && (
          <Card title="Self-efficacy" subtitle={`${conversion.resistRate}% of urge moments ended in a win, not a reset`} help="Every logged urge you surfed is a win; every reset is the rare miss. This is how often, when an urge showed up, you chose your streak — a direct measure of growing self-control.">
            <div className="grid grid-cols-3 gap-3">
              <StatTile compact label="Resisted" value={conversion.resisted} color="green" icon={<ShieldCheck size={14} />} />
              <StatTile compact label="Resets" value={conversion.relapses} color="red" icon={<X size={14} />} />
              <StatTile compact label="Win rate" value={`${conversion.resistRate}%`} color="teal" icon={<HandMetal size={14} />} />
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full" style={{ background: cat('red') + '33' }}>
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${conversion.resistRate}%`, background: cat('green') }} />
            </div>
            <p className="mt-2 text-xs text-overlay0">Each resisted urge is a streak you protected. Keep the green bar climbing.</p>
          </Card>
        )}

        {/* Streak-saved counter (#334) · resisted urges = streaks protected */}
        {saved.saved > 0 && (
          <Card title={<span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-green" /> Streaks you saved</span>} subtitle="Every resisted urge was a reset that didn’t happen" help="Each urge you surfed was a moment that could have become a reset. Counting them reframes resistance as progress protected — not just willpower spent, but streaks kept alive.">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-extrabold leading-none" style={{ color: cat('green') }}>{saved.saved}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-overlay0">urges resisted</div>
              </div>
              <p className="flex-1 text-sm text-subtext0">
                That’s <strong style={{ color: cat('green') }}>{saved.saved} streak{saved.saved === 1 ? '' : 's'}</strong> you might have lost.
                {saved.savedToday > 0 && <> <span className="text-overlay1">{saved.savedToday} saved today</span> · keep the count climbing.</>}
              </p>
            </div>
          </Card>
        )}

        {/* Time / life reclaimed (#344) · per-day cost × clean days, non-financial motivator */}
        {stats.totalClean > 0 && (
          <Card title={<span className="inline-flex items-center gap-2"><Hourglass size={16} className="text-teal" /> Time reclaimed</span>} subtitle="Hours you’d otherwise have lost · across all your clean days" help="An estimate of the life you’ve won back: set how many hours a day the behaviour used to cost you, and this multiplies it across your lifetime clean days. A concrete, non-financial reason every day counts.">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-extrabold leading-none" style={{ color: cat('teal') }}>{reclaimed.hours}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-overlay0">hours back</div>
              </div>
              <p className="flex-1 text-sm text-subtext0">
                That’s about <strong style={{ color: cat('teal') }}>{reclaimed.days} full day{reclaimed.days === 1 ? '' : 's'}</strong>{reclaimed.remHours > 0 && <> and {reclaimed.remHours}h</>} of life reclaimed across <strong>{stats.totalClean}</strong> clean day{stats.totalClean === 1 ? '' : 's'}.
              </p>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-subtext1">
                <label htmlFor="reclaim-rate">Hours/day it used to cost you</label>
                <span className="font-semibold" style={{ color: cat('teal') }}>{hoursPerDay}h</span>
              </div>
              <input id="reclaim-rate" type="range" min={0} max={8} step={1} value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                className="mt-1 w-full" style={{ accentColor: cat('teal') }} aria-label="Hours per day reclaimed, 0 to 8" />
            </div>
          </Card>
        )}

        {/* Urge-quiet stretch · days since even a craving showed up */}
        {!quiet.empty && quiet.days >= 1 && (
          <Card title={<span className="inline-flex items-center gap-2"><Wind size={16} className="text-sky" /> Calm stretch</span>} subtitle="Days since your last logged urge" help="Not just clean days — days without even a craving worth logging. A growing number here is the quiet that follows the storm: the brain settling and the urges thinning out.">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-extrabold leading-none" style={{ color: cat('sky') }}>{quiet.days}</div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-overlay0">day{quiet.days === 1 ? '' : 's'} quiet</div>
              </div>
              <p className="flex-1 text-sm text-subtext0">No urge logged since <strong style={{ color: cat('sky') }}>{quiet.lastDate && prettyDay(quiet.lastDate)}</strong>. The cravings are getting quieter · this is the work paying off.</p>
            </div>
          </Card>
        )}

        {/* Urge-frequency trend (#348) · weekly sparkline, evidence cravings ease */}
        {urgeTrend.total > 0 && (
          <Card
            title={<span className="inline-flex items-center gap-2">{urgeTrend.direction === 'down' ? <TrendingDown size={16} className="text-green" /> : urgeTrend.direction === 'up' ? <TrendingUp size={16} className="text-peach" /> : <Activity size={16} className="text-overlay1" />} Urge trend</span>}
            subtitle={urgeTrend.direction === 'down' ? 'Cravings are easing week over week' : urgeTrend.direction === 'up' ? 'Urges have picked up lately · lean on your plan' : 'Holding steady week to week'}
            help="Resisted urges bucketed into the last 8 weeks. A falling line is hard evidence that cravings genuinely weaken with abstinence — the brain re-regulates and the waves get smaller.">
            <div className="h-40 w-full" role="img" aria-label={`Weekly urge counts, oldest to newest: ${urgeTrend.weeks.map((w) => w.count).join(', ')}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={urgeTrend.weeks} margin={{ top: 6, right: 8, bottom: 0, left: -24 }}>
                  <defs>
                    <linearGradient id="urgeTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cat('mauve')} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={cat('mauve')} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={cat('surface0')} vertical={false} />
                  <XAxis dataKey="weekStart" stroke={cat('overlay0')} fontSize={10} tickLine={false}
                    tickFormatter={(d) => prettyDay(d as string).replace(/^\w+, /, '')} />
                  <YAxis allowDecimals={false} stroke={cat('overlay0')} fontSize={11} />
                  <Tooltip contentStyle={{ background: cat('mantle'), border: `1px solid ${cat('surface0')}`, borderRadius: 8, color: cat('text') }} cursor={{ stroke: cat('surface1') }}
                    labelFormatter={(d) => `Week of ${prettyDay(d as string)}`}
                    formatter={(v) => [`${v} urge${v === 1 ? '' : 's'}`, 'Resisted'] as [string, string]} />
                  <Area type="monotone" dataKey="count" stroke={cat('mauve')} strokeWidth={2} fill="url(#urgeTrendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1.5 text-xs text-overlay0">Averaging <span className="font-medium" style={{ color: cat('mauve') }}>{urgeTrend.avgPerWeek}/week</span>{urgeTrend.delta !== 0 && <> · {urgeTrend.delta < 0 ? 'down' : 'up'} {Math.abs(urgeTrend.delta)} vs. 8 weeks ago</>}.</p>
          </Card>
        )}

        {/* Urge-intensity distribution (#74) · how strong, and whether it's weakening */}
        {intensity9.rated > 0 && (
          <Card title={<span className="inline-flex items-center gap-2"><Activity size={16} className="text-peach" /> Urge intensity</span>} subtitle={`Averaging ${intensity9.avg}/5${intensity9.mode ? ` · mostly ${INTENSITY_LABELS[intensity9.mode - 1].toLowerCase()}` : ''}`} help="Your self-rated urge strengths (1 faint … 5 intense). A falling trend means the urges themselves are getting weaker over time, not just less frequent — the strongest signal that recovery is working.">
            <div className="space-y-1.5">
              {intensity9.buckets.map((c, i) => {
                const pct = intensity9.rated > 0 ? Math.round((c / intensity9.rated) * 100) : 0
                const isMode = intensity9.mode === i + 1
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-16 shrink-0 text-overlay0">{i + 1} · {INTENSITY_LABELS[i]}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: cat('surface0') }}>
                      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: isMode ? cat('peach') : cat('surface1') }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-overlay1">{c}</span>
                  </div>
                )
              })}
            </div>
            {intensity9.rated >= 2 && intensity9.trend !== 0 && (
              <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs" style={{ color: intensity9.trend < 0 ? cat('green') : cat('peach') }}>
                {intensity9.trend < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                {intensity9.trend < 0
                  ? <span>Urges are getting <strong>weaker</strong> · recent ones average {Math.abs(intensity9.trend)} lower.</span>
                  : <span>Urges have intensified by {intensity9.trend} lately · extra care this stretch.</span>}
              </p>
            )}
          </Card>
        )}

        {/* Relapse-free week / month rollup (#322) · reward sustained windows */}
        {rollup.totalWeeks > 0 && (
          <Card title={<span className="inline-flex items-center gap-2"><CalendarRange size={16} className="text-teal" /> Clean weeks &amp; months</span>} subtitle="Fully reset-free windows across your whole journey" help="Counts of calendar weeks and months with zero resets since you started tracking. Rewarding sustained clean windows — not just single days — keeps a stumble from feeling like total failure.">
            <div className="grid grid-cols-2 gap-3">
              <StatTile compact label="Clean weeks" value={`${rollup.cleanWeeks}/${rollup.totalWeeks}`} color="teal" icon={<CalendarCheck size={14} />} />
              <StatTile compact label="Clean months" value={`${rollup.cleanMonths}/${rollup.totalMonths}`} color="green" icon={<CalendarRange size={14} />} />
            </div>
            <p className="mt-2 text-xs text-overlay0">{rollup.cleanWeeks} of {rollup.totalWeeks} weeks and {rollup.cleanMonths} of {rollup.totalMonths} month{rollup.totalMonths === 1 ? '' : 's'} stayed fully reset-free.</p>
          </Card>
        )}

        {/* High-risk hour heatmap (#114) · 24h clock from urge timestamps */}
        {peakHour && (
          <Card title={<span className="inline-flex items-center gap-2"><Clock size={16} className="text-peach" /> High-risk hours</span>} subtitle={`Urges cluster around ${peakHour.label} · pre-plan a defense`} help="Each cell is an hour of the day, shaded by how many urges you logged then (from their timestamps). Your peak hours are when to remove cues and have your plan ready before the craving hits.">
            <div className="grid grid-cols-12 gap-1" role="img" aria-label={`Hour-of-day urge heatmap; peak at ${peakHour.label} with ${peakHour.count} urges`}>
              {hourHist.map((h) => (
                <div key={h.hour} title={`${h.count} urge${h.count === 1 ? '' : 's'} around ${((h.hour % 12) === 0 ? 12 : h.hour % 12)}${h.hour < 12 ? 'am' : 'pm'}`}
                  className="grid aspect-square place-items-center rounded text-[9px]"
                  style={{
                    background: h.count > 0 ? cat('peach') + Math.round(38 + h.heat * 217).toString(16).padStart(2, '0') : cat('surface0'),
                    color: h.heat > 0.5 ? cat('crust') : cat('overlay0'),
                  }}>
                  {h.hour % 6 === 0 ? h.hour : ''}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-overlay0"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span></div>
            <p className="mt-1.5 text-xs text-overlay0">Tallest heat at <span className="font-medium" style={{ color: cat('peach') }}>{peakHour.label}</span> · {peakHour.count} urge{peakHour.count === 1 ? '' : 's'}.</p>
          </Card>
        )}

        {/* Day-of-week relapse pattern (#263) · weekday bar chart from reset dates */}
        {peakWeekday && (
          <Card title={<span className="inline-flex items-center gap-2"><CalendarX size={16} className="text-red" /> Riskiest days</span>} subtitle={`${peakWeekday.label} is your highest-reset weekday`} help="Resets counted by day of the week. A tall bar means that day repeatedly trips you up — a weekend, a routine, a recurring trigger. Spot it, then build a plan for that day.">
            <div className="h-44 w-full" role="img" aria-label={`Relapses by weekday: ${weekdayPattern.map((w) => `${w.count} on ${w.label}`).join(', ')}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekdayPattern} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke={cat('surface0')} vertical={false} />
                  <XAxis dataKey="label" stroke={cat('overlay0')} fontSize={11} tickLine={false} />
                  <YAxis allowDecimals={false} stroke={cat('overlay0')} fontSize={11} />
                  <Tooltip contentStyle={{ background: cat('mantle'), border: `1px solid ${cat('surface0')}`, borderRadius: 8, color: cat('text') }} cursor={{ fill: cat('surface0') }}
                    formatter={(v) => [`${v} reset${v === 1 ? '' : 's'}`, 'Resets'] as [string, string]} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {weekdayPattern.map((w) => <Cell key={w.day} fill={w.day === peakWeekday.day ? cat('red') : cat('surface1')} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1.5 text-xs text-overlay0">Most resets land on <span className="font-medium" style={{ color: cat('red') }}>{peakWeekday.label}</span> · plan extra support there.</p>
          </Card>
        )}

        {/* Multi-addiction overview (#408) · whole recovery portfolio ranked by current streak */}
        {(s.addictions ?? []).length > 0 && (
          <Card title={<span className="inline-flex items-center gap-2"><ListOrdered size={16} className="text-mauve" /> Recovery portfolio</span>} subtitle="Every streak you’re holding · ranked by current run" help="An at-a-glance ranking of everything you’re quitting — your main streak plus each tracked addiction — by days clean now, with best and reset counts. See your whole recovery in one place.">
            <ul className="space-y-1.5">
              {portfolio.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 rounded-lg border border-surface0 bg-base px-3 py-2 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold" style={{ background: i === 0 ? cat('mauve') + '22' : cat('surface0'), color: i === 0 ? cat('mauve') : cat('overlay1') }}>{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-text">{p.name}</span>
                  <span className="shrink-0 tabular-nums" style={{ color: p.resetToday ? cat('red') : cat('mauve') }}><span className="font-semibold">{p.current}</span>d</span>
                  <span className="hidden shrink-0 text-xs text-overlay0 sm:inline">best {p.best}d</span>
                  <span className="hidden shrink-0 text-xs text-overlay0 sm:inline">{p.totalClean}d total</span>
                  <span className="shrink-0 text-xs text-overlay0">{p.resets} reset{p.resets === 1 ? '' : 's'}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

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
                return (
                  <li key={a.id} className="group flex items-center gap-3 rounded-lg border border-surface0 bg-base px-3 py-2.5">
                    <Flame size={16} style={{ color: reset ? cat('red') : cat('peach') }} className="shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate font-medium text-text">{a.name}</span>
                        <span className="text-xs text-overlay0">best {st.best}d</span>
                      </div>
                      <span className="text-sm text-subtext1"><span className="font-semibold" style={{ color: cat('mauve') }}>{st.current}</span> day{st.current === 1 ? '' : 's'} clean{st.relapseCount ? ` · ${st.relapseCount} reset${st.relapseCount === 1 ? '' : 's'}` : ''}</span>
                    </div>
                    <Button onClick={() => { if (confirm(`Reset the ${a.name} streak to today?`)) relapseAddiction(a.id, { date: today, trigger: '', note: '' }) }} className="shrink-0 text-xs">Reset</Button>
                    <button onClick={() => { if (confirm(`Stop tracking ${a.name}? Its history is removed.`)) removeAddiction(a.id) }} aria-label={`Remove ${a.name}`} className="shrink-0 text-overlay0 opacity-0 group-hover:opacity-100 hover:text-red">×</button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Urge surfing · pick what it was, log the win with date + time */}
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
          <Card title="Trigger patterns" subtitle="Your most common reasons · name them to beat them" help="Aggregated from your reset reasons. The biggest bars are where to build a plan: an if-then for your top trigger removes most relapses.">
            <ul className="space-y-2">
              {stats.topTriggers.map((t) => {
                const pct = Math.round((t.count / stats.relapseCount) * 100)
                return (
                  <li key={t.trigger}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="capitalize text-subtext1">{t.trigger}</span>
                      <span className="text-overlay1">{t.count}× · {pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface0"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat('peach') }} /></div>
                  </li>
                )
              })}
            </ul>
            {stats.avgGap > 0 && <p className="mt-3 text-xs text-overlay0">Average <span style={{ color: cat('teal') }}>{stats.avgGap} days</span> between resets · aim to stretch it.</p>}
          </Card>
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
