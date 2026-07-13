import { useEffect, useRef } from 'react'

type Handler = (e: KeyboardEvent) => void

/** True when the key event came from somewhere the user is typing. */
function isTyping(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null
  if (!el) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

/**
 * Single-key app shortcuts, keyed by `KeyboardEvent.key`.
 *
 * Presses inside a text field, modifier chords (those belong to the palette and
 * undo/redo), and presses while a dialog is open are all ignored — a page key
 * must never hijack typing or fire behind a modal.
 */
export function useHotkeys(map: Record<string, Handler>, enabled = true) {
  const mapRef = useRef(map)
  useEffect(() => { mapRef.current = map })

  useEffect(() => {
    if (!enabled) return
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTyping(e)) return
      if (document.querySelector('[role="dialog"]')) return
      const handler = mapRef.current[e.key]
      if (!handler) return
      e.preventDefault()
      handler(e)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}

/**
 * Vim-style two-key jumps: press `g`, then a destination key within the timeout.
 * A lone `g` does nothing, so it stays out of the way of single-key shortcuts.
 */
export function useLeaderKey(leader: string, map: Record<string, () => void>, timeoutMs = 1200) {
  const mapRef = useRef(map)
  useEffect(() => { mapRef.current = map })

  useEffect(() => {
    let armed = false
    let timer: number | undefined

    function disarm() {
      armed = false
      window.clearTimeout(timer)
    }
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTyping(e)) return
      if (document.querySelector('[role="dialog"]')) return

      if (armed) {
        const run = mapRef.current[e.key]
        disarm()
        if (run) {
          e.preventDefault()
          run()
        }
        return
      }
      if (e.key === leader) {
        e.preventDefault()
        armed = true
        timer = window.setTimeout(disarm, timeoutMs)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      disarm()
    }
  }, [leader, timeoutMs])
}
