import { useEffect } from 'react'

/**
 * Publish the sticky header's real height as `--header-h` on `:root`.
 *
 * Anything that parks itself below the header (the page contract's sticky act
 * column) needs to know how tall it is. That cannot be a constant: the header
 * sizes to its content, and it also carries
 * `padding-top: max(0.625rem, env(safe-area-inset-top))`, so on a notched
 * device it grows by the notch. A hard-coded token would leave the sticky
 * column tucked under the header on exactly the devices where that is hardest
 * to recover from.
 *
 * A ResizeObserver rather than a one-off measurement, because the header's
 * height changes in normal use — the date-nav row wraps at narrow widths, and
 * the safe-area inset changes on orientation flip.
 */
export function useHeaderHeight() {
  useEffect(() => {
    const header = document.querySelector('.app-header')
    if (!header) return
    const publish = () => {
      document.documentElement.style.setProperty('--header-h', `${header.getBoundingClientRect().height}px`)
    }
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(header)
    return () => {
      ro.disconnect()
      // Hand the fallback in tokens.css back, rather than leaving a stale
      // pixel value pinned to the root for whatever mounts next.
      document.documentElement.style.removeProperty('--header-h')
    }
  }, [])
}
