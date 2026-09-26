import { CaretDown, CaretRight } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { Switch } from '../ui/switch'

/**
 * The three things every Settings card needs and none of them owns.
 *
 * `views/Settings.tsx` was 969 lines holding five tab panels, nine cards and
 * these primitives, so changing a label meant opening the file that also holds
 * the passcode flow and the CSV exporter. The panels are one file each now
 * (`ProfileTab`, `AppearanceTab`, …) and this is what they share — moved
 * verbatim, with the rendered text of all five tabs captured before and diffed
 * after, because markup that looks identical often is not.
 */

/** A labeled settings row: label on the left, control on the right. */
export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-body text-fg-1">{label}</span>
      {children}
    </div>
  )
}

export function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex w-full cursor-pointer items-center justify-between text-body text-fg-1">
      <span>{label}</span>
      <Switch checked={on} onCheckedChange={onChange} />
    </label>
  )
}

/** Self-managed collapsible settings section (SET-5) — one disclosure primitive
 *  instead of the three ad-hoc toggle buttons this page used to repeat. */
export function Disclosure({ title, subtitle, defaultOpen = true, children }: {
  title: string; subtitle?: string; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        /* `flex-wrap`: at 390px the title and the subtitle each wrapped to two
           lines *beside each other*, reading as two ragged columns. The
           subtitle is a clarifier — it drops to its own line instead. */
        className="flex w-full flex-wrap items-center gap-x-2 rounded-control px-1 py-1 text-left hover:text-fg-1"
      >
        <span className="text-fg-2">{open ? <Icon as={CaretDown} size="md" /> : <Icon as={CaretRight} size="md" />}</span>
        <span className="font-display text-heading font-medium text-fg-1">{title}</span>
        {subtitle && <span className="text-label text-fg-2">{subtitle}</span>}
      </button>
      {open && children}
    </section>
  )
}
