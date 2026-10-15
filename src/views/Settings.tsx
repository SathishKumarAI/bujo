import { Cloud, Database, Palette, User } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useMemo } from 'react'
import { Page } from '../components/shell/Page'
import { PaneStrip, type Pane } from '../components/panes/PaneStrip'
import { readDeepLink } from '../lib/deepLink'
import {
  AccountTab, AppearanceTab, DataTab, SyncTab,
} from '../components/settings'

/**
 * SETTINGS · four panes on one screen, and nothing else.
 *
 * This file was 969 lines: the tab shell, all panels, nine cards, three shared
 * primitives and five file-reader handlers, so editing one label meant opening
 * the file that also holds the passcode flow and the CSV exporter. Each panel
 * is its own module under `components/settings/` now and this is the shell.
 *
 * ── It was a tab shell until COD-310 ───────────────────────────────────────
 *
 * Asked for directly: *"I want all the screen to only one screen, make this in
 * parallel, no scroll, and use the horizontal screens."* So: four panes side by
 * side on a desktop, swipe between full-width panes on a phone, and the page
 * itself does not scroll at either size. `components/panes/PaneStrip.tsx` is
 * the mechanism; this file is the content and the deep link.
 *
 * Settings is the right page to try it on and that is a measured claim, not a
 * guess. Driven per tab with a throwaway probe it is **2.7 screens of content
 * over four surfaces, three of them under half a screen** — 378px, 467px and
 * 504px of content in a 743px viewport at 1440×900. Four columns of roughly
 * 0.7 screens each is not a compression of this page, it is its natural shape;
 * the tab row was spending four clicks hiding how little there was.
 *
 * ── The coverage this gets back, which is the half worth keeping ───────────
 *
 * **A tab shell holds one panel in the DOM.** That is COD-232, and it meant
 * every space number ever quoted for this view (`0.9 shipped · 0.9 open ·
 * 2 cards`) described the Account tab alone, while `npm run a11y` scanned
 * whatever happened to be mounted — so the passcode form, the cloud passphrase,
 * every export button and the erase-everything dialog had never been seen by
 * axe at any theme or viewport. The workaround was three extra gate entries
 * reaching `?tab=…` by URL: three more navigations and three more axe runs, at
 * twelve shards each, to scan one page.
 *
 * All four panes are in the DOM now, so one scan covers the view and those
 * three entries are gone from `scripts/a11y-axe.mjs` — **36 fewer scans in a
 * run that was 166.** The risk in that trade is obvious and is the exact shape
 * of COD-232 itself: if a pane ever became lazily mounted, coverage would
 * silently fall back to one panel and the gate would go on printing a
 * reassuring zero. `Settings.test.tsx` asserts all four pane headings render in
 * a single pass, which is the tripwire that makes removing those entries safe.
 */

/** The four pane ids, and the only values `?tab=` accepts. */
const PANES = ['account', 'feel', 'sync', 'data']

export function Settings() {
  /**
   * `?view=settings&tab=sync` opens on that pane — the parameter is kept at
   * `tab` deliberately, even though there are no tabs any more. It is in links
   * people have sent each other, in `scripts/a11y-axe.mjs`, and in this repo's
   * own docs; renaming it would break all three to make one identifier tidier.
   *
   * Validated against the list rather than trusted: a stale or hand-typed value
   * must land on the first pane, not on nothing.
   */
  const initial = useMemo(() => {
    const wanted = readDeepLink().tab
    return wanted && PANES.includes(wanted) ? wanted : 'account'
  }, [])

  /* `useMemo` so the array identity is stable: `PaneStrip` observes these
     elements and re-running its `IntersectionObserver` effect on every render
     would disconnect and re-observe mid-scroll. */
  const panes = useMemo<Pane[]>(() => [
    {
      // "Account", not "Profile". There were two destinations answering "who is
      // this journal for" — a whole `views/Account.tsx` holding the Google
      // sign-in and a card titled "You", and a tab holding a card titled
      // "Profile". One person, two nouns, two pages (COD-297).
      id: 'account',
      label: 'Account',
      icon: <Icon as={User} size="sm" />,
      content: <AccountTab />,
    },
    {
      id: 'feel',
      label: 'Appearance',
      icon: <Icon as={Palette} size="sm" />,
      content: <AppearanceTab />,
    },
    {
      // The full name fits now. It was shortened to "Sync" with "& privacy"
      // hidden below `sm` because the clarifier wrapped a five-pill tab row
      // onto a third line at 390px — and those overflowing rows rendered on
      // top of the panel below, a real text collision on the live phone build
      // that neither rendering gate could see. There is no pill row to wrap
      // any more, so the honest name comes back at every width.
      id: 'sync',
      label: 'Sync & privacy',
      icon: <Icon as={Cloud} size="sm" />,
      content: <SyncTab />,
    },
    {
      id: 'data',
      label: 'Data',
      icon: <Icon as={Database} size="sm" />,
      content: <DataTab />,
    },
  ], [])

  return (
    // `gap-0` and no page header: the top bar already renders `Settings ·
    // Account, sync, appearance and data` as this page's h1, and a second
    // designed header repeated the word 110px lower and gave the document two
    // h1s — the only view in the app that did.
    <Page width="wide" className="gap-0 sm:gap-0">
      <PaneStrip panes={panes} initial={initial} label="Settings sections" />
    </Page>
  )
}
