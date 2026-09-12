# A purpose-built model for bujo: should we build one?

**Research only.** Nothing in `src/` was changed to write this. Measurements were taken on this
machine on **2026-09-12** against the real GPU and the real Ollama daemon; anything not measured is
marked *unverified* rather than guessed.

Builds on [`landscape.md`](./landscape.md), which settles the capture stack (browser on-device
speech → `capture.ts` grammar → `ImportRecord[]` → validate → plan → confirm) and measured the
fabrication failure. This document answers only the next question: **do we train our own model, and
what runs the Q&A feature?**

---

## Recommendation

**No. Do not fine-tune anything — not now, and not on any roadmap this document can foresee.**
Prompt stock `llama3.1:8b`, which is already pulled, and spend the effort on the part that is
actually missing.

For **Q&A over the journal**, the model must **never compute the answer**. It picks which of the
400 functions already in `src/lib/` to call, the app computes, and the model phrases the result.
Measured here against a 90-day journal with exact ground truth:

| Who does the arithmetic | `llama3.1:8b` | `gemma4:12b` | `qwen38-27b` | `gpt-oss:20b` |
|---|---|---|---|---|
| **The model**, reading journal rows | **0 / 8** | **1 / 8** | **2 / 8** | **no output at all** |
| **The app**, model only picks the function | **8 / 8** | **8 / 8** | 6 / 8 | 7 / 8 |

Across 24 arithmetic answers from three models that produced any, **21 were wrong and not one was
flagged as uncertain.** Every wrong answer was a confident, plausible, specific number. Meanwhile
the **smallest** model was the best router. That is the whole decision; the rest of this document
defends it.

---

## 0. The measurement that settles it

A 90-day synthetic journal shaped like `JournalData` — 90 `metrics` rows, 47 `workouts`, a `read`
habit with a deliberately planted 30-day run — 10,787 characters of JSON, ~3.4k tokens. Ground
truth computed in Python, independently of any model. Eight questions of exactly the kind asked
for. Temperature 0, `num_ctx` 16384, seed 42, JSON-schema-constrained output **with an explicit
`null` escape hatch**, and a system prompt saying *"Never guess; if the data does not say, answer
null."*

### Condition A — the whole journal in context, model computes

| Question | Truth | `llama3.1:8b` | `gemma4:12b` | `qwen38-27b` |
|---|---|---|---|---|
| days trained in August | **18** | 31 | 16 | 19 |
| longest `read` streak | **30** | 31 | 51 | 59 |
| worst weekday for sleep | **Tuesday** | Monday | Sunday | Tuesday ✅ |
| workouts logged in total | **47** | 32 | 46 | 48 |
| average sleep, whole journal | **6.84** | 7.0 | 6.86 ✅ | 6.87 ✅ |
| pickleball sessions | **10** | 6 | 9 | 8 |
| total gym minutes | **465** | 345 | 330 | 330 |
| days slept under 6 h | **13** | 4 | 11 | 12 |
| | | **0/8**, 3.3 s | **1/8**, 12.9 s | **2/8**, 3.2 s |

**Scaling the model did not fix the errors. It tightened them around the wrong answer.**

Read the three columns left to right on "workouts logged in total": 32, then 46, then 48, against a
true 47. `llama3.1:8b` saying 32 is wrong in a way you might notice. `qwen38-27b` saying 48 is wrong
in a way you never will — it is exactly what a correct answer looks like. Same story on days trained
(31 → 16 → 19 against 18) and days under 6 h (4 → 11 → 12 against 13). A 3.4× bigger model turns a
visible failure into an invisible one, which for a health journal is a **worse** product, not a
better one.

The cells that did land are the tell: two of the three are the *average*, the one question whose
answer is robust to miscounting a few rows. Every question requiring a count or a sum over specific
rows failed in every model.

**`gpt-oss:20b` produced an empty string for all eight**, `eval_count: 6`, `done_reason: stop` —
verified on a re-run. It did **not** abstain; `{"answer": null}` would have been an abstention and
would have been the correct behaviour. It emitted nothing. This reproduces at 20.9 B the exact
failure `landscape.md` §2 measured on `qwen3-vl:2b` at 2.1 B: *some models silently produce nothing
under a JSON schema.* The rule from that section — verify structured output on your own schema
before trusting a model — is not a small-model rule.

### Condition C — the model picks an existing function

Sixteen real exports from `src/lib/stats.ts` and `src/lib/correlations.ts`, offered as Ollama tools:
name and a one-line description. **No journal data in context at all.**

| Model | Correct function | Latency | Notes |
|---|---|---|---|
| **`llama3.1:8b`** | **8 / 8** | **2.4 s** | Best of the four, and the cheapest |
| `gemma4:12b` | 8 / 8 | 21.7 s | 9× the latency for the same result |
| `gpt-oss:20b` | 7 / 8 | 9.4 s | chose no tool once |
| `qwen38-27b` | 6 / 8 | 2.9 s | fell back to `search` twice |

`llama3.1:8b` routed every question the way a competent engineer would — `activeDays` for "days I
trained", `habitStreak` for the streak, `bestWorstWeekday` for "when do I sleep worst",
`pickleballInsights` for the session count. It is 16-way classification over short descriptions,
which is a task an 8B model is genuinely good at, and it is the **only** thing we ask of it.

Note the inversion: **the largest model routed worst.** `qwen38-27b` twice reached for `search`, a
generic free-text fallback, instead of the exact function. More capability is not more reliability
for a narrow, well-specified job — which is the same reason a fine-tune is not the lever here.

### Condition C, second half — does the number survive being phrased?

App computes, model writes the sentence. `llama3.1:8b`, same settings:

| | Result |
|---|---|
| Number survived into the sentence | **8 / 8** |
| Sentence contained no other number | 7 / 8 |

The one flag — *"You slept less than 6 hours 13 times."* — is a **false positive in my checker**:
the `6` is the threshold from the question, not an invention. **Phrasing a correct number is safe;
deriving one is not.** Different jobs, and that split is the design.

### Why this is not a quirk of my test

Corroborated by [arXiv:2606.32029](https://arxiv.org/pdf/2606.32029) (USC/AWS, June 2026), which
measures *data-referencing errors* — citing the wrong cell, or omitting rows a count needs:

| Model | Task | Accuracy | **Data-referencing error rate** |
|---|---|---|---|
| Qwen3-8B | WTQ (table lookup) | 77.1 % | **14.0 %** |
| Qwen3-8B | FinQA (arithmetic-heavy) | 63.2 % | **33.6 %** |
| Qwen3-4B | WTQ | 75.7 % | 16.2 % |
| gpt-oss-20b | WTQ | 78.4 % | 5.7 % |

Two findings there matter more than the headline rates:

1. **An explicit anti-hallucination prompt did not help.** Qwen3-8B went 14.04 % → 14.34 % — i.e.
   nowhere — when told to use only the table and never fabricate. My prompt said the same and got
   0/8. **You cannot prompt your way out of this.**
2. **30–50 % of responses were "correct despite a referencing error"** — right number, wrong
   reasoning. So spot-checking final answers **understates the problem by roughly a third**, which
   is exactly how a feature like this ships feeling fine and is quietly wrong.

A journal is the FinQA case, not the WTQ case: "how many days did I train last month" is an
aggregation behind a date filter, not a lookup.

---

## 1. Do nothing / prompt an existing model

### What fits in 16 GB, measured

Ollama 0.33.3, `llama3.1:8b` (Q4_K_M, 4.92 GB on disk), sweeping `num_ctx`, reading `/api/ps`
`size_vram` and `nvidia-smi` together:

| `num_ctx` | Ollama VRAM | Whole-GPU used | Load | Throughput |
|---|---|---|---|---|
| 2,048 | 5.00 GB | 6.53 GB | 3.9 s | 134 tok/s |
| 4,096 | 5.27 GB | 6.81 GB | 4.2 s | 122 tok/s |
| 8,192 | 5.93 GB | 7.40 GB | 3.9 s | 134 tok/s |
| **16,384** | **7.02 GB** | **8.38 GB** | 4.1 s | **135 tok/s** |
| 32,768 | 9.21 GB | 10.42 GB | 5.2 s | 133 tok/s |
| **131,072** (model default) | **14.09 GB** | **14.93 GB** | 7.2 s | **28 tok/s** |

**Trap, and it is the most useful number here: the model file size is not the VRAM cost.** A 4.9 GB
model was sitting in **13.39 GB of VRAM** when I started this work, because Ollama honours Llama
3.1's declared 131,072-token context and the KV cache runs ~137 KB per token. At the default context
the card is full and throughput collapses from 135 to **28 tok/s** — a 4.8× penalty, the signature
of spilling out of VRAM.

**Always pass `num_ctx` explicitly.** 16k is the sweet spot: 7.02 GB, full speed, and vastly more
than one sentence or one tool call needs.

Second number worth writing down: **Windows itself holds 1.78 GB** of the 15.92 GB the driver
reports (16,303 MiB). The usable budget is **~14.1 GB, not 16** — measured after unloading every
model.

### What prompting gets you, per job

| | Job 1 — extraction | Job 2 — Q&A |
|---|---|---|
| Stock 8B, constrained schema | **Good enough, as a fallback only** | **Good enough, if it never does arithmetic** |
| Measured | 3/3 target sentences, 2.4 s warm (`landscape.md` §2) | 8/8 routing, 2.4 s |
| Fails by | fabricating a field the sentence never stated | choosing a plausible-but-wrong function |
| Guard already built | `validate.ts` `RANGES`, then human confirm | the function returns a correct number or none |

For **extraction**, `landscape.md` settled it: the grammar handles common sentences, the LLM is an
opt-in fallback for the `bullet` case, every field is nullable, the user confirms. Nothing found
here revises that, and a fine-tune would not either (§2).

For **Q&A**, prompting works *because the design removes the part the model is bad at*. That is not
a fine-tuning problem. It is an architecture choice, and it is free.

### Where prompting genuinely fails

| Failure | Real? | Fix |
|---|---|---|
| No matching function ("how did mood track protein in July") | **Yes** | Write the function. There are already 400, and `correlations.ts` exports `pearson` |
| Ambiguous routing between near-identical functions | **Yes at scale** — my set was 16, not 400; `qwen38-27b` already fell to `search` twice | Expose a **curated ~20-tool subset**, never everything |
| Multi-hop ("compare August's streak to July's") | **Yes** | Out of scope. Two calls and a subtraction is app code |
| 18.6 s cold start (`landscape.md` §2) | Yes | `keep_alive`, or accept it once per session |

None of those is solved by training. Three are solved by writing a function, which this repo is
already extremely good at.

---

## 2. Fine-tuning: is it justified?

**No.** Three independent reasons, any one sufficient, ordered by how hard they are to argue with.

### Reason 1 — there is no training data, and it is not fixable

| Source | Examples available **today** |
|---|---|
| `src/lib/capture.test.ts` hand-written fixtures | **29** |
| `src/lib/voice/intent.test.ts` | **1** |
| The user's own journal, as labelled extraction pairs | **0** |
| **Total hand-labelled** | **30** |

That third row is the crux, and it deserves stating plainly. This is a **single-user app**. There is
one journal, and it stores **records, not utterances**. The app has never kept "what the user said"
alongside "what got written", so there is no corpus to mine — not a small one, *none*. Fixing that
means shipping logging and then waiting months.

Against 30, the published evidence on what a LoRA needs:

| Source | Finding |
|---|---|
| [arXiv:2508.04063](https://arxiv.org/pdf/2508.04063) | QLoRA on **Llama-3-8B failed outright** at ~150 structured-JSON examples — F1 0.165–0.408 against a 0.165 baseline, i.e. **at or barely above doing nothing**. Authors state the family *"requires much more data than 50–100 examples"* |
| Same paper | Synthetic augmentation rescued it: 0.408 → **0.653** |
| [arXiv:2606.08051](https://arxiv.org/html/2606.08051v1) | 96.75 % F1 on JSON field extraction at 8B — using **6,125 examples**, with no smaller-dataset ablation |
| Practitioner consensus, 2026 | *"500+ high-quality examples"* before fine-tuning is worth starting. **Folk wisdom, not a benchmark — unverified** |

**30 examples against a documented floor of "more than 150, probably thousands."** The single paper
that tested an 8B model at this scale found fine-tuning made it **worse than the base model**.

**No study was found reporting a crossover point — "at N examples LoRA overtakes few-shot" — for
structured extraction.** That absence is itself a finding: the question is not established enough
for anyone to have answered it, and this app sits two orders of magnitude below the smallest
dataset anyone reports succeeding with.

### Reason 2 — the Windows/Blackwell toolchain is not ready

The RTX 5070 Ti is `sm_120` (Blackwell). As of 2026-09-12:

| Component | Status | Source |
|---|---|---|
| **bitsandbytes on sm_120** | **Open bug, unresolved.** Issue #1937 (2026-05-05, "Waiting for Info"): *"sm_120 not in supported architecture list"*, *"no kernel image available"* — **reported specifically on Windows**. The maintainers' workaround is to quantize on an Ampere/Hopper GPU and transfer weights | [bitsandbytes#1937](https://github.com/bitsandbytes-foundation/bitsandbytes/issues/1937) |
| **flash-attention on Blackwell** | **No official support merged.** Issue #2535 open since 2026-05-04, no PR. Unofficial community Windows wheels exist; trust level unverified | [flash-attention#2535](https://github.com/Dao-AILab/flash-attention/issues/2535) |
| **xformers** | PyPI wheels lack sm_120; build from source with `TORCH_CUDA_ARCH_LIST="12.0"` | [xformers#1395](https://github.com/facebookresearch/xformers/issues/1395) |
| **PyTorch sm_120** | 2.7.0 first shipped cu128 Blackwell wheels; issue #164342 reports stable builds *"not yet fully stable"*. Verify `torch.cuda.get_arch_list()` contains `sm_120` | [pytorch#164342](https://github.com/pytorch/pytorch/issues/164342) |
| **triton-windows** | Maintained (release 2026-08-29) but **Beta**; open issue titled *"Triton Windows Production Readiness"* | [triton-windows](https://github.com/triton-lang/triton-windows/releases) |
| **torchtune** | **Deprecated.** Meta wound it down during 2025 (issue #2883). Do not start here | [torchtune#2883](https://github.com/meta-pytorch/torchtune/issues/2883) |

The load-bearing row is **bitsandbytes**. QLoRA *is* 4-bit bitsandbytes quantization; if its kernels
do not run on this card under Windows, QLoRA does not run on this card under Windows. The
maintainers' own workaround requires owning a second, older GPU.

The tooling that would work:

| Tool | Windows | 8B QLoRA VRAM (documented) | Verdict |
|---|---|---|---|
| **Unsloth** | **Yes, natively** — Desktop app since 2026-08-10, plus pip/WSL2/Docker. Explicit Blackwell page; needs CUDA ≥12.8, `TORCH_CUDA_ARCH_LIST="12.0"`, triton ≥3.3.1 | **6 GB minimum** (official table); 6.6 GB peak observed on a 4090 | The only realistic choice |
| LLaMA-Factory | Partial — its documented Windows bitsandbytes wheel targets CUDA 11.1–12.2, which **predates Blackwell** | 8B → 6 GB (own table) | Stale wheel is a live risk |
| Axolotl | **No** — docs say WSL2 or Docker; native install hits Triton conflicts (#2810) | not published | WSL2 only |
| TRL + PEFT direct | Yes | inherits the same bitsandbytes risk | Slowest — 2.87 s/step vs Unsloth's 2.07 s/step (Llama-3.1-8B LoRA) |
| `llama.cpp` `llama-finetune` | Yes | — | **A toy.** Removed once, restored, OOMs on current models (#22040). Its real role is merging a LoRA into GGUF, not training |

There is a directly relevant data point: **Unsloth issue #5266 is an RTX 5070 Ti user on Windows.**
It closed as working — but only after `TORCH_CUDA_ARCH_LIST=12.0`, `CUDA_VISIBLE_DEVICES=0`,
`CUDA_MODULE_LOADING=LAZY` and a GPU-preference registry edit. That is the shape of the day you
would be signing up for, before writing a single training example.

**Does WSL2 rescue it?** It is the documented path for Axolotl and supported for Unsloth, but it is
not free: **~5–10 % lower VRAM utilization** from paravirtualization, plus **200–500 MB that Windows
reserves before the WSL2 hypervisor starts, invisible from inside WSL2**. On a card whose usable
budget is already 14.1 GB, that is a real haircut. General compute overhead is cited at 5–15 %; the
one concrete benchmark found (68 tok/s native Linux vs 58 tok/s WSL2 on a 4070 Ti) is **inference,
not training — treat as a proxy, unverified**. Disk cost: **unverified**, no sourced figure found.

### Reason 3 — it would fit, and that was never the constraint

| Config | VRAM | Confidence |
|---|---|---|
| 8B, 4-bit QLoRA, minimal | 6 GB | Documented (Unsloth, LLaMA-Factory tables) |
| 8B QLoRA, rank 16, seq 1024, batch 1 | ~7–8 GB | **Extrapolated** |
| 8B QLoRA, batch 4 × grad-accum 4, seq 2048 | **14–15 GB peak** | Community-reported — *at or over* budget |
| **Usable budget on this machine** | **14.1 GB** | **Measured** (15.92 − 1.78 Windows) |

So realistically: **rank 16–32, seq len 1024–2048, batch size 1–2 with gradient accumulation.**
Batch 4 at seq 2048 does not fit once Windows takes its 1.78 GB.

Time for 1,000 examples × 3 epochs: **~45–85 minutes, extrapolated, low confidence.** No RTX 5070 Ti
QLoRA training benchmark exists. The chain is a single blog's 4090 figure (~520 tok/s) scaled by the
5070 Ti's ~43.94 TFLOPS FP32 / 896 GB/s (both verified specs) against the 4090's ~82.6 TFLOPS /
1008 GB/s, giving **~300–350 tok/s — my extrapolation, not a documented number.** Benchmark a
50-step run before believing any of it.

**But the honest framing: a one-hour training run is cheap. Producing the 1,000 examples it eats is
not — and Reason 1 says they would be synthetic anyway. The GPU time was never the cost.**

---

## 3. Where would the training data come from?

Answered plainly, because this is the question that kills the idea: **there is not enough data, and
generating it would train the model to imitate the very thing it is meant to replace.**

| Source | Yield | The problem |
|---|---|---|
| **The user's journal** | **0 pairs** | It stores records, not utterances. No `(sentence, record)` history exists because the app never kept one |
| **Synthetic from the schema** | Unlimited | **Circular** — see below |
| **A larger local model labels** | Thousands | Best of the three, and bounded above by the teacher's own accuracy. You cannot distil past `gpt-oss:20b`, which in §0 emitted nothing at all under a schema |

The synthetic row is the one people talk themselves past, so state it as a rule:

> **A fine-tune whose labels come from a deterministic parser can only approximate that parser.**

To generate `(sentence, record)` pairs from `ImportRecord` you must decide which sentences map to
which records — and that decision *is* `capture.ts`. You would be distilling a grammar that is
**100 % correct on the sentences it covers** into a model that is ~97 % correct, slower, and 5 GB
heavier. Worse, the failure mode flips: from *"returns `bullet`, keeps your words, nothing is
written"* to *"invents a number"*. You would trade a lossless failure for a lossy one and pay VRAM
for the privilege.

### If the numbers were different, the method would be sound

For completeness, because the evidence does **not** say synthetic data is bad:

- **Model collapse is documented for *iterative* self-training** — model N trained on model N−1's
  output over generations ([arXiv:2509.16499](https://arxiv.org/html/2509.16499v1)).
- **Single-round distillation shows no such degradation**
  ([arXiv:2510.01631](https://arxiv.org/pdf/2510.01631) explicitly rejects several earlier collapse
  conjectures at pretraining scale), and a one-round synthetic augmentation is the documented
  rescue in arXiv:2508.04063 (0.408 → 0.653 F1).
- **No 2026 paper isolates "20B→8B distillation for narrow extraction"** as a controlled experiment
  — *unverified*, supported only by adjacent results.

So generating data once with a larger model and training once would **not** collapse. It would just
be pointless here, for the circularity reason above.

### How many examples each job would actually need

| Job | Needed | Have | Gap |
|---|---|---|---|
| Extraction → `ImportRecord` | **≥1,000; plausibly 6,000** (arXiv:2606.08051 used 6,125) | 30 | **33×–200×** |
| Q&A tool routing | ~200–500, *unverified* | 0 | **irrelevant — it already scores 8/8 with zero** |

That second row is the whole argument in miniature. **The job we most want is the job that needs no
training at all**, because we reduced it to something an 8B model is already good at.

---

## 4. The Q&A job: three designs, weighed

The three example questions map onto functions that **already exist and are already tested**:

| Question | Existing function | File |
|---|---|---|
| "how many days did I train last month" | `activeDays(data)`, `workoutSplitCounts(data)` | `src/lib/stats.ts:65`, `:299` |
| "what's my longest streak" | `longestStreak(data)`, `streakLeaderboard(data)` | `src/lib/stats.ts:113`, `src/lib/correlations.ts:369` |
| "when do I sleep worst" | `bestWorstWeekday(data, 'sleep')` | `src/lib/correlations.ts:503` |

That is not a coincidence, it is the finding. `src/lib/` exports **400 functions**; `stats.ts` and
`correlations.ts` alone hold ~60 answering questions of this exact shape, each with a `.test.ts`
beside it. **The analytics layer for this feature was finished before the feature was proposed.**

| | (a) Model writes a query | (b) Retrieval over summaries | **(c) Model picks a function** |
|---|---|---|---|
| Who computes | the model | a batch job; model reads | **`src/lib/`, already tested** |
| Accuracy | 39–51 % EX for 7–8B on BIRD; 64–66 % frontier | exact *if* anticipated | **exact, always** |
| Measured here | **0/8, 1/8, 2/8** | not tested | **8/8** (`llama3.1:8b`) |
| New code | a query engine over nested JSON | summary generator + index + staleness rule | **a ~20-entry manifest** |
| Fails by | a wrong number that looks right | *"I don't have that"*, or a **stale** number | wrong function → a right answer to the wrong question |
| Wrong answer visible? | **no** | yes | **yes** — the UI names the function it called |

### (a) Model writes a query — no

Beyond my 0/8: documented text-to-SQL execution accuracy on BIRD is **39.05 % for Qwen2.5-Coder-7B,
47.39 % at 14B, 50.39 % at 32B**, against **64.02 % GPT-4o** and **65.97 % Gemini-2.5-Pro**
([arXiv:2606.29733](https://arxiv.org/html/2606.29733)). That paper's own recommendation for
self-hosted private data is *"serve a mid-to-large size [14B+]"* — it does not recommend 7–8B for
unsupervised query generation at all.

A journal schema is narrower than BIRD's cross-database benchmark, so real accuracy would be higher
— **unverified, no paper measures the narrow case.** It does not matter, because **`JournalData` is
not a table.** It is nested objects with `Record<string, Record<string, number>>` habit values and
a dozen optional array fields. There is no query engine to write against, so option (a) means
*building one* and then trusting an 8B model to drive it: two new risks in place of zero.

### (b) Retrieval over pre-computed summaries — no, but it has one real use

The fatal flaw is staleness, and it is specific: **this journal is written to every day.** A summary
index is wrong the moment the user logs a workout. So either you rebuild on every write — at which
point you have a slow cache in front of functions that run in microseconds — or you serve
yesterday's number. "You trained 17 days in August" when it is 18 is precisely the failure this
document exists to avoid, arriving by a different road.

Its one honest use: **the tool descriptions themselves.** At 400 functions you cannot put every
signature in the prompt. Retrieving the ~20 most relevant *descriptions* for a question, then
letting the model choose among those, is retrieval doing what retrieval is good at — **narrowing a
menu, not supplying a fact.** Only needed if a curated 20-tool manifest proves too small.

### (c) Model picks a function — yes

**Opinionated, and the measurements are one-sided.** 8/8 on the smallest and cheapest model tested,
2.4 s, zero new computation, and every number reaching the screen came from a function with a test
beside it.

The honest costs:

| Cost | Size | Mitigation |
|---|---|---|
| Wrong function chosen | **Real** — 0/8 at 16 tools on the 8B, but `qwen38-27b` already fell to `search` twice | Curate ~20. Name the function in the UI: *"from your streak leaderboard —"* |
| `llama3.1:8b` scores ~0.76 on BFCL | Mid-tier, not top | BFCL is thousands of adversarial schemas; this is 20 hand-written ones. Scores for `qwen3-8b`/`gpt-oss-20b` **could not be retrieved — unverified** |
| The model still phrases the answer | 8/8 fidelity measured | **Render the number from the tool's return value in JSX**; let the model write only the words around it |

That last mitigation is the one to actually implement, and it is nearly free. If React renders the
number from the tool result and the model supplies only prose, then **the model literally cannot
corrupt it** — the guarantee moves from "measured 8/8" to "structurally impossible". Same instinct
as the nullable-schema rule in `landscape.md` §2: do not rely on a model declining to do the wrong
thing when you can remove its ability to.

### The deeper argument

This app's entire design — grammar-first capture, `ingest/validate.ts`'s `RANGES`, the
confirm-before-write step, `ImportRecord[]` as the only seam a model may touch — is one decision
made repeatedly: **a model may propose, it may not compute, and it may never write.** Letting an LLM
do arithmetic on health data would be the first exception, and the least defensible one, because
the correct answer is already sitting in a tested function four lines away.

---

## 5. Evaluation

A model feature without an eval is a feature that degrades silently on the next `ollama pull`. Both
jobs need one, and they need **different** ones.

### What a bujo eval set looks like

| Job | Cases | Shape | Pass condition |
|---|---|---|---|
| **Extraction** | ~60: 30 the grammar handles, 20 it misses, **10 that must produce nothing** | `(sentence, expected ImportRecord[] \| null)` | field-level F1, **plus abstention on the 10** |
| **Q&A routing** | ~40: the 8 here, the questions actually asked, **8 with no matching function** | `(question, acceptable function set)` | correct function, **plus refusal on the 8** |
| **Phrasing** | reuse the 40 | `(question, computed result)` → sentence | number survives; **no second number appears** |

Note the last item in each middle cell. **The negative cases are the eval.** A set made only of
answerable questions measures fluency, and fluency was never in doubt.

### Measuring fabrication — the specific method

`landscape.md` §2 measured it by flipping one schema field from required to nullable and watching a
breakfast sentence produce two pickleball games. Make that a **standing gate**, not an anecdote:

| Metric | How | Threshold |
|---|---|---|
| **Fabrication rate** | For each of the 10 no-op sentences, count output fields the sentence never stated | **0.** Not "low" |
| **Abstention rate** | How many of those 10 returned `null`/empty | **10/10** |
| **Empty-output check** | Distinguish `{"answer": null}` from `""` — they are **not** the same | An empty string is a **failure**, not an abstention |
| **Schema-required canary** | Run the eval twice: once nullable, once with fields required. The required run **must fail loudly** | If it passes, the eval is not testing what you think |
| **Field-level F1** | Per field across the 50 answerable sentences | Track; regression is the signal |
| **Routing refusal** | Of the 8 unanswerable questions, how many chose no tool | **8/8** |

Rows 3 and 4 both came out of writing this document. Row 3 is there because my own harness scored
`gpt-oss:20b`'s empty strings as "abstained" — flattering, and wrong, until I checked the raw
content. Row 4 is the repo's own recurring lesson: the empty-journal a11y scan, the collapsed fold,
the smoke test pointed at a different application. **A fabrication gate that cannot be made to go
red is a fabrication gate that is off.** Flipping the schema to required is the cheapest possible
proof that it still bites.

Tooling: **promptfoo** (actively maintained, native JSON-schema assertions, CI-friendly) is the
right size — or plain `vitest`, which this repo already runs. DeepEval is also current, but its
extra value is an LLM-judge hallucination metric, and this eval is deterministic: the expected
records are known. **Do not introduce a model to grade a model when exact match will do.**

### "Good enough to trust" for a private journal

Not a single percentage, because the two jobs have different stakes:

| | Threshold | Why |
|---|---|---|
| A number the app **computed** | 100 %, and it already is | It came from a tested function |
| A record the model **proposed** | Any accuracy, **provided the user confirms** | `validate` → `plan` → confirm makes a bad proposal a wasted tap |
| A number the model **derived** | **No threshold is acceptable** | There is no confirm step for an answer, and the user cannot check it |

That third row is the policy. The user cannot verify "you trained 18 days in August" — verifying it
is *why they asked*. An extraction error is caught by the confirm screen; a Q&A error is caught by
nobody, ever. So extraction may use a model and Q&A may not, and **the asymmetry is about who checks
the output, not about which task is harder.**

---

## 6. The staged plan

Each stage is gated on the previous one proving it necessary. Stage 4 exists to be argued against,
not reached.

| Stage | What | Effort | GPU time | Gate to proceed |
|---|---|---|---|---|
| **1** | **Tool-calling Q&A over existing functions.** ~20-entry manifest from `stats.ts`/`correlations.ts`; Ollama `tools`; app executes and **renders the number**; model writes only prose. Opt-in, `num_ctx: 16384` | **6–10 h** | ~0 (inference) | Ship it. This is this week's work |
| **2** | **The eval set** (§5): ~100 cases in `vitest` or promptfoo beside the manifest, including the required-schema canary and the empty-output check | **4–6 h** | ~0 | **Stage 1 is not done until this exists** |
| **3** | **Fill gaps with functions, not training.** Each routing failure from stage 2 → a new export in `correlations.ts` or a better tool description. Retrieval over descriptions (§4b) only if 20 tools proves too few | **1–2 h each, ongoing** | 0 | Only if stage 2 shows a *routing* failure that 20 good descriptions cannot fix |
| **4** | **Fine-tune.** Requires, in order: (i) ≥1,000 real `(sentence, record)` pairs — meaning the app has been **logging what the user said** for months; (ii) bitsandbytes#1937 closed; (iii) a measured base-model plateau from stage 2 | **40–80 h + ~6 months of data collection** | 1–3 h/run, *unverified* | **All three. Expect never.** |

### Stage 1 in detail, because it is the one to do

The whole feature is a manifest and a dispatch. No new analytics, no new storage, no model download
— `llama3.1:8b` is already on disk and already scored 8/8.

1. `src/lib/voice/tools.ts` — ~20 `{name, description, params, run(data, args)}` entries pointing at
   functions that already exist. A lookup table, not logic.
2. Ask Ollama with `tools`, `num_ctx: 16384`, `temperature: 0`.
3. Execute the chosen function **in the app**. Feed back only its return value.
4. **Render the number in JSX.** The model's sentence goes around it.
5. Show which function answered. A visible *"from your streak leaderboard"* is what makes a wrong
   route survivable rather than silent.

**The trap to avoid in stage 1**, and it is the one this repo keeps re-learning: **do not pass
`JournalData` into the prompt "for context."** The moment the rows are in the window the model will
use them, and §0 is what that looks like. The tool result is the only data the model ever sees.

### What is deliberately not in this plan

- **No fine-tuning.** §2.
- **No new model download.** `llama3.1:8b` scored 8/8 and beat every larger model at routing.
- **No embeddings, no vector store.** 400 named functions with descriptions is a menu, not a corpus.
- **No change to the extraction path.** `landscape.md` settled it; nothing here revises it.
- **No multi-hop Q&A.** One question, one function. Comparisons are app code.

---

## Open questions, honestly flagged

| Question | Status |
|---|---|
| Does routing hold at 40+ tools rather than 16? | **Unverified, and the biggest risk to stage 1.** `qwen38-27b` already degraded to 6/8 at 16 tools. Measure before expanding the manifest |
| Why did the 27B route *worse* than the 8B? | **Unexplained.** Possibly IQ3_XXS quantization (11.9 GB at 3 bits) damaging tool-selection more than prose. Worth one experiment, not a blocker |
| `qwen3-8b` / `gpt-oss-20b` BFCL scores | **Could not retrieve** — rotated off the live leaderboard view |
| QLoRA throughput on this exact card | **Extrapolated**, ~300–350 tok/s. Nobody has benchmarked a 5070 Ti for this |
| Real-journal token count | Measured **3.4k tokens for 90 days**; a 2-year journal extrapolates to **~28k**, which would exceed a 16k context. Another reason the rows never enter the prompt |
| Does `gpt-oss:20b`'s empty output survive `think: true`? | **Untested.** It is a reasoning model and `think: false` may be fighting it. Irrelevant to the recommendation, but do not cite it as "broken" without checking |

---

## Sources

**Measured on this machine, 2026-09-12.** RTX 5070 Ti, 16,303 MiB, driver 610.47; Ollama 0.33.3;
Windows 11, 31 GB RAM. Harness: a 90-day synthetic `JournalData` with Python-computed ground truth;
8 questions × 3 conditions × 4 models; temperature 0, seed 42, `num_ctx` 16384.

**Tabular arithmetic and fabrication**
- [arXiv:2606.32029](https://arxiv.org/pdf/2606.32029) — *When LLMs Read Tables Carelessly* (USC/AWS). DRE rates; anti-hallucination prompting shown ineffective
- [TableBench, AAAI 2026](https://ojs.aaai.org/index.php/AAAI/article/view/34739/36894) — 64.48 % SOTA numerical reasoning vs 85.42 % fact-checking
- arXiv:2607.20492 — *PhantomFill* (via `landscape.md` §2)

**Fine-tuning data requirements**
- [arXiv:2508.04063](https://arxiv.org/pdf/2508.04063) — QLoRA on Llama-3-8B fails at ~150 structured examples; synthetic rescue 0.408 → 0.653
- [arXiv:2606.08051](https://arxiv.org/html/2606.08051v1) — 270M–8B LoRA extraction sweep, 6,125 examples
- [arXiv:2509.06883](https://arxiv.org/pdf/2509.06883) — UNH at CheckThat! 2025, fine-tune vs few-shot on claim extraction
- [LIMA, arXiv:2305.11206](https://arxiv.org/abs/2305.11206) — the "1,000 curated examples" precedent (alignment, not extraction)

**Synthetic data and collapse**
- [arXiv:2509.16499](https://arxiv.org/html/2509.16499v1) — collapse under iterative self-training
- [arXiv:2510.01631](https://arxiv.org/pdf/2510.01631) — *Demystifying Synthetic Data in LLM Pre-training*; single-round shows no degradation
- [arXiv:2503.03150](https://arxiv.org/pdf/2503.03150) — *Position: Model Collapse Does Not Mean What You Think*

**Text-to-SQL**
- [arXiv:2606.29733](https://arxiv.org/html/2606.29733) — *How Far Do On-Prem Open LLMs Get on Text-to-SQL?* BIRD numbers; 14B+ recommendation

**Tooling and hardware**
- Unsloth: [Windows install](https://unsloth.ai/docs/get-started/install/windows-installation) · [Blackwell/RTX 50-series](https://unsloth.ai/docs/blog/fine-tuning-llms-with-blackwell-rtx-50-series-and-unsloth) · [VRAM requirements](https://unsloth.ai/docs/get-started/fine-tuning-for-beginners/unsloth-requirements) · [issue #5266 — RTX 5070 Ti on Windows](https://github.com/unslothai/unsloth/issues/5266)
- [bitsandbytes#1937 — sm_120 unsupported on Windows](https://github.com/bitsandbytes-foundation/bitsandbytes/issues/1937)
- [flash-attention#2535 — no Blackwell support](https://github.com/Dao-AILab/flash-attention/issues/2535) · [xformers#1395](https://github.com/facebookresearch/xformers/issues/1395)
- [pytorch#164342 — sm_120 stable support](https://github.com/pytorch/pytorch/issues/164342) · [triton-windows releases](https://github.com/triton-lang/triton-windows/releases)
- [torchtune#2883 — wound down](https://github.com/meta-pytorch/torchtune/issues/2883)
- [Axolotl install](https://docs.axolotl.ai/docs/installation.html) · [#2810 Windows](https://github.com/axolotl-ai-cloud/axolotl/issues/2810) · [LLaMA-Factory install](https://llamafactory.readthedocs.io/en/latest/getting_started/installation.html) · [llama.cpp#22040](https://github.com/ggml-org/llama.cpp/issues/22040)
- [Unsloth vs Axolotl vs TRL vs LLaMA-Factory](https://www.marktechpost.com/2026/07/22/unsloth-vs-axolotl-vs-trl-vs-llama-factory-a-fine-tuning-framework-comparison-on-speed-vram-and-multi-gpu/) · [WSL2 GPU passthrough](https://insiderllm.com/guides/wsl2-local-ai-windows-guide/) · [RTX 5070 Ti specs](https://graphicscardsdatabase.com/gpu/nvidia-geforce-rtx-5070-ti)

**Evaluation**
- [promptfoo — JSON eval guide](https://www.promptfoo.dev/docs/guides/evaluate-json/) · [releases](https://github.com/promptfoo/promptfoo/releases)
- [BFCL via llm-stats](https://llm-stats.com/benchmarks/bfcl) — Llama-3.1-8B 0.761
