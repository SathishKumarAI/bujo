# Page audits

One file per page. Each was written while looking at the page in a browser with
the demo dataset loaded — not read out of the source — so the findings are about
what the product *feels* like, not what the code says.

**The question each file answers:** what stands between this page and something
a person would pay for?

## How to read a file

| Section | What it holds |
|---|---|
| **What this page is** | One paragraph. If this is hard to write, that is itself the finding |
| **Measured** | Numbers from the live page: height in screens, block order, counts |
| **Copy** | Wording, tone, voice, labels, empty states |
| **UI** | Type, spacing, colour, density, hierarchy — how it looks |
| **UX / IA** | Order, flow, what is where, what a user is trying to do |
| **Upgrades** | Ranked P1 / P2 / P3, each with the reason |
| **Leave alone** | What already works, so a later pass does not "fix" it |

**P1** = a person notices this on first visit · **P2** = noticed by a returning
user · **P3** = polish, worth doing when nearby.

## Method

- Demo data (`?demo=1`), desktop 1440×900 and phone 390×844.
- Navigate by clicking the real nav. This router ignores `popstate`, so a
  URL-driven sweep silently re-measures whatever view is already mounted.
- Numbers come from the DOM, not from estimating against a screenshot.

## Pages

| Cluster | Pages |
|---|---|
| Journal | [Today](today.md) · [Plan](plan.md) · [Monthly](monthly.md) |
| Fitness | Fitness · Pull-ups · Home Workout |
| Sports | Pickleball · Coaching |
| Habits | Trackers · Challenges · Focus |
| Wellbeing | Mindset · Cycle · Recovery |
| Library | Collections · Reading · Goals |
| Review | Insights · Stats |
| System | Settings · Account · Help · Welcome |

Filled in as each page is visited; unlinked names are not written yet.
