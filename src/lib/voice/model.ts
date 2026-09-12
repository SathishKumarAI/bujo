/**
 * THE LOCAL MODEL · the fallback for sentences the grammar does not know.
 *
 * `intent.ts` handles the sentences this app is actually used for, deterministic
 * and offline. This is what happens to the rest — and it is a **fallback, not a
 * path**: it runs only when the grammar has fallen through to "keep it as a
 * note", so a working sentence never waits on a model, and turning the model off
 * removes a capability rather than breaking the feature.
 *
 * ## The rules, and why each one exists
 *
 * **Localhost only.** A URL field that accepts any host, in an app holding a
 * health journal, is an exfiltration primitive: one pasted endpoint and every
 * sentence you speak goes to someone else's server. `isLocalEndpoint` is the
 * whole allowlist, it is enforced here rather than in the settings form, and
 * there is deliberately no override.
 *
 * **Every schema field is nullable.** Measured on this machine, same model and
 * sentence, only the schema changed: with required fields, "log oatmeal and eggs
 * for breakfast" came back `games: 2, score: 1, kcal: 250, protein: 18` — four
 * fabricated numbers that all look like data. With nullable fields, null
 * everywhere. A required field is an instruction to produce a value, and a model
 * with no value invents one rather than failing.
 *
 * **The output is untrusted input.** It goes through `validateRecords` like a
 * file picked off disk, and then through the same preview and confirm step. The
 * model proposes; it cannot write. Nothing here bypasses `plan()`.
 *
 * **It is marked as a guess in the UI.** `llama3.1:8b` answered "I played two
 * games and scored 68" with `gamesWon: 2` — it read "played" as "won", which is
 * exactly the fabrication the grammar refuses to make. A proposal from the model
 * is worth showing and is not worth trusting silently.
 */
import type { ImportRecord } from '../ingest/envelope'
import { validateRecords, type RejectedRecord } from '../ingest/validate'
import { ACTIVITIES } from '../../domain/activities'

export interface VoiceModelSettings {
  enabled?: boolean
  /** Ollama-compatible chat endpoint. Localhost only — see `isLocalEndpoint`. */
  endpoint?: string
  model?: string
}

export const DEFAULT_ENDPOINT = 'http://localhost:11434'
export const DEFAULT_MODEL = 'llama3.1:8b'
/** A local model that has to load from disk takes seconds; one already resident answers in under one. */
export const TIMEOUT_MS = 20_000

/**
 * The only hosts this will talk to.
 *
 * Not a warning in the UI, not a "are you sure" — a refusal. The failure mode
 * being prevented is silent and total, and the feature is worth nothing
 * compared to it.
 */
export function isLocalEndpoint(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    return ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'].includes(u.hostname)
  } catch {
    return false
  }
}

/**
 * The shape the model is asked for: one flat, fully nullable record.
 *
 * Flat rather than the real `ImportRecord` union, because a union of six arms
 * with per-arm fields is a schema small models follow badly — and every field it
 * gets wrong is a field the validator then has to reject. One flat object with
 * a `kind` is a question an 8B model can answer.
 */
const SCHEMA = {
  type: 'object',
  properties: {
    kind: { type: ['string', 'null'], enum: ['metric', 'workout', 'body', 'habit', 'entry', 'cycle', 'pickleball', null] },
    date: { type: ['string', 'null'], description: 'YYYY-MM-DD, only if the sentence names a day' },
    mood: { type: ['number', 'null'] },
    stress: { type: ['number', 'null'] },
    sleep: { type: ['number', 'null'], description: 'hours' },
    energy: { type: ['number', 'null'] },
    calories: { type: ['number', 'null'] },
    protein: { type: ['number', 'null'] },
    carbs: { type: ['number', 'null'] },
    fat: { type: ['number', 'null'] },
    steps: { type: ['number', 'null'] },
    /**
     * The real activity keys, as an enum, not a description.
     *
     * This was a free string with the keys listed in its `description`, and the
     * model did exactly what that invites: "I did three rounds of kettlebell
     * swings" came back as `activity: "kettlebell swings"`. The validator
     * rejected it — correctly, since `normalizeActivity` would have silently
     * downgraded an invented value to 'other' — and the whole answer was
     * discarded, which looked from the outside like the model never ran.
     * Constrained, the same sentence returns 'strength'. Put the allowed values
     * in the schema; a description is a suggestion.
     */
    activity: { type: ['string', 'null'], enum: [...Object.keys(ACTIVITIES), null] },
    durationMin: { type: ['number', 'null'] },
    distanceKm: { type: ['number', 'null'] },
    gamesWon: { type: ['number', 'null'] },
    gamesLost: { type: ['number', 'null'] },
    pointsFor: { type: ['number', 'null'] },
    habit: { type: ['string', 'null'] },
    text: { type: ['string', 'null'], description: 'the sentence itself, when nothing else fits' },
  },
  required: ['kind'],
} as const

const PROMPT = `You turn one sentence from a personal journal into fields.

Rules you must not break:
- Use null for anything the sentence does not state. Never guess a number.
- "played two games" is two games PLAYED. It is not two games won. Leave gamesWon null unless the sentence says who won.
- A food with no numbers ("oatmeal and eggs") has no calories. Leave them null and put the sentence in text.
- Only use a date if the sentence names one.
- activity must be one of the listed values. If none fits, use "other".`

/**
 * Ollama returns JSON, and its idea of "null" is not always JSON's.
 *
 * Measured: `llama3.1:8b` under this schema answered `"kind": "null"` — the
 * four-character string. A reader that trusts the type would file a record of
 * kind "null", so every value is normalised through here before it is believed.
 */
function clean(v: unknown): unknown {
  if (v === null || v === undefined) return undefined
  if (typeof v === 'string') {
    const t = v.trim()
    if (t === '' || t.toLowerCase() === 'null' || t.toLowerCase() === 'none' || t.toLowerCase() === 'n/a') return undefined
    return t
  }
  if (typeof v === 'number' && !Number.isFinite(v)) return undefined
  return v
}

export interface ModelResult {
  /** Validated records, ready for the same preview any import uses. Empty when the model gave nothing usable. */
  records: ImportRecord[]
  rejected: RejectedRecord[]
  /** What the model actually returned, for the UI to show when it is refused. */
  raw?: unknown
  error?: string
  ms: number
}

/**
 * Ask the local model to read one sentence.
 *
 * Never throws: a model that is not running, is slow, or answers with prose is
 * an ordinary outcome here, and the caller's next move is the same in every case
 * — keep the sentence as a note.
 */
export async function askModel(
  transcript: string,
  date: string,
  settings: VoiceModelSettings = {},
  fetchImpl: typeof fetch = fetch,
): Promise<ModelResult> {
  const started = Date.now()
  const endpoint = settings.endpoint?.trim() || DEFAULT_ENDPOINT
  const fail = (error: string): ModelResult => ({ records: [], rejected: [], error, ms: Date.now() - started })

  if (!isLocalEndpoint(endpoint)) return fail('That endpoint is not on this machine, so it will not be used.')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  let body: unknown
  try {
    const res = await fetchImpl(`${endpoint.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: settings.model?.trim() || DEFAULT_MODEL,
        stream: false,
        format: SCHEMA,
        options: { temperature: 0 },
        messages: [
          { role: 'system', content: PROMPT },
          { role: 'user', content: `Today is ${date}. Sentence: ${transcript}` },
        ],
      }),
    })
    if (!res.ok) return fail(`The model server answered ${res.status}.`)
    body = await res.json()
  } catch (e) {
    return fail(
      (e as Error)?.name === 'AbortError'
        ? `The model took longer than ${TIMEOUT_MS / 1000}s, so this was left as a note.`
        : 'No model is answering on this machine.',
    )
  } finally {
    clearTimeout(timer)
  }

  const content = (body as { message?: { content?: string } })?.message?.content
  if (typeof content !== 'string') return fail('The model answered in a shape this cannot read.')
  let flat: Record<string, unknown>
  try {
    flat = JSON.parse(content) as Record<string, unknown>
  } catch {
    return { ...fail('The model did not answer with JSON.'), raw: content }
  }

  const kind = clean(flat.kind)
  const record: Record<string, unknown> = { kind, date: clean(flat.date) ?? date }
  for (const [k, v] of Object.entries(flat)) {
    if (k === 'kind' || k === 'date') continue
    const c = clean(v)
    if (c !== undefined) record[k] = c
  }
  // A model that could not classify the sentence has told us something useful:
  // keep the words, which is what the grammar would have done anyway.
  if (!kind) {
    record.kind = 'entry'
    record.type = 'note'
    record.text = clean(flat.text) ?? transcript
  }

  const { records, rejected } = validateRecords([record])
  return { records, rejected, raw: flat, ms: Date.now() - started }
}

/** The models this server has, for the settings form. Empty list on any failure. */
export async function listModels(endpoint = DEFAULT_ENDPOINT, fetchImpl: typeof fetch = fetch): Promise<string[]> {
  if (!isLocalEndpoint(endpoint)) return []
  try {
    const res = await fetchImpl(`${endpoint.replace(/\/$/, '')}/api/tags`, { signal: AbortSignal.timeout(4_000) })
    if (!res.ok) return []
    const body = await res.json() as { models?: { name?: string }[] }
    return (body.models ?? []).map((m) => m.name).filter((n): n is string => !!n).sort()
  } catch {
    return []
  }
}
