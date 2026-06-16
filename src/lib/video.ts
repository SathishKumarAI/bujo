// Generic YouTube demo/search links for any exercise, drill, or movement.
// This is the same approach the Home Workout library uses, lifted out so every
// view (Gym, Pull-ups, program trackers, …) can surface a proper-form video
// from just a name. We don't hardcode video ids by default (those rot); pass a
// pinned `yt` id only when you want a specific clip.

/** Proper-form demo link — a pinned clip if `yt` is set, else a targeted search. */
export function videoUrl(name: string, yt?: string): string {
  if (yt) return `https://www.youtube.com/watch?v=${yt}`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + ' proper form technique')}`
}

/** Always-available "find more" search link. */
export function videoSearchUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent('how to ' + name + ' exercise')}`
}
