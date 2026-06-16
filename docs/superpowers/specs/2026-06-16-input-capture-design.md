# Input capture — design spec

**Date:** 2026-06-16
**Status:** approved, Phase 1 in build
**Goal:** Stop making the user type into the right form in the right view. Let them type (or say) one line anywhere and have it land in the right place.

## The bet

One **local, deterministic parser** is the single source of truth for every input mode. Typed text, tapped controls, and dictated speech all funnel through it. Build the parser once; three front-ends ride it.

No LLM, no backend, no network, no new data model — fits the locked local-first / E2E / BYO-data stance. Unknown input is never lost: it falls back to a plain journal note.

## Architecture

```
type / voice  ─┐
                ├─►  parseCapture(text, ctx)  ──►  preview  ──►  confirm / edit  ──►  existing store mutators
smart fields  ─┘        (lib/capture.ts, pure)
```

### Keystone — `lib/capture.ts` (pure, framework-free, unit-tested)

`parseCapture(text: string, ctx: CaptureCtx): CaptureResult`

- **Pipeline:** trim → run ordered matchers → first confident match wins → else `bullet` fallback.
- Each matcher is a small pure function owning one value shape. Adding a value type = add a matcher + tests. Nothing else changes.
- **Reuses:** `bullets.parseQuickCapture` (the `t`/`e`/`n`/`*`/`^` grammar) for the bullet path; `fitness.EXERCISE_LIBRARY` + a small alias map for exercise-name normalization; `date.ts` for day resolution.

```ts
export type CaptureKind = 'gym' | 'cardio' | 'metric' | 'habit' | 'bullet'
interface Base { raw: string; confidence: number }   // confidence 0..1

interface GymCapture    extends Base { kind: 'gym';    exercise: string; weight?: number; reps?: number; rpe?: number; unit: 'kg' | 'lb' }
interface CardioCapture extends Base { kind: 'cardio'; activity: string; distanceKm?: number; durationMin?: number }
interface MetricCapture extends Base { kind: 'metric'; mood?: number; sleep?: number; stress?: number }
interface HabitCapture  extends Base { kind: 'habit';  habit: string; value?: number }   // value absent = toggle done
interface BulletCapture extends Base { kind: 'bullet' }                                   // raw → addEntry

export type CaptureResult = GymCapture | CardioCapture | MetricCapture | HabitCapture | BulletCapture
export interface CaptureCtx { exercises: string[]; habits: string[] }
```

### Matchers (Phase 1 order)

| matcher | hits on | example | → |
|---|---|---|---|
| `gymSet`  | known/aliased exercise + `weight x reps` (+ `@rpe`/`rpe N`) | `bench 80x5 @8`, `ohp 40kg x8` | `addWorkout` (Strength, `setRows`) |
| `cardio`  | run/walk/cycle/bike/swim + distance and/or duration | `ran 5k 28min`, `walk 30min` | `addWorkout` (activity) |
| `metric`  | `mood N` / `slept N` / `sleep Nh` / `stress N` | `mood 7`, `slept 8h` | `setMetric` |
| `habit`   | text matches a known habit name (+ optional count) | `water 6`, `meditate` | `setHabitValue` / `toggleHabit` |
| `bullet`  | always (fallback); explicit `t/e/n/*/^` raises confidence | `t call mom #work` | `addEntry` |

Weight-x-reps convention follows the Gym row: first number = weight, second = reps (`80x5` → 80kg ×5). Unit defaults to the user's setting; `kg`/`lb` suffix overrides.

## Phases (each its own PR)

**Phase 1 — parser + capture bar.** `lib/capture.ts` + table-driven `capture.test.ts`; `components/CaptureBar.tsx` (one input, live preview chip showing parsed result + target view, `suggest.ts` dropdown, Enter commits, "edit fields" expands the structured form pre-filled). Wired into the Today view. **This PR.**

**Phase 2 — smart field controls.** `components/fields/*`: `Stepper` (±, long-press accelerate), `ChipGroup`, `Slider`, `EmojiScale`, `RepeatLast`. Retrofit Gym rows, Trackers, Fitness. Same controls back the capture bar's "edit fields" expansion.

**Phase 3 — voice.** Mic on the capture bar → `speech.ts` dictation flows into the **same** `parseCapture`. Add number-word normalization ("eighty" → 80) to the parser. Voice is nearly free once Phase 1 exists.

## Data flow & boundaries

- Output maps to existing mutators only: `addWorkout`, `setMetric`, `setHabitValue`/`toggleHabit`, `addEntry`. No new storage; E2E/local-first untouched.
- **YAGNI:** no LLM, no backend, no new schema. Don't resurrect the stale PR #2 wholesale — salvage the `SmartInput`/`QuickAdd` ideas, rebuild clean on `main`.
- **Escape hatch:** every parse is editable before commit; the user is never trapped by a wrong guess. Low-confidence input defaults to a note (lossless).

## Testing

Parser is pure → table-driven `vitest` (mirrors `suggest.test.ts`): each matcher gets hit / miss / ambiguous cases; the fallback proves no input is ever dropped.
