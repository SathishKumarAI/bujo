# 21 · Pickleball improvements — Summary

**Branch:** `bionic/21-pickleball-improvements`  
**Status:** Phase A complete, Phase B in progress  
**Date:** 2026-08-27

---

## ✅ Completed (Phase A - Heatmap Toggle)

### BUJO-280b: Add 1-year heatmap toggle
Implemented like `Stats` Activity card pattern.

#### Changes Made
1. **Heatmap range state** (line ~164-166):
   ```tsx
   // BUJO-280b: Add 1-year heatmap toggle (like Stats Activity card)
   const [heatWeeks, setHeatWeeks] = useState(13)
   const WEEKS = heatWeeks
   ```

2. **Segmented control** on Play heatmap card (lines ~275-308):
   - Options: `3mo` / `6mo` / `1yr`
   - Dynamic aria-label: "Heatmap of pickleball games played per day over the last {X} weeks"
   - Shows current range in subtitle

#### Evidence
```bash
$ grep "heatWeeks" src/views/Pickleball.tsx | wc -l
# Output: 6 (state, component uses, aria-label, subtitle display)

$ npx tsc -b --noEmit 2>&1
# No TypeScript errors
```

---

## 📋 Remaining (Phase B - Visual Hierarchy Redesign)

### Goal
Redesign Pickleball page with **data entities as main focus**, insights at bottom.

### Current Layout Issues
From STATUS.md and visual inspection:
- Page is 4.2 screens tall (reduced to ~2.6 with grid, still verbose)
- Static reference content (~1,000px) expanded while user data stays collapsed
- Logging form buried under analytics sections

### Priority Changes

#### A. Card Reordering (Primary Column)
**Current order:**
1. At a glance (summary stats)
2. Tournament countdown (conditional)
3. Log a session ← should be first!
4. History
5. DUPR tracker
6. Leagues & tournaments

**Desired order (data-first):**
1. **Log a session** ← primary action, data entry
2. **History** ← user's record (primary data)
3. At a glance ← summary metrics (can stay or move)
4. Tournament countdown
5. DUPR tracker
6. Leagues & tournaments

#### B. Static Content Collapse
Wrap these in collapsible sections:
- TIPS (physio/injury prevention)
- WARMUP (pre-match checklist)
- DRILLS (rotating practice focus)
- Format playbook (league formats)

Currently all expanded by default (~600px static content).

#### C. Analytics Consolidation
Group analytics into collapsible sections at bottom:
- Form & momentum (charts, forecast, milestones, intensity)
- Opponents, partners & venues (chemistry, courts, rivalries)
- Deeper signals (weekday, points, time, scoring, consistency)
- Charts section

---

## Implementation Plan

### Step 1: Card Reordering (Lines 325-405 in CardGrid)
```tsx
<CardGrid>
  // Insert Log a session FIRST after <CardGrid>
  <Card band title="Log a session" right={...}>...</Card>
  
  <Card band title="History" subtitle="..." collapsible>
    ...existing History content...
  </Card>
  
  // Move "At a glance" later, or keep here as summary
  
  {/* Tournament countdown */}
  {upcoming.length > 0 && (...)}
  
  {/* Analytics sections */}
  <Section title="Form & momentum">...</Section>
  ...
</CardGrid>
```

### Step 2: Static Content → Collapsible Sections
Move TIPS, WARMUP, DRILLS, Format playbook into collapsible sections:

```tsx
<Section title="Practice today & improve" collapsible>
  <div className="grid gap-4 md:grid-cols-2">
    {/* Today's rotating practice focus */}
    ...DRILLS content...
    
    {/* Warm-up checklist */}
    ...WARMUP content...
  </div>
</Section>

<Section title="Play safe & physio" collapsible>
  ...TIPS content...
</Section>

<Section title="Format playbook" collapsible>
  ...PICKLE_FORMATS content...
</Section>
```

### Step 3: Move "At a glance" to Secondary Column or Collapsible
Option A: Keep as top summary but make collapsible  
Option B: Move to secondary column in right rail (analytics area)

---

## Acceptance Criteria

- [x] **Phase A:** Heatmap has segmented control: 3mo / 6mo / 1yr ✅ DONE
- [ ] "Log a session" card appears above analytics sections
- [ ] History immediately follows logging form
- [ ] TIPS, WARMUP, DRILLS, Format playbook collapsed by default
- [ ] All existing data visualizations render identically to current behavior
- [ ] No breaking changes to `?view=` URLs or navigation

---

## Testing

```bash
# Verify TypeScript compiles
npx tsc -b --noEmit

# Run dev server and check Pickleball view
npm run dev
open http://localhost:5173/?view=Pickelball  # Note: typo in URL!
```

---

## Notes

- The heatmap toggle is complete and working
- Card reordering requires careful JSX manipulation (best done via replace_file)
- Collapsible sections improve UX by hiding static reference content until needed
- No breaking changes to data model or API

