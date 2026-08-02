# Recovery

`src/views/NoFap.tsx` · nav: Wellbeing → Recovery · `?view=nofap`

## What this page is

An opt-in abstinence tracker. A main streak with a milestone ladder, an
urge-surfing tool (pick the urge, rate the intensity, choose a coping action),
a HALT check, a judgement-free relapse log, and a full-screen SOS overlay.

This is the most sensitive page in the product and, on the whole, the most
carefully written. The notes below are about structure, not tone.

## Measured (1440×900, demo data)

- **2.3 screens.**
- **One top-level block, 2,059px tall.** The entire page is a single card.

## The finding that matters

**P1 · The page has no structure — it is one 2,059px card.** Streak ring, four
stat tiles, milestone preview, ten urge chips, an intensity control, four action
buttons, a HALT check with four toggles, and the resisted-urges log all live in
one container. There is no visual break between "here is how you are doing" and
"here is what to do right now", which are two very different moments.

Someone opening this page mid-urge has to scroll past their own statistics to
reach the tool that helps. Splitting into *Where you are* / *Right now* /
*History* would take nothing away and would put help first.

**P2 · Ten urge chips of very different weight, side by side.** Porn ·
Masturbation · Smoking · Vaping · Alcohol · Junk food · Sugar · Doomscrolling ·
Gaming · Caffeine. Presenting a pornography compulsion and a caffeine habit as
peer options in one row flattens the seriousness of the first and inflates the
second. Grouping, or letting the user choose which appear, would respect both.

## UX / IA

**P2 · Only the SOS overlay is reachable fast.** SOS is at the very top, which
is right — but everything else that helps in the moment (urge surfing, HALT,
"delay 10 min") is 800px down. In a crisis the page's structure is the
intervention.

**P3 · "Other urges (smoking, scrolling…) are logged + planned below"** — the
page explains its own information architecture to the user, which is usually a
sign the architecture needs the explaining.

## UI

**P2 · The streak number is the page's best asset and shares a screen with
everything else.** `16 · DAYS CLEAN · since Fri, Jul 17` with a ring, then
immediately four more numbers (`16 Current · 24 Personal best · 58 Total clean
days · 8 Urges resisted`). The 16 appears twice within 200px.

**P3 · "Intensity 3/5"** sits between the chips and the actions with no anchors,
unlike Focus's sliders which say `0 scattered · 10 deep flow`. What does 5 mean.

## Copy

**Excellent, and the reason this page works.** *"Feeling an urge? Pick what it
is and mark the win, it crests and passes in minutes."* — accurate, calm,
actionable, no shame. *"Confidence and motivation climb noticeably"* as a
milestone preview gives the streak a reason beyond the number. The HALT check
(Hungry / Angry / Lonely / Tired) is a real technique, correctly used.

**P3 · "Your main streak"** implies secondary streaks that the page then says
are "logged + planned below" — two sentences to explain a hierarchy the layout
could show.

## Upgrades, ranked

1. **P1 · Split the single card into three sections** — *Where you are*,
   *Right now*, *History* — and put *Right now* first when an urge is logged
   recently.
2. **P2 · Group or curate the urge chips** rather than listing ten as equals.
3. **P2 · Show the streak number once.**
4. **P3 · Anchor the intensity scale** (`1 passing · 5 overwhelming`).
5. **P3 · Let the layout express the main-streak hierarchy** so the explanatory
   sentence can go.

## Leave alone

- **The tone.** Judgement-free, specific, practical. This is the hardest writing
  in the app to get right and it is right.
- **SOS at the top**, always reachable.
- **The HALT check.** Real technique, correctly implemented, no embellishment.
- **Milestone previews with a quoted benefit** — this is what makes a streak
  mean something.
- **Opt-in, local-only.** Correct default for this content.
