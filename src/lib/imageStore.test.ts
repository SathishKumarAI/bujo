import { describe, expect, it } from 'vitest'
import { newImageId, isImageId, externalizeImages } from './imageStore'

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
