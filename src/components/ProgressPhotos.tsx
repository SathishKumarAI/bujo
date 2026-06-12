import { useEffect, useRef, useState } from 'react'
import { Camera, X, Columns2 } from 'lucide-react'
import { useJournal } from '../store'
import { fileToDataURL } from '../lib/image'
import { putImage, getImage, deleteImage } from '../lib/imageStore'
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
  // Resolve each stored photo (an IndexedDB id, or a legacy inline data-URL) to
  // a displayable data-URL. Keeps the big bytes out of the JSON journal.
  const [resolved, setResolved] = useState<Record<string, string>>({})
  useEffect(() => {
    let live = true
    Promise.all(photos.map(async (p) => [p.photo, await getImage(p.photo)] as const)).then((pairs) => {
      if (!live) return
      const map: Record<string, string> = {}
      for (const [key, url] of pairs) if (url) map[key] = url
      setResolved(map)
    })
    return () => { live = false }
  }, [photos.map((p) => p.photo).join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const weight = data.bodyMetrics.filter((b) => b.weight != null).sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.weight
      const id = await putImage(await fileToDataURL(file))
      addProgressPhoto({ date: todayISO(), photo: id, weight })
    } catch {
      alert('Could not read that image.')
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ''
    }
  }
  function removePhoto(id: string, photoKey: string) {
    deleteImage(photoKey)
    removeProgressPhoto(id)
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
              <img src={resolved[p.photo]} alt={`${i === 0 ? 'First' : 'Latest'} progress photo`} className="aspect-[3/4] w-full bg-surface0 object-cover" />
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
              <img src={resolved[p.photo]} alt={`Progress photo ${prettyDay(p.date)}`} className="aspect-[3/4] w-full bg-surface0 object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-crust/80 px-1.5 py-0.5 text-center text-[10px] text-subtext1">
                {p.date.slice(5)}
              </figcaption>
              <button
                onClick={() => removePhoto(p.id, p.photo)}
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
