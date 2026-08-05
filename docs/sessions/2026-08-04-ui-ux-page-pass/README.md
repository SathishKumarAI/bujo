# Session · UI/UX page pass — 2026-08-04

Branch `fix/ui-ux-page-pass`, off `chore/real-data-pass`.

## What this session is

Walk every page of the app with **real data in it**, one page at a time, and
run the same loop on each. Not a sweep, not a grep — look at the rendered
page, name what is wrong, write the fix down before writing the fix, apply it,
prove it.

## The loop (one pass per page)

```
┌─ 1 OBSERVE ──────────────────────────────────────────────────┐
│  Navigate to the view at 1440 with demo data loaded.         │
│  Screenshot. Snapshot the a11y tree. Read the console.       │
│  Record what is on screen, not what the code says is.        │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌─ 2 DIAGNOSE ─────────────────────────────────────────────────┐
│  Three lenses, in this order:                                │
│   · solution engineer — does it do the job the user came for?│
│   · frontend engineer — is it correct, fast, accessible?     │
│   · UX engineer      — is the hierarchy, copy, density right?│
│  Each finding gets a severity and a one-line failure case.   │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌─ 3 PROMPT ───────────────────────────────────────────────────┐
│  Write the fix as a numbered, self-contained prompt BEFORE   │
│  touching code — file paths, the exact change, the check.    │
│  If the prompt is hard to write, the diagnosis is not done.  │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌─ 4 FIX ──────────────────────────────────────────────────────┐
│  Apply the prompt. Root cause, not the call site that showed │
│  it — grep every caller of anything you touch.               │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌─ 5 VALIDATE ─────────────────────────────────────────────────┐
│  npx tsc -b · npx vitest run · npx eslint .                  │
│  Re-screenshot the same view. The frame is the proof.        │
│  A fix with no re-screenshot is a claim, not a result.       │
└───────────────────────┬──────────────────────────────────────┘
                        ▼
┌─ 6 RECORD ───────────────────────────────────────────────────┐
│  Append to this session: findings, prompt, diff summary,     │
│  before/after. Anything found that is a feature, not a bug,  │
│  goes to BACKLOG.md instead of into the diff.                │
└──────────────────────────────────────────────────────────────┘
```

**Why the prompt step exists at all.** It is the cheapest place to be wrong.
A prompt that cannot name the file it edits is a finding that was never
understood, and a fix written from that finding is a guess with a diff
attached. This is the same reason a training run gets a written hypothesis
before the hyperparameter is touched — the artefact that survives is the
reasoning, not the weights.

## Rules for this pass

| | |
|---|---|
| Viewport | 1440 x 900, desktop only (agreed) |
| Theme | mocha; re-check other themes only when a fix touches colour |
| Data | demo data loaded — 89 entries, 17 workouts, 15 memories |
| Defects | fixed in this branch |
| Features / improvements | documented in `BACKLOG.md`, **not** built |
| Deletions | none — `archive/components/` stays (permission not given) |

## Files

| File | What |
|---|---|
| `README.md` | this — the loop and the rules |
| `pages/*.md` | one file per view: observation, findings, prompt, fix, validation |
| `BACKLOG.md` | everything that was an improvement rather than a defect |
| `FINDINGS.md` | the flat ranked list across all pages |
| `VALIDATION.md` | gate output before and after |
