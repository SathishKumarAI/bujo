/**
 * A one-shot handoff of exercise names from one view to Strength's session
 * logger.
 *
 * The program tracker's "Load into session" button used to be a plain callback:
 * it and the logger lived in the same component, so it could call `loadRoutine`
 * directly. Giving the 12-week block its own Body tab separated them, and the
 * logger's rows are local React state — there is nothing to call across a view
 * switch.
 *
 * Deliberately NOT persisted and NOT in the URL. It is not a preference (the
 * journal should not carry a half-loaded session across reloads) and it is not
 * a destination (`?view=gym&load=…` would survive a refresh and re-seed rows
 * you had already edited). It is one value in flight for the length of one
 * navigation, so it lives for exactly that long.
 *
 * **`peek` is pure and `clear` is separate, on purpose.** A single
 * read-and-clear call would have to run either in an effect — which then has to
 * `setState`, the thing `react-hooks/set-state-in-effect` correctly warns about
 * — or during render, where React may invoke a component twice and the second
 * invocation would find the value already gone. Splitting them lets the logger
 * seed its `useState` initialisers from a pure read (so it paints filled rather
 * than flashing empty) and clear afterwards from an effect that sets no state.
 */
let pending: string[] | null = null

export function setPendingSession(exercises: string[]): void {
  pending = exercises.length ? [...exercises] : null
}

/** Read without consuming. Safe to call during render, and on every render. */
export function peekPendingSession(): string[] | null {
  return pending
}

/** Consume. Call once the handoff has been read into state. */
export function clearPendingSession(): void {
  pending = null
}
