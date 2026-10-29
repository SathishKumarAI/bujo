# Mobile brief — the prompt to start every phone page with

Paste the block below into Claude Code with the page name filled in. It is the
owner's direction from 2026-10-28, plus the numbers and traps learned doing
Pickleball first (COD-450, COD-451). The rules it cites live in `CLAUDE.md`
("A phone logs, a desktop reads").

---

```
<role>
You are redesigning ONE page of the bujo/Cadence app for phones, as a senior
iOS-minded product engineer. You have full latitude on the phone version:
change buttons, text, order, grouping, remove information. You have NO latitude
on the desktop version: it must not change.
</role>

<page>{{PAGE — e.g. Body → Strength}}</page>

<direction>
- A phone is for LOGGING and for reading back what you logged. A desktop is for
  reading analysis. On a phone: no charts, no trend cards, no analytics panels.
- The log is the first thing on the page. Every input is open — nothing behind
  a fold — in one form you scroll, not one you hunt through.
- Fit as much as possible into the first screen. Kill empty space. Essentials
  (date, the main numbers) must be visible without scrolling.
- iOS geometry: 17px fields, 15px labels, 13px uppercase section headers,
  44px minimum tap target, inset grouped sections, a full-width primary button.
- Phone vs desktop is decided by screen width (`useDevice()`), never a mode.
- Every new answer the user gives is stored on the journal (which syncs to
  Supabase); a field that is written must also be shown back somewhere.
</direction>

<steps>
1. Measure the page BEFORE touching it, at iPhone 13 Pro (390x664 visible) and
   at desktop 1440x900, with a Playwright probe in your scratchpad: page height,
   y of the submit button, visible fields, chart count, review panels/tabs,
   headings. Save the desktop numbers — they are the contract.
2. Reuse what Pickleball built: `FieldGroup` (components/ui/FieldGroup.tsx),
   `styles/phone.css` (`.ios-form`, `.ios-row`, `[data-chip-row]`),
   `panelsFor()`-style `phone: true` flags on review panels, and an early
   `if (phone) return` in the view with the form as zone 1 and no act column.
3. Put short choices on one line, label left (`className={phone ? 'ios-row' :
   undefined}`). Chip rows become one segmented row; pick-several rows wrap
   four to a line. Drop helper text the control already says.
4. Measure AFTER at 375, 390, 393 and 430px: no horizontal overflow, no
   clipped label (scrollWidth > clientWidth), no control under 44px, form
   height in screens. Re-run the desktop probe: it must be byte-identical.
5. Drive the real flow on the phone profile: tap the form, log, then read back
   `localStorage['bujo:data']` AND the history row. Report the stored values.
6. npm run verify, npm run design, npm run contrast — all exit 0, quoted.
7. One branch, one PR, before/after table in the body, a Plane item with
   repo:bujo, CLAUDE.md updated if you learned a new trap.
</steps>

<must>
- MUST keep the desktop DOM identical — `FieldGroup` renders the exact wrapper
  it replaces; anything phone-only is behind `useDevice() === 'mobile'`.
- MUST keep one form component shared by "log new" and "edit from history".
- MUST give every short chip label an announced name that CONTAINS it.
- MUST state numbers, not adjectives: "2.62 screens, was 3.05", not "tighter".
</must>

<must_not>
- MUST NOT stop or restart any server you did not start in this session.
- MUST NOT route a phone form through `useActColumn` — it shuts on a phone.
- MUST NOT add a media query for phone styling; scope under `.ios-form`.
- MUST NOT trust a screenshot for "empty" or "clipped" — measure the DOM.
- MUST NOT drop below 44px tap height to save space; save it elsewhere.
</must_not>

<output>
A short report: before/after table (phone and desktop), what you removed from
the phone and why, the e2e read-back, gate results, PR link, and the one
decision you need from the owner, if any.
</output>
```

---

## What Pickleball measured, for scale

| | before | after |
|---|---|---|
| form on the page (phone) | no — shut strip | first, y285 in demo (y~133 real) |
| inputs reachable | 1 | 22 incl. "How it went" |
| form height | — | 2.62 screens (3.05 before the density pass) |
| review panels on phone | 5, 3 analytics | 2 |
| desktop probe | — | byte-identical |

Why not literally one screen: ~22 inputs at a 44px floor is ~970px of
controls before a single label, against a 664px visible screen. One screen
holds the essentials (date, format, score); the rest is one scroll down. To go
further means fewer questions, not smaller ones.
