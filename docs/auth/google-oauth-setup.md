# Enable Google sign-in (Supabase + Google Cloud)

The app code is ready (`signInGoogle()` in `src/lib/supabase.ts`); Google OAuth just needs to be turned on in two dashboards. ~10 minutes, copy-paste.

**Project values (bujo):**
| key | value |
|---|---|
| Supabase project ref | `ueahhgqxshfvkjgcwtnh` |
| Supabase OAuth callback | `https://ueahhgqxshfvkjgcwtnh.supabase.co/auth/v1/callback` |
| Production app URL | `https://bujo-journal.vercel.app` |
| Local dev URL | `http://localhost:5173` |

The app calls `signInWithOAuth({ provider: 'google', redirectTo: window.location.origin })`, so Google → Supabase callback → back to whatever origin launched it. Both origins must be allow-listed below.

---

## 1. Google Cloud — create the OAuth client

1. <https://console.cloud.google.com> → create or pick a project (e.g. `bujo`).
2. **APIs & Services → OAuth consent screen**
   - User type: **External** → Create.
   - App name `Bujo`, user support email = your email, developer contact = your email.
   - Scopes: add `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid` (defaults are fine).
   - While the app is in **Testing**, add your Google account under **Test users** (only listed users can sign in until you Publish).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**, name `bujo-web`.
   - **Authorized JavaScript origins** (add both):
     - `https://bujo-journal.vercel.app`
     - `http://localhost:5173`
   - **Authorized redirect URIs** (add exactly one — the Supabase callback):
     - `https://ueahhgqxshfvkjgcwtnh.supabase.co/auth/v1/callback`
   - Create → copy the **Client ID** and **Client secret**.

## 2. Supabase — turn on the provider

1. <https://supabase.com/dashboard/project/ueahhgqxshfvkjgcwtnh> → **Authentication → Providers → Google**.
2. Toggle **Enable**, paste the **Client ID** and **Client secret** from step 1, **Save**.

## 3. Supabase — URL configuration

**Authentication → URL Configuration:**
- **Site URL:** `https://bujo-journal.vercel.app`
- **Redirect URLs** (Add URL, both):
  - `https://bujo-journal.vercel.app/**`
  - `http://localhost:5173/**`

(The `redirectTo` the app sends must match an entry here, or Supabase rejects the round-trip.)

## 4. Verify

1. Open <https://bujo-journal.vercel.app>, click **Continue with Google**.
2. Expect the Google account picker → consent → land back signed in.
3. Re-check the provider went live (anon key is public in the bundle):
   ```
   curl -s https://ueahhgqxshfvkjgcwtnh.supabase.co/auth/v1/settings -H "apikey: <anon-key>" | grep -o '"google":[a-z]*'
   ```
   Want `"google":true`.

## Gotchas

- **`redirect_uri_mismatch`** → the redirect URI in Google must be *exactly* the Supabase callback (no trailing slash, https).
- **Stuck on Google "unverified app" / access blocked** → you're in Testing and not on the Test-users list, or you need to **Publish** the consent screen for public use.
- **Returns to app but not signed in** → the launching origin isn't in Supabase **Redirect URLs**.
- Publishing the consent screen for sensitive scopes can require Google verification; the `email`/`profile`/`openid` scopes used here are non-sensitive and don't.
