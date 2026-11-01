import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge only knows Tailwind's own size names, so it read this app's
 * size tokens (`text-heading`, `text-label`, …) as COLOURS and dropped them
 * whenever a colour followed: `cn('text-heading text-fg-1')` returned
 * `text-fg-1`. Every Card title lost its 17px and inherited 15px. Naming the
 * tokens as font sizes keeps both. Add a size here when `tokens.css` gains one.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['micro', 'caption', 'label', 'body', 'heading', 'answer', 'title', 'display'] }],
    },
  },
})

/** Merge Tailwind classes safely (later classes win on conflict). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
