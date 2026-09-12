# Voice → journal: what already exists, and what to use

**Research only.** Nothing in `src/` was changed to write this. Measurements were taken on this
machine on **2026-09-11**; anything not measured is marked *unverified* rather than guessed.

---

## Recommended stack

| Stage | Use | Why | Fallback |
|---|---|---|---|
| Capture | `MicButton` + `useSpeechInput` (**already shipped**), plus `processLocally = true` | 0 new bytes; the toggle already exists | the text field — same parser either way |
| Transcription | Chrome/Edge **on-device Web Speech** (~60 MB pack, browser-managed) | no audio leaves the device, no npm dep, no download in *our* bundle | typed text. Moonshine-tiny (~50 MB) in a Worker **only** behind an explicit opt-in |
| Intent | `lib/voice/intent.ts` → `lib/capture.ts` grammar → `ImportRecord[]` | deterministic, offline, unit-testable, already routes through `validate`→`plan`→confirm | local LLM at `localhost:11434`, opt-in, **never auto-applied** |
| LLM (if enabled) | Ollama `llama3.1:8b` (4.9 GB, already installed) with a **fully nullable** JSON schema | measured correct on all 3 target sentences at 2.4 s warm | drop to the bullet fallback; a bullet is never wrong |
| Food lookup | offline `lib/foods.ts` → grow it from **USDA SR Legacy** (6.7 MB, CC0) → Open Food Facts **v3** by barcode | no key, no cost; OFF has **22,935 Indian products** vs 968k US, so the offline table carries the Indian half | type the macros |
| Barcode | **`zxing-wasm`** (14 KB JS + 931 KB reader wasm, precached) | `BarcodeDetector` **does not exist in any browser on Windows** — see §4 | feature-detect native first where it exists |
| Photo → food | **don't ship it** | §4: 35–42 % calorie MAPE from *frontier* models, and portion from one image is mathematically ill-posed | barcode, or pick from your own food list |

---

## 0. The finding that changes the question: most of this already exists

Read these four files before designing anything. The pipeline is ~70 % built and the remaining
gap is smaller than the research suggests.

| File | What it already does |
|---|---|
| `src/lib/speech.ts` (74 lines) | `useSpeechInput` hook over `SpeechRecognition`/`webkitSpeechRecognition`, `continuous`, graceful no-op where unsupported |
| `src/components/MicButton.tsx` | mic toggle, `aria-pressed`, renders **nothing** where unsupported so callers need no feature check |
| `src/components/CaptureBar.tsx:206` | already wires `MicButton` → appends the transcript into the capture field |
| `src/lib/capture.ts` (312 lines) | **the hand-written grammar layer already exists**, and was built for voice: `normalizeSpoken()` maps number-words → digits, "kilos" → kg, "by" → x. Emits `{kind, confidence}` and the UI shows the target and lets you edit |
| `src/lib/ingest/` (committed, `69adfb7` "the import pipeline, pure and without a caller") | `ImportRecord` union incl. a `PickleballRecord` with `gamesWon`/`pointsFor`, then `validate` → `plan` → confirm. **This is the confirm-before-write step, already built and already tested.** |
| `src/lib/voice/intent.ts` + `components/VoiceAgent.tsx` (**shipped in `d6b8d31` while this was being written**) | `understand(transcript, ctx, today)` → `VoiceIntent { records, say, confidence }`, `CONFIRM_BELOW = 0.6`, `readDate()` for "yesterday". Emits `ImportRecord[]` **and cannot write** |

So the shape is settled: **speech → text → deterministic parse → `ImportRecord[]` → validate → plan →
human confirms → store.** The LLM question is only ever "what fills the gap when the grammar
returns `bullet`", and the answer must plug in at the `ImportRecord[]` seam, not anywhere nearer
the store.

### What the existing parser does with the target sentences — measured

Run through `parseCapture` with a realistic context (2026-09-11, vitest, then deleted):

| Spoken | Result today |
|---|---|
| `mood 7, slept 6 hours` | ✅ `{kind:'metric', mood:7, sleep:6, confidence:0.85}` |
| `mood seven slept six hours` | ✅ same — `normalizeSpoken` handles the word-numbers |
| `bench eighty five by five` | ✅ `{kind:'gym', exercise:'Bench Press', weight:85, reps:5, confidence:0.95}` |
| `ran 5k in 28 minutes` | ✅ `{kind:'cardio', activity:'run', distanceKm:5, durationMin:28}` |
| `walked 30 minutes` | ✅ `{kind:'cardio', activity:'walk', durationMin:30}` |
| `I played two games of pickleball, scored 68` | ❌ falls to `{kind:'bullet', confidence:0.3}` |
| `two games of pickleball` | ❌ `bullet` — `pickleball` is not in `CARDIO_WORDS`, and there is no score field |
| `log oatmeal and eggs for breakfast` | ❌ `bullet` — there is no `food` capture kind at all |

**One of the three target sentences already works end to end.** The other two fail for a reason
that is two regexes and one record kind, not a missing ML runtime. `lib/voice/intent.ts` is adding
exactly `matchPickleball` and `matchFood` — the right fix.

`DailyMetric` already carries `calories`/`protein`/`carbs`/`fat`, so food has a destination.

---

## 1. Speech to text, on-device

### The short version

Chrome 139+ on desktop can do speech recognition **entirely on-device**, and the app already uses
the API that gets you there. That is the whole answer for the browser. Everything below is the
fallback matrix.

### What actually happens to the audio

| Engine | Audio leaves the machine? |
|---|---|
| Chrome/Edge, default `webkitSpeechRecognition` | **Yes.** MDN is explicit: *"On browsers like Chrome, audio is sent to web services for processing."* This is the current default in `speech.ts`. |
| Chrome/Edge 139+, `processLocally = true` | **No** — that is the point of the flag. Ships Windows/macOS/Linux desktop; **not Android, not WebView** initially |
| Safari 14.1+ / iOS 14.5+ (`webkitSpeechRecognition`) | Sends to Apple's recognition service, with a permission prompt. Reports differ on whether an installed language pack lets it stay local — **unverified**; assume it leaves |
| Firefox | Not shipped. Behind `media.webspeech.recognition.enable` since FF22 and never enabled for users. Mozilla's stated 2025 position: it will ship **on-device only** |

**`speech.ts` sets no `processLocally`** — verified by grep across `src/lib/speech.ts` and
`src/lib/voice/` at `d6b8d31`. So on Chrome the shipped microphone takes the **cloud path**, and
nothing on screen says so. This stopped being a design note and became a live bug the moment
`feat(voice)` merged. It is the single highest-value one-line change in this whole document.

The on-device API surface (Chrome 139, milestone target was 135):

```js
await SpeechRecognition.available({ langs: ['en-US'], processLocally: true })
// → 'available' | 'downloadable' | 'downloading' | 'unavailable'
await SpeechRecognition.install({ langs: ['en-US'], processLocally: true })  // → boolean
recognition.processLocally = true
```

Language packs are **~60 MB each**, downloaded and cached by the *browser*, not by us — the
critical distinction versus every option below. There is an open Chromium issue
(`issues.chromium.org/444393111`) about `available({processLocally:true})` on macOS; status
**unverified**, so treat a `false`/throw as "fall back", never as "fail".

### The engines, compared

5-second utterance, laptop CPU. Latency figures marked *unverified* are extrapolated from
minute-scale benchmarks and should be measured before being quoted anywhere.

| Engine | Model size | 5 s utterance, laptop CPU | Accuracy class | Licence | Runs in a tab? |
|---|---|---|---|---|---|
| **Chrome on-device Web Speech** | ~60 MB pack, browser-owned | near-real-time; no model load in our bundle | production dictation | n/a (browser) | ✅ Chrome/Edge 139+ desktop |
| **Chrome cloud Web Speech** | 0 | ~0.3–1 s + network | best of the lot | n/a | ✅ but audio leaves |
| **Moonshine tiny** via transformers.js (`onnx-community/moonshine-tiny-ONNX`) | 27 M params; **~28 MB** quantised (7.9 enc + 20.2 dec); ~120 MB RAM WASM / ~150 MB WebGPU | best browser option — **variable-length audio, no 30 s pad**, which is exactly the 5-second-utterance case. Sub-second plausible, **unverified** | ≤ Whisper-tiny WER at ~5× less compute | **MIT** (code + most models; legacy non-English non-streaming models are non-commercial) | ✅ — but **not** via `@moonshine-ai/moonshine-js`, which was archived 2026-08-15. Go through transformers.js |
| **transformers.js Whisper** (`@huggingface/transformers` v4, `onnx-community/whisper-tiny.en`) | encoder ~10 MB + quantised decoder. **Two reads disagree: 30.7 MB and 110 MB** — so ~41 MB or ~120 MB total. *Measure before quoting either.* `whisper-base` ≈ 77 MB | tiny ≈ 7 s per minute of audio → ~0.6 s for 5 s, plus first-run model fetch and compile. WebGPU 5–10× WASM *when it works* | tiny WER 7.6 % / base 5.0 % (LibriSpeech) | Apache-2.0 (lib), MIT (Whisper weights) | ✅ dedicated Worker — **never a service worker** (§3). Let it auto-detect the device; hardcoded `device:'webgpu'` has hung Firefox for 200 s |
| **whisper.cpp WASM** | tiny.en 75 MB, q5_1 **31 MB**; base.en 142 MB | 2–3× real-time on a modern CPU → **~2 s for a 5 s clip** | same weights as above | MIT | ✅ needs WASM SIMD; **Firefox cannot load a file >256 MB**, so Chrome only past `small` |
| **Vosk (`vosk-browser`)** | `small-en-us-0.15` **40 MB**, ~300 MB RAM | genuinely streaming, low latency | Kaldi-era; clearly worse than Whisper-tiny on natural speech | Apache-2.0 | ⚠️ `vosk-browser@0.0.8`, **last published 2022-12-25 and still 0.0.x**. `Vosklet` is the live successor. Treat as abandonware |
| **whisper.cpp via `@transcribe/*` or `@remotion/whisper-web`** | ggml tiny.en q5_1 31 MB | fastest WASM path | same weights | MIT / **`UNLICENSED`** (Remotion: free ≤3 people) | ⚠️ both **hard-require `SharedArrayBuffer`** → `COOP: same-origin` + `COEP: require-corp` on the whole app. That is a bigger change than the feature |
| **faster-whisper behind localhost** | small int8 ~500 MB on disk | base int8 ≈ 20× real-time on x86 CPU → **~0.25 s for 5 s**, plus HTTP | best CPU accuracy/speed ratio | MIT (lib), CTranslate2 MIT | ❌ not in a tab — needs a Python server. mise-managed Python makes this cheap *for the user*, and impossible *for the PWA* |

WER, same weights for whisper.cpp and faster-whisper (LibriSpeech English): tiny 7.6 %, base 5.0 %,
small 3.4 %, medium 2.9 %, large-v3 2.5 %. **The difference between those tools is runtime, not
accuracy.**

### Where Tauri changes the answer — and where it makes it worse

| Platform | Web Speech in the Tauri webview |
|---|---|
| Windows (WebView2/Chromium) | works |
| macOS (WKWebView) | works, but needs `Info.plist` entries |
| **Linux (webkit2gtk)** | **not supported — no recognition at all.** `MicButton` renders nothing |

So on Linux desktop the Tauri build currently has no voice feature, silently, because `MicButton`
returns `null` when unsupported. That is correct behaviour and an invisible hole.

Tauri's fix is `bundle.externalBin` — ship `whisper.cpp` (or a Moonshine binary) as a sidecar,
invoke it over the Tauri command bridge. It is genuinely the right call **for the desktop build
only**: it adds ~30–140 MB to the installer, not to the PWA, and it makes Linux work. Today
`src-tauri/tauri.conf.json` has `"plugins": {}` and no `externalBin`, and
`capabilities/default.json` grants only `core:default` + `opener:default` — a sidecar needs a
`shell:allow-execute` scoped permission added deliberately.

Note also `"security": { "csp": null }` in that config. A null CSP means the desktop webview would
happily fetch a model from any CDN. If a model download is ever added, set a CSP first.

---

## 2. Sentence → structured records

### Verdict

**Hand-written grammar, with a local LLM as an opt-in fallback for the `bullet` case only.** Not a
close call, and the measurements below are why.

| | Grammar (`capture.ts` + `intent.ts`) | Local LLM, schema-constrained |
|---|---|---|
| Runtime cost | 0 bytes, 0 ms | 2.4 s warm / 18.6 s cold (measured, `llama3.1:8b`) |
| Offline | always | only if the daemon is running |
| Testable | `capture.test.ts` exists; every sentence is a fixture | you can test a prompt, not a behaviour |
| Fails by | returning `bullet` — lossless, the words are kept | **inventing a value that looks right** |
| Extending | one regex + one record kind | a prompt edit, and re-verifying everything |

The grammar's failure mode is *visibly nothing happened*. The LLM's failure mode is *a number in
your health log that you never said*. For a private health journal those are not comparable risks.

### Constrained decoding, measured on this machine

Ollama at `localhost:11434` (LM Studio's `:1234` was not running at the time of writing).
Temperature 0, `think: false`, JSON-schema `format`.

**Small models silently produce nothing.** `qwen3-vl:2b` (2.1 B, Q4_K_M, 1.89 GB) returned an
**empty string** for all three target sentences under a JSON schema — in 3–6 s, with no error. With
thinking left on, it burned the entire 200-token budget on reasoning and emitted no JSON at all.
LM Studio's docs say the same thing plainly: *"Not all models are capable of structured output,
particularly LLMs below 7B parameters."* A sub-2B extractor is not an option in 2026.

`llama3.1:8b` (4.9 GB, Q4_K_M, already installed) got all three right:

| Sentence | Output | Latency |
|---|---|---|
| `I played two games of pickleball, scored 68` | `{kind:"pickleball", games:2, score:68}` | 18.6 s cold / ~2.4 s warm |
| `log oatmeal and eggs for breakfast` | `{kind:"food", foods:["oatmeal","eggs"]}` | 2.4 s |
| `mood 7, slept 6 hours` | `{kind:"metric", mood:7, sleepHours:6}` | 2.4 s |

### The dangerous failure mode, reproduced here

The literature calls it *PhantomFill* (arXiv 2607.20492, 2026): across nine open-weight models
(0.8 B–26 B) and four frontier models, **required schema fields with no escape hatch produced
fabrication at 98–100 %**. GPT-5.5 fabricates 2 % in prose, 0 % with an escape hatch, and **100 %**
with required fields. Grammar-constrained decoding does not prevent hallucination; it *removes the
model's ability to abstain*. Related: constrained decoding measured **91.37 %** vs **93.63 %** for
unconstrained-plus-parse on function calling — always-valid JSON that is less often correct.

Reproduced locally, same model, same sentence, only the schema changed:

| Schema | `log oatmeal and eggs for breakfast` → |
|---|---|
| all fields **required** | `{kind:"food", games:2, score:1, kcal:250, protein:18}` |
| all fields **nullable**, only `kind` required | `{kind:"food", score:null, kcal:null, protein:null}` |

Read the first row again. From a sentence about breakfast, a required schema invented **two
pickleball games**, a **score of 1**, and **250 kcal / 18 g protein** — numbers that would land in
the nutrition log looking exactly like something the user said. `played pickleball today` under the
required schema became `games: 1` (never stated) and `score: 0` (not even a legal pickleball
score). The nullable schema omitted `games` entirely.

**Rules that follow, and they are not negotiable:**

1. Every extracted field is `["number","null"]`. Only a discriminant is `required`.
2. `null` and *absent* both mean **do not write that field**, never "write 0".
3. Run the output through `lib/ingest/validate.ts` — `RANGES` already rejects an out-of-range
   mood or sleep, and that guard is the one thing standing between a hallucinated number and the
   store.
4. Show the user the number before it is written. `CONFIRM_BELOW = 0.6` is the right instinct; for
   LLM-sourced records the threshold is 1.0 — always confirm.

### Small models worth trying, 2026

Measured from this machine's Ollama library (`/api/tags`, 2026-09-11):

| Model | Size on disk | Tools? | Verdict for this job |
|---|---|---|---|
| `qwen3-vl:2b` | 1.89 GB | yes (nominally) | **empty output under a schema — measured.** Unusable |
| `qwen3-vl:4b` | 3.30 GB | yes, + vision | untested; the smallest plausible candidate |
| `llama3.1:8b` | 4.92 GB | yes | **works, 2.4 s warm.** The recommendation |
| `gemma4:12b` | 7.56 GB | yes, + vision | overkill for one sentence |
| `gpt-oss:20b` | 13.8 GB | yes, thinking | far too slow for a capture bar |

Published guidance for 2026 small models (Gemma 4 E2B/E4B ~2 GB Apache-2.0, Phi-4-mini 3.8 B,
Qwen3.5-4B) is consistent with the measurement: pick a **tool-calling-capable model at 4 B or
above**, and verify structured output on your own schema before trusting it. Both LM Studio (GGUF →
llama.cpp grammar sampling; MLX → Outlines) and Ollama (`format` → GBNF) enforce at the token
level, so malformed JSON is mechanically impossible — which is precisely why a fabricated value is
the risk that remains.

One more llama.cpp footgun: **the JSON schema constrains the sampler but is not injected into the
prompt.** The model cannot see the schema. Describe the fields in the system prompt too, or it
fills shapes it is guessing at.

---

## 3. Open-source projects worth reading or reusing

**Nothing here is a drop-in.** Four things are genuinely worth taking; the rest is reading, and a
surprising amount of it is dead. Dates are last push / last npm publish as of 2026-09-12.

### Worth actually installing

| Package | Licence | Last publish | Why |
|---|---|---|---|
| **`chrono-node`** (12.2k★ repo) | MIT | 2.10.1, 2026-07-20 | NL date parser — "yesterday", "last Tuesday", "6 hours ago" → `Date`. `intent.ts` is currently hand-rolling `readDate()`; this is the boring correct version and you will need it either way |
| **`compromise`** | MIT | 14.17.0, 2026-09-10 | ~200 kB rule-based NLP, no model, works in a Worker. Pulls nouns/numbers/units out of a transcript. Only worth it if the regexes start fighting each other |
| **`@ricky0123/vad-web`** | ISC | 0.0.30, 2025-11-21 (repo active 2026-09-11) | Silero VAD, ~2 MB. **Endpointing** — so "stopped talking" ends the utterance instead of a fixed window. Not needed with the browser's own recogniser, needed the moment you run your own model |
| **`@huggingface/transformers` v4** | Apache-2.0 | 4.2.0, 2026-04-22 | The only sane self-hosted STT route in a tab. See §1 |

### Worth reading, not installing

| Project | Licence | ★ | Last activity | What to take |
|---|---|---|---|---|
| [`huggingface/transformers.js-examples` → `realtime-whisper-webgpu`](https://github.com/huggingface/transformers.js-examples/tree/main/realtime-whisper-webgpu) | Apache-2.0 | 2.1k | 2026-02-17 | **The file you copy** if you ever self-host STT: worker + streaming chunks + `whisper-base`. Sibling `moonshine-web` is the same shape in React + Vite — your exact stack |
| [`fastrepl/anarlog`](https://github.com/fastrepl/anarlog) (Hyprnote, renamed) | MIT | 9.3k | 2026-09-11 | **Tauri v2 + React + TS, local-first, on-device STT, LLM via Ollama/LM Studio.** The only codebase in this space with the same stack and real engineering in it. Read its audio-capture → transcription → storage boundaries. Its `OWhisper` component is **GPLv3** — do not link against it |
| [`OHF-Voice/hassil`](https://github.com/OHF-Voice/hassil) | Apache-2.0 | 115 | 2026-09-08 | Home Assistant's YAML sentence-template matcher: `(play\|start) [the] {media} in {area}`. **There is no JS port and you should not write one** — but alternation + optional + `{slot}` capture is an afternoon in TS and turns `capture.ts`'s growing regex pile into declarative templates. The right upgrade path *if* the regexes get unwieldy, not before |
| [`druedaro/trainlog`](https://github.com/druedaro/trainlog) | MIT | 0 | 2026-09-08 | The closest functional match to "I played two games of pickleball, scored 68" — spoken sentence → fatigue/sleep/mood metrics. **It is Groq cloud Whisper + Llama 3 behind a Vercel function**, so the only artefact is its extraction schema and prompt |
| [BAML](https://github.com/BoundaryML/baml) | Apache-2.0 | 9.2k | 2026-09-11 | Steal the **idea** — schema-aligned parsing *repairs* malformed LLM JSON instead of demanding perfection. The dependency is a DSL, a codegen step and a Rust native binding. Absurd for one schema |
| [`KatherLab/LLMAIx`](https://github.com/KatherLab/LLMAIx) | unverified | small | unverified | The only NL→structured project found with an explicit **human review stage** before the record lands. Read the workflow |

### Dead, dying, or a blog post with a repo attached

| Project | Status |
|---|---|
| `@xenova/transformers` | **Superseded.** Final publish 2024-05-29; same author renamed it `@huggingface/transformers`. Every tutorial you find uses it |
| `zod-to-json-schema` | **Repo archived.** Zod 4 ships `z.toJSONSchema()` natively. Still in every ollama-js tutorial |
| `vosk-browser` | npm untouched **3.7 years**, still `0.0.8`. Kaldi-era accuracy |
| `@moonshine-ai/moonshine-js` | **Repo archived 2026-08-15**, deprecated in favour of Moonshine Voice's JS support — whose npm package name I could not find (**unverified**). Reach Moonshine through `onnx-community/moonshine-tiny-ONNX` on transformers.js instead |
| `whisper-webgpu` / whisper-turbo | Abandoned since 2024-02. npm licence field is literally `"$$$"` |
| `rhasspy` / `rhasspy3` | **Both archived.** hassil is the surviving descendant |
| `snips-nlu` | **Dead since Sonos bought Snips in 2019.** Not archived, which flatters it |
| `@instructor-ai/instructor` (JS) | 20 months stale. The Python one thrives; the port does not |
| `gbnf` (npm) | 4 stars, and pointless — llama.cpp and Ollama take a JSON schema directly |
| `kaisoapbox/WhisperJournal` | 7★, React Native, dead since 2024-04 |
| `nikdanilov/whisper-obsidian-plugin` (378★) | Calls the OpenAI API. Not local-first |
| `outlines` (Python), `llguidance` (Rust) | Both alive, both unreachable from here — `llguidance` constrains a tokenizer you own, and you do not embed an inference engine |
| `sherpa-onnx` | Very alive (14.7k★, daily), but its npm package is **Node addon bindings**. The browser WASM build requires you to install Emscripten and compile it. Wrong tool for a PWA |

### If the LLM ever has to run in the tab

`@mlc-ai/web-llm` (Apache-2.0, 19.1k★, 2026-09-08) is the only fully-local-in-browser option, and
it does JSON-Schema-constrained decoding via XGrammar. The cost is a **~1 GB model download**,
which is also the honest argument for putting the LLM behind Tauri/Ollama instead.

From Tauri, `ollama-js` (MIT, 4.4k★) with `format: <json schema>` is the lazy correct answer.
`@lmstudio/sdk` is equivalent; its repo is very active but its npm publish is 13 months stale
(**unverified** whether that is deliberate).

### Traps from this survey

1. **A service worker cannot host the model.** transformers.js [#787](https://github.com/huggingface/transformers.js/issues/787): neither the WebGPU nor the WASM backend is available inside a service worker. For a PWA that is the natural-looking place to put it. Dedicated Worker only.
2. **whisper.cpp-WASM wrappers demand cross-origin isolation.** `@transcribe/transcriber` and `@remotion/whisper-web` both hard-require `SharedArrayBuffer`, i.e. `COOP: same-origin` + `COEP: require-corp` — which changes what the whole PWA can load from anywhere else. transformers.js does not demand it; it just runs single-threaded without it. That alone settles the choice.
3. **`@remotion/whisper-web` is `UNLICENSED` on npm.** Free for individuals and teams of ≤3 under Remotion's own terms — fine for personal use, not OSI open source. Flag it if this ever ships.
4. **Almost everything in the voice-journal category with <100 stars is a blog post with a repo attached.** Read the writeups; do not read the code.

---

## 4. Food logging

### Verdict

**Barcode → nutrition is solved, free and cheap to build. Photo → nutrition is not solved by
anyone, at any price, in 2026 — and it is worse than that: it is mathematically ill-posed.**

### Open Food Facts

Measured live 2026-09-11. Both `v2` and `v3` return 200; **write against v3** —
`GET https://world.openfoodfacts.org/api/v3/product/{barcode}.json`.

| | v2 | v3 |
|---|---|---|
| Envelope | `{code, product, status, status_verbose}` | `{code, product, result:{id,...}, errors:[], warnings:[], status}` |
| Docs | flagged deprecated | current, recommended |

`?fields=` works on both. Full-text search is in **neither** — it moved to Search-a-licious at
`search.openfoodfacts.org` (beta, rate limits **unverified**).

| Rule | Value |
|---|---|
| Product reads | **15 req/min per IP** |
| Search | **10 req/min per IP** |
| User-Agent | **required**, `AppName/Version (email)` |
| Licence | database **ODbL 1.0**, contents DbCL 1.0, images CC-BY-SA 3.0 |

On the licence: share-alike triggers on *publicly distributing a derived database*. A personal
local-first app storing its own food log is a produced work. Attribution in About, and stop
thinking about it.

**Nutrition fields.** Every nutrient appears four times — bare, `_value`, `_unit`, `_100g` (plus
`_serving`). Store `_100g`. **The trap: `energy_100g` is kilojoules; `energy-kcal_100g` is
kilocalories.** Read the kcal key explicitly. The rest map straight onto `DailyMetric`:
`proteins_100g`, `carbohydrates_100g`, `fat_100g`.

**Coverage — the finding that should drive the design:**

| Scope | Products | No usable nutrition (upper bound) |
|---|---|---|
| Total | 4,743,915 | — |
| United States | **968,338** | 571,198 (59 %) |
| France | 1,266,312 | — |
| **India** | **22,935** | 16,671 (73 %) |

India is **0.5 % of the database** — 2 % of the US figure, and three quarters of those rows have no
nutrition. And a barcode only ever covers *packaged* food: the dal, the sabzi, the rice have no
barcode at all. **Barcode scanning solves the American half of this user's diet and essentially
none of the Indian half.** `lib/foods.ts` — which already carries 12 Indian staples — is not a
stopgap before the API; it is the part that covers what the API cannot.

**Dumps** (measured `Content-Length`): MongoDB 15.66 GB · JSONL 12.86 GB · **CSV 1.28 GB** (~9 GB
raw) · Parquet 7.87 GB · **daily delta 24.5 MB**, 14 days retained. There is no official offline
subset; a US+India filtered SQLite is *estimated* 50–150 MB (**unverified, not built**). Too big
for localStorage, reasonable as a Tauri-side file. For the PWA the honest answer is **online lookup
plus a cache of what you actually scanned** — a few hundred barcodes a year, not a million.

`@openfoodfacts/openfoodfacts-nodejs` is maintained (2.0.0-**alpha.35**, 2026-09-03, Apache-2.0)
but 35 alphas deep. For one endpoint, a 10-line `fetch` with your own `User-Agent` beats it.

### USDA FoodData Central

| Item | Value |
|---|---|
| Key | free from api.data.gov; **1,000 req/hour per IP** (per *IP*, not per key) |
| `DEMO_KEY` | works — 30/hour, 50/day per IP |
| Licence | **CC0 1.0 / public domain.** Citation requested, not required |

| Dataset | Latest | CSV zipped | Why it matters |
|---|---|---|---|
| **SR Legacy** | 04/2018, **frozen** | **6.7 MB** (54 MB raw) | ~7,800 generic foods — "rice, white, cooked", "lentils, boiled". CC0, no share-alike question, fits in IndexedDB trimmed |
| **FNDDS** | 10/2024 | 200 MB | **Portion descriptions with gram weights** — "1 cup" → 158 g. The missing piece for logging home food by eye |
| Branded Foods | 04/2026 | 428 MB | US packaged goods with UPCs |
| Foundation | 04/2026 | 3.7 MB | Lab-analysed whole foods, small, highest quality |

SR Legacy at 6.7 MB is the sweet spot and the obvious way to grow `lib/foods.ts` from 30 entries to
something useful without touching a network. FNDDS portion weights are worth more here than any
vision model. Both are US-centric; Indian dishes appear as generic approximations at best.

### Photo → food, offline

| Option | Size | Reality |
|---|---|---|
| `onnx-community/swin-finetuned-food101-ONNX` | int8 **93 MB**, q4f16 **53 MB** | The *only* ready-to-use in-browser food classifier, and it has 626 downloads and 0 likes. Untested in production |
| `prithivMLmods/Food-101-93M` (SigLIP2) | 372 MB, **no ONNX** | 89.73 % top-1 on Food-101 |
| CLIP/SigLIP zero-shot | varies | Big-CLIP reaches >90 % on Food-101. **The structural advantage: you write your own label list**, so `["rajma chawal","bhindi masala","idli sambar",…]` works with no training. No pre-packaged food-CLIP for transformers.js — you export it yourself |
| Local VLM (`qwen3-vl:4b`, 3.3 GB — already installed) | 3.3 GB + 0.45–0.84 GB `mmproj` | Open vocabulary, so it will actually say "rajma chawal". Forgetting the separate `mmproj` file is the classic "vision model that can't see" bug |

**Food-101 is 101 Western restaurant dishes, and contains exactly two Indian classes:
`chicken_curry` and `samosa`.** Softmax has no "none of the above" — shown a plate of rajma-chawal
it returns `chicken_curry` at 0.6 and will do so forever. Even a 99.5 % top-1 model (NoisyViT, SOTA)
is **structurally incapable of being right** about this user's food, and its confidence score will
not say so. Indian-specific work exists (Khana, 131k images / 80 labels) as research artifacts, not
deployable weights.

### Paid photo-food APIs — all disqualified

| Provider | Free tier | Price | On-device |
|---|---|---|---|
| **Passio** | **none** | **$99/mo** minimum | partly — the on-device path is legacy; they now steer you to cloud LLM photo logging |
| LogMeal | 30-day trial | not public | no |
| Nutritionix | limited dev tier, attribution required | ~$299/mo up | no (NL parsing, not photo) |
| Foodvisor | consumer app only | $14.99/mo | no |
| Calorie Mama | dev registration | not public | no |

Every accuracy claim above is vendor-published; **no independent evaluation of these five was
found.** That absence is the finding.

### Portion estimation — the numbers

| Study | Models | Calorie error |
|---|---|---|
| ACM BCB, Dec 2025 | Gemini 2.5 Flash, GPT-4.1, Gemma3 27B, Llama4 | **MAPE 40.55–42.33 %** |
| PubMed 41081011, 2025 | ChatGPT, Claude, Gemini | energy **MAPE 35.8 %**; Gemini 64.2–109.9 % |
| GPT-4V direct | GPT-4V | MAE ~69 kcal single item, ~**151 kcal mixed meal** |
| ACETADA, with **ground-truth weight supplied** | Gemini 2.5 Flash / GPT-4.1 | MAPE **20.2 % / 26.8 %** |

**Expect 35–42 % MAPE on calories from a photo, from the best commercial models in 2026.** On a
600 kcal meal that is ±210–250 kcal — three times a day, larger than most people's intended daily
deficit. A local 4 B model is worse than every figure there.

Three findings matter more than the headline:

1. **Portion is the dominant error, not identification.** The model knows it is rajma chawal; it does not know if it is 200 g or 400 g. Supply the weight and MAPE roughly halves. The camera is not where the uncertainty lives.
2. **The bias is systematic and downward** — error grows with portion size, so it does not cancel over a week. It compounds in the flattering direction.
3. **Open models degrade catastrophically without context** — 29–52 MAPE points of improvement just from being handed metadata means the unassisted baseline was dire.

And the reason no model fixes it, from the Feb 2026 survey (arXiv 2602.05078):

> Portion estimation from a single image is mathematically an **ill-posed** problem, as infinite 3D
> volumes can yield the exact same 2D projection. Without a known reference, a small pizza close to
> the camera is geometrically indistinguishable from a large pizza placed further away.

The information is not in the pixels. The three escapes — a fiducial marker (a coin in every
photo), an RGB-D sensor, or learned environmental priors — are all either hostile to use or not
something you can `npm install`.

### Barcode scanning in a browser — the Windows problem

From MDN browser-compat-data, not caniuse's headline percentage:

| Browser | Support | Caveat |
|---|---|---|
| Chrome desktop | 88+, **partial** | **"Supported on ChromeOS and macOS only"** |
| Edge desktop | 83+, partial | **"Supported on macOS only"** |
| **Chrome Android** | **83+, full** | the one platform where it just works |
| Samsung Internet | full | mirrors Chrome Android |
| Firefox (desktop + Android) | **no** | [bug 1553738](https://bugzil.la/1553738), open since 2019 |
| Safari macOS + iOS | 17+ **behind a flag**, off by default | effectively unavailable |

caniuse says 77.88 % (47.03 full + 30.85 partial) and that number is misleading here, because the
partial half is desktop-macOS-only.

**`BarcodeDetector` does not exist in any browser on Windows.** The env for this repo is Windows 11.
So the fallback *is* the implementation — develop against it, or you build on an API you can never
test locally.

| Library | Version | Last publish | Licence | JS gzip | WASM | Verdict |
|---|---|---|---|---|---|---|
| **`zxing-wasm`** | 3.1.4 | **2026-09-10** | MIT | 14.1 KB | reader **931 KB** | **Alive. Pick this** |
| **`barcode-detector`** | 3.2.2 | 2026-08-16 | MIT | 15.1 KB | wraps zxing-wasm | Polyfill for the native API, same author — best ergonomics |
| `@ericblade/quagga2` | 1.12.1 | 2025-12-20 | MIT | 42.0 KB | — | Maintained fork, pure JS, **1D only** |
| `@zxing/library` | 0.23.0 | 2026-04-29 | Apache-2.0 | 119.9 KB | — | Maintenance mode, heavy |
| `html5-qrcode` | 2.3.8 | **2023-04-15** | Apache-2.0 | 107.3 KB | — | **Abandonware, 3.4 years stale** — and still the most-recommended library in blog posts |

Bundlephobia's 14 KB for `zxing-wasm` is JS glue only. The real cost is `zxing_reader.wasm` =
**931 KB**, fetched separately at runtime — so for an offline PWA **pin it and precache it**, or the
scanner dies on a plane. Use the *reader* build; you decode, you never generate.

**Real-world accuracy** (Dynamsoft benchmark, Jul 2026 — vendor-run, discount the winner):

| Dataset | ZXing-CPP | ZBar | Scandit (paid) |
|---|---|---|---|
| Artelab in-focus | 82.36 % | 89.77 % | 91.63 % |
| Artelab **out-of-focus** | **10.23 %** | 13.95 % | 79.07 % |
| Muenster BarcodeDB | 75.14 % | 70.59 % | 93.26 % |

The out-of-focus row is the honest one, and a phone hunting focus on a curved packet in kitchen
light *is* that case. The mitigation is free and matters more than the library: scan **continuously
across frames**, require the **same code twice**, and **validate the EAN-13 check digit yourself**
(one line of modular arithmetic) so a misread never reaches the lookup. "Checksum-valid but not in
OFF" and "misread" are different failures and only the check digit separates them.

**Tauri does not help on desktop.** `tauri-plugin-barcode-scanner` v2.4.2 is **Android and iOS
only** — ✗ on Linux, Windows and macOS. It wraps MLKit/AVFoundation, not `rxing`. On Windows you
are back in WebView2, which has no `BarcodeDetector`. Shelling to the `rxing` crate would buy you
the same ZXing decode quality as the 931 KB WASM. Not worth it.

### The lazy design that actually works

Barcode for packaged food. For everything else, a **searchable local table of the foods you
actually eat** — `lib/foods.ts` grown from USDA SR Legacy (6.7 MB, CC0) plus FNDDS portion weights
for "1 cup cooked rice → 158 g", plus your own entries for the twenty dishes that are most of your
meals. A local VLM or CLIP zero-shot can then *suggest which of your twenty dishes this is* — a
20-way pick from your own list, which small models are genuinely good at — and you confirm the
portion. That puts the human where the information actually is, and it is a smaller build than any
photo-calorie pipeline.

---

## 5. What must never happen

This is a private journal holding mood, sleep, stress, body metrics, a menstrual cycle log and a
relapse/addiction streak. The blast radius of a mistake here is not a bad UX review.

| Trap | Why it is specifically live in this repo | The gate |
|---|---|---|
| **Audio uploaded silently** | **Live in `main` as of `d6b8d31`.** `speech.ts` sets no `processLocally`, so pressing the new top-bar mic on Chrome **sends journal audio to Google**, and nothing in the UI says so. The commit message says "the microphone gets no write path of its own" — true, and it is the read path that leaks | Set `processLocally = true`; if `available()` is not `'available'`, either `install()` with consent or **disable the mic** and say why. Never silently downgrade to cloud |
| **A cloud STT default** | the same line, from the other side: the cloud path is the default *because it is the default of the API* | The fallback order must be on-device → typed, never on-device → cloud |
| **An LLM writing into storage** | `lib/ingest/` exists and is correct; the risk is a future "quick apply" that calls a store function directly from the voice path | Keep `understand()` returning `ImportRecord[]` and nothing else. The LLM must plug in at that same seam. If a diff adds an import of `storage.ts` to anything under `lib/voice/`, that is the bug |
| **A required-field schema** | measured above: it invented 250 kcal from a breakfast sentence | Every field nullable. This is a one-character trap (`"integer"` vs `["integer","null"]`) and nothing fails loudly |
| **A model download that blocks first paint** | the app ships no ML runtime today; adding a 119 MB Whisper fetch to the app shell would be the single worst regression available | Any model is lazy-loaded, in a Worker, behind an explicit tap, with a visible size and a cancel. Prefer the browser-owned 60 MB pack, which never enters our bundle or our service worker |
| **The service worker caching a model** | `vite.config.ts` `globPatterns: ['**/*.{js,css,html,svg}']` would not catch `.onnx`/`.bin` today — but a careless `**/*` would, and a ~100 MB precache breaks install on a phone. Separately, transformers.js [#787](https://github.com/huggingface/transformers.js/issues/787): **neither backend runs inside a service worker at all**, so the obvious place to put it is also the broken one | Leave the glob narrow. Never precache weights. Dedicated Worker only |
| **Turning on cross-origin isolation for a wrapper** | `@transcribe/*` and `@remotion/whisper-web` need `COOP`/`COEP`, which changes what the *whole* app may load — fonts, Supabase, Open Food Facts | If a route needs `SharedArrayBuffer`, that is a reason to reject the library, not to isolate the app |
| **Nutrition written from a photo guess** | §4: 35–42 % calorie MAPE, biased downward, from *frontier* models | A photo may *propose*; a human confirms the number. Never auto-apply a macro |
| **A barcode lookup leaking the diet log** | an OFF request is an outbound call that ties a product to a timestamp and an IP. It is not anonymous just because it has no account | Cache every hit locally so the same product is fetched once. Make the lookup a visible, per-scan action, not a background sync. Offline-first means offline by default |
| **Reading `energy_100g` as calories** | OFF returns **kilojoules** in `energy_100g` and kcal only in `energy-kcal_100g`. A 4.184× error looks like a plausible big meal, not like a bug | Read `energy-kcal_100g` explicitly; reject a row that has only kJ rather than converting silently |
| **Trusting a single barcode frame** | open-source decoders drop to **10–14 %** on out-of-focus images, which is the normal kitchen case; a misread is a *valid-looking number* | Same code twice across frames + EAN-13 check digit, before any lookup |
| **`csp: null` in the desktop build** | a model or API fetch from anywhere would be permitted in the Tauri webview | Set a CSP before any new outbound fetch is added |
| **An always-on mic** | `speech.ts` sets `continuous = true`; there is no wake word and there must not be one | Press-to-talk, a visible listening state (the pulsing red button already does this), and `stop()` on unmount (already done) |
| **The transcript being lost** | `VoiceIntent.transcript` keeps the raw words; `matchBullet` is a lossless fallback | Keep both. A mis-parse should degrade to a journal bullet containing what was said, never to nothing |
| **A gate that cannot see it** | per `CLAUDE.md`: a card that never renders cannot fail; a mic button that renders `null` on Firefox/Linux is invisible to `a11y` and `smoke` | Add the voice surface to `scripts/a11y-axe.mjs`'s `VIEWS` **with the mic present**, and assert `speechSupported()` handling in a unit test rather than relying on a browser gate |

---

## Sources

**Speech**

- MDN, [`SpeechRecognition`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition) — "on browsers like Chrome, audio is sent to web services for processing"
- MDN, [`SpeechRecognition.processLocally`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally), [`available()`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/available_static), [`install()`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/install_static)
- WebAudio CG, [on-device speech recognition explainer](https://github.com/WebAudio/web-speech-api/blob/main/explainers/on-device-speech-recognition.md)
- Chromium blink-dev, [Intent to Ship: On-device Web Speech API](https://groups.google.com/a/chromium.org/g/blink-dev/c/VNOok2dbmHM) — Windows/Mac/Linux desktop, not Android; ~60 MB language packs
- [New in Chrome 139](https://developer.chrome.com/blog/new-in-chrome-139)
- Chromium issue [444393111](https://issues.chromium.org/issues/444393111) — `available({processLocally:true})` on macOS (status unverified)
- Mozilla, [Web Speech API – Speech Recognition wiki](https://wiki.mozilla.org/Web_Speech_API_-_Speech_Recognition) and [bug 1244237](https://bugzilla.mozilla.org/show_bug.cgi?id=1244237)
- [whisper.cpp](https://github.com/ggml-org/whisper.cpp) and its [WASM example](https://ggml.ai/whisper.cpp/) / [streaming example](https://ggml.ai/whisper.cpp/stream.wasm/) — model sizes, 2–3× real-time, Firefox 256 MB limit
- [Whisper.cpp vs faster-whisper 2026](https://www.promptquorum.com/power-local-llm/local-whisper-stt-comparison-2026) — RTF and WER table
- [Transformers.js v3](https://www.huggingface.co/blog/transformersjs-v3); [WebGPU guide](https://huggingface.co/docs/transformers.js/en/guides/webgpu); [issue #894, WebGPU vs WASM](https://github.com/huggingface/transformers.js/issues/894)
- [`onnx-community/whisper-tiny.en-ONNX`](https://huggingface.co/onnx-community/whisper-tiny.en-ONNX/tree/main/onnx) — 10.1 MB encoder + 109 MB int8 decoder
- [Moonshine](https://github.com/moonshine-ai/moonshine) (MIT), [moonshine-js](https://github.com/moonshine-ai/moonshine-js), [arXiv 2410.15608](https://arxiv.org/abs/2410.15608), [Moonshine v2, arXiv 2602.12241](https://arxiv.org/pdf/2602.12241)
- [Vosk models](https://alphacephei.com/vosk/models); [`vosk-browser` on npm](https://www.npmjs.com/package/vosk-browser) (last publish ~4 years ago); [Vosklet](https://github.com/msqr1/Vosklet)
- Tauri: [Embedding External Binaries](https://v2.tauri.app/develop/sidecar/); [discussion #13460](https://github.com/tauri-apps/tauri/discussions/13460) and [#8784](https://github.com/orgs/tauri-apps/discussions/8784) — recognition unsupported on Linux webkit2gtk

**Structured extraction**

- [PhantomFill: When the Form Demands an Answer, Language Models Invent One](https://arxiv.org/html/2607.20492) — 98–100 % fabrication on required fields
- [Your JSON Is Valid but Your Data Is Wrong](https://towardsdatascience.com/your-json-is-valid-but-your-data-is-wrong-five-failure-modes-llm-structured-outputs-wont-catch/)
- [JSON Mode Makes Your LLM Dumber](https://dev.to/ji_ai/json-mode-makes-your-llm-dumber-the-constrained-decoding-trap-cp) — 91.37 % vs 93.63 % on function calling
- [LM Studio structured output](https://lmstudio.ai/docs/app/api/structured-output) — "not all models... particularly below 7B"
- [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs) and [the announcement](https://ollama.com/blog/structured-outputs)
- [llama.cpp GBNF grammars](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md); [issue #8914, JSON schema → GBNF](https://github.com/ggml-org/llama.cpp/issues/8914)
- [A Guide to Structured Outputs Using Constrained Decoding](https://www.aidancooper.co.uk/constrained-decoding/)
- [XGrammar](https://arxiv.org/html/2412.15803v2) — the constrained-decoding engine behind `@mlc-ai/web-llm`

**Projects**

- [`fastrepl/anarlog`](https://github.com/fastrepl/anarlog) (Hyprnote) · [`OHF-Voice/hassil`](https://github.com/OHF-Voice/hassil) + [template sentence syntax](https://developers.home-assistant.io/docs/voice/intent-recognition/template-sentence-syntax/) · [`druedaro/trainlog`](https://github.com/druedaro/trainlog)
- [`transformers.js-examples`](https://github.com/huggingface/transformers.js-examples) — `realtime-whisper-webgpu`, `moonshine-web`
- [transformers.js #787 — no WebGPU/WASM backend inside a service worker](https://github.com/huggingface/transformers.js/issues/787)
- [`chrono-node`](https://github.com/wanasit/chrono) · [`compromise`](https://github.com/spencermountain/compromise) · [`@ricky0123/vad-web`](https://github.com/ricky0123/vad)
- [`@mlc-ai/web-llm`](https://github.com/mlc-ai/web-llm) · [`ollama-js`](https://github.com/ollama/ollama-js) · [`@lmstudio/sdk`](https://github.com/lmstudio-ai/lmstudio-js) · [BAML](https://github.com/BoundaryML/baml)
- [`@transcribe/transcriber`](https://github.com/TranscribeJs/transcribe.js) · [`@remotion/whisper-web`](https://www.remotion.dev/docs/whisper-web/) · [`sherpa-onnx`](https://github.com/k2-fsa/sherpa-onnx)

**Food**

- [Open Food Facts — Data, API and SDKs](https://world.openfoodfacts.org/data) · [API introduction: rate limits and User-Agent](https://openfoodfacts.github.io/openfoodfacts-server/api/) · [API cheatsheet](https://openfoodfacts.github.io/openfoodfacts-server/api/ref-cheatsheet/) · [Terms of use](https://world.openfoodfacts.org/terms-of-use) · [product-database on HuggingFace](https://huggingface.co/datasets/openfoodfacts/product-database) · [`openfoodfacts-nodejs`](https://www.npmjs.com/package/@openfoodfacts/openfoodfacts-nodejs)
- USDA FoodData Central — [API guide](http://fdc.nal.usda.gov/api-guide/) · [Download datasets](http://fdc.nal.usda.gov/download-datasets/)
- [Benchmarking Foundation Model Dietary Estimates from Meal Images, ACM BCB 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC13401436/) — 40.55–42.33 % MAPE
- [Evaluating Large Multimodal Models for Nutrition Analysis (ACETADA), arXiv 2507.07048](https://arxiv.org/html/2507.07048v1)
- [Food Portion Estimation: From Pixels to Calories, arXiv 2602.05078](https://arxiv.org/html/2602.05078v1) — the ill-posedness quote
- [Geometry-Enhanced Portion Estimation for Multimodal LLMs, arXiv 2607.16514](https://arxiv.org/abs/2607.16514) · [Performance Evaluation of 3 LLMs](https://pubmed.ncbi.nlm.nih.gov/41081011/)
- [NoisyViT, arXiv 2503.18997](https://arxiv.org/abs/2503.18997) · [Khana: Indian cuisine dataset, arXiv 2509.06006](https://arxiv.org/abs/2509.06006)
- [`onnx-community/swin-finetuned-food101-ONNX`](https://huggingface.co/onnx-community/swin-finetuned-food101-ONNX) · [`prithivMLmods/Food-101-93M`](https://huggingface.co/prithivMLmods/Food-101-93M) · [`Qwen3-VL-4B-Instruct-GGUF`](https://huggingface.co/Qwen/Qwen3-VL-4B-Instruct-GGUF)
- [Passio pricing](https://www.passio.ai/pricing) · [Passio mobile SDK](https://passio.gitbook.io/nutrition-ai/mobile-sdks/mobile-sdk-overview) · [LogMeal plans](https://docs.logmeal.com/docs/guides-essential-concepts-plans-limits) · [Nutritionix API](https://www.nutritionix.com/api) · [Calorie Mama API](https://caloriemama.ai/api)
- [MDN Barcode Detection API](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API) · [MDN BCD `BarcodeDetector.json`](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/BarcodeDetector.json) · [caniuse](https://caniuse.com/mdn-api_barcodedetector)
- [`zxing-wasm`](https://github.com/Sec-ant/zxing-wasm) · [`barcode-detector`](https://github.com/Sec-ant/barcode-detector) · [Dynamsoft 1D accuracy benchmark, Jul 2026](https://www.dynamsoft.com/codepool/barcode-scanning-accuracy-benchmark-and-comparison.html)
- [`tauri-plugin-barcode-scanner`](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/barcode-scanner) — Android and iOS only

**Measured on this machine, 2026-09-11**

- `parseCapture` outputs: temporary vitest probe against `src/lib/capture.ts`, deleted after running
- Ollama `GET /api/tags` — installed model list and sizes
- Ollama `POST /api/chat` with `format: <schema>`, `temperature: 0`, `think: false` — latencies and the required-vs-nullable fabrication test
- Open Food Facts v2/v3 live responses, country product counts, and dump `Content-Length` — measured by the food research pass on 2026-09-11

### Marked unverified

Safari's on-device recognition claim · Moonshine latency for a 5 s clip and its current npm package name · the two conflicting quantised-decoder sizes for `whisper-tiny.en` · Chromium 444393111's status · the size of a filtered US+India OFF SQLite (50–150 MB, estimated, not built) · Search-a-licious rate limits · `@lmstudio/sdk`'s 13-month npm gap · licence/stars/dates for `LLMAIx` and `llm-document-extraction` · independent accuracy figures for the five paid photo-food APIs (none published)
