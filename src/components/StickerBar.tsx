import { useJournal } from '../store'

const PALETTE = ['⭐', '❤️', '', '✅', '', '🌧️', '☀️', '💪', '📚', '✈️', '🎂', '🌸', '☕', '🎵', '', '']

/** Emoji sticker / washi decorations for a given day. */
export function StickerBar({ date }: { date: string }) {
  const { data, addSticker, removeSticker } = useJournal()
  const current = data.stickers[date] ?? []

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1">
        {current.length === 0 && <span className="text-label text-fg-2">No stickers yet</span>}
        {current.map((e) => (
          <button
            key={e}
            onClick={() => removeSticker(date, e)}
            title="Remove sticker"
            className="text-title transition-transform hover:scale-110"
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 border-t border-line pt-2">
        {PALETTE.map((e) => (
          <button
            key={e}
            onClick={() => addSticker(date, e)}
            aria-label={`Add ${e} sticker`}
            className="rounded p-1 text-heading opacity-70 transition-all hover:scale-110 hover:opacity-100"
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}
