# Account

`src/views/Account.tsx` · top bar → account menu · `?view=account`

## What this page is

Sign in, sign up, explore as a guest, sign out, manual cloud save. In the
current build there is no backend, so the page is a single honest notice.

## Measured (1440×900, demo data)

- **1.0 screen.** One block, **830px**, whose entire content is:

> bujo ✦
> **Sign in to sync your journal everywhere.**
> **Accounts aren't configured**
> This build has no cloud backend, so the app is fully local. You can still back
> up and sync via a cloud folder, gist, or self-host in Settings → Data & Cloud.
> No tracking. Your data is yours.

## The finding that matters

**P1 · The page promises and denies in consecutive lines.** "Sign in to sync
your journal everywhere." sits directly above "Accounts aren't configured". The
hero line is written for a build where sign-in works; the body is written for
this one. A reader meets the offer and its refusal in the same glance.

When the backend is absent the hero should change too — "This build is fully
local" as the headline, with the cloud-folder route as the action.

**P2 · 830px to deliver four sentences.** Nothing else is on the page, and it
still fills a screen.

## Context worth recording

This is the visible face of `TASKS.md` **B1**: the configured Supabase project
returns NXDOMAIN, so every account feature is dead. Previously that failure was
*silent* — sign-in simply never appeared. The current state is a real
improvement: the app now says what is going on and where to go instead.

## UX / IA

**P2 · The alternative is described but not offered.** "Settings → Data & Cloud"
is a route the user must walk manually; the page has 830px and no button. One
"Open Data & Cloud" action would finish the sentence.

**P3 · Reachable only from the account menu**, which is where a user goes to
*use* an account. Landing on "accounts aren't configured" from a menu labelled
Account is a small dead end.

## Copy

**"No tracking. Your data is yours."** — the app's clearest positioning
statement, and it appears here and on the welcome screen. It should probably
appear in more places, not fewer.

**"This build has no cloud backend, so the app is fully local."** — states the
cause and the consequence in one line. Correct instinct: no apology, no
"something went wrong".

**P3 · "back up and sync via a cloud folder, gist, or self-host"** lists three
routes without ranking them. For most people "a folder in your Drive/Dropbox" is
the answer; the other two are for a narrower audience.

## Upgrades, ranked

1. **P1 · Change the hero when accounts are unavailable** — do not offer sign-in
   above a notice saying sign-in does not exist.
2. **P2 · Add the action** — a button straight to Settings → Data & Cloud.
3. **P2 · Shrink the page** to the size of its content.
4. **P3 · Recommend one backup route** and put the other two behind "other
   options".

## Leave alone

- **Saying it plainly.** A missing backend stated in one sentence beats a
  spinner that never resolves — which is what this used to be.
- **"No tracking. Your data is yours."**
- **Pointing at the local-first alternatives** rather than pretending the
  feature is coming.
