import { autoSyncEnabled } from '../../lib/syncSecret'
import { ArrowCounterClockwise, Command, Gear, Minus, Plus, Question, ShareNetwork, UserCircle, ChatCenteredDots} from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Button } from '../ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { PageHelpItems } from './topbar/HelpMenu'
import { useSuggestionCount } from './topbar/useSuggestionCount'
import { FeedbackButton } from '../feedback/FeedbackButton'
import { useState } from 'react'
import { useJournal } from '../../store'
import { useAuthUser } from '../../lib/authUser'
import { useAccountStatus } from '../../lib/accountStatus'
import { identityOf, phaseCopy } from '../../lib/account'
import { notify } from '../../lib/notify'
import type { ViewId } from './viewChrome'

/**
 * THE header menu — who this journal belongs to, and everything that is not
 * this page's job.
 *
 * It was two menus sitting next to each other in the top-right corner, and
 * they overlapped:
 *
 * | Item | Account (avatar) | Overflow (⋯) |
 * |---|---|---|
 * | Settings | ✓ | ✓ |
 * | Help | "How your data is stored" | "Help & guide" |
 * | Theme | — | 4 of the 6 |
 * | Paper / handwriting / book | — | ✓ (also in Settings) |
 *
 * Two doors to Settings, two differently-named doors to Help, and a theme
 * picker that could not reach `vscode` or `dawn` — so picking Dawn in Settings
 * left the ⋯ menu showing no theme selected at all.
 *
 * One menu now, anchored on the avatar rather than on ⋯, because identity is
 * something a person looks for and "more options" is not. What it holds is
 * **who you are, where you go, and what you can undo** — three things that are
 * about the app rather than about the page.
 *
 * **Appearance is deliberately not here.** Theme, paper, handwriting and the
 * book frame all live in Settings → Appearance, which is where their other
 * copies already were, and where the theme picker has swatches and all six
 * options instead of four bare labels. A setting with two homes drifts; this
 * one had drifted before anyone noticed.
 *
 * Zoom stays, and is not the same control as Settings' "Text size": zoom is a
 * live nudge of the whole page, `fontScale` is a typographic preference that
 * leaves charts alone. Two names for two things.
 *
 * The label deliberately says "This device only" rather than anything about
 * safety: sync being off is a fact about where the data is, not a claim about
 * who can read it. The passcode is the control that does that, and it lives in
 * Settings.
 */
export function AccountMenu({
  view,
  onNavigate,
  onCommand,
  side = 'bottom',
}: {
  /** The page whose help this menu offers — the corner menu is per-page now. */
  view: ViewId
  onNavigate: (id: ViewId) => void
  onCommand: () => void
  /**
   * Which way the panel opens. The two adopters are opposite corners of the
   * window and the same value cannot serve both: measured at 1440x849 from the
   * rail's bottom-left trigger, `side="bottom" align="end"` collision-flipped
   * and landed at **x: 0** — flush against the window edge with no gap at all,
   * which is the "overflowing to the sides" this was reported as. The rail
   * passes `right`, so it opens into the page instead of off the screen.
   */
  side?: 'bottom' | 'right'
}) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const { data, setSettings, undo, redo, canUndo, canRedo } = useJournal()
  const profile = data.settings.profile
  const syncing = autoSyncEnabled()
  const { user } = useAuthUser()
  const status = useAccountStatus()
  const who = identityOf(user)
  /**
   * The account's name beats the local nickname, and this is the fix COD-134
   * was filed for and did not get.
   *
   * That ticket was "AccountMenu fetches the user once and never hears about
   * sign-in"; it was closed by adding `onAuthChange` to `lib/supabase.ts` and
   * calling it from `AccountCard`. This component — the avatar in the corner,
   * the thing a person actually looks at to find out who they are signed in as
   * — was never given the subscription, so after a successful Google sign-in it
   * still read "No name set · This device only" with the yellow not-set-up dot
   * still on the trigger. COD-291.
   */
  const label = who?.name ?? profile?.name ?? 'No name set'
  // Signed in, or a local profile exists: either way this journal is set up, so
  // the yellow "finish setting this up" dot has nothing left to ask for.
  const setUp = !!who || !!profile
  // `phaseCopy().short` is lower case because its other two call sites are
  // StatBar facts, which are. Sentence-cased here rather than carrying a second
  // casing in the copy table — one string, two presentations.
  const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const syncLine = user
    ? sentence(phaseCopy(status.phase, status.lastSyncedAt).short)
    : syncing ? 'Syncing with your passphrase' : 'This device only'
  const zoom = data.settings.zoom ?? 1
  const suggestions = useSuggestionCount()
  const clamp = (z: number) => Math.min(1.5, Math.max(0.7, Math.round(z * 100) / 100))

  function share() {
    navigator.clipboard
      ?.writeText(window.location.origin)
      .then(() => notify.success('Link copied', 'Share it with anyone — it carries no data of yours.'))
      .catch(() => notify.error('Could not copy the link'))
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Account and app menu" title={`Account, ${label}`} className="relative">
          {/* The provider's own picture when there is one. It is the cheapest
              possible confirmation that a sign-in landed — a signed-out app
              cannot produce it — and it is why this trigger is the first place
              the fix had to reach. `no-referrer` because Google's avatar host
              403s on a cross-origin referrer; `onError` hides a broken frame
              rather than drawing one. */}
          {who?.avatarUrl ? (
            <img src={who.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-6 w-6 rounded-pill object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          ) : profile ? (
            <span aria-hidden className="text-base leading-none">{profile.emoji}</span>
          ) : (
            <Icon as={UserCircle} size="md" />
          )}
          {/* The count the retired `?` button carried. Without it, folding help
              into this menu would have hidden the one thing on it that changes
              from day to day. */}
          {suggestions > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-pill bg-yellow px-0.5 text-micro font-medium text-crust">{suggestions}</span>
          ) : (
            !setUp && <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-pill bg-yellow" />
          )}
        </Button>
      </DropdownMenuTrigger>
      {/* `collisionPadding` is the guard, not the `side` above: a side is a
          preference and Radix will still flip it when the panel does not fit.
          Without a padding the flipped panel is allowed to sit at exactly 0. */}
      <DropdownMenuContent side={side} align="end" collisionPadding={12} className="w-64">
        <div className="px-2 py-1.5">
          <p className="truncate text-body font-medium text-fg-1">{label}</p>
          {/* The email, when signed in. Two people's Google accounts can share
              a display name and a user who has switched accounts needs to know
              WHICH one is live — the name alone cannot tell them. */}
          {who?.email ? <p className="truncate text-label text-fg-2">{who.email}</p> : null}
          <p className="text-label text-fg-2">{syncLine}</p>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => onNavigate('settings')}>
          <Icon as={UserCircle} size="sm" className="mr-2" /> {setUp ? 'Account & sync' : 'Set up this journal'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={share}>
          <Icon as={ShareNetwork} size="sm" className="mr-2" /> Share app
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onCommand}>
          <Icon as={Command} size="sm" className="mr-2" /> Command palette
          <span className="ml-auto text-micro text-fg-2">⌘K</span>
        </DropdownMenuItem>
        {/* One door to Settings, not two — and it is the door to the theme
            picker, the paper toggles and the text size as well. */}
        <DropdownMenuItem onClick={() => onNavigate('settings')}>
          <Icon as={Gear} size="sm" className="mr-2" /> Settings
        </DropdownMenuItem>
        {/* ── The three controls that used to sit beside this button ─────
            A `?` with a yellow count, a feedback button hidden below `sm`, and
            this menu: three doors in one corner for "what is this", "who do I
            tell" and "who am I". #240 merged the avatar and the ⋯; this
            finishes the job. The count moved onto this trigger, because
            folding help in here would otherwise have hidden the only thing in
            the corner that changes from day to day. */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Icon as={Question} size="sm" className="mr-2" /> Help with this page
            {suggestions > 0 && (
              <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-pill bg-yellow px-1 text-micro font-medium text-crust">{suggestions}</span>
            )}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-80">
            <PageHelpItems view={view} onNavigate={onNavigate} />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate('help')}>
              <Icon as={Question} size="sm" className="mr-2" /> Help &amp; guide
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem onClick={() => setFeedbackOpen(true)}>
          <Icon as={ChatCenteredDots} size="sm" className="mr-2" /> Send feedback
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        <DropdownMenuItem disabled={!canUndo} onClick={undo}>
          <Icon as={ArrowCounterClockwise} size="sm" className="mr-2" /> Undo
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canRedo} onClick={redo}>
          <Icon as={ArrowCounterClockwise} size="sm" className="mr-2 -scale-x-100" /> Redo
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* One row, not three. Zoom is a nudge you make twice and then never
            again, and it was spending three of this menu's thirteen slots —
            the panel measured 558px tall, 66% of an 849px window. A stepper is
            the shape this control actually is: two steps and the current value
            between them, which doubles as the reset.

            Not `DropdownMenuItem`s: an item closes the menu on select, so
            stepping twice meant reopening the menu in between. Plain buttons
            inside the panel, and the row stops the menu closing on click. */}
        <div className="flex items-center justify-between px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
          <span className="text-body text-fg-1">Zoom</span>
          <span className="inline-flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onClick={() => setSettings({ zoom: clamp(zoom - 0.1) })}>
              <Icon as={Minus} size="sm" />
            </Button>
            <button
              className="min-w-14 rounded-control px-1 py-0.5 text-label text-fg-2 tabular-nums hover:text-fg-1"
              onClick={() => setSettings({ zoom: 1 })}
              aria-label={`Reset zoom, currently ${Math.round(zoom * 100)} percent`}
            >
              {Math.round(zoom * 100)}%
            </button>
            <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={() => setSettings({ zoom: clamp(zoom + 0.1) })}>
              <Icon as={Plus} size="sm" />
            </Button>
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
    {/* Outside the menu on purpose: a dropdown unmounts its content on select,
        and a dialog mounted inside it would be torn down in the same tick it
        was asked to open. */}
    <FeedbackButton open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  )
}
