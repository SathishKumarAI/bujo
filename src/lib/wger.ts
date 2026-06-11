// Client for the wger public exercise database (https://wger.de).
// wger data & images are community-contributed under CC-BY-SA / AGPL.
// We only READ their public API; nothing from this journal is sent to wger.

const BASE = 'https://wger.de'

export interface WgerExercise {
  id: number
  name: string
  image: string | null // absolute URL or null
  category?: string
}

/** Search wger's exercise database by term. Returns up to ~20 matches. */
export async function searchExercises(term: string, signal?: AbortSignal): Promise<WgerExercise[]> {
  const url = `${BASE}/api/v2/exercise/search/?term=${encodeURIComponent(term)}&language=english&format=json`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`wger search failed (${res.status})`)
  const json = await res.json()
  const suggestions: any[] = json.suggestions ?? []
  const seen = new Set<number>()
  const out: WgerExercise[] = []
  for (const s of suggestions) {
    const d = s.data ?? {}
    const id = d.base_id ?? d.id
    if (id == null || seen.has(id)) continue
    seen.add(id)
    const img: string | null = d.image
      ? d.image.startsWith('http') ? d.image : `${BASE}${d.image}`
      : null
    out.push({ id, name: d.name ?? 'Exercise', image: img, category: d.category })
  }
  return out
}
