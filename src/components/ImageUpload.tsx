import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
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
        <div className="group relative overflow-hidden rounded-xl border border-surface0">
          <img src={value} alt="" className="max-h-64 w-full rounded-xl object-cover" />
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => ref.current?.click()}
              aria-label="Replace photo"
              title="Replace photo"
              className="inline-flex items-center gap-1 rounded-full bg-crust/85 px-2.5 py-1 text-xs text-text hover:text-mauve"
            >
              <Camera size={13} /> {busy ? '…' : 'Replace'}
            </button>
            <button
              onClick={() => onChange(undefined)}
              aria-label="Remove photo"
              title="Remove photo"
              className="grid h-7 w-7 place-items-center rounded-full bg-crust/85 text-text hover:text-red"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        <Button onClick={() => ref.current?.click()} className="flex w-full items-center justify-center gap-2">
          <Camera size={15} /> {busy ? 'Processing…' : label}
        </Button>
      )}
      <input ref={ref} type="file" accept="image/*" onChange={pick} className="hidden" />
    </div>
  )
}
