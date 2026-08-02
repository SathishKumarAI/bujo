"""Collapse ten radii onto the three tokens.

    control  8px   buttons, inputs, segments — anything you operate
    card    14px   cards, sheets, panels — anything you read
    pill           pills, chips, avatars — shaped by their own text

Three passes, in increasing order of how much judgement they need:

1. `rounded-full` -> `rounded-pill`. Pure rename, identical computed value.
2. Radius overrides inside a `<Button>`'s className are deleted outright — the
   button owns its radius, and an override is drift by definition.
3. `rounded-xl` / `rounded-2xl` -> `rounded-card`, but only on elements that
   look like a card (they carry a `border-line`/`bg-card`/`bg-ink-*` class).
   Everything else is left for a human, because a rounded container is not
   automatically a card.

Run from the repo root. Prints what it changed; `--apply` to write.
"""
import collections
import glob
import re
import sys

counts = collections.Counter()
apply = '--apply' in sys.argv

BUTTON_RADIUS = re.compile(r'(<Button\b[^>]{0,600}?className="[^"]*?)\s*\brounded-(?:lg|md|xl|2xl|sm|xs|full)\b', re.S)
CARDISH = re.compile(r'\brounded-(xl|2xl)\b')


def is_cardish(class_attr: str) -> bool:
    return any(k in class_attr for k in ('border-line', 'bg-card', 'bg-ink-0', 'bg-ink-1', 'bg-ink-2'))


for path in glob.glob('src/**/*.tsx', recursive=True):
    text = open(path, encoding='utf-8').read()
    original = text

    # 1 · rename
    n = text.count('rounded-full')
    if n:
        counts['rounded-full -> rounded-pill'] += n
        text = text.replace('rounded-full', 'rounded-pill')

    # 2 · drop radius overrides on buttons (repeat: a className may carry two)
    for _ in range(4):
        new = BUTTON_RADIUS.sub(r'\1', text)
        if new == text:
            break
        counts['button radius override removed'] += 1
        text = new

    # 3 · card-shaped containers
    def card_radius(match: re.Match) -> str:
        line_start = text.rfind('\n', 0, match.start()) + 1
        line_end = text.find('\n', match.end())
        line = text[line_start:line_end if line_end != -1 else len(text)]
        if is_cardish(line):
            counts[f'rounded-{match.group(1)} -> rounded-card'] += 1
            return 'rounded-card'
        counts[f'rounded-{match.group(1)} left (not card-shaped)'] += 1
        return match.group(0)

    text = CARDISH.sub(card_radius, text)

    if text != original and apply:
        open(path, 'w', encoding='utf-8', newline='').write(text)

for key, n in sorted(counts.items()):
    print(f'{n:5d}  {key}')
print('applied' if apply else 'dry run — pass --apply to write')
