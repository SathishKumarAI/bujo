/**
 * Writes `docs/FEATURE-REFERENCE.md` from `src/lib/guide.ts`.
 *
 * The manual needs a per-feature reference and the app already has one. Typing
 * it a second time in Markdown would recreate exactly the bug the guide module
 * was built to kill — `views/Help.tsx` carried a hand-written copy of what each
 * screen does and had drifted to fifteen of twenty-four screens with nothing
 * failing. A generated file cannot drift; it can only be out of date, which
 * `git status` after this script makes visible.
 *
 * Loaded through Vite's own SSR module runner rather than plain `node`: the
 * guide imports `shell/sections.ts`, which imports `@/components/icons`, so the
 * path alias and the TypeScript both have to be resolved. Vite is already a
 * dependency and this is what `vite-node` does — fifteen lines is cheaper than
 * another one.
 *
 *   npm run manual
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'docs/FEATURE-REFERENCE.md')

const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { GUIDE, TUTORIALS, guideByGroup } = await server.ssrLoadModule('/src/lib/guide.ts')
await server.close()

const esc = (s) => String(s).replace(/\|/g, '\\|')

const lines = [
  '# Feature reference',
  '',
  '> **Generated — do not edit.** Source: `src/lib/guide.ts`. Regenerate with `npm run manual`.',
  '> The same text is the in-app guide (`?` → Open the full guide, or `?view=help`),',
  '> where every entry has a button that takes you to the page it describes.',
  '',
  `${GUIDE.length} features, in the order the navigation puts them.`,
  '',
  '## Contents',
  '',
]

for (const group of guideByGroup()) {
  lines.push(`**${group.label}** — ${group.cards.map((c) => `[${c.navLabel}](#${slug(c)})`).join(' · ')}`, '')
}

for (const group of guideByGroup()) {
  lines.push(`## ${group.label}`, '')
  for (const card of group.cards) {
    lines.push(`### ${card.navLabel}`, '')
    if (card.navLabel !== card.title) lines.push(`*Page title: ${card.title}.* `)
    lines.push(`\`?view=${card.view}\``, '')
    lines.push(`**What it is.** ${card.what}`, '')
    lines.push(`**Why it exists.** ${card.why}`, '')
    lines.push('**How to use it.**', '')
    card.how.forEach((step, i) => lines.push(`${i + 1}. ${step}`))
    lines.push('')
  }
}

lines.push('## Tutorials', '')
lines.push('| Track | You end up with | Effort |', '|---|---|---|')
for (const t of TUTORIALS) lines.push(`| ${esc(t.title)} | ${esc(t.blurb)} | ${esc(t.effort)} |`)
lines.push('')

for (const t of TUTORIALS) {
  lines.push(`### ${t.title}`, '', `${t.blurb} · **${t.effort}**`, '')
  t.steps.forEach((s, i) => {
    lines.push(`${i + 1}. **${s.title}** — ${s.body}${s.to ? ` *(\`?view=${s.to}\`)*` : ''}`)
  })
  lines.push('')
}

writeFileSync(out, lines.join('\n'))
console.log(`Wrote ${out} · ${GUIDE.length} features, ${TUTORIALS.length} tutorials`)

function slug(card) {
  return card.navLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
