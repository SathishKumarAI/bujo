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

const files = Object.entries(SOURCES).filter(
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

describe('nothing leaves except through forEgress', () => {
  it('scans the source tree', () => {
    // Guards the key-shape trap above: a glob that matched nothing would make
    // every other assertion in this file vacuously true.
    expect(scannable.length).toBeGreaterThan(50)
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
    for (const m of ['./bujocloud.ts', './serverSync.ts']) {
      const entry = scannable.find(([p]) => p === m)
      expect(entry, `${m} is missing from the scan`).toBeDefined()
      expect(entry![1], `${m} must send forEgress(...)`).toMatch(/forEgress\(/)
    }
  })

  it('knows every lib module that carries a journal over the network', () => {
    // A completeness tripwire, not a style rule. A NEW module that types a
    // `JournalData` and calls `fetch` is a new egress path, and it fails here
    // until someone adds it to this list having decided what it owes the
    // boundary. The two untyped transports are covered by the call-site
    // assertion above instead, which is why they are not in this set.
    const carriers = scannable
      .filter(([p]) => /^\.\/[a-zA-Z]+\.ts$/.test(p))
      .filter(([, src]) => src.includes('JournalData') && src.includes('fetch('))
      .map(([p]) => p.replace('./', ''))
      .sort()
    expect(carriers).toEqual(['bujocloud.ts', 'serverSync.ts'])
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
