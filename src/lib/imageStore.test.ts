import { describe, expect, it } from 'vitest'
import { newImageId, isImageId, externalizeImages, inlineImagesWithinBudget, SYNC_INLINE_BUDGET } from './imageStore'

describe('newImageId', () => {
  /**
   * The regression guard for a silent photo-eater. Ids were
   * `Date.now()` + `Math.floor(performance.now() % 1e6)` — both whole
   * milliseconds — so a batch minted in one tick collided and each photo
   * overwrote the last. Measured before the fix: 50 calls → 2 distinct ids.
   *
   * Latent while photos were added one at a time by hand; fatal the moment
   * `externalizeImages` began minting a batch inside one `Promise.all`, which
   * is exactly what the sync-photo fix made it do.
   */
  it('is unique across a tight batch, not just across milliseconds', () => {
    const ids = Array.from({ length: 500 }, newImageId)
    expect(new Set(ids).size).toBe(500)
  })

  it('mints ids that isImageId recognises', () => {
    expect(isImageId(newImageId())).toBe(true)
    expect(isImageId('data:image/jpeg;base64,AAAA')).toBe(false)
    expect(isImageId(undefined)).toBe(false)
  })
})

describe('externalizeImages', () => {
  // These paths must not touch IndexedDB at all — the test environment has
  // none, and more importantly a journal with no inline photos is the common
  // case on every single sync pull.
  it('returns the input untouched when there are no photos', async () => {
    const data = { entries: [], progressPhotos: undefined }
    expect(await externalizeImages(data)).toBe(data)
  })

  it('returns the input untouched when every photo is already an id', async () => {
    const data = { progressPhotos: [{ photo: 'img:abc-0-1' }, { photo: 'img:abc-1-1' }] }
    expect(await externalizeImages(data)).toBe(data)
  })
})

/**
 * The gap that let a regression through review: the first version of the
 * photo-sync fix inlined unconditionally, passed 764 tests, and would have
 * broken sync for every user with a year of progress photos — because no test
 * went anywhere near a payload limit. These do.
 *
 * They use `inlineImages`' own behaviour: a photo that is already a `data:` URL
 * is passed through untouched, so no IndexedDB is needed to build an oversized
 * journal.
 */
describe('inlineImagesWithinBudget', () => {
  /** ~`kb` KB of base64-ish payload, shaped like a real inline photo. */
  const photo = (kb: number) => ({ photo: `data:image/jpeg;base64,${'A'.repeat(kb * 1024)}` })

  it('inlines when the journal fits', async () => {
    const data = { progressPhotos: [photo(100), photo(100)] }
    const { payload, skipped } = await inlineImagesWithinBudget(data)
    expect(skipped).toBe(0)
    expect(payload.progressPhotos[0].photo.startsWith('data:')).toBe(true)
  })

  /**
   * A year of weekly progress photos at ~160 KB base64 each. Before the budget
   * this produced a ~8 MB push against Vercel's 4.5 MB body limit — the journal
   * text stopped syncing at all, which is worse than the photos being missing.
   */
  it('drops the photos rather than the whole push when a year of them will not fit', async () => {
    const data = { progressPhotos: Array.from({ length: 52 }, () => photo(160)) }
    const { payload, skipped } = await inlineImagesWithinBudget(data)
    expect(skipped).toBe(52)
    expect(payload).toBe(data) // untouched — ids, not bytes
  })

  it('is all-or-nothing, never a partial set', async () => {
    // A partial set means the far device shows some photos and dangling
    // references for the rest, with no way to tell which is which.
    const data = { progressPhotos: [photo(10), ...Array.from({ length: 40 }, () => photo(160))] }
    const { payload, skipped } = await inlineImagesWithinBudget(data)
    expect(skipped).toBe(41)
    expect(payload.progressPhotos.every((p) => !p.photo.startsWith('img:'))).toBe(true)
  })

  it('leaves a photoless journal alone without touching IndexedDB', async () => {
    const data = { entries: [], progressPhotos: undefined }
    expect(await inlineImagesWithinBudget(data)).toEqual({ payload: data, skipped: 0 })
  })

  // The constant is load-bearing: it is derived from a platform limit, not
  // taste. If someone raises it past the real ceiling the guard stops guarding.
  it('keeps the budget under the 4.5MB body limit once base64 and escaping are applied', () => {
    expect(SYNC_INLINE_BUDGET * 1.34 * 1.05).toBeLessThan(4_500_000)
  })
})
