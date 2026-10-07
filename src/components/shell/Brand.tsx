/**
 * The wordmark. One copy, rendered in two places that are never both visible.
 *
 * `SideRail` puts it at the rail's head on desktop — where a product shell puts
 * identity — and `TopBar` keeps it below `md`, where there is no rail to put it
 * in. It lived inside `TopBar.tsx` as a local function until the rail needed it
 * too; this repo's own rule is that retyping shared markup is how an extraction
 * silently changes content, so it moved rather than being copied.
 */
export function Brand() {
  return (
    <div className="flex shrink-0 items-baseline gap-2">
      <span className="font-display text-title font-medium tracking-tight text-foreground">Cadence</span>
      {/* A 6px accent square, not the ✦ glyph it replaces. The redesign spends
          its accent on state and one mark of identity; a star reads as
          decoration, and decoration is what the flat treatment removes. */}
      <span className="size-1.5 bg-brand" aria-hidden />
    </div>
  )
}
