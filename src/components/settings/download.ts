import type { JournalData } from '../../lib/types'
import { todayISO } from '../../lib/date'
import { exportJSON } from '../../lib/storage'
import { stripSyncSecrets } from '../../lib/csv'
import { inlineImages } from '../../lib/imageStore'

/**
 * Hand the browser a generated file. Every export button on the Data tab.
 *
 * Its own module, not a fourth export from `shared.tsx`: react-refresh only
 * works on a file that exports components alone, and a non-component export
 * beside three components silently costs hot reload on every Settings card.
 */
export function download(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * THE backup file — Export JSON and every confirm's "back up first". One copy
 * on purpose: photos live in IndexedDB, and the Apple Health import's own copy
 * skipped `inlineImages`, so its backup restored every photo as a dangling id
 * (COD-570). Sync secrets are stripped so the file is safe to move.
 */
export async function downloadBackup(data: JournalData) {
  download(`cadence-backup-${todayISO()}.json`, exportJSON(stripSyncSecrets(await inlineImages(data))))
}
