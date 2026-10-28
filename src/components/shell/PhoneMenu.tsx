import { useState } from 'react'
import {
  ArrowClockwise, ArrowCounterClockwise, ChatCenteredDots, Gear, Lightbulb, Minus, Plus, Question, ShareNetwork, UserCircle,
} from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Sheet } from '../ui/sheet'
import { Cell, Cells } from '../ui/cells'
import { FeedbackButton } from '../feedback/FeedbackButton'
import { useJournal } from '../../store'
import { useAuthUser } from '../../lib/authUser'
import { useAccountStatus } from '../../lib/accountStatus'
import { identityOf, phaseCopy } from '../../lib/account'
import { autoSyncEnabled } from '../../lib/syncSecret'
import { recommendations } from '../../lib/recommend'
import { notify } from '../../lib/notify'
import type { ViewId } from './viewChrome'

/**
 * The phone's ☰ sheet — `AccountMenu`'s contents as iOS grouped rows.
 *
 * OWNS: which of the account menu's items a phone gets, and their order.
 * DOES NOT OWN: the desktop menu (`AccountMenu.tsx`, unchanged — a row added
 * there that a phone also needs goes HERE too).
 *
 * Kept from the account menu: identity + sync line, Account & sync, Share app,
 * Settings, Help & guide, Send feedback, the suggestions (the badge's count),
 * Undo/Redo, Zoom — Zoom has no other home, and a zoom synced from a desktop
 * would otherwise be stuck on the phone.
 * Dropped: Command palette (owner: "search is not required"; everything it
 * reaches is in the nav, this sheet or Settings) and the per-page help blurb
 * (owner: "help is not going to help"; Help & guide stays as the one door).
 */
export function PhoneMenu({ open, onOpenChange, onNavigate }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (id: ViewId) => void
}) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const { data, setSettings, undo, redo, canUndo, canRedo } = useJournal()
  const { user } = useAuthUser()
  const status = useAccountStatus()
  const who = identityOf(user)
  const profile = data.settings.profile
  const recs = recommendations(data)
  const name = who?.name ?? profile?.name ?? 'No name set'
  const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const syncLine = user
    ? sentence(phaseCopy(status.phase, status.lastSyncedAt).short)
    : autoSyncEnabled() ? 'Syncing with your passphrase' : 'This device only'
  const zoom = data.settings.zoom ?? 1
  const clamp = (z: number) => Math.min(1.5, Math.max(0.7, Math.round(z * 100) / 100))

  const go = (id: ViewId) => { onOpenChange(false); onNavigate(id) }
  const run = (fn: () => void) => () => { onOpenChange(false); fn() }

  function share() {
    navigator.clipboard
      ?.writeText(window.location.origin)
      .then(() => notify.success('Link copied', 'Share it with anyone — it carries no data of yours.'))
      .catch(() => notify.error('Could not copy the link'))
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} title="Menu">
        <div className="flex flex-col gap-5">
          <Cells>
            <Cell
              icon={UserCircle}
              tone="blue"
              label={profile || who ? 'Account and sync,' : 'Set up this journal,'}
              title={name}
              subtitle={who?.email ?? syncLine}
              onPress={() => go('settings')}
            />
            <Cell icon={ShareNetwork} tone="teal" title="Share app" onPress={run(share)} chevron={false} />
          </Cells>

          {recs.length > 0 && (
            <Cells title="Suggestions" aside={recs.length}>
              {recs.map((r) => (
                <Cell
                  key={r.id}
                  icon={Lightbulb}
                  tone="yellow"
                  title={r.text}
                  subtitle={r.action?.label}
                  onPress={r.action ? () => go(r.action!.view) : undefined}
                />
              ))}
            </Cells>
          )}

          <Cells>
            <Cell icon={Gear} tone="overlay1" title="Settings" onPress={() => go('settings')} />
            <Cell icon={Question} tone="sapphire" title="Help & guide" onPress={() => go('help')} />
            <Cell icon={ChatCenteredDots} tone="green" title="Send feedback" onPress={run(() => setFeedbackOpen(true))} />
          </Cells>

          <Cells>
            <Cell icon={ArrowCounterClockwise} tone="peach" title="Undo" subtitle={canUndo ? undefined : 'Nothing to undo'} onPress={canUndo ? run(undo) : undefined} chevron={false} />
            <Cell icon={ArrowClockwise} tone="peach" title="Redo" subtitle={canRedo ? undefined : 'Nothing to redo'} onPress={canRedo ? run(redo) : undefined} chevron={false} />
            {/* Not closing on a step: zoom is nudged twice, then left alone. */}
            <Cell
              title="Zoom"
              chevron={false}
              trail={
                <span className="inline-flex items-center gap-1">
                  <button type="button" className="grid w-11 place-items-center rounded-control text-fg-1 active:bg-ink-2" aria-label="Zoom out" onClick={() => setSettings({ zoom: clamp(zoom - 0.1) })}>
                    <Icon as={Minus} size="sm" />
                  </button>
                  <button type="button" className="min-w-14 rounded-control px-1 text-fg-2 tabular-nums active:bg-ink-2" aria-label={`Reset zoom, ${Math.round(zoom * 100)}%`} onClick={() => setSettings({ zoom: 1 })}>
                    {Math.round(zoom * 100)}%
                  </button>
                  <button type="button" className="grid w-11 place-items-center rounded-control text-fg-1 active:bg-ink-2" aria-label="Zoom in" onClick={() => setSettings({ zoom: clamp(zoom + 0.1) })}>
                    <Icon as={Plus} size="sm" />
                  </button>
                </span>
              }
            />
          </Cells>
        </div>
      </Sheet>
      <FeedbackButton open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  )
}
