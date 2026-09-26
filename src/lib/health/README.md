# `lib/health` — reading an Apple Health export

A reader, **not a write path**. It turns `export.zip` into `ImportRecord[]` and
hands them to `lib/ingest`, which already owns validation, the merge rule and the
single `replaceAll`. Nothing here touches a store, and nothing here fetches.

| Change | File |
|---|---|
| Which HealthKit identifier fills which journal field; unit conversion; workout activity map | `hk.ts` |
| Getting one entry out of a `.zip` without a dependency | `zip.ts` |
| Streaming `export.xml` without building a tree | `xml.ts` |
| Samples → one row per day; sleep sessions; source selection | `aggregate.ts` |
| `File` → records, and the sentences shown in the preview | `parse.ts` |
| All of the above | `health.test.ts` |

```
File ─ zip.ts ──► xml.ts ──────► aggregate.ts ──► ingest/validate ─► ingest/plan ─► replaceAll
       central    scan, no       fold per day     ranges, reject     one candidate  ONE write,
       directory  tree           (memory ceiling) not clamp          journal        one undo step
```

## The numbers this design is built on

Measured, not assumed. The first two are from a published real export
(`docs/import/apple-health-research.md`); the rest are from a generated fixture
run in this repo.

| Figure | Value |
|---|---|
| Real 1.5-year export | 109 MB XML · 5.5 MB zipped · 446,670 records — **20:1** |
| Real 10-year export | 1–2 GB XML · 2.8 M records |
| Generated 2.8 M-record run | **817.9 MB of XML** streamed |
| → records handed to the planner | **3,317** — bounded by *days*, never by samples |
| → peak heap | **116.7 MB** |
| → heap retained after the run | **−4.5 MB.** Nothing is held |
| → throughput | 150,247 records/sec (270,709 on a 1 M / 292 MB fixture) |

## Rules that keep this honest

- **Nothing accumulates.** The scanner's whole memory is one 256 KB chunk plus at
  most one partial element; `aggregate` folds into a `Map` keyed by ISO day, and
  ten years is ~3,650 keys. That is why 818 MB of XML costs 117 MB of heap.
- **No new dependency, because the platform covers it.** `DecompressionStream
  ('deflate-raw')` *is* a zip entry's decompressor (Safari/iOS 16.4+, ~95%
  global); only the container index had to be written, and that is ~90 lines.
  `DOMParser` and `await file.text()` are both impossible here, for different
  reasons — see the table at the top of `xml.ts`.
- **No Worker, deliberately, and it is not a shortcut.** The work is already
  chunked by the stream, and the progress tick `await`s a `setTimeout(0)` so the
  browser gets a frame. If a real import ever janks, `scanHealthXml` is an async
  generator over a `ReadableStream` and moves into a Worker without a rewrite.
- **The day is the string Apple wrote, offset ignored.** Never a UTC conversion
  and never the importing browser's zone. Both of those move records by a day,
  and the second one moves them again when the same file is imported elsewhere.
- **Never sum across sources.** `export.xml` is a raw dump, not the
  de-duplicated view the Health app shows; a phone and a watch both record the
  same walk. Watch preferred, phone as the fallback, never added together.
- **Basal and general body temperature are two measurements.** Separate fields,
  separate accumulators, general one off by default. Mixing them corrupts the
  one chart the feature exists to fill.
- **An unrecognised unit drops the sample and is counted.** A `lb` number in a
  field meaning kilograms is silent corruption; `convert()` returns `null`
  rather than passing a number through.
- **`export_cda.xml` and `workout-routes/*.gpx` are never opened.** The first is
  a redundant clinical rendering; the second is GPS that names the user's home
  and no field here consumes it.

## What is deliberately not mapped

HRV, VO₂max, exercise/stand minutes, per-workout heart-rate series, sleep
stages, daily walking distance, and the whole clinical family (blood pressure,
glucose, SpO₂, ECG). The reasons are one row each in the table at the top of
`hk.ts` — mostly "nothing reads it", and for the HR series "one year of samples
is larger than the entire measured ten-year journal".
