import { Toaster as Sonner } from 'sonner'
import { useJournal } from '../store'

// Dark-family themes render the toast on a dark surface; the rest are light.
const DARK: string[] = ['mocha', 'vscode', 'neon']

/**
 * Global toast host. Mounted once in the shell.
 *
 * The shadcn wrapper in `ui/sonner.tsx` reads the theme from next-themes, which
 * this app does not use — bujo owns its theme in journal settings — so we mount
 * sonner directly and feed it the app's own theme instead.
 */
export function Toasts() {
  const { data } = useJournal()
  const t = data.settings.theme
  const theme = t === 'system' ? 'system' : DARK.includes(t) ? 'dark' : 'light'

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: 'border border-surface1 bg-mantle text-text',
          description: 'text-subtext1',
          actionButton: 'bg-surface1 text-text',
          cancelButton: 'bg-surface0 text-subtext1',
        },
      }}
    />
  )
}
