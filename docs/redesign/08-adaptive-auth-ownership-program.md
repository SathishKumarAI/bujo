# Program plan — adaptive shell, auth-gated use, user-owned data

Status: **plan** (2026-06-15). Decisions locked with the product owner; built across
feature branches, each with its own audit + PR. Append-only.

## Locked decisions

1. **Data model: BYO storage + E2E default.** Users choose where their journal lives —
   this device, *their own* Google Drive, or an E2E-encrypted cloud blob. We are a
   *client*, not a data custodian: we never hold readable user data. (Refines BUJO-152.)
2. **Mobile/desktop: adaptive shell, one app.** One codebase + one data/sync layer;
   at runtime detect device class and render distinct layout trees. Same URL, one sync.
3. **Auth: guest = explore only; sign-up required to use.** Guest sees a read-only demo
   to understand features; any data entry requires Google/email sign-in.
4. **Hot-path constraint: data entry is instant.** Writes hit the local store
   synchronously (optimistic) with zero network in the path; sync to the chosen
   destination is background. "Sync ASAP, no delays" = no network in the entry path.

## Branches & sequencing

### `feat/adaptive-shell` (foundation — first)
- `src/components/shell/device.tsx`: `DeviceProvider` + `useDevice()` → `'mobile' | 'desktop'`,
  from `matchMedia('(max-width: 767px)')` (mirrors the Tailwind `md` breakpoint) +
  coarse-pointer/UA tiebreak; live-updates on resize/orientation; SSR-safe default.
- `AppShell` renders **one** chrome: `<Sidebar>` on desktop, `<BottomNav>` + drawer on
  mobile — instead of mounting both and CSS-hiding one. Behavior preserved at the same
  breakpoint, but now a true single-tree switch (less DOM, clean seam for divergence).
- Sets up `MobileApp` / `DesktopApp` layout seam for later per-device views.

### `feat/auth-gate`
- Guest = demo data, **writes disabled** (capture actions route to a "sign in to save"
  prompt). Add Google OAuth (`signInGoogle` / `linkGoogle`) beside existing email/guest.
- Lossless **guest → account upgrade** via `linkIdentity` + `resolveIncoming` merge
  (BUJO-146 conflict logic), so trying-then-signing-up never loses the trial data.

### `feat/data-ownership`
- Storage-destination picker: **Local**, **Your Google Drive**, **E2E cloud**.
- E2E by default for any cloud: reuse `src/lib/crypto.ts` (PBKDF2 → AES-GCM) to encrypt
  before upload; server/Drive holds ciphertext only.
- Local-first optimistic writes + background sync queue (debounced, retry, conflict via
  `resolveIncoming`). Entry path never awaits the network.
- "Export / take my data" + "delete everywhere" controls — ownership must be exit-able.

### `chore/frontend-audit`
- Run `/frontend-design` over the new mobile and desktop shells; audit layout, spacing,
  touch targets, information density per device; move/adjust components as needed.
- Re-run the a11y conventions (role="img"/labels, focus order, tap-target size).

## Security posture (see also `../security/auth-and-data-security.md`)

- RLS already scopes every row to `auth.uid()` — keep + add a regression test.
- E2E means a server/Drive breach yields ciphertext only; the key never leaves the device.
- Add a strict CSP; audit for `dangerouslySetInnerHTML` on untrusted input.
- Guest/demo data must never sync to a real account by accident (gate on
  non-anonymous, non-demo session).

## Done-when

- Opening on phone vs laptop yields the device-appropriate layout from one deploy.
- A visitor can explore as guest but must sign in to capture anything.
- A signed-in user can choose where data lives, encrypt it E2E, export it, and delete it.
- Entry latency is unaffected by sync; visualizations reflect new entries immediately.
