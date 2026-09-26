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
