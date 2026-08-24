import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useJournal } from '../store'
import { Page } from '../components/shell/Page'
import { LeadingPrinciple } from '../components/mindset/LeadingPrinciple'
import { FocusSlots } from '../components/mindset/FocusSlots'
import { PracticeBand } from '../components/mindset/PracticeBand'
import { LibraryBar } from '../components/mindset/LibraryBar'
import { LibraryList } from '../components/mindset/LibraryList'
import { MINDSET_LIBRARY, MINDSET_MAX_FOCUS, principleById } from '../lib/mindset'
import { daysPracticed } from '../lib/mindsetPractice'
import { todayISO } from '../lib/date'

/**
 * Mindset — pick a few principles to actively practise, record a personal cue
 * for each, see how consistently you have practised, and browse the library.
 *
 * This view composes and decides; it does not lay anything out. The bands are
 * in `components/mindset/`, the structural primitives they are built from in
 * `components/mod/`, and the chart arithmetic in `lib/mindsetPractice.ts`.
 *
 * The page reads top to bottom as one argument: what you are leading with →
 * what you are working on → how it is going → what else there is. That order
 * is the redesign; the previous version opened with a card of cards and put the
 * whole 26-principle library in one uninterrupted wall below it.
 */
export function Mindset() {
  const { data, addMindsetFocus, setMindsetNote, removeMindsetFocus, toggleMindsetPractice } = useJournal()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  const today = todayISO()
  const focus = useMemo(() => data.mindsetFocus ?? [], [data.mindsetFocus])
  const log = data.mindsetPractice ?? {}
  const focusedIds = new Set(focus.map((f) => f.principleId))
  const full = focus.length >= MINDSET_MAX_FOCUS

  // Search and category filter are ANDed, and search covers the description as
  // well as the title — half of these principles are recognised by their line
  // ("slow is smooth") rather than by their name.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MINDSET_LIBRARY.filter(
      (p) =>
        (filter === 'All' || p.category === filter) &&
        (!q || `${p.title} ${p.why}`.toLowerCase().includes(q)),
    )
  }, [query, filter])

  const toggleFocus = (principleId: string) => {
    const row = focus.find((f) => f.principleId === principleId)
    if (row) return removeMindsetFocus(row.id)
    if (full) {
      // Not a disabled button: "why can't I add this?" is answered here, once,
      // in words, instead of being left to the user to infer from a grey label.
      toast.info(`Focus is full — ${MINDSET_MAX_FOCUS} at a time. Clear a slot first.`)
      return
    }
    addMindsetFocus(principleId)
  }

  return (
    // `sm:gap-0` as well as `gap-0`: `Page`'s own `sm:gap-5` is a *responsive*
    // class, and tailwind-merge only drops the base `gap-4` against a base
    // override — the breakpoint one survives and reopens a 20px gap at ≥640px,
    // where the whole point of the bands is that the 2px rules do the dividing.
    <Page width="wide" className="gap-0 sm:gap-0">
      <LeadingPrinciple
        principle={focus[0] ? principleById(focus[0].principleId) : undefined}
        daysPracticed={focus[0] ? daysPracticed(log, focus[0].principleId) : 0}
      />

      <FocusSlots
        focus={focus}
        practiceLog={log}
        today={today}
        onNote={setMindsetNote}
        onRemove={removeMindsetFocus}
        onTogglePractice={toggleMindsetPractice}
      />

      <PracticeBand log={log} focusedIds={focusedIds} today={today} />

      <LibraryBar
        query={query}
        onQuery={setQuery}
        filter={filter}
        onFilter={setFilter}
        shown={visible.length}
        total={MINDSET_LIBRARY.length}
      />

      <LibraryList principles={visible} focusedIds={focusedIds} full={full} onToggle={toggleFocus} />
    </Page>
  )
}
