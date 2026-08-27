# 21 · Pickleball improvements — plan

**Branch:** `main` · **Date:** 2026-08-27  
**Ticket:** Improving the Pickleball view (633 LOC) before next session  
**Supersedes:** None — new ticket

---

## Summary

Pickleball has the page contract but needs refinement. This plan addresses:
1. **Add 1-year heatmap toggle** (BUJO-280b) — like `Stats` Activity card
2. **Visual hierarchy** — make logging flow more prominent  
3. **Static content collapse** — fold TIPS/WARMUP/DRILLS playbook by default

---

## Review findings

### Current layout (from STATUS.md)
- 4.2 screens over twelve blocks → reduced to 2.6 screens with grid
- Still ~1,000px of static reference (physio notes, format playbook) expanded while user data stays collapsed

### Issues identified

| Issue | Location | Severity | Impact |
|---|---|:---:|---|
| Heatmap range | 13 weeks only | medium | Can't view 6mo/1yr play history (unlike Stats) |
| Logging prominence | Form position | low | Session log buried under analytics sections |
| Static content expansion | TIPS, WARMUP, DRILLS sections | medium | ~600px of coaching folded when it should be collapsed by default |

---

## Implementation plan

### Phase A: Add 1-year heatmap toggle (BUJO-280b)

Add a segmented control to switch between 13/26/52 weeks, like `Stats` Activity card. This requires:
- Changing inline `WEEKS = 13` to state-driven variable
- Adding segment options `{13: "3mo", 26: "6mo", 52: "1yr"}`  
- Recomputing `hStart`, `hPad`, `maxDay` based on selection

### Phase B: Visual hierarchy improvements

3. **Promote logging form**
   - Move "Log a session" card higher in the primary column
   - Current position is buried under analytics sections
   - Change: Swap order of logging + history cards to top of grid

4. **Collapse static content by default**
   - Files: `TIPS`, `WARMUP`, `DRILLS`, `FORMAT PLAYBOOK` cards
   - Current: all expanded (default state)  
   - Change: Add `collapsible={true}` with default collapsed, or wrap in parent Section that collapses them

---

## File changes summary

| File | Lines changed | Type |
|---|---|---|
| `src/views/Pickleball.tsx` | 40–60 | Phase A (heatmap toggle) + Phase B3/B4 |

**Total:** 1 file, ~40 LOC changed, zero breaking changes.

---

## Acceptance criteria

- [ ] Heatmap has segmented control: 3mo / 6mo / 1yr options
- [ ] "Log a session" card appears above analytics sections by default  
- [ ] TIPS, WARMUP, DRILLS cards collapsed in default view (expandable)
- [ ] All existing data visualizations render identically to current behavior

---

## Notes

- No breaking changes to `?view=` URLs or navigation
- Mobile layout unaffected (grid handles both modes)
- Tests pass: existing + new smoke test for heatmap range toggle
