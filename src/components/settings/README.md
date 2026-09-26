# Settings

`views/Settings.tsx` is the tab shell — five `TabsTrigger`s and five one-line
panels. Everything else is here, one file per thing.

| Change | File |
|---|---|
| A tab's name, order, or icon | `../../views/Settings.tsx` |
| Gender, wellbeing gates, units, week start | `ProfileTab.tsx` |
| Theme, accent, text size, paper, Today cards, reset | `AppearanceTab.tsx` |
| Reminder time, weather, food lookup | `RemindersTab.tsx` |
| The local model (Ollama) | `VoiceModelCard.tsx` |
| Cloud sync, advanced/self-host fold | `SyncTab.tsx` |
| Passcode / encryption at rest | `PasscodeCard.tsx` |
| PostgREST self-host fields | `SelfHostCard.tsx` |
| The record counts, coverage, storage bar | `YourDataCard.tsx` |
| Any export or import — JSON, Markdown, CSV, `.ics`, checksum | `BackupCard.tsx` |
| Demo data, erase, back to start screen | `DemoResetCard.tsx` |
| `Row`, `Toggle`, `Disclosure` | `shared.tsx` |
| Handing the browser a file | `download.ts` |

## Rules this layout is holding up

**Every number about "how much data is there" comes from `dataSummary()` in
`lib/csv.ts`.** It used to come from two places: `YourDataCard`'s ancestor
counted four domains inline while a second card at the far end of the same tab
counted ten from `dataSummary`. Four repeated verbatim, and the fifth —
**Habits** — did not, because the tile filtered `!archived` and the pill did
not. Adding a count to this card means adding it to `dataSummary`, not to the
JSX.

**Every calendar export lives in `BackupCard`'s one `.ics` fold.** The
events-and-birthdays file used to be a hero button while its three siblings
were folded below it, so "does this export to my calendar" had two answers.

**`download` is not in `shared.tsx`.** react-refresh only works on a file
whose exports are all components; a fourth non-component export there costs
hot reload on every card in this directory. eslint enforces it.
