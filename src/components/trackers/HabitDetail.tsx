import { createPortal } from 'react-dom'
import { X, Flame, ShieldCheck, Settings2, Ban, Share2 } from 'lucide-react'
import { StatTile } from '../ui'
import { cat } from '../../lib/colors'
import { addDays, fromISODay, todayISO, WEEKDAYS } from '../../lib/date'
import { habitStreak, cleanStreak, habitTarget, habitValueOn, habitIntensity } from '../../lib/stats'
import { longestStreakEver } from '../../lib/streak'
import { completionRate30, bestWeekday, perfectWeeks, habitGrade } from '../../lib/habitStats'
import type { Habit, JournalData } from '../../lib/types'

const WEEKS = 18
const LEVEL_OPACITY = [0, 0.4, 0.6, 0.8, 1]

/**
 * Per-habit activity view (BUJO-237): a focused read-first panel for one habit —
 * a GitHub-style day heatmap plus the key numbers (streak, best, 30/90-day rate,
 * best weekday, perfect weeks). Opened by tapping a habit; "Edit settings" hands
 * off to the editor. No line graph by design — the heatmap is the story.
 */
export function HabitDetail({
  habit: h, data, onClose, onEdit,
}: {
  habit: Habit
  data: JournalData
  onClose: () => void
  onEdit: () => void
}) {
  const today = todayISO()
  const type = h.type ?? 'check'
  const target = habitTarget(h)
  const avoid = !!h.avoid
  const accent = avoid ? cat('red') : cat(h.color)

  const streak = avoid ? cleanStreak(data, h.id) : habitStreak(data, h.id)
  const best = longestStreakEver(data, h, today)
  const r30 = completionRate30(data, h, today, 30)
  const r90 = completionRate30(data, h, today, 90)
  const wd = bestWeekday(data, h, today, 90)
  const perfect = perfectWeeks(data, h, today, 12)
  const grade = habitGrade(data, h, today, 30) // recency-weighted strength (0–100) + A–F
  const gradeColor = grade.score >= 75 ? 'green' : grade.score >= 50 ? 'yellow' : grade.score >= 25 ? 'peach' : 'red'

  // 18-week day heatmap (one column per week, aligned to weekday rows).
  const days = WEEKS * 7
  const start = addDays(today, -(days - 1))
  const pad = fromISODay(start).getDay()

  // HabitKit-style "share your grid" — render the heatmap to a PNG and download.
  const shareImage = () => {
    const cell = 13, gap = 3, M = 20, gridTop = 64, footer = 30
    const cols = Math.ceil((pad + days) / 7)
    const gridW = cols * (cell + gap) - gap
    const W = Math.max(gridW, 240) + M * 2
    const H = gridTop + 7 * (cell + gap) - gap + footer
    const dpr = 2
    const canvas = document.createElement('canvas')
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.fillStyle = cat('mantle'); ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = cat('text'); ctx.font = '600 17px Inter, system-ui, sans-serif'
    ctx.fillText(`${h.emoji ? h.emoji + ' ' : ''}${h.name}`, M, 30)
    ctx.fillStyle = cat('overlay1'); ctx.font = '12px Inter, system-ui, sans-serif'
    ctx.fillText(`${avoid ? streak + ' clean' : streak + ' streak'} · ${r30.pct}% 30d · last ${WEEKS} weeks`, M, 48)
    for (let i = 0; i < days; i++) {
      const d = addDays(start, i)
      if (d < h.startedOn) continue
      const idx = pad + i
      const x = M + Math.floor(idx / 7) * (cell + gap)
      const y = gridTop + (idx % 7) * (cell + gap)
      const level = habitIntensity(type, habitValueOn(data, h, d), target)
      ctx.fillStyle = level === 0 ? cat('surface0') : accent
      ctx.globalAlpha = level === 0 ? 1 : LEVEL_OPACITY[level]
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, cell, cell, 2); ctx.fill() }
      else ctx.fillRect(x, y, cell, cell)
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = cat('overlay0'); ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.fillText('bujo', M, H - 11)
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bujo-${h.name.replace(/[^\w-]+/g, '-').toLowerCase()}-grid.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-crust/60 p-4 pt-[8vh]" onClick={onClose}>
      <div
        className="card-3d w-full max-w-2xl overflow-hidden rounded-xl border border-surface1 bg-mantle"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${h.name} activity`}
      >
        <div className="flex items-center justify-between border-b border-surface0 px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-lg">{avoid ? <Ban size={18} style={{ color: cat('red') }} /> : h.emoji ?? <span style={{ color: cat(h.color) }}>●</span>}</span>
            <h2 className="truncate font-display text-lg text-text">{h.name}</h2>
            {h.unit && <span className="text-xs text-overlay0">({h.unit})</span>}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={shareImage} aria-label="Share grid as image" title="Share grid as image" className="inline-flex items-center gap-1 rounded-lg border border-surface1 px-2 py-1 text-xs text-subtext1 hover:text-text"><Share2 size={13} /> Share</button>
            <button onClick={onEdit} aria-label="Edit habit settings" title="Edit settings" className="inline-flex items-center gap-1 rounded-lg border border-surface1 px-2 py-1 text-xs text-subtext1 hover:text-text"><Settings2 size={13} /> Edit</button>
            <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-overlay1 hover:text-text"><X size={18} /></button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <StatTile compact label={avoid ? 'clean' : 'streak'} value={<span className="inline-flex items-center gap-0.5">{avoid ? <ShieldCheck size={13} /> : <Flame size={13} />}{streak}</span>} color={avoid ? 'green' : 'peach'} />
            <StatTile compact label="best ever" value={best} color="mauve" />
            <StatTile compact label="30-day" value={`${r30.pct}%`} color="green" />
            <StatTile compact label="90-day" value={`${r90.pct}%`} color="teal" />
            <StatTile compact label="best day" value={wd.best == null ? '—' : WEEKDAYS[wd.best]} color="blue" />
            <StatTile compact label="perfect wks" value={perfect} color="sky" />
          </div>

          {/* Habit strength meter (BUJO-243): recency-weighted consistency + grade. */}
          {!avoid && (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-overlay0">Habit strength</span>
                <span style={{ color: cat(gradeColor) }}>{grade.score}% · grade {grade.letter}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface0">
                <div className="h-full rounded-full transition-all" style={{ width: `${grade.score}%`, background: cat(gradeColor) }} />
              </div>
            </div>
          )}

          {/* Day heatmap */}
          <div>
            <p className="mb-1.5 text-xs text-overlay0">Last {WEEKS} weeks · {avoid ? 'clean = empty, slip = filled' : 'greener cells = done'}</p>
            <div className="overflow-x-auto">
              <div
                className="grid grid-flow-col grid-rows-7 gap-0.5"
                role="img"
                aria-label={`${h.name} day-by-day activity heatmap for the last ${WEEKS} weeks`}
              >
                {Array.from({ length: pad }).map((_, i) => <span key={`p${i}`} className="h-3 w-3" />)}
                {Array.from({ length: days }).map((_, i) => {
                  const d = addDays(start, i)
                  const before = d < h.startedOn
                  const level = habitIntensity(type, habitValueOn(data, h, d), target)
                  return (
                    <span
                      key={d}
                      title={`${d}${level ? (avoid ? ' · slip' : ' · done') : ''}`}
                      className="h-3 w-3 rounded-[2px]"
                      style={{ background: before ? 'transparent' : level === 0 ? cat('surface0') : accent, opacity: level === 0 ? 1 : LEVEL_OPACITY[level] }}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          <p className="text-xs text-overlay0">
            {r30.done}/{r30.scheduled} scheduled days done in the last 30.
            {h.cue && <> · Cue: {h.cue}</>}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
