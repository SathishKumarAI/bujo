import { useRef, useState } from 'react'
import { fileToDataURL } from '../lib/image'
import { Button } from './ui'

/**
 * Drop-in image picker. Stores a downscaled JPEG data-URL via `onChange`.
 * Pass `value` (data-URL) to show the current image with a remove control.
 */
export function ImageUpload({
  value,
  onChange,
  label = 'Add photo',
  className = '',
}: {
  value?: string
  onChange: (dataUrl: string | undefined) => void
  label?: string
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      onChange(await fileToDataURL(file))
    } catch {
      alert('Could not read that image.')
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }

  return (
    <div className={className}>
      {value ? (
        <div className="group relative rounded-xl border border-surface0">
          <img src={value} alt="" className="hover-zoom max-h-64 w-full rounded-xl object-cover" title="Hover to zoom" />
          <button
            onClick={() => onChange(undefined)}
            aria-label="Remove photo"
            className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-crust/80 text-text opacity-0 transition-opacity group-hover:opacity-100 hover:text-red"
          >
            ×
          </button>
        </div>
      ) : (
        <Button onClick={() => ref.current?.click()} className="w-full">
          {busy ? 'Processing…' : `📷 ${label}`}
        </Button>
      )}
      <input ref={ref} type="file" accept="image/*" onChange={pick} className="hidden" />
    </div>
  )
}
