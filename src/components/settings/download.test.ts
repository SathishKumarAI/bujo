import { afterEach, describe, expect, it, vi } from 'vitest'
import { emptyJournal } from '../../lib/storage'
import { downloadBackup } from './download'

/**
 * COD-570: the Apple Health "back up first" wrote its own copy of the backup
 * and skipped `inlineImages`, so photos (stored in IndexedDB by id) came back
 * as dangling `img:` ids. Every backup now goes through `downloadBackup`;
 * this asserts the FILE carries the photo's bytes, not its id.
 */
vi.mock('../../lib/imageStore', () => ({
  inlineImages: async <T extends { progressPhotos?: { photo: string }[] }>(d: T) =>
    ({ ...d, progressPhotos: d.progressPhotos?.map((p) => ({ ...p, photo: p.photo.replace('img:1', 'data:image/png;base64,AAAA') })) }),
}))

afterEach(() => vi.restoreAllMocks())

describe('downloadBackup', () => {
  it('writes the photo bytes into the file, not the IndexedDB id', async () => {
    let blob: Blob | undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation((b) => { blob = b as Blob; return 'blob:x' })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const data = { ...emptyJournal(), progressPhotos: [{ id: 'p1', date: '2026-11-01', photo: 'img:1' }] }

    await downloadBackup(data as Parameters<typeof downloadBackup>[0])

    const text = await blob!.text()
    expect(text).toContain('data:image/png;base64,AAAA')
    expect(text).not.toContain('"img:1"')
  })
})
