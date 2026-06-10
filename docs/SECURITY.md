# Security & Privacy

`bujo` is **local-first** and has **no backend, no accounts, and no analytics**.
This document states the threat model, what data exists, and the guarantees.

## Data inventory

| Data | Where it lives | Sensitivity |
|---|---|---|
| All journal content (entries, metrics, gratitude, memories, workouts, cycle, nofap, settings) | `localStorage` key `bujo:data` (this browser only) | High — personal |
| Uploaded photos | inside the same `bujo:data` blob as downscaled JPEG data-URLs | High |
| "Notified today" flag | `localStorage` key `bujo:notified:<date>` | None |

Nothing is transmitted to any server owned by this project — there is no server.

## Threat model

| Threat | Exposure | Mitigation |
|---|---|---|
| Network interception | None — app is static; no API calls except opt-in weather | Weather/geocode are opt-in and off by default; everything else is offline |
| Server breach | N/A — no server, no database | Local-first architecture |
| Shared/again-used device | Another user of the same OS account + browser profile can open the app and read everything | Planned: passcode + client-side encryption (v2). Today: use an OS user account / private profile for privacy |
| XSS injecting a script that reads `localStorage` | Low — no `dangerouslySetInnerHTML`, no `eval`, all rendering via React text nodes | Keep dependencies patched; never render untrusted HTML |
| Malicious import file | A crafted JSON/ICS could inject odd data, not code | `migrate()` merges onto a clean default; ICS/JSON are parsed as data, never executed |
| Browser clears storage | Data loss (not disclosure) | One-click JSON/Markdown export + backup nudge |

## Third-party network calls (all opt-in, off by default)

Enabled only when the user turns on **Auto-log weather & location** in Settings:

| Endpoint | Purpose | Data sent |
|---|---|---|
| `api.open-meteo.com` | Current weather | latitude/longitude only |
| `api.bigdatacloud.net` reverse-geocode | City label for the month | latitude/longitude only |
| `fonts.googleapis.com` / `fonts.gstatic.com` | Web fonts | standard font request (no journal data) |

No journal content is ever sent. Geolocation requires explicit browser permission.

## Secure-coding practices

- No `eval`, `Function`, or `dangerouslySetInnerHTML`.
- No secrets in the repo (there are none to keep — no backend).
- Images are re-encoded through a `<canvas>` (strips original EXIF/GPS metadata).
- Dependencies are minimal and pinned in `package.json`; run `npm audit` in CI.

## Roadmap (v2)

- **Passcode lock** on app open.
- **Client-side encryption** of the `bujo:data` blob with a key derived from a
  passphrase (Web Crypto, AES-GCM) — so even cloud sync (if added) stores only
  ciphertext. See `docs/prompts/02-add-login-and-sync.md`.

## Reporting

Found an issue? Open a GitHub issue (no sensitive data) or email the maintainer.
