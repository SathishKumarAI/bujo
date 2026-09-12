# `lib/voice`

Talk to the journal: say what you did, see what it heard, agree, and it is
saved. The design notes live in `docs/voice/`; this is the map.

| Change | File |
|---|---|
| What a spoken sentence means — matchers, the follow-up question | `intent.ts` |
| The assistant speaking back | `speak.ts` |
| The local model fallback, and the localhost rule | `model.ts` |
| Both | `intent.test.ts` |
| Dictation itself (Web Speech API) | `../speech.ts` |
| The dialog you talk to | `../../components/VoiceAgent.tsx` |
| Where the records go | `../ingest/` |

```
speech.ts  →  transcript
intent.ts  →  ImportRecord[] + a sentence to say back  (+ maybe one question)
ingest/    →  validate → plan → one replaceAll, one undo step
```

Rules, each of which is load-bearing:

- **The microphone gets no write path of its own.** Voice emits the same
  `ImportRecord[]` an Apple Health file produces, so a mis-heard number is
  refused by the same validator that refuses a malformed file — by range, not
  by clamping. `mood 77` is rejected with the reason on screen; it never
  becomes a plausible 10.
- **Nothing is saved until it is on screen and agreed to.** An assistant that
  writes while you speak demos well and is the wrong shape for a journal.
- **It asks rather than guesses, but only where the schema forces it.** "I
  played two games" has no win/loss split and `PickleballSession` has no
  "games played", so filing it silently would record two losses. One question,
  skippable.
- **Nothing is ever dropped.** A sentence nothing recognises is kept verbatim
  as a note on the day.
- **No audio leaves the device.** `speech.ts` is the browser's own recogniser
  and `speak.ts` is `speechSynthesis`; neither this app nor these files make a
  network request. Chrome's implementation is a platform question, answered in
  `docs/voice/landscape.md`.
- **Deterministic first.** Every matcher here is a regex over words, so it works
  offline, costs nothing, and gives the same answer twice. An LLM is a
  *fallback* for sentences the grammar misses — see the seam below.

## The local model, and what keeps it honest

Built, off by default, and a **fallback rather than a path**: it is asked only
when the grammar has fallen through to "keep it as a note", so a sentence the
app already understands never waits for a model, and switching it off removes a
capability instead of breaking the feature. Settings → Reminders → Local model.

```
understand()  → note fallback?  → askModel()  → validateRecords() → the same preview
```

| Rule | Why |
|---|---|
| **Localhost only**, refused not warned | A URL field in an app holding health data is an exfiltration primitive. One paste and every sentence goes to someone else's server |
| **Every schema field nullable** | Measured: with required fields, "log oatmeal and eggs for breakfast" came back `games: 2, score: 1, kcal: 250, protein: 18`. Nullable: null everywhere |
| **Enums, not descriptions** | `activity` was a free string listing the keys in its `description`. "three rounds of kettlebell swings" came back as `activity: "kettlebell swings"`, was rejected, and the refusal looked like the model never ran. Constrained, the same sentence returns `strength` |
| **Output is untrusted input** | It goes through `validateRecords` like a file off disk. A fabricated `mood: 99` is rejected by range, not clamped |
| **Marked as a guess in the UI** | `llama3.1:8b` read "I played two games and scored 68" as `gamesWon: 2` — "played" as "won". Worth showing, not worth trusting silently |
| **`"null"` is not null** | The same model answers the four-character string under this schema. Every value is normalised before it is believed |

Measured on this machine (RTX 5070 Ti, `llama3.1:8b`): **637ms** warm for one
sentence, ~5s on the first call while the model loads. The timeout is 20s and
every failure — no server, slow, prose instead of JSON, an answer the validator
refuses — lands on the same note the grammar would have kept, and says why.

Whether a model *specific to this app* is worth building is a separate question,
answered in `docs/voice/purpose-built-model.md`.
