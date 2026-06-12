# Product gaps & path to "people can use it"

Where bujo stands today and what it needs to be a polished, shareable product —
**without giving up the local-first, privacy-first promise**. Direction chosen:
**Path A — local-first + bring-your-own-cloud** (no backend, near-zero cost, the
app is served statically; each user's data syncs to *their own* Drive/gist/folder).

## Today (strengths)
- Single `JournalData` object, fully offline, PWA-installable.
- Opt-in cloud already exists: own folder (File System Access), Google Drive
  appDataFolder, GitHub gist.
- At-rest encryption (passcode → AES-GCM). Full JSON export/import.
- Static hosting wired (GitHub Pages workflow).

## Gaps, ranked (Path A)

| # | Gap | Why it matters | Plan |
|---|---|---|---|
| 1 | **Storage ceiling** | `localStorage` ≈ 5–10 MB; photos blow past it | Offload images to **IndexedDB** blobs, referenced by id; keep `JournalData` small. Interim: a **quota meter + near-full guard** (shipped). |
| 2 | **Sync conflict handling** | Two devices → last-write clobbers | Stamp each save with `updatedAt`; on cloud load, compare + prompt (keep newer / merge / keep both). |
| 3 | **Onboarding** | First-run is sparse for non-technical users | A short guided first-run: pick storage, seed demo, 3-step tour. |
| 4 | **Backup safety** | Passcode has no recovery; no auto-backup | Auto-export reminder cadence; "download recovery copy"; optional encrypted cloud copy. |
| 5 | **Browser gaps** | Voice (no Firefox), folder-sync (no Safari) | Detect + show graceful fallbacks (already no-op; surface why). |
| 6 | **Accessibility** | Partial | Finish keyboard/focus/SR pass; chart text-alternatives done. |
| 7 | **CI gate** | Tests run on deploy only | Add a PR check workflow; consider Playwright e2e. |
| 8 | **Legal** | Public hosting | Privacy policy + ToS (minimal for Path A — no server holds data). |
| 9 | **i18n / telemetry / push** | Reach & reliability | English-only today; no crash reporting (privacy tradeoff); push needs a service worker + a signaling backend (defer). |

## Explicitly NOT doing (for now)
- **Path B** (accounts + database + sync server). It makes multi-device "just
  work" but adds recurring cost, a security burden, and turns us into a **data
  controller** (GDPR/ToS/privacy-policy duties). Revisit only if users demand
  zero-config multi-device. The existing at-rest crypto is the client half if we
  ever add E2E cloud sync.

## Next concrete steps (Path A)
1. ✅ Storage quota meter + near-full guard (Settings).
2. IndexedDB image store (migrate progress/memory/monthly photos).
3. `updatedAt` stamp + cloud-load conflict prompt.
4. Guided onboarding on first run.

## Path A — progress (appended)

- ✅ **Gap #1 (storage ceiling)**: `lib/imageStore.ts` — IndexedDB image store;
  progress photos now reference an `img:` id instead of inlining the data-URL in
  the JSON journal (back-compat: legacy inline `data:` URLs still render). JSON
  **export inlines images** (`inlineImages`) so backups stay portable. Memory /
  monthly photos can follow the same pattern next.
- ✅ **Gap #3 (onboarding)**: first-run "Load a sample journal" path + a ⌘K/Help
  tip on the Welcome gate, so the app isn't empty on day one.
- ⏳ **Gap #2 (sync conflict)**: still open — add an `updatedAt` stamp and a
  newer/older prompt on silent cloud-folder load (currently only the first-run
  folder pick prompts). Touches the App boot path; do deliberately.

## Mobile audit + entry-first pass (appended)

Audited every view at a 390×844 phone viewport in real Chrome (devtools MCP).
**Finding: no broken/invisible views** — the responsive shell works; sidebar →
bottom-nav, calendars/charts/tables all adapt (wide grids scroll horizontally).
Real issue was *ordering*: forms living in the right rail stacked **below** the
charts on phones.

Changes (one responsive codebase, per decision):
- `Page` gained `asideFirst` — on < xl it renders the rail (log forms) **above**
  main, so Fitness/Focus open to data-entry, not charts ("charts down" on mobile).
- Insights stat cards go 2-up on phones (were full-width, too tall).
- Bottom-nav FAB now opens a **quick-action sheet** (Quick add · Log workout ·
  Habits · Goals) — frequent actions one thumb-tap away.
- IndexedDB image store reload verified: no console errors.

Still cosmetic / optional: Gym set-row is tight at 390px; Trackers title wraps.
Not blocking. To open on a real phone: enable GitHub Pages, or run
`npm run dev -- --host` and hit the LAN URL.
