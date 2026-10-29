import { Compass, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useNav } from './shell/nav'
import { onRaised } from '../lib/colors'
import { Button } from './ui/button'
import { useDevice } from './shell/device'
import { useSampleData } from './useSampleData'

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
 * does it here rather than sending the reader to Settings to hunt for it. The
 * first version of this rewrite *did* send them to Settings, where the nearest
 * button was "Clear all data" — a nuclear option wearing the wrong label.
 *
 * It shows on `demoSeeded`, not on `explore`. `explore` is set only by the
 * welcome screen's Explore button; `?demo=1` seeds exactly the same sample
 * journal and set neither flag, so anyone arriving by a demo link saw no banner
 * and had no idea the data was not theirs.
 *
 * **It can also be dismissed, and the dismissal sticks** (kept from the
 * account-era version of this file, and still true without accounts). It sat
 * above every view of every page for as long as the demo data was loaded, and a
 * strip that says the same sentence on the thousandth screen as on the first is
 * an ad rather than a notice. Dismissing hides the *reminder*, never the data:
 * Settings → Data still clears the samples.
 *
 * Per device, not in the journal: `useStickyState` writes to `bujo.ui.*` rather
 * than `settings`, so dismissing it on a laptop does not dismiss it on a phone
 * that has never seen it, and it cannot ride the sync or the undo stack.
 *
 * **On a phone it is not drawn at all.** The strip wrapped to four rows at
 * 390px — **152px of a 664px screen**, 23%, above every page — and the owner
 * asked for it in the ☰ instead: the notice and all three actions are the
 * Notifications tab of `shell/PhoneMenu.tsx`, and the ☰ badge counts it.
 * State and actions live in `useSampleData` so the two surfaces cannot drift.
 */
export function ExploreBanner() {
  const nav = useNav()
  const sample = useSampleData()
  const phone = useDevice() === 'mobile'
  if (!sample.active || phone) return null

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-ink-1 px-4 py-2 text-body">
      <Icon as={Compass} size="sm" style={{ color: onRaised('mauve') }} />
      <span className="text-fg-1">
        You’re exploring sample data. Nothing here is yours yet —{' '}
        <strong className="text-fg-1">clear it out when you want to start for real.</strong>
      </span>
      {/* `flex-wrap`, and the reason is measured: the four controls come to
          about 300px, the sentence takes the rest, and on a 390px phone the
          row pushed `document.body.scrollWidth` to **414** — so EVERY page in
          demo mode scrolled 24px sideways and every card looked cut off at the
          right edge. It reads as a broken page, and it was the banner. */}
      <div className="ml-auto flex min-w-0 flex-wrap items-center gap-2">
        {/* First, and the non-destructive one. It was missing entirely: every
            exit from demo mode deleted the journal, so "I want to keep what I
            have written since" had no answer and sync stayed blocked forever.
            Why it exists at all: `useSampleData`'s `keepAsMine`. */}
        <Button variant="secondary" size="sm" onClick={sample.keepAsMine} className="press-3d text-label">
          Keep this as mine
        </Button>
        <Button variant="ghost" size="sm" onClick={sample.clearDemo} className="text-label">
          Clear the demo
        </Button>
        <Button variant="ghost" size="sm" onClick={() => nav('settings')} className="h-auto p-0 text-label">
          Set up this journal
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={sample.dismiss}
          aria-label="Dismiss the sample-data notice"
          title="Dismiss · clear the samples any time from Settings → Data"
          className="text-fg-2 hover:text-fg-1"
        >
          <Icon as={X} size="sm" />
        </Button>
      </div>
    </div>
  )
}
