import { chromium } from 'playwright'
const URL = process.env.BUJO_URL ?? 'http://localhost:4299'
const OUT = process.env.OUT ?? '.'
const b = await chromium.launch()
for (const [n, vp] of [['desk', { width: 1440, height: 1000 }], ['phone', { width: 390, height: 900 }]]) {
  const ctx = await b.newContext({ viewport: vp })
  const p = await ctx.newPage()
  await p.goto(`${URL}/?demo=1`, { waitUntil: 'networkidle' })
  await p.evaluate(() => localStorage.setItem('bujo:onboarded', '1'))
  await p.goto(`${URL}/?view=nofap&demo=1`, { waitUntil: 'networkidle' })
  await p.waitForFunction(() => (document.querySelector('#main')?.textContent ?? '').length > 200, null, { timeout: 15000 }).catch(() => {})
  await p.waitForTimeout(800)
  const m = await p.evaluate(() => {
    const H = (el) => el ? Math.round(el.getBoundingClientRect().height) : null
    const q = (s) => document.querySelector(s)
    const orient = q('.zone-orient')
    const parts = orient ? [...orient.querySelectorAll(':scope > div > *')].map((e) => ({
      tag: e.tagName.toLowerCase(), h: H(e), text: (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 46),
    })) : []
    return {
      page: H(q('#main')), orient: H(orient), act: H(q('.zone-act')), review: H(q('.zone-review')),
      screens: Math.round(H(q('#main')) / innerHeight * 100) / 100, parts,
    }
  })
  console.log(`\n${n}: page ${m.page} (${m.screens} screens) · orient ${m.orient} · act ${m.act} · review ${m.review}`)
  for (const x of m.parts) console.log(`   orient part ${String(x.h).padStart(4)}px  ${x.tag}  "${x.text}"`)
  if (process.env.SHOT) await p.screenshot({ path: `${OUT}/rec2-${n}.png` })
  await ctx.close()
}
await b.close()
