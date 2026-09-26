/**
 * READING ONE ENTRY OUT OF A ZIP, WITHOUT A ZIP LIBRARY.
 *
 * **The decision, and why.** Apple's Health app hands the user `export.zip`.
 * Asking for `export.xml` instead would mean asking an iPhone user to unzip a
 * 60 MB archive on their phone and then find one file inside the folder it
 * produced — which is not "one drag and drop", and is the step people give up
 * at. So this reads the zip. It costs ~90 lines and no dependency:
 * `DecompressionStream('deflate-raw')` **is** the decompressor a zip entry
 * needs (Safari/iOS 16.4+, Chrome 103+, Firefox 113+, ~95% global), and the
 * only thing missing from the platform is the *container* — the index that says
 * which byte range is which file. That is what this file is.
 *
 * `DecompressionStream` has no `'zip'` format and cannot get one; `'gzip'` and
 * `'deflate'` are a single compressed stream with no file names in them.
 *
 * **Measured, on the one real export with both figures published (1.5 years,
 * 446,670 records): 5.5 MB zipped against 109 MB of XML — 20:1.** That ratio is
 * the whole argument. The user drags the small file, and we never hold the big
 * one: `blob.slice()` on a `File` is a view onto bytes still on disk, so the
 * entry is decompressed as a stream and consumed a chunk at a time.
 *
 * The rules that keep it honest:
 *
 * | Rule | Why |
 * |---|---|
 * | Sizes come from the **central directory**, never a local header | Zip's streaming mode (general-purpose bit 3) writes zeros for size in the local header and puts the real figures in a trailing descriptor. The central directory always has them |
 * | `await blob.arrayBuffer()` is never called on the archive | A 600 MB zip as one `ArrayBuffer` is already near a phone's per-tab ceiling before decompression starts |
 * | Zip64 is **refused loudly**, not guessed at | A `0xFFFFFFFF` sentinel read as a real offset seeks to garbage and produces a confident wrong answer. Over 4 GB, say so |
 * | Only entry *names* are read; nothing else is opened | `workout-routes/*.gpx` is real GPS that names the user's home, and `export_cda.xml` is a redundant clinical rendering that only inflates the archive |
 */

const EOCD_SIG = 0x0605_4b50
const CD_SIG = 0x0201_4b50
const LOCAL_SIG = 0x0403_4b50
const ZIP64_SENTINEL = 0xffff_ffff

/** The comment field is 16 bits, so the EOCD can be at most this far from the end. */
const MAX_EOCD_SCAN = 66_000

/**
 * 256 KB per read. Big enough that the per-chunk overhead disappears against
 * ~200 bytes of markup per data point, small enough that this plus one partial
 * element is the scanner's entire footprint.
 */
export const CHUNK = 256 * 1024

/**
 * A blob as a byte stream, read in `CHUNK`-sized slices.
 *
 * Not `blob.stream()`, for two reasons. The chunk size is ours, which is what
 * makes the scanner's memory a number we chose rather than one the platform
 * picked; and `Blob.prototype.stream` is missing in jsdom, so the zip path
 * would have had to be tested through a polyfill of the thing under test.
 *
 * Still streaming in the sense that matters: `slice()` on a `File` is a view
 * onto bytes still on disk, so at no point is more than one chunk resident.
 * **`await blob.arrayBuffer()` on the whole archive is the thing this exists to
 * avoid** — a 600 MB zip as one buffer is already near a phone's per-tab
 * ceiling before decompression starts.
 */
export function blobStream(blob: Blob, chunk = CHUNK): ReadableStream<Uint8Array> {
  let offset = 0
  return new ReadableStream<Uint8Array>({
    async pull(ctl) {
      if (offset >= blob.size) { ctl.close(); return }
      const slice = blob.slice(offset, Math.min(offset + chunk, blob.size))
      offset += chunk
      ctl.enqueue(new Uint8Array(await slice.arrayBuffer()))
    },
  })
}

export interface ZipEntry {
  name: string
  /** 0 = stored, 8 = deflate. Anything else this reader refuses. */
  method: number
  compressedSize: number
  /** What the entry weighs once decompressed — the denominator for a progress bar. */
  uncompressedSize: number
  /** Byte offset of the local file header within the archive. */
  headerOffset: number
}

/**
 * Every entry's name and byte range, read from the central directory.
 *
 * Throws with a sentence fit to show the user. A zip we cannot index is a zip
 * we must not guess at — every failure here is louder than the alternative,
 * which is seeking to a wrong offset and reporting "0 records found".
 */
export async function readZipIndex(blob: Blob): Promise<ZipEntry[]> {
  const tailLen = Math.min(MAX_EOCD_SCAN, blob.size)
  const tail = new DataView(await blob.slice(blob.size - tailLen).arrayBuffer())

  // Backwards, because the archive comment sits after the EOCD and can itself
  // contain the signature. The last match is the real one.
  let eocd = -1
  for (let i = tail.byteLength - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === EOCD_SIG) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('That file is not a zip archive.')

  const count = tail.getUint16(eocd + 10, true)
  const cdSize = tail.getUint32(eocd + 12, true)
  const cdOffset = tail.getUint32(eocd + 16, true)
  if (cdOffset === ZIP64_SENTINEL || cdSize === ZIP64_SENTINEL || count === 0xffff) {
    // Refusing beats reading 0xFFFFFFFF as an offset and decompressing whatever
    // is there. A Health export this large has other problems first.
    throw new Error('That zip is over 4 GB (Zip64). Unzip it yourself and pick export.xml instead.')
  }

  const cd = new DataView(await blob.slice(cdOffset, cdOffset + cdSize).arrayBuffer())
  const names = new TextDecoder('utf-8')
  const entries: ZipEntry[] = []
  let p = 0
  for (let n = 0; n < count && p + 46 <= cd.byteLength; n++) {
    if (cd.getUint32(p, true) !== CD_SIG) break
    const nameLen = cd.getUint16(p + 28, true)
    const extraLen = cd.getUint16(p + 30, true)
    const commentLen = cd.getUint16(p + 32, true)
    entries.push({
      name: names.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen)),
      method: cd.getUint16(p + 10, true),
      compressedSize: cd.getUint32(p + 20, true),
      uncompressedSize: cd.getUint32(p + 24, true),
      headerOffset: cd.getUint32(p + 42, true),
    })
    p += 46 + nameLen + extraLen + commentLen
  }
  if (entries.length === 0) throw new Error('That zip has no files in it.')
  return entries
}

/**
 * One entry as a byte stream, decompressed.
 *
 * The local header is read for its *variable* lengths only — name and extra
 * field — because that is the one thing the central directory cannot tell you:
 * where the entry's bytes actually begin.
 */
export async function openZipEntry(blob: Blob, entry: ZipEntry): Promise<ReadableStream<Uint8Array>> {
  const head = new DataView(await blob.slice(entry.headerOffset, entry.headerOffset + 30).arrayBuffer())
  if (head.byteLength < 30 || head.getUint32(0, true) !== LOCAL_SIG) {
    throw new Error(`The zip's index points at nothing for ${entry.name}.`)
  }
  const start = entry.headerOffset + 30 + head.getUint16(26, true) + head.getUint16(28, true)
  const bytes = blob.slice(start, start + entry.compressedSize)

  if (entry.method === 0) return blobStream(bytes)
  if (entry.method !== 8) {
    throw new Error(`${entry.name} uses a compression this browser cannot read (method ${entry.method}).`)
  }
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser is too old to read a zip. Update it, or unzip the file and pick export.xml.')
  }
  // 'deflate-raw' and not 'deflate': a zip entry is a bare deflate stream with
  // no zlib header, and 'deflate' would reject the first two bytes.
  //
  // The cast is a TypeScript DOM-lib wart, not a claim about the data:
  // `DecompressionStream.writable` is typed `WritableStream<BufferSource>`,
  // which is not assignable from `WritableStream<Uint8Array<ArrayBufferLike>>`
  // even though every `Uint8Array` is a `BufferSource`.
  const pair = new DecompressionStream('deflate-raw') as unknown as ReadableWritablePair<Uint8Array, Uint8Array>
  return blobStream(bytes).pipeThrough(pair)
}

/**
 * The entry in a Health export that holds the data.
 *
 * `export.xml` is what we want. `export_cda.xml` is a clinical-document
 * rendering of largely the same information and is ignored — matching on the
 * exact basename rather than a suffix is what keeps it out, because
 * `endsWith('export.xml')` matches `export_cda.xml` only by luck of spelling
 * and would match `my_export.xml` too.
 */
export function findHealthXml(entries: ZipEntry[]): ZipEntry | undefined {
  return entries.find((e) => {
    const base = e.name.split('/').pop() ?? ''
    return base === 'export.xml'
  })
}
