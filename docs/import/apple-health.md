# Importing from Apple Health

**One file, dropped in. Nothing leaves your device.**

The measurement this exists for is **basal body temperature**: on Cycle it is the
chart everything else is read against, and until now it was typed in by hand
every morning. If your phone or a thermometer app already writes it to Health,
this fills the whole history in one go.

---

## 1 · Getting the file off your iPhone

| Step | |
|---|---|
| 1 | Open **Health** |
| 2 | Tap your **picture or initials**, top right |
| 3 | Scroll to the bottom → **Export All Health Data** |
| 4 | Wait. It can take **several minutes**, and on a large history much longer |
| 5 | Share it somewhere you can reach from this app — Files, iCloud Drive, AirDrop to a computer, an email to yourself |

You get **`export.zip`**. Do not unzip it; drop the zip in as it is. It contains
`export.xml`, which is 20× larger — a real 1.5-year export is 5.5 MB zipped and
**109 MB** unzipped — so the zip is both the smaller thing to move and the one
the app wants.

Then, here: **Settings → Data → Apple Health**, and drop the file on the box.

### If it is a big export, use a computer

A ten-year history is 1–2 GB of XML inside a 60–200 MB zip. The app streams it
and never holds it (see §5), but mobile Safari kills a tab that runs out of
memory **without an error** — the page just goes blank. A desktop browser has
far more room. The app tells you how much XML it is reading as it goes.

### If "Preparing…" never finishes

A known Health problem, not a problem with this app — people report multi-hour
waits and occasionally empty zips. Try again, or export from a period when the
phone is charging and unlocked.

### An already-unzipped `export.xml` works too

Dropped straight in, whatever it has been renamed to. The file is identified by
its first four bytes, not its extension.

---

## 2 · What gets imported

Read the middle column as "one number per day". Every value is converted from
whatever unit your phone exported into the unit you have set in **Settings →
Profile**.

| In Health | How a day is reduced | Lands in |
|---|---|---|
| Basal body temperature | **the earliest reading of the day** | The temperature chart on **Cycle** |
| Body temperature | earliest of the day | **Off by default.** Only with the switch on, and only on days with no basal reading |
| Steps | sum | Your daily step count |
| Active energy | sum | Calories burned |
| Sleep | hours asleep, on **the day you woke up** | Sleep hours |
| Resting heart rate | average | Resting heart rate |
| Weight | last of the day | The weight trend on **Gym** |
| Body fat percentage | last of the day | Body fat |
| Lean body mass, waist | last of the day | Body measurements |
| Calories, protein, carbs, fat eaten | sum | Nutrition |
| Period days | — | The flags on **Cycle**, if the Cycle tracker is on |
| Workouts | one row each | Your training log |

Workouts are imported only where the activity means the same thing in both apps:
running, cycling, swimming, rowing, walking, hiking, yoga, HIIT, strength
training, pickleball. **Anything else is left out and counted**, rather than
filed as "Other" — a wrong label you cannot see is worse than a gap you can.

### Why basal temperature is the *earliest* reading

A basal temperature means the one taken on waking, before getting up, eating or
drinking. A reading from later in the day is an ordinary body temperature, and
averaging it in — or letting the most recent one win — flattens the small shift
after ovulation that the chart exists to show. So the first reading of each day
is the one used.

For the same reason, **basal and general body temperature are never mixed.** They
are different measurements. If you switch the general one on, the app tells you
how many days it filled and never lets it overwrite a basal reading.

---

## 3 · What is *not* imported, and why

| Not imported | Why |
|---|---|
| **GPS routes** from workouts | They name where you live. No field here uses them, and the safest handling of data you have no use for is not opening the file |
| **Clinical records** (`export_cda.xml`) | A duplicate rendering of medical documents in a format nothing here reads |
| **Heart-rate samples** from workouts | Thousands per day. One year of them is larger than an entire ten-year journal |
| **Sleep stages** (REM, Core, Deep) | Sleep is stored as one number, total hours asleep. The stages are used to compute it and then dropped |
| **Daily walking/running distance** | It would be counted twice against your workouts' own distances |
| Exercise and Stand ring minutes | Workouts already carry minutes; a second, differently-calculated figure would disagree with the first on the same screen |
| Heart-rate variability, VO₂ max | Nothing in the app shows them yet |
| Blood pressure, glucose, blood oxygen, ECG, audio exposure | This is a journal, not a medical record |
| Date of birth, sex, blood type | Nothing uses them |

---

## 4 · The merge rule

**What you typed wins. Always, by default, and you see the disagreements before
anything is written.**

| Situation | What happens | What the preview says |
|---|---|---|
| The app has nothing for that day | Health's value is written | counted as **new** |
| The app already has the **same** value | nothing happens | **already in your journal** |
| The app has a **different** value you entered | **Your value is kept.** Health's is discarded | **kept yours**, listed with both numbers and a button to take Health's instead |
| Steps, resting heart rate, active energy | Health's value is written | counted as **replaced** — no form in the app can type these, so there is nothing of yours to protect |
| A value outside a sane range | the record is skipped | **skipped** |

Out-of-range values are **skipped, not corrected**. A body fat of 900% clamped to
70 would be a number nobody could later tell from a real one.

### Nothing is written until you press Import

The whole import is assembled in memory first and applied in a single write, so:

- Closing the card, or a crash while reading, changes **nothing**.
- The import is **one** press of Undo, whether it carried 3 values or 11,000.
- It cannot half-apply. You get all of it or none of it.

Undo only reaches back so far, so the confirmation offers **"Export a backup
first"**. Take it on a large import — that file is the only way back a week
later.

### Importing the same file twice is safe

Everything is matched on the day and the measurement, so a re-import writes
nothing new. Re-export from Health next month and drop it in again: you will be
told how many days were already there.

---

## 5 · Where the data goes, exactly

**The file is read on your device and never uploaded.** There is no network call
anywhere in the import — no server, no "parsing service", nothing.

**But be clear about the second half of that:** an imported temperature is a
journal field exactly like one you typed. So **if you have already switched on
any sync** — Supabase, Google Drive, a folder, a self-hosted server — imported
health values travel with the rest of your journal, on the paths you already
chose. The import does not add a path and does not change how sync works. If you
would rather health data stayed on this device only, turn sync off before
importing.

Getting it back out again: **Settings → Data → Backup** exports the whole journal
as JSON, and the per-domain CSVs (metrics, workouts, body) are plain text a
spreadsheet reads. Nothing imported here is locked in a format only this app
understands.

---

## 6 · How days and timezones are decided

The day is the **local date written on the record**, exactly as your phone wrote
it. A run at 08:00 in Tokyo is filed on that Tokyo date, and stays there if you
import the same file from London two years later.

| Case | Rule |
|---|---|
| A workout | the day it **started** |
| A night's sleep | the day it **ended** — the day you woke up |
| Steps, energy, food | the day of each reading, summed |
| A nap | its own day, kept separate from that night |
| Travel across timezones | a 23- or 25-hour day is left alone. It really happened |

Sleep crossing midnight belongs to the waking day because that is how it is
read: "I slept seven hours last night" is said while looking at today.

### One honest gap

Before roughly 2022 — and for anyone without a Watch — Health recorded only
**time in bed**, not time asleep. Where a night has no asleep data, time in bed
is used instead and the preview tells you how many nights that was. It is a
slight overestimate on those nights, and the alternative was importing zero
sleep for years of history and calling it a success.

### Why steps sometimes look lower than you expect

The export is a raw dump of every source, and it is **not** de-duplicated the way
the Health app's own screens are — a phone in your pocket and a Watch on your
wrist both record the same walk. Adding them gives roughly double, so the app
picks **one source per day**, preferring the Watch. That matches what Health
shows you.

---

## 7 · If something goes wrong

| It says | It means |
|---|---|
| "That zip has no export.xml in it" — and lists what it did contain | Probably the wrong zip. The names shown are what was inside |
| "That file is not a zip archive" | Not a Health export, or a partial download |
| "That zip is over 4 GB" | Beyond what this can index. Unzip it yourself and drop `export.xml` in |
| "N readings came in a unit we don't recognise" | Left out rather than guessed at. Everything else still imported |
| "Nothing in that file could be imported" | It was read, but held none of the measurements in §2 |
| The tab goes blank on a phone | Out of memory. Use a computer — see §1 |

Nothing in that list can damage an existing journal: every one of them happens
before anything is written.

---

## 8 · For the curious: why a `.zip` and not an app

There is **no server API for Apple Health**, and there cannot be one — HealthKit
is an on-device store and iCloud syncs it device-to-device, never to a web
endpoint. Reading it live needs a native iOS app, the paid Apple Developer
Program, and App Store review of a health app. A file you export and hand over is
the only route that works for every iPhone on day one, costs nothing, and keeps
the data on your device.

The engineering behind it, and the measurements: `src/lib/health/README.md`. The
format research, with sources: `docs/import/apple-health-research.md`. The merge
pipeline it feeds: `docs/import/ingest-architecture.md`.
