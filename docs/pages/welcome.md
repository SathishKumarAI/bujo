# Welcome

`src/views/Welcome.tsx` + `src/components/Onboarding.tsx` · first run

## What this page is

The first thing anyone sees. A storage choice — account, your own cloud folder,
or this device only — plus a demo route, and then a four-step onboarding tour.

This is the whole first impression, so it carries more weight per pixel than any
other page in the product.

## What is on it (from the a11y tree, fresh profile)

> bujo ✦
> A private bullet journal. Sign in to sync across your devices, or keep
> everything on this one.
>
> **Sync with an account** — "Sign in with email" · *Signing in creates your
> journal and keeps it in sync across devices.*
> **Use my own cloud** — Point bujo at a folder inside your Drive / Dropbox /
> OneDrive sync folder … *No account, no sign-in · Works with any cloud you
> already use · Your files, your control* · **Choose folder**
> **This device only** — Keep everything in this browser … *Fastest, fully
> offline · Export backups anytime* · **Continue on this device →**
>
> Just looking? **Explore with sample data** · see every feature, no account …
> **Explore the demo →**
>
> Learn as you go: press ⌘K to jump anywhere, tap the ? on any page, or open
> Help.
> Changed your mind? Reset or wipe the sample anytime in Settings → Data & Cloud.
> No tracking. Your data stays yours.

## The finding that matters

**P1 · Option one does not work in this build.** "Sync with an account · Sign in
with email" is the first and most prominent choice, and the Account page says
"Accounts aren't configured" because the backend is gone (`TASKS.md` B1). The
first decision a new user is asked to make is between two working options and
one dead one — and the dead one is listed first.

**P1 · Four decisions before a single line is written.** Account, cloud folder,
device only, or demo — each with a description and a sub-list of benefits — is a
lot of reading to reach a journal. The bullet journal method's whole pitch is
"open it and write". "This device only" plus a quiet "change this later in
Settings" would get someone writing in one click, which the page already tells
them is possible: *"You can connect a cloud folder later in Settings."*

## UX / IA

**P2 · "Explore with sample data" is not a button.** The two words that most
people actually want are plain text; the button is further down and reads
"Explore the demo →". Two phrasings for one action, only the second clickable.

**P3 · Three storage options presented as equals** when they serve very
different users. "Use my own cloud" — pointing the app at a Drive folder — is a
power-user route sitting in the middle of the funnel with the longest
description of the three.

## UI

**P2 · Every option is the same size.** Three cards of equal weight, each with a
title, a paragraph and a bullet list. Nothing recommends a default, so the user
must actually read all three.

**P3 · The tour that follows is well made** — "Capture in Today", one card, dot
pagination, "Show me" / "Next →", and a "Private & local-first. Your data is
yours." footer. Its problem is timing: it arrives after the four-way decision,
when attention is already spent.

## Copy

**"A private bullet journal. Sign in to sync across your devices, or keep
everything on this one."** — one sentence, states what it is and the only
decision that matters.

**"No account, no sign-in · Works with any cloud you already use · Your files,
your control"** — three-beat benefit lists done properly.

**"Learn as you go: press ⌘K to jump anywhere, tap the ? on any page, or open
Help."** — teaches three affordances in one line and sets the expectation that
you do not need to learn the app up front. Best line on the page.

## Upgrades, ranked

1. **P1 · Hide or demote the account option** while no backend is configured.
   Never lead with the one path that cannot complete.
2. **P1 · Offer a one-click start.** Recommend "This device only", make the
   others secondary, and lean on the existing "you can change this later".
3. **P2 · Make "Explore with sample data" the button** it looks like.
4. **P2 · Recommend a default visually** rather than presenting three equals.
5. **P3 · Move the tour's first card earlier** — teach capture before storage.

## Leave alone

- **The one-sentence positioning line.**
- **"No tracking. Your data stays yours."**
- **The reassurance that the choice is reversible** — it is the thing that makes
  a one-click default safe.
- **The tour itself.** Short, specific, dismissible.
