# `lib/voice`

Talk to the journal: say what you did, see what it heard, agree, and it is
saved. The design notes live in `docs/voice/`; this is the map.

| Change | File |
|---|---|
| What a spoken sentence means — matchers, the follow-up question | `intent.ts` |
| The assistant speaking back | `speak.ts` |
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

## The LLM seam, unbuilt on purpose

`understand()` ends in a lossless fallback: what it cannot parse becomes a note.
That fallback is where a model plugs in — it would take the same transcript and
return the same `ImportRecord[]`, competing with nothing and replacing nothing:

```ts
// sketch, not shipped
const records = await askLocalModel(transcript, { schema: IMPORT_RECORD_SCHEMA })
// …then the identical validate → plan → confirm path.
```

Two things make that safe rather than exciting: the model's output is untrusted
input like any other file, and it still cannot write — it proposes. Keep it that
way. The model choice, and whether it is worth the download at all, is
`docs/voice/landscape.md`'s question.

**When you build it, make every field of that schema nullable.** This was
measured on this machine, not inferred: the same model and the same sentence,
with only the schema changed. "log oatmeal and eggs for breakfast" under an
all-**required** schema came back `games: 2, score: 1, kcal: 250, protein: 18`
— four fabricated numbers, every one of them plausible, none of them said. The
identical prompt under an all-**nullable** schema returned `null` everywhere.
A required field is an instruction to produce a value, and a model that has no
value will invent one rather than fail; the journal then holds a calorie count
nobody ate. Nullable everywhere, and drop to the note fallback — a note is
never wrong.
