import { Compass, X } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useJournal } from '../store'
import { useNav } from './shell/nav'
import { onRaised } from '../lib/colors'
import { Button } from './ui/button'
import { useConfirm } from './ConfirmDialog'
import { emptyJournal } from '../lib/storage'
import { notify } from '../lib/notify'
import { useStickyState } from '../lib/useStickyState'

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
 */
export function ExploreBanner() {
  const { data, replaceAll, setSettings } = useJournal()
  const nav = useNav()
  const confirm = useConfirm()
  const [seen, setSeen] = useStickyState('explore.banner', 'show', ['show', 'dismissed'] as const)
  if (!data.settings.demoSeeded && !data.settings.explore) return null
  if (seen === 'dismissed') return null

  /**
   * Keep everything, and stop calling it a demo.
   *
   * ── The gap this closes ─────────────────────────────────────────────────
   *
   * All three places that cleared `explore` wiped the journal first, so there
   * was no way to say "I started with the samples and then made this mine".
   * And `isDemo()` is `demoSeeded || explore`, which `mayPush` refuses — so a
   * journal that began as a demo could **never sync, ever**, no matter how
   * much real work went into it. The flag is set by one tap on the Welcome
   * screen and nothing ever cleared it without deleting.
   *
   * That is the shape the user hit: signed in, waited, and nothing uploaded.
   * The status said "demo, not uploaded" — which was true, and was the only
   * place it was said.
   *
   * No confirm: this deletes nothing. The one-way part is that the samples
   * stop being labelled as samples, which is what the person asking for it
   * already wants.
   */
  function keepAsMine() {
    setSettings({ storageMode: 'local', demoSeeded: false, explore: false })
    setSeen('dismissed')
    notify.success(
      'This journal is yours now',
      'Nothing was deleted. The sample entries are just entries, and syncing is no longer held back.',
    )
  }

  async function clearDemo() {
    if (await confirm({
      title: 'Remove the demo data?',
      description: `This clears all ${data.entries.length} sample entries and starts you on an empty journal — including anything you have added since.`,
      confirmLabel: 'Remove the samples',
      destructive: true,
    })) {
      replaceAll(emptyJournal())
      setSettings({ storageMode: 'local', demoSeeded: false, explore: false })
      notify.success('Demo data removed', 'You are starting from an empty journal.')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-ink-1 px-4 py-2 text-body">
      <Icon as={Compass} size="sm" style={{ color: onRaised('mauve') }} />
      <span className="text-fg-1">
        You’re exploring sample data. Nothing here is yours yet —{' '}
        <strong className="text-fg-1">clear it out when you want to start for real.</strong>
      </span>
      <div className="ml-auto flex items-center gap-2">
        {/* First, and the non-destructive one. It was missing entirely: every
            exit from demo mode deleted the journal, so "I want to keep what I
            have written since" had no answer and sync stayed blocked forever. */}
        <Button variant="secondary" size="sm" onClick={keepAsMine} className="press-3d text-label">
          Keep this as mine
        </Button>
        <Button variant="ghost" size="sm" onClick={clearDemo} className="text-label">
          Clear the demo
        </Button>
        <Button variant="ghost" size="sm" onClick={() => nav('settings')} className="h-auto p-0 text-label">
          Set up this journal
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSeen('dismissed')}
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
