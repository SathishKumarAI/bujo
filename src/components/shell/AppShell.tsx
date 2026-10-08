import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { TooltipProvider } from '../ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { CaptureBar } from '../CaptureBar'
import { MilestoneToast } from '../MilestoneToast'
import { ServerSync } from '../ServerSync'
import { SideRail } from './SideRail'
import { AccountSync } from '../AccountSync'
import { Toasts } from '../Toasts'
import { VoiceAgent } from '../VoiceAgent'
import { CaptureReceipt } from '../CaptureReceipt'
import { ShortcutHelp } from '../ShortcutHelp'
import { useHotkeys, useLeaderKey } from '../../lib/useHotkeys'
import { useJournal } from '../../store'
import { useCursor } from './cursor'
import { useDevice } from './device'
import { useHeaderHeight } from './useHeaderHeight'
import { EXTRA_JUMPS, SECTIONS, landingOf, type SectionGates } from './sections'
import type { ViewId } from './viewChrome'

/**
 * Owns the page frame and the global quick-add dialog.
 *
 * **The frame is a row, not a column.** `SideRail` on the left from y=0 — the
 * brand, the five sections, the section’s tabs — and a content column on the
 * right holding the header, the capture receipt and `<main>`. Below `md` the
 * rail is `display: none`, so the row has one child and the frame is the single
 * column it has always been on a phone: `TopBar` plus `BottomNav`.
 *
 * The header being *inside* the content column is the point, not an accident.
 * Stacked above the row instead, it drew a band across the rail as well, so the
 * rail began 103px down with nothing in that space and the band itself was
 * ~1100px of nothing to the right of the page title. Two chrome layers, each
 * mostly empty, each saying where you are.
 *
 * What this frame still does NOT have, from PR #120, and should not grow back:
 *
 * - **collapse and auto-hide** — two settings and a hover-edge overlay that
 *   existed only to win back the 240px the old rail was spending.
 * - **the mobile drawer and its scrim** — `BottomNav` already puts all five
 *   sections one thumb-tap away, so the drawer was a second way to the same
 *   place, behind an extra tap.
 */
export function AppShell({
  gates,
  view,
  onNavigate,
  onCommand,
  children,
}: {
  gates: SectionGates
  view: ViewId
  onNavigate: (id: ViewId) => void
  onCommand: () => void
  children: ReactNode
}) {
  const [quickOpen, setQuickOpen] = useState(false)
  const [talkOpen, setTalkOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const { data, setSettings } = useJournal()
  const { day } = useCursor()
  const isMobile = useDevice() === 'mobile'

  // Desktop rail visibility. `useJournal` rather than local state: the whole
  // point is that the choice survives a reload.
  const railHidden = !!data.settings.railHidden
  const toggleRail = useCallback(
    () => setSettings({ railHidden: !data.settings.railHidden }),
    [data.settings.railHidden, setSettings],
  )
  useHeaderHeight()

  // Single-key shortcuts. ⌘K (palette) and ⌘Z (undo) are chords, so they stay
  // where they are — these are the bare keys, which need the typing/dialog
  // guards that useHotkeys provides.
  // ⌘B / Ctrl-B toggles the rail. A CHORD, so it cannot live in `useHotkeys`
  // — that hook deliberately ignores anything with a modifier, because its
  // keys are bare letters that must not fire while you are typing. Bound the
  // way the palette binds ⌘K, next to it.
  //
  // ⌘B is the VS Code / Notion convention for exactly this control. It does
  // not collide with the `g b` leader chord: that is a bare `g` then a bare
  // `b`, and this is a modified `b`.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleRail()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleRail])

  useHotkeys({
    n: () => setQuickOpen(true),
    '?': () => setHelpOpen(true),
  })

  // `g` then a destination - jump without lifting your hands.
  //
  // The five section keys are BUILT FROM `SECTIONS`, not listed here, because
  // `SideRail` now draws each one on its row: a hand-written table would let
  // the hint and the key drift apart, and a keyboard hint that lies is worse
  // than no hint. `landingOf` is the same resolver the rail row uses, so the
  // chord and the click land on the same view, including when a gate hides the
  // section’s first tab.
  //
  // The rest are destinations with no rail row of their own and no hint drawn.
  // They are spread SECOND, so a collision would silently override a section
  // key and the rail would advertise a chord that goes elsewhere — which is why
  // `sections.test.ts` asserts the two halves are disjoint.
  useLeaderKey('g', {
    ...Object.fromEntries(SECTIONS.map((s) => [s.jump, () => onNavigate(landingOf(s.id, gates))])),
    ...Object.fromEntries(Object.entries(EXTRA_JUMPS).map(([k, v]) => [k, () => onNavigate(v)])),
  })

  return (
    <TooltipProvider delayDuration={150}>
    <div className="flex min-h-screen flex-col">
      {/* First focusable element on the page: a keyboard user lands here and can
          jump straight past the top bar to the content. Off-screen until
          focused. Listed as a known gap in docs/ACCESSIBILITY.md. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-card focus:bg-ink-1 focus:px-3 focus:py-2 focus:text-body focus:text-fg-1 focus:outline-2 focus:outline-mauve"
      >
        Skip to content
      </a>
      {/* THE SHELL IS A ROW, and the header lives INSIDE the content column.

          It was a column: two full-width header rows stacked above a row that
          held the rail and the page. That put two chrome bands across the
          whole window and left the rail’s own top 103px blank, while the
          title row’s right ~1100px was blank in turn — reported as "the top
          bar and the sidebar are conflicting and wasting space", and both
          halves of that are literally true: the bar and the rail each spent a
          band saying where you are, and each band was mostly empty.

          Now the rail starts at y=0 and carries the brand at its head, which
          is where a product shell puts it, and the header is one row over the
          content column only. Nothing is duplicated and nothing is lost — the
          same controls, measured from a different origin.

          Below `md` this is unchanged: the rail is `hidden md:flex`, so the
          row has one child and the header spans it exactly as before. */}
      <div className="flex min-h-screen">
        {!railHidden && <SideRail view={view} gates={gates} onNavigate={onNavigate} onCommand={onCommand} />}

        {/* `min-w-0` is load-bearing and was not needed before this row
            existed. A flex item’s `min-width: auto` resolves to its
            *min-content* width unless the box is a scroll container — and
            `overflow-x: clip` is explicitly not one (`hidden` would be). So
            the moment this column became a flex-row item it stopped being
            able to be narrower than its widest child: measured at a 501px
            viewport, `document.body.scrollWidth` read **1245**, a page-wide
            horizontal scrollbar on every view, with `overflow-x-clip`
            clipping nothing because the box it clips had itself grown. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            railHidden={railHidden}
            onToggleRail={toggleRail}
            view={view}
            gates={gates}
            onNavigate={onNavigate}
            onQuickAdd={() => setQuickOpen(true)}
            onTalk={() => setTalkOpen(true)}
            onCommand={onCommand}
          />

          {/* Under the header, above the page: what the last capture wrote, on
              the page it wrote it to. Outside `main` so it is not inside
              whichever view the capture sent us to — it belongs to the shell,
              like the banners. */}
          <CaptureReceipt />

          {/* `overflow-x-clip`, NOT `overflow-x-hidden`. `hidden` on one axis
              forces the other to compute `auto`, which made `<main>` a scroll
              container — and a `position: sticky` child sticks to its nearest
              scrolling ancestor, not the viewport. `<main>` grows with its
              content instead of scrolling, so that scrollport never moves and
              every sticky-under-the-header element in the app was silently
              inert: Mindset’s `LibraryBar`, Today’s mobile `CaptureBar`, and
              the page contract’s act column. Measured, not read: the bar sat
              at -544px after scrolling past it, instead of clamping to
              `--header-h`. `clip` does the same visual job without creating a
              scrollport.
              Extra bottom padding on mobile clears the fixed bottom nav. */}
          <main
            id="main"
            className={`min-w-0 flex-1 overflow-x-clip p-4 sm:p-6 ${isMobile ? 'pb-24' : 'pb-6'}`}
          >
            {children}
          </main>
        </div>
      </div>

      {isMobile && <BottomNav view={view} gates={gates} onNavigate={onNavigate} />}

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick add</DialogTitle>
          </DialogHeader>
          <CaptureBar date={day} onAdded={() => setQuickOpen(false)} />
        </DialogContent>
      </Dialog>
      <VoiceAgent open={talkOpen} onClose={() => setTalkOpen(false)} date={day} />
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <MilestoneToast />
      <Toasts />
      <ServerSync />
      {/* Renders nothing and does nothing unless a Supabase project is
          configured, someone is signed in, and a passphrase exists. */}
      <AccountSync />
    </div>
    </TooltipProvider>
  )
}
