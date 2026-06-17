// Time-of-day grouping for habits (Habitify-style). Pure + tiny so it's tested.

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime'

export const TIME_SLOTS: { id: TimeOfDay; label: string; emoji: string }[] = [
  { id: 'morning', label: 'Morning', emoji: '🌅' },
  { id: 'afternoon', label: 'Afternoon', emoji: '☀️' },
  { id: 'evening', label: 'Evening', emoji: '🌙' },
  { id: 'anytime', label: 'Anytime', emoji: '🕐' },
]

export const slotMeta = (id: TimeOfDay) => TIME_SLOTS.find((s) => s.id === id) ?? TIME_SLOTS[3]

/** Which slot a given hour (0–23) falls in. Late night → anytime. */
export function currentSlot(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'anytime'
}

/**
 * Slot order for the daily view: the current time-of-day first (so its habits
 * surface), then the rest chronologically, with "anytime" always last.
 */
export function orderedSlots(hour: number): TimeOfDay[] {
  const order: TimeOfDay[] = ['morning', 'afternoon', 'evening']
  const cur = currentSlot(hour)
  if (cur === 'anytime') return [...order, 'anytime']
  return [cur, ...order.filter((s) => s !== cur), 'anytime']
}
