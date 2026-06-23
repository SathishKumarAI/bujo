# UML — bujo

Mermaid diagrams. GitHub renders these inline.

## 1. Component / container diagram

How the pieces fit. The browser holds everything; the server is optional.

```mermaid
flowchart TB
  subgraph Browser["Browser (the whole app)"]
    UI["React 19 SPA<br/>App.tsx → views/*"]
    Store["JournalProvider<br/>(useReducer + undo/redo)"]
    LS[("localStorage<br/>bujo:data / bujo:enc")]
    Crypto["crypto.ts<br/>(AES-GCM at rest)"]
    UI <--> Store
    Store <--> LS
    Store <--> Crypto
  end

  subgraph Optional["Optional, opt-in sync backends"]
    SB["Supabase<br/>auth + journals table (RLS)"]
    Folder["File System Access API<br/>(your Drive/Dropbox folder)"]
    Gist["GitHub Gist"]
    Self["Self-host PostgREST"]
    Blob["Vercel Blob<br/>(api/sync, E2E ciphertext)"]
  end

  Store -. "pull/push (debounced)" .-> SB
  Store -. "save/load" .-> Folder
  Store -. "ciphertext only" .-> Blob
  Store -. "JSON" .-> Gist
  Store -. "JWT" .-> Self

  UI -. "feedback text" .-> FB["api/feedback → Blob"]
```

## 2. Class / data-model diagram

The single persisted root object and its main collections (`src/lib/types.ts`).

```mermaid
classDiagram
  class JournalData {
    +number version
    +string updatedAt
    +Entry[] entries
    +Habit[] habits
    +Record habitLog
    +DailyMetric[] metrics
    +Workout[] workouts
    +PickleballSession[] pickleball
    +PickleballEvent[] pickleballEvents
    +Book[] books
    +ReadLink[] readLinks
    +DevSession[] devSessions
    +Challenge[] challenges
    +Streak nofap
    +Settings settings
  }
  class Entry { +id +date +type +text +status +tags }
  class Habit { +id +name +category +type +timeOfDay +cue +weeklyGoal }
  class DailyMetric { +date +mood +stress +sleep +energy +calories }
  class Workout { +id +date +activity +setRows +durationMin }
  class Book { +id +title +status +currentPage +rating +learnings }
  class PickleballEvent { +id +name +kind +format +placement }
  class Settings { +theme +storageMode +readingGoalBooks +trackerLayout }

  JournalData "1" *-- "many" Entry
  JournalData "1" *-- "many" Habit
  JournalData "1" *-- "many" DailyMetric
  JournalData "1" *-- "many" Workout
  JournalData "1" *-- "many" Book
  JournalData "1" *-- "many" PickleballEvent
  JournalData "1" *-- "1" Settings
```

## 3. State-mutation sequence (a user edit)

Every write goes through the reducer; persistence + sync are effects.

```mermaid
sequenceDiagram
  actor U as User
  participant V as View (e.g. Trackers)
  participant S as Store (reducer)
  participant L as localStorage
  participant SB as Supabase

  U->>V: tap habit cell
  V->>S: toggleHabit(date, id)
  S->>S: patch() → new JournalData (stamps updatedAt)
  S->>S: commit() into history (undo/redo)
  S-->>V: re-render with new state
  S->>L: save(data) (or encrypt → bujo:enc)
  Note over S,SB: debounced 4s effect
  S->>SB: pullJournal() (guard: adopt if remote newer)
  S->>SB: pushJournal(data) if local is newer
```

## 4. Auth + gate sequence

```mermaid
sequenceDiagram
  actor U as User
  participant A as App.tsx
  participant Acc as Account view
  participant SB as Supabase Auth

  U->>A: open ?view=account (signed out)
  A->>A: onAuthChange → hasSession=false
  A->>Acc: render FULL-SCREEN (no shell, gated)
  U->>Acc: email+password (validated client-side)
  Acc->>SB: signInWithPassword
  SB-->>Acc: session
  Acc->>A: nav('today')
  A->>A: onAuthChange → hasSession=true → lift gate, show shell
```

## 5. Deploy pipeline

```mermaid
flowchart LR
  Dev["scripts/ship.sh -m '...'"] --> V["tsc + eslint(soft) + vitest"]
  V --> G["git commit + push"]
  G --> B["vercel build --prod<br/>(re-inject Supabase env)"]
  B --> D["vercel deploy --prebuilt --prod"]
  D --> AL["vercel alias → bujo-journal.vercel.app"]
  PR["PR / branch push"] --> CI[".github/workflows/ci.yml<br/>tsc+tests+build"]
```
