import type { ReactNode } from 'react'

/**
 * Renders its children only when their sub-section is the selected one.
 *
 * Module level and `active` as a prop, not a closure: a component declared
 * inside a render is a NEW component type every render, so React unmounts and
 * remounts its whole subtree — every chart would re-enter, every fold inside
 * it would snap shut, and eslint's `no-create-component-during-render` says so
 * before any of that is visible.
 */
export function Facet({ of, active, children }: { of: string; active: string | null; children: ReactNode }) {
  return active == null || active === of ? <>{children}</> : null
}
