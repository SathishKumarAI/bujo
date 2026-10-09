# Settings

`views/Settings.tsx` is the tab shell — four `TabsTrigger`s and four one-line
panels. Everything else is here, one file per thing.

**This is the only destination for account and sync (COD-297).** There used to
be a `views/Account.tsx` as well, and between them they answered "who am I and
does my journal leave" twice: `CloudSyncCard` rendered on both, the local
profile was editable on both under two different nouns ("You" here, "Profile"
there), and sign-out was on one page while the passcode was on the other. The
page is retired; `?view=account` is a 301 in `lib/deepLink.ts`.

**`?view=settings&tab=<id>` opens a tab.** Read-only — clicking a tab does not
write it back, because `DeepLinkSync` already owns the query string. It exists
so a tab is linkable and, more importantly, so a gate can *reach* one: see the
tab-shell rule below.

| Change | File |
|---|---|
| A tab's name, order, or icon | `../../views/Settings.tsx` |
| Google sign-in/out, local name, gender, gates, reminder, units | `AccountTab.tsx` |
| The four sync facts in zone 1 of the Sync tab | `SyncStatusBar.tsx` |
| Theme, accent, text size, paper, Today cards, reset | `AppearanceTab.tsx` |
| Weather, food lookup | `ConnectionsCard.tsx` |
| The local model (Ollama) | `VoiceModelCard.tsx` |
| Cloud sync, the protection cards, advanced/self-host fold | `SyncTab.tsx` |
| Passcode / encryption at rest | `PasscodeCard.tsx` |
| PostgREST self-host fields | `SelfHostCard.tsx` |
| The record counts, coverage, storage bar | `YourDataCard.tsx` |
| Any export or import — JSON, Markdown, CSV, `.ics`, checksum | `BackupCard.tsx` |
| Importing an Apple Health `export.zip` | `AppleHealthCard.tsx` |
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

**A tab is not free, and only one rendering gate can see past the first one
now.** `npm run a11y` visits `?view=settings&tab=feel|sync|data` directly, so
the passcode form, the cloud passphrase, every export button and the
erase-everything dialog are scanned at every theme and viewport for the first
time. `npm run space` still grades only the tab it opens on — COD-232 stays open
for that half, and any space number quoted for this view is the Account tab.

The original note, kept because its measurements are still the reason the tab
count is four:

**A tab is not free, and neither rendering gate could see that.** Both walk the
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
