# Google Drive sync — setup

`bujo` is local-first. Google Drive sync is **optional and opt-in**: it stores
your journal as a single file in Drive's hidden **appDataFolder**, and lets you
reference images/docs from your Drive. Nothing is sent to Google until you paste
a Client ID and connect.

## What you need

A **Google OAuth 2.0 Client ID (Web application)**. Create it once:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create or
   pick a project.
2. **APIs & Services → Library** → enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen** → External → add yourself as a
   **Test user** (so it works without verification). Add the scopes
   `.../auth/drive.appdata` and `.../auth/drive.file`.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** →
   **Web application**.
5. Under **Authorized JavaScript origins**, add where you run the app, e.g.
   `http://localhost:5173`, `http://localhost:5175`, and your deployed origin.
6. Copy the **Client ID** (looks like `…apps.googleusercontent.com`).

## Use it

1. In the app: **Settings → Cloud sync — Google Drive** → paste the Client ID.
2. Click **Connect Google Drive** → consent once.
3. **Back up to Drive** / **Restore from Drive** to sync this device.
4. **Search Drive** to reference your images/docs (opens them in Drive).

## How it works

- Scopes: `drive.appdata` (private app file) + `drive.file` (files you pick).
- The journal is stored as `bujo.json` in the appDataFolder — invisible in your
  normal Drive, only this app can read it.
- Access tokens are short-lived and held in memory only (never persisted).
- Implementation: `src/lib/gdrive.ts` (GIS token client + Drive REST),
  `src/components/DriveSync.tsx` (UI).

## Notes & limits

- This is **manual sync** (back up / restore), not real-time. For automatic,
  conflict-aware sync see `docs/prompts/02-add-login-and-sync.md`.
- Without a verified consent screen, only **Test users** you add can connect.
- The data is **not** end-to-end encrypted in this version — Drive stores plain
  JSON. Encrypt-before-upload is a planned enhancement (see prompt 02).
