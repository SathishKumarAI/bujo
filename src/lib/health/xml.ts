/**
 * SCANNING `export.xml` WITHOUT BUILDING A TREE.
 *
 * This file exists because of one measured number: a real 1.5-year export is
 * **109 MB of XML holding 446,670 `<Record>` elements**, and a ten-year one is
 * 1–2 GB with ~2.8 M. Three obvious approaches are all dead on arrival:
 *
 * | Approach | Why not |
 * |---|---|
 * | `DOMParser.parseFromString` | A 500 MB document becomes a multi-gigabyte DOM. Crashes desktop browsers; guaranteed to kill a phone tab |
 * | `await file.text()` then regex | V8 caps a string at ~512 MB. A 1 GB `export.xml` **cannot be held as one string at all** — `.text()` throws before any parsing runs |
 * | A SAX library | Would work, and is a dependency for a shape that does not need one: `Record` is self-closing and is 446,670 of the file's 446,702 nodes |
 *
 * So: a sliding window over the decoded stream, `indexOf` to find the next
 * element of interest, and a carry-over tail for an element split across a
 * chunk boundary. **Nothing accumulates.** The scanner's whole memory is one
 * chunk plus at most one partial element, and it yields each sample to the
 * caller to fold away immediately.
 *
 * It is a scanner, not a parser, and the difference is deliberate: it does not
 * validate, does not resolve entities beyond the five it needs, and ignores
 * every element it does not recognise. Apple has added elements
 * (`ActivitySummary`, `ClinicalRecord`, `Audiogram`) across iOS versions
 * without announcement, and the inlined DTD is the only schema they publish.
 * Parse permissively; never validate.
 *
 * Dates are **not** parsed here. `2016-04-15 07:27:26 +0100` is not ISO-8601
 * (space instead of `T`, offset without a colon) and `new Date()` accepting it
 * is unspecified behaviour that happens to work in Chrome. `aggregate.ts` takes
 * the `YYYY-MM-DD` off the front of the string with a regex, which is both
 * safer and *more* correct — see the timezone rule there.
 */

/** One `<Record>` or `<Workout>`, as attributes. No tree, no children. */
export interface HKSample {
  /** `Record` → the `type` attribute. `Workout` → the literal `'Workout'`. */
  tag: 'Record' | 'Workout'
  attrs: Record<string, string>
}

export interface ScanProgress {
  /** Bytes of XML decoded so far. */
  bytes: number
  /** Elements yielded so far — not elements matched, elements the caller saw. */
  records: number
}

/**
 * Only `<Record` and `<Workout` are stopped for — see `nextElement`. Everything
 * else in the file (the DTD, `Me`, `ExportDate`, `ActivitySummary`,
 * `Correlation`, `MetadataEntry`, `WorkoutEvent`, `ClinicalRecord`) is skipped
 * without ever being decoded into an object, which is most of why this is fast
 * enough to run on the main thread.
 *
 * Comfortably longer than `'<Workout '` (9): the most of a split tag that can
 * be held back as undecidable.
 */
const MAX_PARTIAL = 16

/**
 * A single element longer than this is not a Health export. The guard exists
 * because the alternative — an unbounded carry buffer while searching for a
 * `>` that never comes — is an out-of-memory crash with no message, which is
 * the worst failure mode this file could have.
 */
const MAX_ELEMENT = 1 << 20

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'",
}

/** The five entities XML requires, and nothing else. Skipped entirely when there is no `&`. */
export function unescapeXml(s: string): string {
  return s.includes('&') ? s.replace(/&(?:amp|lt|gt|quot|apos|#39);/g, (m) => ENTITIES[m] ?? m) : s
}

const ATTR = /([A-Za-z]+)="([^"]*)"/g

function attrsOf(span: string): Record<string, string> {
  const out: Record<string, string> = {}
  ATTR.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = ATTR.exec(span)) !== null) out[m[1]] = unescapeXml(m[2])
  return out
}

/**
 * The index of the `>` that closes the tag starting at `from`, or `-1` if the
 * buffer does not hold it yet.
 *
 * Quote-aware, in `indexOf` hops rather than character by character. It matters
 * because a `>` inside an attribute value is legal XML, and Apple's `device`
 * attribute is literally `<<HKDevice: 0x…>, name:Apple Watch, …>` — escaped in
 * practice, but a scanner that *relies* on it being escaped truncates a record
 * silently on the day it is not. Two `indexOf` calls per attribute is cheap;
 * being wrong here loses data with no error.
 */
function tagEnd(buf: string, from: number): number {
  let p = from
  for (;;) {
    const q = buf.indexOf('"', p)
    const g = buf.indexOf('>', p)
    if (g < 0) return -1
    if (q < 0 || g < q) return g
    const close = buf.indexOf('"', q + 1)
    if (close < 0) return -1
    p = close + 1
  }
}

/**
 * The next element start at or after `from`: `{ at, tag }` for one we want,
 * `{ at, tag: null }` for one we do not, or `null` when the buffer holds no
 * further `<` and `pending` when it may hold a partial one.
 *
 * **Scans for `'<'` and then tests, rather than `indexOf` per opener, and that
 * is a 25× difference measured.** The obvious version — `indexOf('<Record ')`
 * and `indexOf('<Workout ')` from the cursor, take the earlier — re-scans the
 * *entire remaining buffer* for `<Workout ` on every single record, because a
 * miss costs a full scan and almost every chunk contains no workouts at all.
 * That is O(records × chunk bytes), and it was measured on a generated
 * 1,000,000-record / 292 MB fixture: **8,163 records/sec**, i.e. six minutes for
 * a real ten-year export. Advancing through `<` and testing what follows visits
 * each element once and measured **270,709 records/sec on the same fixture** —
 * 33× from one line. (A 2,800,000-record / 818 MB run settles at 150,247/sec.)
 *
 * The lesson generalises: a "not found" from `indexOf` is the most expensive
 * answer it can give, so never ask it in a loop for something usually absent.
 */
function nextElement(buf: string, from: number): { at: number; tag: 'Record' | 'Workout' | null } | 'pending' | null {
  const at = buf.indexOf('<', from)
  if (at < 0) return null
  // Too near the end to tell what it is — wait for the rest rather than decide.
  if (buf.length - at < MAX_PARTIAL) return 'pending'
  if (buf.startsWith('<Record ', at)) return { at, tag: 'Record' }
  if (buf.startsWith('<Workout ', at)) return { at, tag: 'Workout' }
  return { at, tag: null }
}

/**
 * Every `<Record>` and `<Workout>` in an XML byte stream, in document order.
 *
 * Decodes with `TextDecoder` in streaming mode, which holds a multi-byte
 * character split across a chunk boundary until its remaining bytes arrive —
 * the bug you get for free by not concatenating decoded chunks by hand. Reports
 * progress every `progressEvery` elements.
 *
 * The progress tick is also the **yield point**, and that is load-bearing:
 * `await reader.read()` resolves as a microtask when the stream already has
 * data buffered, so a tight loop over a warm stream can starve rendering for
 * the whole import. One `setTimeout(0)` per tick gives the browser a frame, so
 * the progress figure the user is being shown actually paints. It is the
 * difference between "importing, 240,000 records" and a frozen tab, and it is
 * what makes a Worker unnecessary here — see `README.md`.
 */
export async function* scanHealthXml(
  stream: ReadableStream<Uint8Array>,
  onProgress?: (p: ScanProgress) => void,
  progressEvery = 20_000,
): AsyncGenerator<HKSample> {
  let buf = ''
  let bytes = 0
  let records = 0

  const reader = stream.getReader()
  const decoder = new TextDecoder('utf-8')

  try {
    for (;;) {
      const { done, value } = await reader.read()
      // The final `decode()` with no argument flushes a trailing incomplete
      // sequence; without it the last character of a file can be dropped.
      buf += done ? decoder.decode() : decoder.decode(value, { stream: true })
      // Counted from the RAW chunk, because the progress denominator is the zip
      // entry's `uncompressedSize` in bytes and a decoded chunk's `.length` is
      // characters. Equal only while the XML is pure ASCII — one accented
      // `sourceName` and the bar would never reach the end.
      if (!done) bytes += value.byteLength

      let i = 0
      for (;;) {
        const el = nextElement(buf, i)
        if (el === null) {
          // No `<` left. Keep nothing but the cursor position — and never reach
          // back before `i`, or an already-consumed element could be found
          // again in the tail and yielded twice.
          buf = buf.slice(i)
          break
        }
        if (el === 'pending') {
          // A `<` too close to the end to identify. Keep it and wait.
          buf = buf.slice(Math.max(i, buf.length - MAX_PARTIAL))
          break
        }
        if (el.tag === null) { i = el.at + 1; continue }
        const end = tagEnd(buf, el.at)
        if (end < 0) {
          buf = buf.slice(el.at)
          if (buf.length > MAX_ELEMENT) {
            throw new Error('That XML does not look like a Health export — one element ran past a megabyte.')
          }
          break
        }
        yield { tag: el.tag, attrs: attrsOf(buf.slice(el.at, end)) }
        records++
        if (records % progressEvery === 0) {
          onProgress?.({ bytes, records })
          await new Promise((r) => setTimeout(r, 0))
        }
        i = end + 1
      }
      // Broken AFTER the scan, not before it: the last chunk's records are in
      // `buf` and an early `break` on `done` would silently drop every element
      // in it — up to a whole chunk of the user's data, with a successful-
      // looking count.
      if (done) break
    }
  } finally {
    // Cancel rather than leak: an early `break` in the consumer (a cap hit, a
    // user pressing cancel) must release the file handle underneath.
    await reader.cancel().catch(() => {})
  }
  onProgress?.({ bytes, records })
}
