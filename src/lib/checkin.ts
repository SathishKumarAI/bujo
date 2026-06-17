// "When do you check in?" — time-of-day analysis from habit-completion
// timestamps (Habitify-style). Pure + tested.
import type { JournalData } from './types'

/** Count of habit check-ins per hour-of-day (0–23) across all history. */
export function completionByHour(data: JournalData): number[] {
  const hours = new Array(24).fill(0)
  for (const day of Object.values(data.habitTimes ?? {})) {
    for (const iso of Object.values(day)) {
      const h = new Date(iso).getHours()
      if (h >= 0 && h < 24) hours[h] += 1
    }
  }
  return hours
}

export function totalCheckins(hours: number[]): number {
  return hours.reduce((a, b) => a + b, 0)
}

/** Hour with the most check-ins, or null when there's no data. */
export function peakHour(hours: number[]): number | null {
  let max = 0
  let idx = -1
  hours.forEach((c, i) => { if (c > max) { max = c; idx = i } })
  return idx >= 0 ? idx : null
}

export function fmtHour(h: number): string {
  const ampm = h < 12 ? 'am' : 'pm'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${hr}${ampm}`
}
