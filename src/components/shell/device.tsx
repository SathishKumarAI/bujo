import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type DeviceClass = 'mobile' | 'desktop'

// Mirrors Tailwind's `md` breakpoint so the JS switch matches existing CSS.
const MOBILE_QUERY = '(max-width: 767px)'

/** Pick a device class from viewport + pointer. SSR-safe (defaults to desktop). */
function detect(): DeviceClass {
  if (typeof window === 'undefined' || !window.matchMedia) return 'desktop'
  const narrow = window.matchMedia(MOBILE_QUERY).matches
  // A coarse (touch) pointer on a smallish screen counts as mobile even if the
  // width sits just over the breakpoint (e.g. large phones in landscape).
  const coarse = window.matchMedia('(pointer: coarse)').matches
  return narrow || (coarse && window.innerWidth < 1024) ? 'mobile' : 'desktop'
}

const DeviceCtx = createContext<DeviceClass>('desktop')

/**
 * Resolves the active device class once and keeps it live across
 * resize/orientation changes. The adaptive shell renders a single layout tree
 * for the current class instead of mounting both and CSS-hiding one.
 */
export function DeviceProvider({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<DeviceClass>(detect)
  useEffect(() => {
    const onChange = () => setDevice(detect())
    const mq = window.matchMedia(MOBILE_QUERY)
    mq.addEventListener('change', onChange)
    window.addEventListener('orientationchange', onChange)
    return () => {
      mq.removeEventListener('change', onChange)
      window.removeEventListener('orientationchange', onChange)
    }
  }, [])
  return <DeviceCtx.Provider value={device}>{children}</DeviceCtx.Provider>
}

// Hook co-located with its provider (same pattern as cursor/nav); fast-refresh
// only affects dev HMR, not runtime.
// eslint-disable-next-line react-refresh/only-export-components
export function useDevice(): DeviceClass {
  return useContext(DeviceCtx)
}
