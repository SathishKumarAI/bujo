# Coaching

`src/views/Coaching.tsx` · nav: Sports → Coaching · `?view=coaching`

## What this page is

A pickleball curriculum. A 12-week beginner→4.0 program with a day-by-day
schedule, a skill ladder from 2.0 to 4.5+, a shot-by-shot how-to, a drill
library, knee rehab/prehab, and a mental-game track.

This is the app's most *editorial* page — it teaches rather than records — and
it is the best-structured page in the product.

## Measured (1440×900, demo data)

- **1.5 screens · 8 blocks**, six of which are collapsed 102px strips.

| Block | Height | State |
|---|---|---|
| 12-week program · beginner → 4.0 | 247px | open |
| Today: Rest or wall | 255px | open |
| The 12-week roadmap | 102px | collapsed |
| Skill ladder · 2.0 → 4.5+ | 103px | collapsed |
| How to play every shot | 103px | collapsed |
| Drill library | 103px | collapsed |
| Knee rehab & prehab · ACL / MCL | 103px | collapsed |
| Mental game | 103px | collapsed |

## What works — and why it should be copied

**"Today: Rest or wall · Sun, your scheduled focus"** followed by *"True
recovery, or a light 20–30 min wall session (200+ touches just above net
height)"* and a seven-day strip (Mon Dinking · Tue Third-shot · Wed Serve · Thu
Transition · Fri Net · Sat Live · Sun Rest).

That is the pattern the whole product is reaching for: **one specific
instruction for today, with the week's shape visible behind it.** Today's own
page does not do this as well as Coaching does. Whatever else changes, do not
lose this card.

The collapse discipline is also right — two things open, six drawers closed —
and it is the reason a page holding this much content is only 1.5 screens.

## UX / IA

**P2 · Six identical drawers in a row.** Same problem as Pickleball, milder
because the names are honest. `The 12-week roadmap`, `Skill ladder`, `How to
play every shot`, `Drill library`, `Knee rehab & prehab`, `Mental game` — six
102px strips, visually indistinguishable, covering four different kinds of
content (a plan, a rubric, a technique reference, a rehab protocol). Grouping
them — *Learn* / *Practise* / *Body* — would let a reader aim.

**P2 · "Start the program" and "Today: Rest or wall" contradict each other.**
The first card offers to start a program you have not started; the second is
already telling you today's scheduled focus from that program. Either the
schedule is live or the program has not started.

**P3 · Knee rehab sits inside a pickleball coaching page**, and Pickleball has
its own "Play safe · physio & trainer notes". Two injury sections across two
pages in the same sport.

**P3 · "Mental game" here, and a whole "Mindset" view in the sidebar.** Related
content in two places with no link between them.

## Copy

**Best writing in the app.** *"Commit to 12 weeks: fundamentals → dinks →
third-shot drop → resets → hands → strategy → match play. Drill more than you
play."* — specific, confident, opinionated, and it teaches the method in one
line. *"200+ touches just above net height"* is the same: a real coach's
instruction, not an app's suggestion.

**P3 · The one weak line is "A 45–60 min session"**, floating above the weekday
strip with no verb. It is a caption trying to be a heading.

## Upgrades, ranked

1. **P2 · Group the six drawers** into two or three named clusters.
2. **P2 · Resolve the start/started contradiction** — hide "Today's focus" until
   the program starts, or drop the start button once it has.
3. **P3 · Cross-link the two injury sections** (here and Pickleball) rather than
   maintaining two.
4. **P3 · Cross-link Mental game ↔ Mindset.**
5. **P3 · Give "A 45–60 min session" a verb** or fold it into the card subtitle.

## Leave alone — and copy elsewhere

- **The "Today: <focus>" card.** The single best interaction pattern in the
  product. Today should learn from it.
- **The weekday focus strip.** Seven labels, immediately legible, no legend
  needed — the opposite of Today's unexplained bar chart.
- **The collapse discipline.** Two open, six closed. This is why the page is
  1.5 screens instead of Pickleball's 4.2.
- **The voice.** Do not sand this down. It is the strongest argument in the app
  that a person wrote it.
