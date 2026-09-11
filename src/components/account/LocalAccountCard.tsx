import { useState } from 'react'
import { useJournal } from '../../store'
import { Card, Input } from '../ui'
import { Button } from '../ui/button'
import { notify } from '../../lib/notify'

/**
 * The local account: a name and an emoji, kept in this journal and nowhere else.
 *
 * **This is identity, not authentication, and the copy here has to keep that
 * promise.** Nothing is verified, nothing is checked against a server, and
 * anyone holding the device can change it. It exists so the app can say your
 * name and so a shared export says whose journal it is — not to protect
 * anything. Do not let words like "secure", "protected", "private account" or
 * "log in" near this component; the thing that actually protects the journal is
 * the passcode lock in Settings, and the thing that syncs it is the passphrase.
 *
 * There is deliberately no password field. A password with nothing to
 * authenticate against is theatre: it would be stored beside the data it
 * pretends to guard, and anyone who can read one can read the other.
 */

/** Kept short on purpose — a grid of 200 emoji is a decision, not a delight. */
const EMOJI = ['🙂', '🦊', '🌱', '🪐', '🎧', '📓', '🏔️', '🐙', '☕', '🦉', '🍊', '⚡']

export function LocalAccountCard() {
  const { data, setSettings } = useJournal()
  const profile = data.settings.profile
  const [name, setName] = useState(profile?.name ?? '')
  const [emoji, setEmoji] = useState(profile?.emoji ?? '🙂')
  const [editing, setEditing] = useState(!profile)

  function save() {
    const trimmed = name.trim()
    if (!trimmed) {
      notify.error('Pick a name', 'Anything you like — it never leaves this device.')
      return
    }
    setSettings({ profile: { name: trimmed, emoji } })
    setEditing(false)
    notify.success(profile ? 'Name updated' : `Welcome, ${trimmed}`, 'Stored on this device only.')
  }

  if (profile && !editing) {
    return (
      <Card band title="You" subtitle="Stored in this journal, on this device">
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden className="grid size-12 shrink-0 place-items-center border border-line text-2xl">
            {profile.emoji}
          </span>
          <div className="min-w-0 grow">
            <p className="truncate font-display text-heading text-fg-1">{profile.name}</p>
            <p className="text-label text-fg-2">Local account · no email, no provider</p>
          </div>
          <Button variant="secondary" onClick={() => setEditing(true)} className="press-3d">
            Edit
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card
      band
      title={profile ? 'Edit your name' : 'Create a local account'}
      subtitle="No email. No provider. Nothing leaves this device."
    >
      <label className="block text-label text-fg-2" htmlFor="local-account-name">
        What should the app call you?
      </label>
      <Input
        id="local-account-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        placeholder="Your name, a nickname, anything"
        autoComplete="off"
        className="mt-1.5"
      />

      <fieldset className="mt-4">
        <legend className="text-label text-fg-2">Pick a face</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              aria-pressed={emoji === e}
              aria-label={`Avatar ${e}`}
              className={`grid size-10 place-items-center border text-xl ${
                emoji === e ? 'border-brand bg-brand-wash' : 'border-line hover:border-line-strong'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" onClick={save} className="press-3d">
          {profile ? 'Save' : 'Create local account'}
        </Button>
        {profile && (
          <Button variant="ghost" onClick={() => { setName(profile.name); setEmoji(profile.emoji); setEditing(false) }}>
            Cancel
          </Button>
        )}
      </div>

      <p className="mt-3 text-label text-fg-2">
        This is a name, not a login. It is saved in your journal like any other setting, and anyone
        with this device can change it. To lock the journal itself, use the passcode in Settings.
      </p>
    </Card>
  )
}
