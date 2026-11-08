import { useState } from 'react'
import { Check, CloudCheck, ShieldCheck, SignIn, SignOut } from '@/components/icons'
import { Cell, Cells, FieldCell } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { SYNCED, WITHHELD } from '../../lib/account'
import { useAccountSession } from './useAccountSession'
import { EMOJI, useLocalProfile } from './useLocalProfile'

/**
 * THE ACCOUNT TAB — iOS Settings rows, on every device since #524.
 *
 * OWNS: "You" (the local name and face) and the Google account (sign in, who,
 * status, sign out), and the sheet holding what is and is not uploaded.
 * DOES NOT OWN: any account logic — `useAccountSession` and `useLocalProfile`.
 *
 * **The only sign-in surface.** `lib/auth.contract.test.ts` counts the callers
 * of `signInGoogle`; render `SyncAccountCells` rather than a second button.
 * **Absent, not broken:** with no Supabase project configured it returns null —
 * most clones of this public repo never set one, and a sign-in that throws on
 * click is a worse first run than none.
 *
 * **The honest half stays on screen.** "Private to your account, not secret
 * from the server" is the row's subtitle, not only the sheet's: the journal is
 * stored in a form the server can read (COD-309), and a reader who skims has to
 * still meet that sentence. **Signed in is not synced**: the status row reads
 * the phase `AccountSync` publishes, so it can only say what is happening.
 *
 * **"You" is identity, not authentication.** Nothing is verified and anyone
 * holding the device can change it. No password field and no "secure" /
 * "log in" copy near it — the passcode lock is what protects the journal.
 *
 * The desktop cards (`AccountCard`, `LocalAccountCard`) drew these same hooks
 * and were deleted once Settings drew rows everywhere (COD-571).
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
            <Cell icon={ShieldCheck} tone="overlay1" title="What is uploaded" subtitle="Private to your account, not secret from the server" opensSheet onPress={() => setInfo(true)} />
            <Cell icon={SignOut} tone="red" title={busy ? 'Signing out…' : 'Sign out'} subtitle="Everywhere — this device keeps its journal" chevron={false} onPress={busy ? undefined : disconnect} />
          </>
        ) : (
          <>
            <Cell icon={SignIn} tone="blue" title={busy ? 'Opening Google…' : 'Continue with Google'} subtitle="Your journal on every device" chevron={false} onPress={busy ? undefined : connect} />
            <Cell icon={ShieldCheck} tone="overlay1" title="What is uploaded" subtitle="Private to your account, not secret from the server" opensSheet onPress={() => setInfo(true)} />
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
