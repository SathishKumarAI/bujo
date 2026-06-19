import { useState } from 'react'
import { Check, X, Shield, Flame, Trophy, CalendarCheck, HandMetal, Sparkles, AlertTriangle } from 'lucide-react'
import { useJournal } from '../store'
import { Button, Card, Empty, Input, StatTile, Textarea } from '../components/ui'
import { cat } from '../lib/colors'
import { prettyDay, todayISO } from '../lib/date'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { streakStats, STREAK_MILESTONES, URGE_PRESETS, urgesByType } from '../lib/streak'

/**
 * Streak (abstinence) hub · a progress-ring hero to the next milestone, lifetime
 * stats, the recovery-benefits ladder, trigger patterns, urge-surfing, and a
 * judgement-free reset log. Private, local-only.
 */
const URGE_COLORS = ['mauve', 'teal', 'peach', 'sky', 'green', 'pink', 'yellow', 'lavender', 'sapphire', 'flamingo']

export function NoFap() {
  const { data, logRelapse, resistUrge, removeUrge, addTriggerPlan, removeTriggerPlan } = useJournal()
  const [trigger, setTrigger] = useState('')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const [urge, setUrge] = useState('')
  const [plan, setPlan] = useState({ addiction: '', trigger: '', coping: '' })
  const plans = data.nofap.plans ?? []
  function savePlan() {
    if (!plan.addiction.trim() || !plan.trigger.trim()) return
    addTriggerPlan({ addiction: plan.addiction.trim(), trigger: plan.trigger.trim(), coping: plan.coping.trim() || undefined })
    setPlan({ addiction: '', trigger: '', coping: '' })
  }
  const urgeLog = [...(data.nofap.urgeLog ?? [])].sort((a, b) => (a.at ?? a.date) < (b.at ?? b.date) ? 1 : -1)

  function logUrge() {
    resistUrge({ trigger: urge.trim() || undefined })
    setUrge('')
  }
  const fmtTime = (iso?: string) => { try { return iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '' } catch { return '' } }
  const s = data.nofap
  const today = todayISO()
  const stats = streakStats(data, today)
  const byType = urgesByType(data)
  const relapsedToday = s.relapses.some((r) => r.date === today)
  const nextBenefit = stats.next

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
            <Button variant="primary" onClick={logUrge} className="inline-flex items-center gap-1.5"><HandMetal size={15} /> I resisted it</Button>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-subtext1">Urges resisted: <span className="font-semibold" style={{ color: cat('green') }}>{stats.urges}</span></span>
          </div>
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
