/**
 * THE ENTRY POINT · a file the user dropped → records the ingest pipeline takes.
 *
 * One function, three steps, none of which holds the file:
 *
 * ```
 * File → zip index → entry stream → scanHealthXml → aggregate → ImportRecord[]
 *        (a 64 KB read)  (deflate,      (no tree)      (one row
 *                         streamed)                     per day)
 * ```
 *
 * From here the records go through the **existing** pipeline —
 * `validateRecords` then `plan()` then one `replaceAll` — exactly like a voice
 * capture or a pasted payload. This file adds a reader, not a write path. That
 * matters more than it sounds: the app already has several ways data gets in,
 * and a fifth one with its own validation and its own overwrite rules is how
 * they silently diverge.
 *
 * **Nothing leaves the device.** There is no fetch in this directory and there
 * must never be one: the file is the user's entire medical timeline. See
 * `docs/import/apple-health.md` for the one thing that has to be said out loud
 * about sync, which is not the same promise.
 */
import { aggregate, type AggregateOptions, type HealthSummary } from './aggregate'
import { scanHealthXml } from './xml'
import { blobStream, findHealthXml, openZipEntry, readZipIndex } from './zip'
import type { ImportRecord } from '../ingest/envelope'

export interface ReadProgress {
  /** Bytes of XML read so far. */
  bytes: number
  /** Total bytes of XML expected — from the zip's central directory, so it is known before a byte is decompressed. */
  total: number
  /** Elements scanned. The honest figure when `total` is an estimate. */
  records: number
}

export interface HealthFileInfo {
  /** What the file turned out to be, decided by its bytes and not its name. */
  kind: 'zip' | 'xml'
  /** The entry that was read, for the preview to name. */
  entry: string
  /** Uncompressed bytes of XML. The 20:1 ratio is why this is worth showing. */
  xmlBytes: number
}

export interface HealthReadResult {
  records: ImportRecord[]
  summary: HealthSummary
  info: HealthFileInfo
}

/** `PK\x03\x04` — a zip's first four bytes. */
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]

/**
 * Zip or XML, from the first four bytes.
 *
 * Deliberately not from the extension. A user who unzipped on a Mac has
 * `export.xml`; one who renamed it has anything; iOS Files hands over
 * `export.zip`. The bytes are the only thing that cannot be wrong, and getting
 * this wrong means feeding deflate-compressed bytes to a text decoder and
 * reporting "no records found" about a perfectly good file.
 */
async function sniff(file: Blob): Promise<'zip' | 'xml'> {
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  return ZIP_MAGIC.every((b, i) => head[i] === b) ? 'zip' : 'xml'
}

/**
 * Read an Apple Health export. Accepts `export.zip` **or** a bare `export.xml`.
 *
 * Both, because the zip is what the Health app produces and is what makes this
 * one drag-and-drop, while the bare XML is what a user who already unzipped it
 * has in their hand — and supporting it is one branch. The zip path is the one
 * that matters: the measured ratio on a real export is **5.5 MB zipped against
 * 109 MB of XML**, so asking for the XML would mean asking someone to move 109
 * MB around on a phone.
 *
 * Throws with a sentence fit to show the user. Nothing is written by this
 * function or anything it calls.
 */
export async function readHealthExport(
  file: File | Blob,
  opts: AggregateOptions = {},
  onProgress?: (p: ReadProgress) => void,
): Promise<HealthReadResult> {
  const kind = await sniff(file)
  let stream: ReadableStream<Uint8Array>
  let entry: string
  let total: number

  if (kind === 'zip') {
    const index = await readZipIndex(file)
    const xml = findHealthXml(index)
    if (!xml) {
      // Naming what WAS in the archive is the difference between a fixable
      // report and "it didn't work" — the user may have picked the wrong zip
      // entirely, and a list of names tells them so immediately.
      const names = index.slice(0, 6).map((e) => e.name).join(', ')
      throw new Error(`That zip has no export.xml in it. It contains: ${names}${index.length > 6 ? ', …' : ''}`)
    }
    stream = await openZipEntry(file, xml)
    entry = xml.name
    total = xml.uncompressedSize
  } else {
    stream = blobStream(file)
    entry = file instanceof File ? file.name : 'export.xml'
    total = file.size
  }

  const samples = scanHealthXml(stream, (p) => onProgress?.({ ...p, total }))
  const { records, summary } = await aggregate(samples, opts)
  return { records, summary, info: { kind, entry, xmlBytes: total } }
}

/**
 * The one-line summary of what an import will do, as sentences rather than a
 * count of samples nobody can check.
 *
 * Kept next to the reader rather than in the component so the wording is unit-
 * testable: every one of these lines is a claim about the user's data, and a
 * claim in JSX is a claim nothing asserts.
 */
export function describeSummary(s: HealthSummary, info: HealthFileInfo): string[] {
  const out: string[] = []
  const n = (v: number) => v.toLocaleString()
  out.push(`${n(s.samples)} records in ${info.entry} (${Math.round(info.xmlBytes / 1_048_576)} MB of XML).`)
  if (s.sources.length) {
    out.push(`From ${s.sources.slice(0, 3).join(', ')}${s.sources.length > 3 ? ` and ${s.sources.length - 3} more` : ''}.`)
  }
  if (s.inBedDays > 0) {
    out.push(`${n(s.inBedDays)} night${s.inBedDays === 1 ? '' : 's'} recorded only time in bed, not time asleep — those are time in bed.`)
  }
  if (s.bodyTempDays > 0) {
    out.push(`${n(s.bodyTempDays)} day${s.bodyTempDays === 1 ? ' has' : 's have'} a general body temperature but no basal reading. They are a different measurement and are ${s.byField.bodyTempC ? 'included because you asked' : 'left out'}.`)
  }
  if (s.badUnit > 0) out.push(`${n(s.badUnit)} reading${s.badUnit === 1 ? '' : 's'} came in a unit we don't recognise and were left out rather than guessed at.`)
  if (s.malformed > 0) out.push(`${n(s.malformed)} record${s.malformed === 1 ? ' was' : 's were'} missing a value or a date.`)
  if (s.unmappedWorkouts > 0) out.push(`${n(s.unmappedWorkouts)} workout${s.unmappedWorkouts === 1 ? '' : 's'} had an activity this app has no equivalent for and ${s.unmappedWorkouts === 1 ? 'was' : 'were'} left out.`)
  out.push('Heart-rate samples, sleep stages, daily walking distance, clinical records and GPS routes are never read.')
  return out
}
