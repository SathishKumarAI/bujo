import { Play } from 'lucide-react'
import { videoUrl } from '../lib/video'
import { cn } from '../lib/cn'

/**
 * Inline "Watch demo" link for any named exercise/drill — opens a pinned clip
 * (`yt`) or a proper-form YouTube search. Mirrors the Home Workout demo link so
 * every exercise list in the app gets a video the same way.
 */
export function VideoLink({
  name,
  yt,
  label = 'Watch demo',
  size = 11,
  className,
}: {
  name: string
  yt?: string
  label?: string
  size?: number
  className?: string
}) {
  return (
    <a
      href={videoUrl(name, yt)}
      target="_blank"
      rel="noreferrer"
      className={cn('inline-flex items-center gap-1 text-xs text-red hover:underline', className)}
      onClick={(e) => e.stopPropagation()}
    >
      <Play size={size} /> {label}
    </a>
  )
}
