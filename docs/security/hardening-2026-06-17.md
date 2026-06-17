# Security & sync hardening — 2026-06-17

Follow-up to the audit (`docs/qa/audit-2026-06-17.md`). Covers the **CRITICAL** sync data-loss fix (all paths) and HTTP security hardening for **both** the cloud (Vercel) and non-cloud (self-host nginx) targets.

## Sync — no-clobber guard on every auto-push path

The audit found auto-push paths that could silently overwrite a **newer** remote copy when two devices share a sync target. Fixed with an **adopt-newer-remote** guard (pull first, compare `updatedAt`, adopt remote if newer, else push) + an echo-guard so applying a remote change doesn't re-push:

| Path | Before | After |
|---|---|---|
| **bujocloud** (passphrase cloud) | unguarded LWW push every change | ✅ pull-first, adopt-if-newer, echo-guard (`App.tsx`) |
| **folder** (own cloud folder) | unconditional overwrite | ✅ same guard via `loadFromFolder` (`App.tsx`) |
| **Supabase** (account) | already guarded (`resolveIncoming` + `lastSync` + realtime) | unchanged |
| gist / gdrive | user-initiated (manual button), not auto-push | lower risk; unchanged |

No prompt spam: the guard compares timestamps rather than calling the prompting `resolveIncoming` on every debounced push.

## HTTP security headers — cloud + non-cloud

Both targets now send the same hardened set:

| Header | Value |
|---|---|
| Content-Security-Policy | `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`, `upgrade-insecure-requests`, **`script-src 'self'`** (no unsafe-inline/eval), scoped `connect-src` allowlist (Vercel) / `'self' https:` (self-host) |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains` (+`preload` on Vercel) |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | camera/mic/payment/usb/topics **off**, geolocation `self` |
| Cross-Origin-Opener-Policy | `same-origin` |
| Cross-Origin-Resource-Policy | `same-origin` |
| X-Permitted-Cross-Domain-Policies | `none` |

- **Cloud:** `vercel.json` headers block.
- **Non-cloud:** `docker/security-headers.conf`, **included into every nginx `location`** — fixed a real bug where nginx `add_header` in the cache-control locations (`/index.html`, `/sw.js`, `/assets/`) **cancelled** the server-level security headers (add_header does not inherit when a location declares its own). **Verified:** all headers now present on `/` and deep routes.

## Residual notes
- `style-src 'unsafe-inline'` remains (the app uses inline `style={{}}`); the high-value `script-src` has **no** unsafe-inline/eval. Removing style unsafe-inline would need nonces/hashes — deferred.
- Self-host `connect-src 'self' https:` is permissive so a user's own PostgREST API works; tighten to the specific API origin in production.
- E2E (passphrase/account) stores ciphertext, so even a leaked sync target exposes only encrypted blobs.
