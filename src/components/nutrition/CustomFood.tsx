import { useState } from 'react'
import { Plus } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Input } from '../ui'
import { Button } from '../ui/button'
import { DisclosureRow, ResetField } from '../page'
import { foodIssues, foodOf, type CustomFood as Custom } from '../../lib/foods'

/**
 * A FOOD THE LIBRARY HAS NEVER HEARD OF.
 *
 * WHAT THIS FILE OWNS: the form, its guard rail, and the reset on it.
 * WHAT IT DOES NOT OWN: validation (`foodIssues`), conversion (`foodOf`), or
 * where the saved food is kept.
 *
 * Reported as *"normalize the log-what-you-eat into a better one instead of
 * just having built-in items"*. The picker offered forty foods and nothing
 * else, so anything outside them had to go in as four bare numbers under "or
 * set the day's totals directly" — which logs the calories and **loses what
 * they were**. That matters more since the review started reading `foodLog` to
 * say what a fortnight was made of: a typed total is a day with no ingredients.
 *
 * Saving is two things at once, deliberately: the food is logged on the day AND
 * kept in `settings.customFoods`, so the second time you eat it it is a chip.
 * Asking "save for later?" as a separate question would be a dialog about
 * housekeeping in the middle of logging lunch.
 *
 * **The guard rail is the same one adding a chip has**, and it fires on the
 * item rather than the day: over 3,000 kcal for one food is a typo in all but
 * a handful of real cases, and `foodIssues` says so in words rather than
 * refusing silently. What it deliberately does NOT do is check the macros
 * against the calories — 4·4·9 arithmetic rejects plenty of real labels
 * (fibre, alcohol, rounding), and a validator that argues with the packet in
 * your hand is one people work around by lying to it.
 */
const BLANK = { name: '', serving: '', kcal: '', protein: '', carbs: '', fat: '' }

export function CustomFoodForm({ onAdd }: { onAdd: (food: Custom) => void }) {
  const [d, setD] = useState(BLANK)
  const [tried, setTried] = useState(false)
  const issues = foodIssues(d)
  const touched = Object.values(d).some((v) => v.trim())

  function save() {
    setTried(true)
    if (issues.length > 0) return
    onAdd(foodOf(d))
    setD(BLANK)
    setTried(false)
  }

  return (
    <DisclosureRow label="Add a food of your own">
      <Input
        value={d.name}
        onChange={(e) => setD((c) => ({ ...c, name: e.target.value }))}
        placeholder="Chicken shawarma"
        aria-label="Food name"
      />
      {/*
        `@min-[30rem]/act`, NOT `sm:`.

        `sm` is a VIEWPORT query and this form lives in the act column, which is
        **424px at a 1440 viewport** — so `sm:grid-cols-5` was true from 640px
        of window onward and drew five 77px columns in that 424px box: a
        "Protein g" label and a number in 77px, getting worse the bigger the
        screen, while a 390px phone correctly showed two at 158px. The trap
        CLAUDE.md records from Strength's set row, in the form the report called
        "going out of the screen size". The container is `@container/act` on the
        act `<section>` in `views/Nutrition.tsx`.

        Serving keeps the full row until there is real room: it is free text
        ("1 wrap", "2 slices") and the only field here that is not three digits.
      */}
      <div className="grid grid-cols-2 gap-2 @min-[30rem]/act:grid-cols-5">
        <label className="col-span-2 block text-micro text-fg-2 @min-[30rem]/act:col-span-1">
          Serving
          <Input
            value={d.serving}
            onChange={(e) => setD((c) => ({ ...c, serving: e.target.value }))}
            placeholder="1 wrap"
            aria-label="Serving size"
            className="mt-0.5 py-1"
          />
        </label>
        {([['kcal', 'kcal'], ['protein', 'Protein g'], ['carbs', 'Carbs g'], ['fat', 'Fat g']] as const).map(([key, label]) => (
          <label key={key} className="block text-micro text-fg-2">
            {label}
            <Input
              type="number"
              value={d[key]}
              onChange={(e) => setD((c) => ({ ...c, [key]: e.target.value }))}
              placeholder={key === 'kcal' ? '420' : '0'}
              aria-label={`${label} for this food`}
              className="num mt-0.5 py-1 text-right"
            />
          </label>
        ))}
      </div>

      {/* The issues, once you have tried — not while you are still typing the
          name, which would say "give it a name" at every keystroke. */}
      {tried && issues.length > 0 && (
        <ul className="space-y-0.5 text-label text-yellow">
          {issues.map((i) => <li key={i}>{i}</li>)}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={save} className="press-3d inline-flex items-center gap-1.5">
          <Icon as={Plus} size="sm" /> Log it and keep it
        </Button>
        {/* The way back out of a half-filled form. */}
        <ResetField
          changed={touched}
          to="empty"
          what="this form"
          onReset={() => { setD(BLANK); setTried(false) }}
        />
      </div>
      <p className="text-micro text-fg-2">
        Saved to your own chips, so the next time it is one tap. The macros are optional — the calories are what the day is judged on.
      </p>
    </DisclosureRow>
  )
}
