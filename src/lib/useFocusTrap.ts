import { useEffect, useRef } from 'react'

/**
 * Everything the platform treats as tabbable, minus the things it doesn't:
 * `tabindex="-1"` is programmatically focusable but not tab-reachable, and a
 * disabled control is neither.
 */
const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'video[controls]',
  'audio[controls]',
  'summary',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function tabbable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    // `hidden` and `aria-hidden` subtrees are out. Deliberately *not* filtered
    // on `offsetParent` / geometry: jsdom has no layout, so a size check would
    // make every element look invisible under test and empty the trap.
    (el) => !el.closest('[hidden]') && !el.closest('[aria-hidden="true"]'),
  )
}

/**
 * FOCUS TRAP · keyboard containment for hand-rolled overlays.
 *
 * Radix (`ui/dialog`, `ui/alert-dialog`) already traps and restores focus, so
 * anything built on those needs nothing. This is for the overlays that are a
 * bare `fixed inset-0` div — the command palette, the enlarge modals, the habit
 * detail sheet, the SOS overlay — where Tab otherwise walks straight out of the
 * dialog and into the page behind it, invisibly.
 *
 * While `active`:
 * - focus moves to the first tabbable element inside (or the container itself),
 * - Tab / Shift-Tab cycle within the container instead of leaving it,
 * - on close, focus returns to whatever had it before the overlay opened.
 *
 * The Tab listener is bound to the container, not the document, so a nested
 * overlay traps ahead of its parent. There is deliberately no `focusin` guard:
 * these overlays open Radix dialogs (confirm prompts) that portal *outside* the
 * container, and a guard would yank focus back out of them.
 *
 * ```tsx
 * const trap = useFocusTrap<HTMLDivElement>(open)
 * return <div ref={trap} role="dialog">…</div>
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(active = true) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const node = ref.current
    if (!active || !node) return

    const restoreTo = document.activeElement as HTMLElement | null

    const first = tabbable(node)[0]
    if (first) first.focus()
    else {
      // Nothing tabbable inside (a bare read-only panel): focus the container
      // so the screen reader lands in the dialog and Escape still reaches it.
      node.tabIndex = -1
      node.focus()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = tabbable(node)
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      const current = document.activeElement
      if (e.shiftKey && (current === firstItem || !node.contains(current))) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && (current === lastItem || !node.contains(current))) {
        e.preventDefault()
        firstItem.focus()
      }
    }

    node.addEventListener('keydown', onKeyDown)
    return () => {
      node.removeEventListener('keydown', onKeyDown)
      // Only restore if the opener is still on the page — after a delete or a
      // navigation it may be gone, and focusing a detached node silently drops
      // focus to <body>.
      if (restoreTo && restoreTo.isConnected) restoreTo.focus()
    }
  }, [active])

  return ref
}
