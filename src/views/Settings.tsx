import { Cloud, Database, Palette, User } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useRef, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Page } from '../components/shell/Page'
import { SectionScreen } from '../components/panes/SectionScreen'
import { readDeepLink } from '../lib/deepLink'
import { useDevice } from '../components/shell/device'
import {
  AccountTab, AppearanceTab, DataTab, SyncTab,
} from '../components/settings'

/**
 * SETTINGS · one section, one screen.
 *
 * This file was 969 lines: the tab shell, all panels, nine cards, three shared
 * primitives and five file-reader handlers, so editing one label meant opening
 * the file that also holds the passcode flow and the CSV exporter. Each panel
 * is its own module under `components/settings/` now and this is the shell.
 *
 * ── The layout, and the wrong turn before it ──────────────────────────────
 *
 * Asked for: *"fit everything in one page for one section"*, *"less
 * scrollable"*, *"don't waste the empty space"*.
 *
 * The attempt before this one put all four sections on screen at once, side by
 * side. It was a misreading and it looked it: four 328px columns at 1440,
 * every card narrower than the same card gets on a phone, and the actual ask —
 * one *section* fitting one *page* — delivered by none of it.
 *
 * What is here instead: the tab row comes back, so one section is on screen
 * and the page answers one question at a time; and that section is a fixed
 * height with `column-fill: auto`, so its cards pack into columns that fill
 * the screen before starting the next one. No vertical page scroll, and no
 * half-empty column — see `styles/section-screen.css` for why a grid and a
 * masonry both leave the hole that this does not.
 *
 * Measured at 1440×900, the section heights this has to fit into ~700px:
 * account **1.80 screens**, appearance **1.20**, sync **3.29**, data **2.24**
 * — at full width, two columns. Three columns of packed content is what brings
 * the first two under one screen; the folds on the two reference cards are
 * what brings Sync down. The per-section numbers after the change are in the
 * PR, and the ones that still exceed a screen scroll **sideways**, which is
 * deliberate.
 *
 * ── COD-232 is back, and this file is why ─────────────────────────────────
 *
 * `TabsContent` mounts only the open panel, so three of these four are absent
 * from the DOM — which is exactly the hole COD-232 describes: every space
 * number ever quoted for this view measured the Account tab, and `npm run
 * a11y` scanned whatever had mounted. The previous attempt closed it for free
 * by rendering all four; this one gives that back, deliberately, because a
 * readable page is worth more than a convenient gate.
 *
 * So the three `?tab=` entries in `scripts/a11y-axe.mjs` are restored in the
 * same commit that reintroduces the need for them. **Do not remove them again
 * without making every panel mount.**
 */

/** The four panel ids, and the only values `?tab=` accepts. */
const TABS = ['account', 'feel', 'sync', 'data']

/** Label per id, so the switcher and the scrollport's name cannot drift. */
const LABEL: Record<string, string> = {
  account: 'Account',
  feel: 'Appearance',
  sync: 'Sync & privacy',
  data: 'Data',
}

export function Settings() {
  /**
   * `?view=settings&tab=sync` opens that section. Two reasons, and the second
   * is load-bearing: "Settings → Sync & privacy" becomes a link people can
   * send each other, and **a gate can reach a panel it could not reach by
   * clicking.**
   *
   * Validated against the list rather than trusted: a stale or hand-typed
   * `tab` must land on the default, not on an empty panel.
   */
  const [tab, setTab] = useState(() => {
    const wanted = readDeepLink().tab
    return wanted && TABS.includes(wanted) ? wanted : 'account'
  })

  // On a phone the four tabs are one scrolling strip (`.phone-strip`,
  // styles/phone.css) instead of wrapping to two rows — and a deep link to a
  // tab past the edge (`tab=data`) has to bring it into view. Rect maths on the
  // list only; `scrollIntoView` would scroll the page too.
  const phone = useDevice() === 'mobile'
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const list = listRef.current
    const a = list?.querySelector<HTMLElement>('[data-state="active"]')
    if (!phone || !list || !a) return
    const lr = list.getBoundingClientRect()
    const ar = a.getBoundingClientRect()
    if (ar.left < lr.left || ar.right > lr.right) list.scrollLeft += ar.left - lr.left - (lr.width - ar.width) / 2
  }, [phone, tab])

  // `flex-none` is load-bearing: TabsTrigger ships `flex-1`, which stretched
  // these pills to 209px each across the wide tier. They are labels, not a
  // segmented control — they should be as wide as their text.
  const tabClass = 'flex-none gap-1.5 whitespace-nowrap rounded-card border border-transparent px-3.5 py-2 text-body text-fg-2 hover:text-fg-1 data-[state=active]:border-line data-[state=active]:bg-card data-[state=active]:text-fg-1 data-[state=active]:shadow-sm'

  return (
    // `gap-0` and no page header: the top bar already renders `Settings ·
    // Account, sync, appearance and data` as this page's h1, and a second
    // designed header repeated the word 110px lower and gave the document two
    // h1s — the only view in the app that did.
    <Page width="wide" className="gap-0 sm:gap-0">
      <Tabs value={tab} onValueChange={setTab}>
        {/* Horizontal pill bar — every section visible at once, wraps on
            narrow screens. No sidebar rail, no clipped scroller.

            `h-auto` alone did NOT make it wrap safely. `tabsListVariants` sets
            `group-data-[orientation=horizontal]/tabs:h-9`, and tailwind-merge
            does not treat a group-variant class and a bare `h-auto` as the
            same utility — so both shipped, the variant won, and the list
            stayed locked at 36px while its content wrapped to three rows at
            390px. The overflowing rows rendered *on top of* the panel below: a
            real text collision on the live phone build, which neither
            rendering gate saw. `clipped-text.mjs` asks whether an element shows
            less than it holds (it showed everything) and `a11y` asks whether
            the tree is sound (it was). Overridden at the same specificity it
            is set at. */}
        {/* ON A PHONE, A 2×2 GRID — not the scrolling strip. Measured at
            390px: Sync ended at x370 and Data began at x376, so the strip's
            clip fell in the gap and the row looked complete with three tabs;
            the fourth was off the edge with nothing to say so (the
            `.phone-strip` trap, in its own comment). Four tabs fit two-up
            with their whole labels, "Sync & privacy" included. */}
        <TabsList ref={listRef} className={`${phone ? 'settings-tabs grid grid-cols-2' : 'flex flex-wrap justify-start'} mb-4 w-full gap-1.5 bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto`}>
          {/* "Account", not "Profile". There were two destinations answering
              "who is this journal for" — a whole `views/Account.tsx` holding
              the Google sign-in and a card titled "You", and this tab holding
              a card titled "Profile". One person, two nouns, two pages
              (COD-297). */}
          <TabsTrigger value="account" className={tabClass}><Icon as={User} size="sm" /> Account</TabsTrigger>
          <TabsTrigger value="feel" className={tabClass}><Icon as={Palette} size="sm" /> Appearance</TabsTrigger>
          {/* "& privacy" is hidden below `sm`: with it, this row wrapped onto a
              third line at 390px, and those overflowing rows drew on top of
              the panel. It is a clarifier, not the name. */}
          <TabsTrigger value="sync" className={tabClass}><Icon as={Cloud} size="sm" /> {phone ? 'Sync & privacy' : <>Sync<span className="hidden sm:inline">&nbsp;&amp; privacy</span></>}</TabsTrigger>
          <TabsTrigger value="data" className={tabClass}><Icon as={Database} size="sm" /> Data</TabsTrigger>
        </TabsList>

        {/* `key={tab}` remounts the wrapper on every switch, which replays the
            `page-enter` stagger. A CSS animation fires on mount, not on
            re-render, so without the key the first section you land on
            animates and the others appear instantly — and the switch is the
            one moment on this page where motion carries meaning ("a different
            set of things", not "the page reloaded"). Reduced-motion users get
            the same instant swap: `bujo-rise` lives inside a
            `prefers-reduced-motion: no-preference` block. */}
        {/* `.settings-phone` scopes `styles/phone-settings.css`: the iOS
            grouped-row look the tabs draw on a phone (COD-562). */}
        <div key={tab} className={phone ? 'min-w-0 settings-phone' : 'min-w-0'}>
          <TabsContent value="account">
            <SectionScreen label={LABEL.account}><AccountTab /></SectionScreen>
          </TabsContent>
          <TabsContent value="feel">
            <SectionScreen label={LABEL.feel}><AppearanceTab /></SectionScreen>
          </TabsContent>
          <TabsContent value="sync">
            <SectionScreen label={LABEL.sync}><SyncTab /></SectionScreen>
          </TabsContent>
          <TabsContent value="data">
            <SectionScreen label={LABEL.data}><DataTab /></SectionScreen>
          </TabsContent>
        </div>
      </Tabs>
    </Page>
  )
}
