import { Cloud, Database, Palette, User } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Page } from '../components/shell/Page'
import {
  AppearanceTab, DataTab, ProfileTab, SyncTab,
} from '../components/settings'

/**
 * SETTINGS · four tab panels and nothing else.
 *
 * This file was 969 lines: the tab shell, all panels, nine cards, three shared
 * primitives and five file-reader handlers, so editing one label meant opening
 * the file that also holds the passcode flow and the CSV exporter. Each panel is
 * its own module under `components/settings/` now and this is the shell — which
 * is all a view in this app should be once its page has more than one mode.
 *
 * The extraction was verbatim and verified as such: the rendered text of every
 * tab with every fold open was captured before and diffed after, because markup
 * that looks identical often is not (see the emergency-banner note in the global
 * rules). The only intended deltas are the two on the Data tab — the duplicate
 * summary card, and the calendar export that lived in two places. Both are
 * documented where they happened.
 *
 * **Five tabs became four, measured.** Nothing here could see that it needed
 * to: `npm run space -- settings` walks the rendered DOM, a tab shell holds one
 * panel at a time, and so every space number ever quoted for this view — 0.9
 * shipped, 0.9 open, 2 cards — was the Profile tab alone. Driven per tab, the
 * page was 2.7 screens of content spread over five surfaces, three of them
 * under half a screen tall on a 1440×900 desktop (378px, 467px and 504px of
 * content in a 743px viewport). Reminders held the two outbound-connection
 * cards that answer the same question as cloud sync; they are on the Sync tab
 * now, and its daily reminder is on Profile. The gates still cannot see past
 * the first tab — COD-232; these numbers came from a throwaway probe.
 */
export function Settings() {
  const [tab, setTab] = useState('profile')

  // `flex-none` is load-bearing: TabsTrigger ships `flex-1`, which stretched
  // these pills to 209px each across the wide tier. They are labels, not
  // a segmented control — they should be as wide as their text.
  const tabClass = 'flex-none gap-1.5 whitespace-nowrap rounded-card border border-transparent px-3.5 py-2 text-body text-fg-2 hover:text-fg-1 data-[state=active]:border-line data-[state=active]:bg-card data-[state=active]:text-fg-1 data-[state=active]:shadow-sm'

  return (
    <Page width="wide" className="gap-0 sm:gap-0">
      {/* No page header here. The top bar already renders `Settings · Theme,
          profile, data` as the page's h1; a second designed header repeated the
          word 110px lower and gave the document two h1s — the only view in the
          app that did. The tab bar is the first thing now. */}
      <Tabs value={tab} onValueChange={setTab}>
        {/* Horizontal pill bar — every section visible at once, wraps on narrow
            screens. No sidebar rail, no clipped scroller.

            `h-auto` alone did NOT make it wrap safely. `tabsListVariants` sets
            `group-data-[orientation=horizontal]/tabs:h-9`, and tailwind-merge
            does not treat a group-variant class and a bare `h-auto` as the same
            utility — so both shipped, the variant won, and the list stayed
            locked at 36px while its content wrapped to three rows at 390px.
            The overflowing rows rendered *on top of* the panel below: "Data"
            and the "Profile" card heading drew over each other, a text
            collision on the live phone build. Neither rendering gate saw it —
            `clipped-text.mjs` asks whether an element shows less than it holds
            (it showed everything) and `a11y` asks whether the tree is sound (it
            was). Overridden with the same specificity it is set at. */}
        <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1.5 bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-auto">
          <TabsTrigger value="profile" className={tabClass}><Icon as={User} size="sm" /> Profile</TabsTrigger>
          <TabsTrigger value="feel" className={tabClass}><Icon as={Palette} size="sm" /> Appearance</TabsTrigger>
          {/* "& privacy" is the half that used to wrap a five-pill row onto a
              third line at 390px. It is a clarifier, not the name. Four pills
              fit in two rows with it hidden, and it stays hidden: this tab now
              also holds the weather and food-lookup switches, so the honest
              full name is longer than the space, not shorter. */}
          <TabsTrigger value="sync" className={tabClass}><Icon as={Cloud} size="sm" /> Sync<span className="hidden sm:inline">&nbsp;&amp; privacy</span></TabsTrigger>
          <TabsTrigger value="data" className={tabClass}><Icon as={Database} size="sm" /> Data</TabsTrigger>
        </TabsList>

        {/* `key={tab}` remounts the panel wrapper on every switch, which is
            what replays the grids' `page-enter` stagger. A CSS animation fires
            on mount, not on re-render, so without the key the first tab you
            land on animates and the other four appear instantly — the tab
            switch is the one moment on this page where motion carries meaning
            (it says "this is a different set of things", not "the page
            reloaded"). Reduced-motion users get the same instant swap they got
            before: `bujo-rise` is inside a `prefers-reduced-motion:
            no-preference` block. */}
        <div key={tab} className="min-w-0">
        <TabsContent value="profile"><ProfileTab /></TabsContent>
        <TabsContent value="feel"><AppearanceTab /></TabsContent>
        <TabsContent value="sync"><SyncTab /></TabsContent>
        <TabsContent value="data"><DataTab /></TabsContent>
        </div>
      </Tabs>
    </Page>
  )
}
