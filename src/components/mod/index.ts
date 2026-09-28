/**
 * The two typographic primitives that outlived the Modernist pass.
 *
 * This entrypoint used to export `Band`, `BandRow` and `BandCell` — the
 * structural rules of that pass: "2px between sections, 1px between cells,
 * zero radius, no surface fill". `DESIGN.md` declares that world
 * **anti-reference** in its first sentence, and the last three pages using it
 * (Mindset, Reading, Collections) moved onto the page contract, so `Band.tsx`
 * is deleted rather than left for someone to reach for.
 *
 * `Eyebrow` and `Statement` stay because neither is Modernist: an eyebrow is a
 * quiet label (and its own docstring already retired the letter-spaced caps it
 * started as), and a statement is a short measure at a large size. Both are
 * type, and type survived the change of world.
 *
 * What went with `Band`, recorded because it was load-bearing and is now
 * nobody's job: `BandCell` carried a `@max-[44rem]/band` guard that dropped its
 * column padding and its divider rule once a row wrapped, because `first:pl-0`
 * is DOM order and not visual order. Cards do not have that problem — a card
 * owns its own padding on four sides — which is the clearest single argument
 * for the change.
 */
export { Eyebrow } from './Eyebrow'
export { Statement } from './Statement'
