import { useJournal } from '../store'
import { useConfirm } from './ConfirmDialog'
import { emptyJournal } from '../lib/storage'
import { notify } from '../lib/notify'
import { useStickyState } from '../lib/useStickyState'

/**
 * The sample-data notice's state and its two ways out, shared by the desktop
 * strip (`ExploreBanner`) and the phone's ☰ Notifications tab (`PhoneMenu`).
 *
 * OWNS: whether the journal is the demo, whether this device dismissed the
 * notice, and what Keep / Clear do. DOES NOT OWN: how either surface draws it.
 *
 * Why the actions are what they are is in `ExploreBanner.tsx`'s docstring.
 */
export function useSampleData() {
  const { data, replaceAll, setSettings } = useJournal()
  const confirm = useConfirm()
  const [seen, setSeen] = useStickyState('explore.banner', 'show', ['show', 'dismissed'] as const)
  const demo = !!(data.settings.demoSeeded || data.settings.explore)

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

  return {
    demo,
    /** Showing as a notice: the demo, and not dismissed on this device. */
    active: demo && seen !== 'dismissed',
    dismiss: () => setSeen('dismissed'),
    keepAsMine,
    clearDemo,
  }
}
