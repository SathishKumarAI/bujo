# `collections/` — the Collections page's bands

One band per file, composed by `views/Collections.tsx`. Entry rendering is
`components/EntryRow.tsx`, shared with the journal — an entry must not look like
a different object depending on which page found it.

| Change | File |
|---|---|
| The table of contents and its jump links | `IndexBand.tsx` |
| Dateless-item triage | `InboxBand.tsx` |
| Create / open / delete a collection, add to one | `CustomCollections.tsx` |
| Future-dated entries, ▲ memories | `FutureAndMemories.tsx` |
| Tag pages and the open tag's entries | `TagPages.tsx` |
| Friends and birthdays | `People.tsx` |
| Which collection and which tag are open, jump scrolling | `views/Collections.tsx` |

## Decisions worth keeping

- **Two `QuietSection` folds are gone** (People, Auto-pages). A fold hides
  content from `npm run a11y` as well as from the reader.
- **`People.tsx` absorbed `components/FriendsCard.tsx`**, which had one call
  site and existed only because the page was made of cards. Friends and
  birthdays are two cells of one band because they are one subject; the
  dedupe rule (friend record wins over a manual birthday for the same
  person+date) lives there, next to the list it protects.
- **The Index band renders even when empty.** Hiding it until something existed
  meant a new journal never learned that collections or tags were a thing.
- **The tag row scrolls, never wraps** — same rule as Mindset's filters.
