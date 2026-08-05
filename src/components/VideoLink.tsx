import { Play } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { videoUrl } from '../lib/video'
import { cn } from '../lib/cn'

/**
 * Inline "Watch demo" link for any named exercise/drill · opens a pinned clip
 * (`yt`) or a proper-form YouTube search. Mirrors the Home Workout demo link so
 * every exercise list in the app gets a video the same way.
 */
export function VideoLink({
  name,
  yt,
  label = 'Watch demo',
  size = 'sm',
  className,
}: {
  name: string
  yt?: string
  label?: string
  /** Was a px number (11 by default, 13 at one call site). Icons come from the
   *  three-step scale now, so the prop takes a step instead — a caller cannot
   *  invent a fourteenth icon size any more. */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  return (
    <a
      href={videoUrl(name, yt)}
      target="_blank"
      rel="noreferrer"
      // Named after the exercise, always — and this is not belt-and-braces.
      // `ProgramTracker` passes `label=""` for a compact icon-only link, which
      // left a bare anchor with no accessible name at all (axe `link-name`,
      // serious). It was invisible to the gate for months because it sits
      // inside a fold that was collapsed by default.
      //
      // Naming it after the exercise rather than "Watch demo" also fixes the
      // quieter problem: a screen reader listing twenty links all called "Watch
      // demo" cannot be used to pick one.
      aria-label={`Watch a form demo for ${name}`}
      className={cn('inline-flex items-center gap-1 text-label text-red hover:underline', className)}
      onClick={(e) => e.stopPropagation()}
    >
      <Icon as={Play} size={size} /> {label}
    </a>
  )
}
