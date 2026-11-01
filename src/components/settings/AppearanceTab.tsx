import { useJournal } from '../../store'
import { useConfirm } from '../ConfirmDialog'
import { AppearancePhone } from './AppearancePhone'

/**
 * How the app looks. Four bands and one reset, all of which write `settings`
 * and nothing else — this tab cannot touch journal data, which is why the
 * reset button can be a plain destructive without an export offer.
 */
export function AppearanceTab() {
  const confirm = useConfirm()
  const { setSettings } = useJournal()

  async function reset() {
    if (await confirm({
      title: 'Reset appearance to defaults?',
      description: 'Restores the theme, accent, text size, paper and dashboard toggles. Your journal data is untouched.',
      confirmLabel: 'Reset appearance', destructive: true,
    })) setSettings({ theme: 'mocha', accent: undefined, fontScale: 1, bookMode: false, paperMode: false, handwriting: false, reflectionPrompts: true, penaltyLevel: 'beginner', hideToday: [] })
  }

  // The same grouped rows on every device (`AppearancePhone.tsx`).
  return <AppearancePhone onReset={reset} />
}
