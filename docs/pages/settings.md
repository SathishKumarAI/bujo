# Settings

`src/views/Settings.tsx` · top bar → gear · `?view=settings`

## What this page is

Five tabs: Profile (units, opt-in trackers), Appearance (theme, text size, paper
feel), Reminders, Sync & privacy, Data (storage meter, export/import, passcode).

## Measured (1440×900, demo data)

| Tab | Panel height |
|---|---|
| Profile | 337px |
| Appearance | 960px |
| Reminders | **212px** |
| Sync & privacy | 590px |
| Data | 858px |

- Page column is **1,078px**; the panel is **672px**. ~400px of the wide tier is
  unused on every tab.

## Already fixed on this branch

Settings used to render a second `<h1>` reading "Settings" 110px below the top
bar's, and its five tab pills were stretched to a uniform 209px each by
`TabsTrigger`'s `flex-1`. Both are fixed (PR #87); the pills are now 96–151px,
sized to their text. See `docs/redesign/11-pages-ui-polish.md`.

## UX / IA

**P2 · The Reminders tab holds two switches.** 212px, two rows: "Daily
journaling reminder" and "Auto-log weather & location". It is a fifth of the
next-smallest tab. Folding it into Profile or Sync & privacy would remove a tab
from the bar without losing anything.

**P2 · "Appearance" is really two tabs.** Theme + text size (a rendering
preference) and paper feel — open-book frame, dot-grid texture, handwriting font,
daily reflection prompts — which are *product* choices about what the journal
is. 960px in one panel.

**P3 · Tab widths vary 4.5× but the container does not.** Reminders leaves
~750px of empty card below it; Appearance needs a scroll. Same shell, wildly
different fills.

## UI

**P1 · ~400px of the column is empty on every tab.** The page uses the `wide`
tier (1,078px) while every panel is capped at `max-w-2xl` (672px). Either narrow
the page to the `read` tier, or let the wide tabs (Appearance, Data) use the
space they have — Appearance's theme picker in particular would suit two
columns.

**P3 · The storage meter is the best UI on the page.** `67 Entries · 8 Habits ·
15 Workouts · 13 Memories · 0 Photos · 51 KB stored`, then "1% of ~5 MB". Six
counts and a capacity bar — concrete, honest, no jargon.

## Copy

**Strongest writing in the app for a settings screen.** Three lines do real work:

> *"Your journal is encrypted in this browser before it is uploaded, so the
> server only ever stores ciphertext. Enter the same passphrase on another
> device to get your data back. There are no accounts, and a lost passphrase
> cannot be recovered."*

> *"Uses open-meteo and your browser location. When off, the app makes no
> network calls."*

> *"You haven't backed up yet. Browsers can clear local storage · export a
> copy."*

Each names the mechanism, the trade-off and the consequence, without hedging.
The second is a privacy claim precise enough to verify. Keep all three verbatim.

**P3 · "Scales all text & controls across every screen. Charts and figures keep
their natural size."** — accurate and useful, and the second sentence answers
the question the first one raises. Model for the rest of the app.

**P3 · Theme names carry their own descriptors** (`Mocha · Dark · default`,
`Dawn · Light · warm`). Good; a swatch alone would be worse.

## Upgrades, ranked

1. **P1 · Fix the width mismatch** — narrow the page or widen the panels.
2. **P2 · Split Appearance** into *Theme & text* and *Journal feel*, or fold
   Reminders away so the bar keeps five.
3. **P2 · Two-column theme picker** at wide widths.
4. **P3 · Promote the storage meter** — a "your data lives here, and here is how
   much of it there is" panel is a trust asset, not a footnote.

## Leave alone

- **All three privacy/backup paragraphs.** Verbatim.
- **The storage meter.**
- **Text size as a global rem-scale setting**, with charts exempted.
- **Five named tabs rather than one long scroll.**
