import { useState } from 'react'
import { useJournal } from '../../store'
import { notify } from '../../lib/notify'

/** The faces a local account can pick (`LocalAccountCard`, `AccountPhoneCells`). */
export const EMOJI = ['🙂', '🦊', '🌱', '🪐', '🎧', '📓', '🏔️', '🐙', '☕', '🦉', '🍊', '⚡']

/** The name form's state and its save — shared by this card and the phone's
 *  rows (`AccountPhoneCells.tsx`). */
export function useLocalProfile() {
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

  return { profile, name, setName, emoji, setEmoji, editing, setEditing, save }
}
