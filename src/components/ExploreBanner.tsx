import { Compass } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { useNav } from './shell/nav'
import { cat } from '../lib/colors'
import { Button } from './ui/button'

/**
 * Shown while exploring sample data (the demo seed). Exploring is for *seeing*
 * the features; starting a real journal means clearing the samples out.
 *
 * It used to say "Sign up to start your own journal · it syncs across your
 * devices" with a "Continue with Google" button that redirected straight to
 * OAuth. There are no accounts any more (`docs/AUTH.md`), and more to the
 * point that sentence was never true of what the button did: signing in did
 * not start a journal, it replaced one.
 *
 * Starting fresh is a local action — clear the demo, keep the app — so the CTA
 * points at the thing that actually does it, and the destructive part is
 * confirmed there rather than here.
 */
export function ExploreBanner() {
  const { data } = useJournal()
  const nav = useNav()
  if (!data.settings.explore) return null

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-ink-1 px-4 py-2 text-body">
      <Icon as={Compass} size="sm" style={{ color: cat('mauve') }} />
      <span className="text-fg-1">
        You’re exploring sample data. Nothing here is yours yet —{' '}
        <strong className="text-fg-1">clear it out when you want to start for real.</strong>
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => nav('settings')}
          className="press-3d text-label"
        >
          Clear the demo
        </Button>
        <Button variant="ghost" size="sm" onClick={() => nav('account')} className="h-auto p-0 text-label">
          Set up this journal
        </Button>
      </div>
    </div>
  )
}
