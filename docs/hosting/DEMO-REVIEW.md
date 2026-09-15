# The shared demo — what to look at, and what is deliberately missing

For someone opening the link for the first time with an hour and an opinion.
Written to be pasted into a message, not read as reference.

**Demo:** <https://bujo-journal.vercel.app>
**Name:** Cadence Journal. The URL still says `bujo` — that was the name until
2026-09-15, and the host name is not worth breaking links over.

---

## Sixty seconds

1. Open the link, pick **"This device only"**. No account, nothing to sign up
   for; the journal lives in your browser and never leaves it.
2. Append **`?demo=1`** to the URL for a month of sample data, or start empty if
   you would rather see the real first-run.
3. Press **Quick add** (top right) and type `bench 80x5`.

That third step is the thing to review. It should take you to **Strength**, show
a bar under the header reading *Saved to Strength · Bench Press 80lb ×5* with an
**Undo**, and ring the row it wrote.

## The four things worth an opinion

| Try | What should happen | The question |
|---|---|---|
| `bench 80x5` | Lands on Strength. Receipt names it. **No row rings** — Strength has no per-workout list. | Is a receipt without a ring enough here, or does Strength need a session list? |
| `called mum` | Lands on Today, rings that line | Is six seconds the right amount of ring? |
| `mood 7` | Lands on Tracking, scrolls to the trend chart, marks **one** dot on the mood line | Does marking a point on a chart read as "this is your new reading"? |
| `water 6` | Lands on Tracking, rings **two** things — the Today chip and the month-grid cell | Two marks for one capture: helpful, or noisy? |

Then press the **microphone** next to Quick add and say one of those out loud.
It is the same pipeline — speech is just another way in. Firefox has no Web
Speech API at all, so the microphone is hidden there and typing is the path.

## What it is for

A private journal that keeps your rhythm: rapid logging, habits, mood, training,
sleep. The bet is that **capture has to be one sentence and the app has to show
you what it did with it** — not a form, not a silent toast in a corner.

## Known gaps, so nobody spends their review finding them

- **Strength cannot ring anything.** It is a session builder, charts and PRs —
  there is no per-workout row to point at. Known, listed in `STATUS.md`.
- **Three alternative Tracking layouts** (cards, activity, wheel — the icons in
  the Tracking toolbar) draw their own habit cells and are not wired to the
  ring.
- **Undo does not take you back.** It removes the record and clears the bar, and
  leaves you on the page you were sent to.
- **The command palette** (`⌘K`) does not route through the receipt.
- The **account** page needs a Supabase backend that the demo has no route to.
  Everything else works with no server at all.

## Giving feedback

The **speech-bubble icon** in the header posts straight to the repo's feedback
endpoint — no account, no email. Anything longer is better as a GitHub issue:
<https://github.com/SathishKumarAI/bujo/issues>.

## Deploying an updated demo

See `docs/hosting/vercel.mdx`. The one thing that catches people: **the alias
does not follow a new production deploy**, so a successful deploy can leave
`bujo-journal.vercel.app` pointing at the old build — which is exactly what
happened before this document existed. Check the title of the live page before
telling anyone it is updated.
