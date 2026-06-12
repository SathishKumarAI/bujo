import { useRef, useState } from 'react'
import { Camera, X, Columns2 } from 'lucide-react'
import { useJournal } from '../store'
import { fileToDataURL } from '../lib/image'
import { todayISO, prettyDay } from '../lib/date'
import { Button, Card, Empty } from './ui'

/**
 * Physique / progress-photo tracker: upload a dated photo, view the gallery
 * newest-first, and flip to a first-vs-latest side-by-side comparison.
 */
export function ProgressPhotos() {
  const { data, addProgressPhoto, removeProgressPhoto } = useJournal()
  const photos = [...(data.progressPhotos ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1))
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [compare, setCompare] = useState(false)

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const weight = data.bodyMetrics.filter((b) => b.weight != null).sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.weight
      addProgressPhoto({ date: todayISO(), photo: await fileToDataURL(file), weight })
    } catch {
      alert('Could not read that image.')
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }

  const oldest = photos[photos.length - 1]
  const newest = photos[0]

  return (
    <Card
      title="Progress photos"
      subtitle="Weekly physique check — private, on-device"
      right={
        photos.length >= 2 && (
          <Button onClick={() => setCompare((c) => !c)} className="inline-flex items-center gap-1.5">
            <Columns2 size={14} /> {compare ? 'Gallery' : 'Compare'}
          </Button>
        )
      }
    >
      <Button onClick={() => ref.current?.click()} className="mb-3 flex w-full items-center justify-center gap-2">
        <Camera size={15} /> {busy ? 'Processing…' : 'Add today’s photo'}
      </Button>
      <input ref={ref} type="file" accept="image/*" onChange={pick} className="hidden" />

      {photos.length === 0 ? (
        <Empty>No photos yet — add one to start tracking your progress.</Empty>
      ) : compare && oldest && newest ? (
        <div className="grid grid-cols-2 gap-2">
          {[oldest, newest].map((p, i) => (
            <figure key={p.id} className="overflow-hidden rounded-xl border border-surface0">
              <img src={p.photo} alt={`${i === 0 ? 'First' : 'Latest'} progress photo`} className="aspect-[3/4] w-full object-cover" />
              <figcaption className="bg-mantle px-2 py-1 text-center text-xs text-subtext0">
                <span className="text-overlay0">{i === 0 ? 'First' : 'Latest'}</span> · {prettyDay(p.date)}{p.weight != null && ` · ${p.weight}`}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p) => (
            <figure key={p.id} className="group relative overflow-hidden rounded-lg border border-surface0">
              <img src={p.photo} alt={`Progress photo ${prettyDay(p.date)}`} className="aspect-[3/4] w-full object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-crust/80 px-1.5 py-0.5 text-center text-[10px] text-subtext1">
                {p.date.slice(5)}
              </figcaption>
              <button
                onClick={() => removeProgressPhoto(p.id)}
                aria-label="Remove photo"
                className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-crust/85 text-text opacity-0 transition-opacity group-hover:opacity-100 hover:text-red"
              >
                <X size={13} />
              </button>
            </figure>
          ))}
        </div>
      )}
    </Card>
  )
}
