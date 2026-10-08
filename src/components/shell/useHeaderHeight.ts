import { useEffect } from 'react'

/**
 * Publish the real height of the chrome above the content as `--header-h`.
 *
 * Anything that parks itself below it (the page contract's sticky act column,
 * Mindset's `LibraryBar`, `SectionRail`, three `scroll-mt` anchors) needs to
 * know how tall it is. That cannot be a constant: it sizes to its content, and
 * it carries `padding-top: max(0.625rem, env(safe-area-inset-top))`, so on a
 * notched device it grows by the notch. A hard-coded token would leave the
 * sticky column tucked underneath on exactly the devices where that is hardest
 * to recover from.
 *
 * A ResizeObserver rather than a one-off measurement, because the height
 * changes in normal use — the date-nav row wraps at narrow widths, and the
 * safe-area inset changes on orientation flip.
 *
 * **ALL `.app-header` elements, not the first.** There are two now and they are
 * breakpoint-exclusive: `TopBar` below `md`, `PageHeader` above it, since the
 * top bar came down on desktop (`docs/SHELL-ONE-CHROME.md`). `querySelector`
 * returns the first in DOM order, which is `TopBar` — so on a desktop this
 * would have measured the *hidden* one, published 0, and put every sticky
 * element that reads the variable underneath the 59px strip it was supposed to
 * clear.
 *
 * Summing is correct rather than lucky: a `display: none` element has no box
 * and contributes exactly 0, so the sum is the visible one. It also stays
 * right if the two ever render together at some width.
 */
export function useHeaderHeight() {
  useEffect(() => {
    const headers = [...document.querySelectorAll('.app-header')]
    if (headers.length === 0) return

    const publish = () => {
      const h = headers.reduce((a, el) => a + el.getBoundingClientRect().height, 0)
      document.documentElement.style.setProperty('--header-h', `${h}px`)
    }

    publish()
    const ro = new ResizeObserver(publish)
    for (const el of headers) ro.observe(el)

    return () => {
      ro.disconnect()
      // Hand the fallback in tokens.css back, rather than leaving a stale
      // pixel value pinned to the root for whatever mounts next.
      document.documentElement.style.removeProperty('--header-h')
    }
  }, [])
}
