import { useState } from 'react'
import { Check, PencilSimple, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Input } from '../ui'
import { Button } from '../ui/button'
import { useConfirm } from '../ConfirmDialog'
import { prettyDay } from '../../lib/date'
import type { LoggedFood } from '../../lib/types'

/**
 * WHAT YOU LOGGED TODAY, AND EVERY WAY BACK OUT OF IT.
 *
 * WHAT THIS FILE OWNS: the day's food rows, their inline editor, and the
 * confirmation in front of a delete.
 * WHAT IT DOES NOT OWN: the arithmetic (`withFoodEdited` / `withFoodRemoved` in
 * `lib/foods.ts`) or where the list sits.
 *
 * Reported as *"if I enter the values of some food item, I'm unable to edit it
 * or delete it; if I accidentally delete it … and the values are exceeding, ask
 * me the warning"*. Three separate things, and the list had one of them:
 *
 * | Ask | Before | Now |
 * |---|---|---|
 * | Edit a logged item | nothing — a wrong number cost the entry | an inline editor on the row, name and all four numbers |
 * | Delete without fear | a `×` that removed it on the first click | `useConfirm`, naming the food and the calories it takes back |
 * | Warn when values exceed | only when ADDING pushed the day over 5,000 | also when an EDIT does, and on a single item over 3,000 |
 * | More of the same thing | a second identical row | `−` / `×3` / `+` on the row |
 *
 * `USER-CONTROL.md` rule 1 is that `add` without `edit` is a bug — and this is
 * the fourth page in a row to have shipped exactly that. The rule's sharper
 * form, from Strength: **a record you can see is not a record you can
 * correct**, and the affordance has to be on the row.
 *
 * The editor rewrites BOTH stored shapes through `withFoodEdited`: the entry in
 * `foodLog` and the four day totals, moved by the delta rather than re-summed —
 * because a day's totals can also be typed by hand, and re-summing would
 * silently discard that.
 */
export function DayLog({ date, today, foods, onEdit, onRemove, onServings }: {
  date: string
  today: string
  foods: LoggedFood[]
  /** Returns false when a guard (an implausible total) stopped the edit. */
  onEdit: (entry: LoggedFood, patch: Pick<LoggedFood, 'name' | 'kcal' | 'protein' | 'carbs' | 'fat'>) => Promise<boolean> | boolean
  onRemove: (entry: LoggedFood) => void
  /**
   * How many servings of this row.
   *
   * "I had a lot of rice today, so I want to add more rice on top of it" — and
   * the answer is a count on the row rather than a second row, because a day of
   * rice read as four identical lines and the review counted four foods.
   * Tapping the chip again does the same thing from the other side.
   */
  onServings: (entry: LoggedFood, servings: number) => void
}) {
  const confirm = useConfirm()
  const [editing, setEditing] = useState<string | null>(null)

  if (foods.length === 0) return null

  return (
    <section>
      <h3 className="mb-1 border-b border-line pb-1 text-label text-fg-2">
        Logged {date === today ? 'today' : `on ${prettyDay(date)}`} · {foods.length}
      </h3>
      <ul>
        {foods.map((f) => (
          <li key={f.id} className="border-b border-line py-1 last:border-b-0">
            {editing === f.id ? (
              <FoodEditor
                entry={f}
                onCancel={() => setEditing(null)}
                onSave={async (patch) => { if (await onEdit(f, patch)) setEditing(null) }}
              />
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-body text-fg-1" title={`${f.name} · ${f.protein} g protein · ${f.carbs} g carbs · ${f.fat} g fat`}>
                  {f.name}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {/* MORE OF IT, OR LESS. `−` disappears at one serving rather
                      than sitting there disabled: removing the last serving is
                      a delete, and a delete asks first. */}
                  {(f.servings ?? 1) > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`One fewer serving of ${f.name}`}
                      title={`One fewer serving of ${f.name}`}
                      onClick={() => onServings(f, (f.servings ?? 1) - 1)}
                    >−</Button>
                  )}
                  {(f.servings ?? 1) > 1 && (
                    <span className="num text-label text-fg-1" title={`${f.servings} servings`}>×{f.servings}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`One more serving of ${f.name}`}
                    title={`One more serving of ${f.name}`}
                    onClick={() => onServings(f, (f.servings ?? 1) + 1)}
                  >+</Button>
                  <span className="num text-label text-fg-2">{f.kcal} kcal</span>
                  {/* Edit before delete, and both named: "Remove" alone would
                      give a screen reader eleven identical controls. */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${f.name}`}
                    title={`Edit ${f.name}`}
                    onClick={() => setEditing(f.id)}
                  >
                    <Icon as={PencilSimple} size="sm" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${f.name}`}
                    title={`Remove ${f.name}`}
                    onClick={async () => {
                      /* It deleted on the first click. A tap meant for the row
                         above took the entry and its calories with it, and
                         there was nothing to undo it with. */
                      if (await confirm({
                        title: `Remove ${f.name}?`,
                        description: `${f.kcal} kcal comes back off ${date === today ? 'today' : prettyDay(date)}. You can add it again from the chips.`,
                        confirmLabel: 'Remove it',
                        destructive: true,
                      })) onRemove(f)
                    }}
                  >
                    <Icon as={X} size="sm" />
                  </Button>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The four numbers and the name, in the row itself. */
function FoodEditor({ entry, onSave, onCancel }: {
  entry: LoggedFood
  onSave: (patch: Pick<LoggedFood, 'name' | 'kcal' | 'protein' | 'carbs' | 'fat'>) => void
  onCancel: () => void
}) {
  const [d, setD] = useState({
    name: entry.name,
    kcal: String(entry.kcal),
    protein: String(entry.protein),
    carbs: String(entry.carbs),
    fat: String(entry.fat),
  })
  const num = (v: string) => Math.max(0, Math.round(Number(v) || 0))
  return (
    <div className="space-y-2 py-1">
      <Input
        value={d.name}
        onChange={(e) => setD((c) => ({ ...c, name: e.target.value }))}
        aria-label={`Name of ${entry.name}`}
        className="py-1"
      />
      <div className="grid grid-cols-4 gap-1.5">
        {([['kcal', 'kcal'], ['protein', 'P g'], ['carbs', 'C g'], ['fat', 'F g']] as const).map(([key, label]) => (
          <label key={key} className="block text-micro text-fg-2">
            {label}
            <Input
              type="number"
              value={d[key]}
              onChange={(e) => setD((c) => ({ ...c, [key]: e.target.value }))}
              aria-label={`${entry.name} ${key === 'kcal' ? 'calories' : key}`}
              className="num mt-0.5 py-1 text-right"
            />
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="press-3d inline-flex flex-1 items-center justify-center gap-1.5"
          onClick={() => onSave({
            name: d.name.trim() || entry.name,
            kcal: num(d.kcal),
            protein: num(d.protein),
            carbs: num(d.carbs),
            fat: num(d.fat),
          })}
        ><Icon as={Check} size="sm" /> Save</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
