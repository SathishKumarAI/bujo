import { describe, it, expect } from 'vitest'

/**
 * THE EGRESS CONTRACT — nothing leaves this device except through `forEgress`,
 * and nothing arrives except through a guard.
 *
 * `lib/cyclePrivacy.ts` has said since it was written that cycle data is
 * "excluded from every network path, unconditionally". It was not, and the
 * reason it stayed untrue for so long is the shape of the check: `forNetwork`
 * was audited by grepping its own name, which finds every path that remembered
 * the rule and no path that forgot it. `gdrive.pushData` never called it, so no
 * sweep of its callers could see Drive — and Drive uploaded the cycle log while
 * the page collecting it promised the opposite (COD-265).
 *
 * The same blindness ran the other way. `mergePulled` — *withheld is not
 * deleted* — is reached only through `resolveIncoming`, and four pull sites
 * called `replaceAll(migrate(remote))` raw. Since every push strips the log, the
 * remote always arrives with `cycle: []`, so Settings' **Pull** button erased it
 * on every press.
 *
 * So this file asserts the **absence** of both mistakes across the whole tree,
 * which is the only shape of assertion that survives someone adding a fifth
 * sync target in a sixth place. Modelled on `auth.contract.test.ts`, for the
 * same reason and with the same key-shape trap, noted below.
 *
 * Note *why* a type-keyed check could not have done this job: `gdrive.pushData`
 * and `github.pushGist` take `unknown`/`obj`, not `JournalData`. The journal
 * reaches them untyped, so the call site is the only place the rule can live,
 * and only a source sweep can see it.
 */
const SOURCES = import.meta.glob('../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * `api/` is OUTSIDE the glob above. COD-301.
 *
 * The pattern resolves relative to this file's directory, so `../**` is
 * `src/**` and stops there — while this file's own docstring claimed a
 * whole-tree sweep. `api/sync.ts` and `api/feedback.ts` both make outbound
 * `fetch` calls, one of them carrying a GitHub token, and neither was ever
 * scanned.
 *
 * Not a live leak today: neither handles a journal shape, so there was nothing
 * for the cycle-log rule to catch. But "the test does not look there" and "the
 * test looked and found nothing" are different facts, and only one of them was
 * true.
 */
const API_SOURCES = import.meta.glob('../../api/**/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

/**
 * `import.meta.glob` keys are relative to THIS file's directory, so they arrive
 * in two shapes: a sibling in `src/lib` is `./storage.ts` — with no `lib/`
 * segment at all — and anything else is `../components/CloudStorage.tsx`. A
 * pattern written as `lib/cyclePrivacy.ts` therefore matches nothing, every
 * filter built on it excuses everything, and the assertions pass vacuously.
 *
 * Same trap `auth.contract.test.ts` records, in a second shape: there it was a
 * path prefix on a basename match, here it is a directory segment missing from
 * the key for that very directory. It cost a round of red assertions while this
 * file was being written. `scannable.length > 50` is the tripwire.
 */
const SELF = /egress\.contract\.test\.ts$/

const files = Object.entries({ ...SOURCES, ...API_SOURCES }).filter(
  ([p]) => !/\.test\.tsx?$/.test(p) || /egress\.contract/.test(p),
)
const scannable = files.filter(([p]) => !SELF.test(p))

/** A comment line. Quoting the mistake in a comment must not count as making it. */
const isComment = (line: string) => {
  const t = line.trimStart()
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')
}
const code = (src: string) => src.split('\n').filter((l) => !isComment(l))

/** The file that owns the boundary, plus its own unit test, may name the halves. */
const BOUNDARY = /^\.\/cyclePrivacy(\.test)?\.ts$/

/**
 * `fscloud` is exempt from BOTH halves, and this is the one place that says so
 * in a form a test can check: a folder on this machine *is* this device, the
 * folder copy legitimately holds the cycle log, and "Export backup" is that
 * path. A replace from a folder is a replace from a full copy, so `mergePulled`
 * would wrongly hold the local log over the one the user asked to restore.
 */
const FOLDER_RESTORE = [/components\/CloudStorage\.tsx$/, /views\/Welcome\.tsx$/]

/** Transports that take an untyped journal — the rule can only live at the call site. */
const TRANSPORTS = ['pushGist', 'pushData'] as const
/** …and the modules that define them, where a bare mention is the definition. */
const TRANSPORT_DEFS = [/^\.\/github\.ts$/, /^\.\/gdrive\.ts$/]

/**
 * What counts as "sends it somewhere".
 *
 * Constructed from strings rather than written as regex literals. When this
 * array was rewritten as a multi-line list of literals during COD-301, two of
 * the three known carriers silently dropped out of the assertion below —
 * `SENDS[0].test(src)` returned false on a file an identical *inline* literal
 * matched. **I did not isolate why**, and that is the point: a tripwire whose
 * patterns can stop matching without anyone noticing is worse than no
 * tripwire, because it reports a clean sweep.
 *
 * So they are built where there is nothing to mis-parse, and
 * `each pattern still matches what it is for` below asserts every one of them
 * against a known-positive sample. If you ever convert these back to
 * literals, keep that test.
 */
const SENDS = [
  String.raw`fetch\s*\(`,
  String.raw`fetchImpl\s*\(`,
  '@supabase/supabase-js',
  String.raw`navigator\.sendBeacon`,
  String.raw`new WebSocket\(`,
  String.raw`new XMLHttpRequest\(`,
].map((pattern) => new RegExp(pattern))

describe('nothing leaves except through forEgress', () => {
  it('scans the source tree', () => {
    // Guards the key-shape trap above: a glob that matched nothing would make
    // every other assertion in this file vacuously true.
    expect(scannable.length).toBeGreaterThan(50)
  })

  it('scans api/ too, and proves it rather than assuming it', () => {
    // COD-301. Widening a glob that then matches nothing is worse than not
    // widening it: the docstring starts claiming coverage the file does not
    // have. These two serverless functions both call `fetch`, so if the second
    // glob silently resolved to nothing this assertion is what says so.
    const api = scannable.filter(([p]) => p.includes('/api/'))
    expect(api.map(([p]) => p.replace(/^.*\/api\//, 'api/')).sort())
      .toEqual(['api/feedback.ts', 'api/sync.ts'])
  })

  it('has no caller of forNetwork except forEgress', () => {
    // The half-rule is no longer a door. A new sync path reaching for
    // `forNetwork` would get the cycle strip and silently keep the sync
    // secrets, which is exactly the state all four push paths were in.
    const offenders = scannable
      .filter(([p]) => !BOUNDARY.test(p))
      .filter(([, src]) => code(src).some((l) => /forNetwork\(/.test(l)))
      .map(([p]) => p)
    expect(offenders).toEqual([])
  })

  it('passes every untyped transport call through forEgress', () => {
    const offenders: string[] = []
    for (const [p, src] of scannable) {
      if (TRANSPORT_DEFS.some((re) => re.test(p))) continue
      for (const line of code(src)) {
        for (const t of TRANSPORTS) {
          if (!line.includes(`${t}(`)) continue
          if (!line.includes('forEgress')) offenders.push(`${p}: ${line.trim()}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('strips inside the two push libs that own their own request', () => {
    // `bujocloud` and `serverSync` build their own fetch, so unlike the
    // transports above there is no call site to carry the rule for them.
    for (const m of ['./bujocloud.ts', './serverSync.ts', './supabase.ts']) {
      const entry = scannable.find(([p]) => p === m)
      expect(entry, `${m} is missing from the scan`).toBeDefined()
      expect(entry![1], `${m} must send forEgress(...)`).toMatch(/forEgress\(/)
    }
  })

  it('each pattern still matches what it is for', () => {
    // The guard on the guard. Two carriers once vanished from the assertion
    // below because a pattern silently stopped matching, and the sweep went
    // green — a tripwire that reports a clean result for the wrong reason is
    // the exact failure this whole file exists to prevent, turned inward.
    const samples: Array<[string, string]> = [
      ['await fetch(url)', 'a plain fetch'],
      ['const r = fetchImpl(url, init)', 'an injected fetch'],
      ["import { createClient } from '@supabase/supabase-js'", 'the Supabase SDK'],
      ['navigator.sendBeacon(url, body)', 'a beacon'],
      ['const ws = new WebSocket(url)', 'a socket'],
      ['const x = new XMLHttpRequest()', 'an XHR'],
    ]
    expect(samples).toHaveLength(SENDS.length)
    samples.forEach(([sample, what], i) => {
      expect(SENDS[i].test(sample), `SENDS[${i}] (${SENDS[i].source}) no longer matches ${what}`).toBe(true)
    })
    // And it must not match prose, or every file becomes a carrier.
    for (const re of SENDS) {
      expect(re.test('// we do not fetch anything here'), re.source).toBe(false)
    }
  })

  it('excludes the two untyped transports by name, not by accident', () => {
    // `gdrive.pushData` and `github.pushGist` take `unknown`, so the journal
    // reaches them untyped and the call-site assertion is where their rule
    // lives. That is correct — but until COD-301 they were also absent from
    // the carriers list purely because neither file happens to contain the
    // string `JournalData`. Annotating either would have failed the build for
    // a file that was already right.
    const defs = scannable.filter(([p]) => TRANSPORT_DEFS.some((re) => re.test(p))).map(([p]) => p)
    expect(defs.sort()).toEqual(['./gdrive.ts', './github.ts'])
  })

  it('knows every lib module that carries a journal over the network', () => {
    // A completeness tripwire, not a style rule. A NEW module that types a
    // `JournalData` and sends it somewhere is a new egress path, and it fails
    // here until someone adds it to this list having decided what it owes the
    // boundary. The two untyped transports are covered by the call-site
    // assertion above instead, which is why they are not in this set —
    // and `TRANSPORT_DEFS` is what makes that deliberate: those two files are
    // filtered out BY NAME below.
    //
    // Before COD-301 they fell out only because neither contains the string
    // `JournalData` (both take `unknown`) — so adding a type annotation to
    // either would have turned this assertion red for a file that is already
    // correct. An exclusion nobody chose is not an exclusion.
    //
    // "Sends it somewhere" was `fetch(` alone until COD-271, and that was too
    // narrow: `supabase.ts` carries a `JournalData` to a server and never calls
    // `fetch` itself — the SDK does. The tripwire written to catch the next
    // egress path would have missed the very next egress path. Any client that
    // speaks for us has to be named here.
    //
    // ── Three ways this filter used to miss things (COD-301) ──────────────
    //
    // 1. The path pattern was `/^\.\/[a-zA-Z]+\.ts$/` — flat, alphabetic-only,
    //    `src/lib/*.ts` and nothing else. `food/providers.ts` makes two
    //    outbound calls (one carrying a user API key) and `voice/model.ts`
    //    ships the raw spoken transcript; neither could EVER appear in this
    //    list whatever it did. The same class of hole the test was written
    //    for, one directory level down.
    // 2. `SENDS` was `fetch(` and the Supabase SDK. `voice/model.ts` calls
    //    `fetchImpl(`, injected as a parameter — the string `fetch(` never
    //    appears. The note above says the tripwire "would have missed the very
    //    next egress path"; it was still true for an injected fetch.
    // 3. A client that speaks for us is not always a `fetch`. Beacons and
    //    sockets send too, and neither was named.
    const carriers = scannable
      // Any .ts under src/lib, subdirectories included.
      .filter(([p]) => /^\.\/[a-zA-Z0-9][a-zA-Z0-9/-]*\.ts$/.test(p))
      // The two untyped transports, excluded on purpose and by name.
      .filter(([p]) => !TRANSPORT_DEFS.some((re) => re.test(p)))
      .filter(([, src]) => src.includes('JournalData') && SENDS.some((re) => re.test(src)))
      .map(([p]) => p.replace('./', ''))
      .sort()
    expect(carriers).toEqual(['bujocloud.ts', 'serverSync.ts', 'supabase.ts'])
  })
})

describe('nothing arrives without a guard', () => {
  it('has no raw replaceAll(migrate(...)) outside the folder paths', () => {
    // The exact mistake, matched exactly. Four sites shipped this; the folder
    // restores keep it on purpose (see FOLDER_RESTORE above).
    const offenders = scannable
      .filter(([p]) => !FOLDER_RESTORE.some((re) => re.test(p)))
      .filter(([, src]) => code(src).some((l) => /replaceAll\(\s*migrate\(/.test(l)))
      .map(([p]) => p)
    expect(offenders).toEqual([])
  })

  it('still finds the folder restores, so the exemption cannot rot into a typo', () => {
    // If a refactor renames or rewrites these two call sites, the exemption
    // above stops describing anything and would quietly excuse both whole files.
    const found = scannable
      .filter(([p]) => FOLDER_RESTORE.some((re) => re.test(p)))
      .filter(([, src]) => code(src).some((l) => /replaceAll\(\s*migrate\(/.test(l)))
      .map(([p]) => p.replace(/^.*\//, ''))
      .sort()
    expect(found).toEqual(['CloudStorage.tsx', 'Welcome.tsx'])
  })

  /** The four "replace this device's journal" buttons that read a remote. */
  const NETWORK_RESTORES = [
    'account/CloudSyncCard.tsx',
    'settings/SelfHostCard.tsx',
    'components/CloudStorage.tsx',
    'DriveSync.tsx',
  ]

  it('guards every network restore with mergePulled', () => {
    for (const m of NETWORK_RESTORES) {
      const entry = scannable.find(([p]) => p.endsWith(m))
      expect(entry, `${m} is missing from the scan`).toBeDefined()
      expect(entry![1], `${m} must pull through mergePulled(...)`).toMatch(/mergePulled\(/)
    }
  })

  it('tells the user the cycle log survives, in every one of those dialogs', () => {
    // The code half and the copy half are one change. A dialog saying
    // "everything on this device is overwritten" while the code keeps the cycle
    // log is the same class of defect as the reverse — it is just the harmless
    // direction, and it still means the sentence on screen is not true.
    // `CYCLE_CLAUSE` is one exported string precisely so this can be checked.
    for (const m of NETWORK_RESTORES) {
      const entry = scannable.find(([p]) => p.endsWith(m))
      expect(entry![1], `${m} must append CYCLE_CLAUSE to its confirm copy`).toMatch(/CYCLE_CLAUSE/)
    }
  })
})
