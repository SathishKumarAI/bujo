import type { ReactNode } from 'react'

/**
 * A labelled field inside a card.
 *
 * The app had no way to say "this input is called X and here is the prompt for
 * it" without spending a whole `<Card>` on it — which is why Today carried
 * three separate bordered cards holding one input each. A field is not a card;
 * it is a label, an optional prompt, and the control.
 *
 * The label is a real `<label>` wrapping the control, so clicking it focuses
 * the input and screen readers get the association for free — no `id`/`htmlFor`
 * bookkeeping at the call site.
 */
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  /** The prompt or unit note. Sits under the label, above the control. */
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-body font-medium text-fg-1">{label}</span>
      {hint && <span className="mt-0.5 mb-2 block text-label leading-snug text-fg-2">{hint}</span>}
      <span className={hint ? 'block' : 'mt-2 block'}>{children}</span>
    </label>
  )
}
