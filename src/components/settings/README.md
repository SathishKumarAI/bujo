# Settings

`views/Settings.tsx` is the tab shell — four `TabsTrigger`s and four one-line
panels. Everything else is here, one file per thing.

| Change | File |
|---|---|
| A tab's name, order, or icon | `../../views/Settings.tsx` |
| Gender, wellbeing gates, units, week start, daily reminder | `ProfileTab.tsx` |
| Theme, accent, text size, paper, Today cards, reset | `AppearanceTab.tsx` |
| Weather, food lookup | `ConnectionsCard.tsx` |
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

**A tab is not free, and neither rendering gate can see that.** Both walk the
rendered DOM and a tab shell holds one panel at a time, so every space number
ever quoted for this view is the Profile tab — and axe has never scanned any
other panel (COD-232). Driven per tab with a throwaway probe, Settings was 2.7
screens of content over five tabs, three of them under half a screen: 378px,
467px and 504px of content in a 743px desktop viewport. `RemindersTab` is gone — its daily reminder is a Profile card, its
weather and food-lookup switches are `ConnectionsCard` on the Sync tab beside
the local model, which is where "what does this app talk to" was always
answered for cloud sync, self-host and Drive. Adding a fifth tab back needs a
per-tab measurement saying the content fills one.

**`download` is not in `shared.tsx`.** react-refresh only works on a file
whose exports are all components; a fourth non-component export there costs
hot reload on every card in this directory. eslint enforces it.
