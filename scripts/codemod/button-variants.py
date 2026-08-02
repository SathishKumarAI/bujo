"""Second pass of the button migration: variant and size literals.

The first pass matched `<Button …>` with a regex, which silently skipped every
multi-line call site — `[^>]*` stops at the first `>`, and `onClick={() => …}`
contains one. This pass rewrites the literals wherever they appear, which is
safe because `variant=`/`size=` in this codebase belong to the button system
(shadcn's alert-dialog composes `buttonVariants` with the same names).

    default     -> primary      the solid accent fill is gone; the loud button is tonal
    outline     -> secondary    one bordered variant, not two
    link        -> ghost        a link-shaped button is a ghost with an underline class
    destructive -> danger
    xs          -> sm           three heights: 28 / 36 / 44
    icon-xs     -> icon-sm
"""
import collections
import glob
import os

REPLACEMENTS = [
    ('variant="default"', 'variant="primary"'),
    ('variant: "default"', 'variant: "primary"'),
    ("variant: 'default'", "variant: 'primary'"),
    ('variant="outline"', 'variant="secondary"'),
    ('variant: "outline"', 'variant: "secondary"'),
    ("variant: 'outline'", "variant: 'secondary'"),
    ('variant="link"', 'variant="ghost"'),
    ('variant="destructive"', 'variant="danger"'),
    ("? 'destructive' :", "? 'danger' :"),
    ('size="xs"', 'size="sm"'),
    ('size="icon-xs"', 'size="icon-sm"'),
    ('size="default"', 'size="md"'),
]

counts = collections.Counter()
for path in glob.glob('src/**/*.tsx', recursive=True):
    if os.path.basename(path) == 'button.tsx':
        continue
    text = open(path, encoding='utf-8').read()
    original = text
    for old, new in REPLACEMENTS:
        if old in text:
            counts[f'{old} -> {new}'] += text.count(old)
            text = text.replace(old, new)
    if text != original:
        open(path, 'w', encoding='utf-8', newline='').write(text)

for key, n in sorted(counts.items()):
    print(f'{n:4d}  {key}')
