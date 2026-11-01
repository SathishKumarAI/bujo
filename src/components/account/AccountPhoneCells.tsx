import { useState } from 'react'
import { Check, CloudCheck, ShieldCheck, SignIn, SignOut } from '@/components/icons'
import { Cell, Cells, FieldCell } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { SYNCED, WITHHELD } from '../../lib/account'
import { useAccountSession } from './useAccountSession'
import { EMOJI, useLocalProfile } from './useLocalProfile'

/**
 * THE ACCOUNT TAB ON A PHONE — iOS Settings rows instead of two cards.
 *
 * OWNS: the phone drawing of "You" (the local name and face) and of the
 * Google account (sign in, who, status, sign out), and the sheet holding what
 * is and is not uploaded.
 * DOES NOT OWN: any account logic — `useAccountSession` (AccountCard.tsx) and
 * `useLocalProfile` (LocalAccountCard.tsx) are the same hooks the desktop
 * cards draw from, so a change to sign-in reaches both.
 *
 * Owner, 2026-11-01: "make this page into a more mobile version". Measured
 * before: the tab opened on an "Account" card repeating the tab's own name,
 * seven bullet points, then a second card with a form — the first setting
 * row sat below the first screen.
 */
export function YouCells() {
  const { profile, name, setName, emoji, setEmoji, editing, setEditing, save } = useLocalProfile()

  if (profile && !editing) return (
    <Cells title="You">
      <Cell lead={<span aria-hidden className="cell-tile text-xl">{profile.emoji}</span>} title={profile.name}
        subtitle="On this device only" label="Edit your name," onPress={() => setEditing(true)} />
    </Cells>
  )

  return (
    <Cells title="You">
      <FieldCell label="Name" value={name} onChange={setName} placeholder="Anything you like" />
      <div className="cell cell-stack gap-2">
        <span className="text-label text-fg-2">Face</span>
        <div role="group" aria-label="Face" className="flex flex-wrap gap-1.5">
          {EMOJI.map((e) => (
            <button key={e} type="button" aria-pressed={emoji === e} aria-label={`Avatar ${e}`} onClick={() => setEmoji(e)}
              className={`grid size-11 place-items-center rounded-control text-xl ${emoji === e ? 'bg-brand-wash ring-2 ring-brand' : 'bg-ink-2'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <Cell icon={Check} tone="green" title={profile ? 'Save' : 'Create local account'} subtitle="A name, not a login" chevron={false} onPress={save} />
    </Cells>
  )
}

export function SyncAccountCells() {
  const { configured, who, copy, busy, connect, disconnect } = useAccountSession()
  const [info, setInfo] = useState(false)
  if (!configured) return null

  return (
    <>
      <Cells title="Sync across devices">
        {who ? (
          <>
            <Cell
              lead={who.avatarUrl
                ? <img src={who.avatarUrl} alt="" referrerPolicy="no-referrer" className="size-8 shrink-0 rounded-pill object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                : undefined}
              title={who.name} subtitle={who.email ?? `Signed in with ${who.provider}`} chevron={false} />
            <Cell icon={CloudCheck} tone="teal" title={copy.short} subtitle={copy.detail} chevron={false} />
            <Cell icon={ShieldCheck} tone="overlay1" title="What is uploaded" onPress={() => setInfo(true)} />
            <Cell icon={SignOut} tone="red" title={busy ? 'Signing out…' : 'Sign out'} subtitle="Everywhere — this device keeps its journal" chevron={false} onPress={busy ? undefined : disconnect} />
          </>
        ) : (
          <>
            <Cell icon={SignIn} tone="blue" title={busy ? 'Opening Google…' : 'Continue with Google'} subtitle="Your journal on every device" chevron={false} onPress={busy ? undefined : connect} />
            <Cell icon={ShieldCheck} tone="overlay1" title="What is uploaded" onPress={() => setInfo(true)} />
          </>
        )}
      </Cells>

      <Sheet open={info} onOpenChange={setInfo} title="What is uploaded" description="Private to your account, not secret from the server">
        <div className="flex flex-col gap-4">
          <Cells title="Uploaded to your account">
            {SYNCED.map((s) => <p key={s} className="cell text-body text-fg-1">{s}</p>)}
          </Cells>
          <Cells title="Never uploaded">
            {WITHHELD.map((s) => <p key={s} className="cell text-body text-fg-1">{s}</p>)}
          </Cells>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-label text-fg-2">
            <li>Every row is readable only by the account that owns it</li>
            <li>Losing access never loses your data</li>
            <li>Anyone with database access could read it</li>
            <li>Your cycle log is never uploaded, by any route</li>
          </ul>
        </div>
      </Sheet>
    </>
  )
}
