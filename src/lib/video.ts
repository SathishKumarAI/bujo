// Search links built from a NAME, never pinned — video for a movement, and a
// buying guide for a piece of equipment. One file because they are one idea.
// This is the same approach the Home Workout library uses, lifted out so every
// view (Gym, Pull-ups, program trackers, …) can surface a proper-form video
// from just a name. We don't hardcode video ids by default (those rot); pass a
// pinned `yt` id only when you want a specific clip. The one exception is the
// owner-chosen demo catalogue in `lib/demoClips.ts`, looked up by name below —
// a lift with no clip there still gets the search.

import { demoClipId } from './demoClips'

/** Proper-form demo link — a pinned clip (`yt`, else the catalogue's), else a targeted search. */
export function videoUrl(name: string, yt = demoClipId(name)): string {
  if (yt) return `https://www.youtube.com/watch?v=${yt}`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' proper form technique')}`
}

/** Always-available "find more" search link. */
export function videoSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent('how to ' + name + ' exercise')}`
}

/**
 * "How to choose one" for a piece of equipment: a verified guide when we have
 * one, else a search that always lands somewhere useful.
 *
 * Same rule as the video links above, and the same reason — a pinned URL rots,
 * and a dead link is worse than a search. Measured when this was added: of the
 * eight rows in `HOME_EQUIPMENT` exactly **one** carried a `url`, and of the
 * seven in `PULLUP_EQUIPMENT` exactly one, so thirteen of fifteen equipment
 * rows rendered no link at all. Both pinned URLs answered 200 — the fault was
 * never a broken link, it was thirteen missing ones.
 */
export function buyingGuideUrl(item: string, url?: string): string {
  if (url) return url
  return `https://duckduckgo.com/?q=${encodeURIComponent(`how to choose ${item} home gym buying guide`)}`
}
