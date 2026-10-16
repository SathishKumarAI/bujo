import { useState } from 'react'
import { HandFist } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card, Empty, Input, Pill } from '../ui'
import { Button } from '../ui/button'
import { useJournal } from '../../store'
import { useConfirm } from '../ConfirmDialog'
import { onRaised } from '../../lib/colors'
import { prettyDay } from '../../lib/date'
import { useCappedList } from '../../lib/useCappedList'
import { ShowMore } from '../ShowMore'
import { techniqueRanking, tiedLabel, topTied, TECH_LABEL } from '../../lib/urge'
import { haltTally } from '../../lib/streak'
import { discreetly } from '../../lib/discreet'

/**
 * EVERY URGE YOU LOGGED, and what it taught — out of the act column.
 *
 * WHAT THIS FILE OWNS: the two tallies, the list, its editor and its delete.
 * WHAT IT DOES NOT OWN: logging an urge (`UrgeSurfingCard`, which stays in the
 * act), or the ranking arithmetic (`lib/urge.ts`).
 *
 * ── Why it moved ─────────────────────────────────────────────────────────
 *
 * `UrgeSurfingCard` was doing four jobs: a form with twenty-odd chips, two
 * tally panels, a fifteen-row history and a footnote — all in a 424px act
 * column. Reported by pasting the whole column back with "a lot of content in
 * here is not needed, we can move some of the content into the manual".
 *
 * The tallies and the list are things you READ — `REUSABLE-PATTERNS.md` §29,
 * the record of a thing lives with what it explains — and the act is for what
 * you DO. Same move as Nutrition's day log, which came out of its act for the
 * same reason and shortened the column by the same kind of margin.
 *
 * ── And it could not be corrected ────────────────────────────────────────
 *
 * The old list's only affordance was a `×` that deleted on the first click.
 * That is, word for word, the failure `docs/USER-CONTROL.md` was written
 * after — Home Workout shipped exactly it — and it was still here on the
 * record of someone's hardest moments. Now: a named **Edit** that opens the
 * trigger, the day and the intensity, and a delete that says what it is
 * removing and goes through the store's undo.
 */
export function UrgeHistoryCard() {
  const { data, updateUrge, removeUrge } = useJournal()
  const confirm = useConfirm()
  const [editing, setEditing] = useState<string | null>(null)

  const techRank = techniqueRanking(data.nofap.urgeLog ?? [])
  const haltRank = haltTally(data)
  /* A TIE IS NOT A WINNER. Both headlines read `rows[0]` of a descending
     sort, so "Lonely most often · 6×" printed above `Lonely 6 · Tired 6` —
     the winner decided by the order the states are declared in. */
  const techTop = topTied(techRank)
  const haltTop = topTied(haltRank)
  const urges = [...(data.nofap.urgeLog ?? [])].sort((a, b) => ((a.at ?? a.date) < (b.at ?? b.date) ? 1 : -1))
  const list = useCappedList(urges, 6)
  const fmtTime = (iso?: string) => {
    try { return iso ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '' } catch { return '' }
  }
  const before = data.nofap.urgesResisted ?? 0
  const label = discreetly(data.settings)

  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={HandFist} size="sm" style={{ color: onRaised('green') }} /> Urges you logged</span>}
      subtitle={urges.length ? `${urges.length} logged · what helped, and when they came` : 'What helped, and when they came'}
    >
      {/* THE TWO TALLIES FIRST — they are the finding, the list is the
          evidence. Both were in the act, under the form that produces them. */}
      {techRank.length > 0 && (
        <div className="mb-2 rounded-card bg-ink-2 p-2.5 text-label">
          <div className="mb-1 text-fg-1">
            {techTop.length > 1 ? 'Most-used, tied: ' : 'Most-used technique: '}
            <span className="font-medium" style={{ color: onRaised('teal') }}>{tiedLabel(techTop.map((t) => TECH_LABEL[t.technique]))}</span> · {techTop[0].count}×
          </div>
          <div className="flex flex-wrap gap-1.5">
            {techRank.map((t) => <Pill key={t.technique} tone="muted">{TECH_LABEL[t.technique]} {t.count}</Pill>)}
          </div>
        </div>
      )}
      {haltRank.length > 0 && (
        <div className="mb-2 rounded-card bg-ink-2 p-2.5 text-label">
          <div className="mb-1 text-fg-1">
            HALT pattern: <span className="font-medium" style={{ color: onRaised('peach') }}>{tiedLabel(haltTop.map((h) => h.label))}</span>
            {haltTop.length > 1 ? ' tied on ' : ' most often · '}{haltTop[0].count}×
          </div>
          <div className="flex flex-wrap gap-1.5">
            {haltRank.map((h) => <Pill key={h.state} tone="muted">{h.label} {h.count}</Pill>)}
          </div>
        </div>
      )}

      {urges.length === 0 ? (
        <Empty>Nothing logged yet · ride one out and it lands here.</Empty>
      ) : (<>
        <ul className="space-y-1.5">
          {list.shown.map((u) => (
            <li key={u.id} className="@container/urge group rounded-card bg-ink-2 px-2.5 py-1.5 text-body">
              {/* `flex-wrap`, and the name does NOT truncate.

                  The clip gate caught this the moment the card moved out of
                  the act: five triggers were cut on a 390px phone, worst
                  "Doomscrolling" showing 48px of the 101px it needs — a name
                  the whole row is about, lost to a date and two buttons
                  sharing one line. The row wraps instead, so the second line
                  is the timestamp rather than a guess at what the word was. */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Icon as={HandFist} size="sm" style={{ color: onRaised(u.outcome === 'followed' ? 'peach' : 'green') }} className="shrink-0" />
                <span className="min-w-0 text-fg-1">{label(u.trigger || 'Urge')}</span>
                {u.intensity && <span className="num shrink-0 text-label text-fg-2">{u.intensity}/5</span>}
                <span className="ml-auto shrink-0 text-label text-fg-2">
                  {prettyDay(u.date)}{fmtTime(u.at) ? ` · ${fmtTime(u.at)}` : ''}
                </span>
                {/* Edit before ×, and both named — `USER-CONTROL.md` rule 2. */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(editing === u.id ? null : u.id)}
                  aria-expanded={editing === u.id}
                  aria-label={editing === u.id
                    ? `Close the editor for the urge on ${prettyDay(u.date)}`
                    : `Edit the urge on ${prettyDay(u.date)}`}
                  className="h-auto shrink-0 p-0 text-label text-fg-2 hover:text-fg-1"
                >{editing === u.id ? 'Close' : 'Edit'}</Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={async () => {
                    if (await confirm({
                      title: 'Delete this urge?',
                      description: `“${u.trigger || 'Urge'}” on ${prettyDay(u.date)} comes off the record, and off the technique and HALT tallies with it.`,
                      confirmLabel: 'Delete urge',
                      destructive: true,
                    })) { setEditing(null); removeUrge(u.id) }
                  }}
                  aria-label={`Delete the urge on ${prettyDay(u.date)}`}
                  className="shrink-0 text-fg-2 reveal hover:text-red"
                >×</Button>
              </div>

              {editing === u.id && (
                <div className="mt-2 grid grid-cols-1 gap-2 @min-[22rem]/urge:grid-cols-[1fr_auto_auto]">
                  <label className="block text-micro text-fg-2">
                    What it was
                    <Input
                      value={u.trigger ?? ''}
                      onChange={(e) => updateUrge(u.id, { trigger: e.target.value })}
                      placeholder="What set it off"
                      aria-label={`What the urge on ${prettyDay(u.date)} was`}
                      className="mt-0.5 py-1"
                    />
                  </label>
                  <label className="block text-micro text-fg-2">
                    Day
                    <Input
                      type="date"
                      value={u.date}
                      onChange={(e) => e.target.value && updateUrge(u.id, { date: e.target.value })}
                      aria-label={`Day of the urge logged on ${prettyDay(u.date)}`}
                      className="mt-0.5 py-1"
                    />
                  </label>
                  <label className="block text-micro text-fg-2">
                    Intensity
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={u.intensity ?? ''}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        updateUrge(u.id, { intensity: n >= 1 && n <= 5 ? (n as 1 | 2 | 3 | 4 | 5) : undefined })
                      }}
                      aria-label={`Intensity of the urge on ${prettyDay(u.date)}, 1 to 5`}
                      className="num mt-0.5 w-20 py-1 text-right"
                    />
                  </label>
                </div>
              )}
            </li>
          ))}
        </ul>
        <ShowMore list={list} />
      </>)}

      {before > 0 && (
        <p className="mt-2 text-label text-fg-2">+ {before} logged before dated entries existed.</p>
      )}
    </Card>
  )
}
