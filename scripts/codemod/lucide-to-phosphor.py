"""One-shot codemod: lucide-react -> the Phosphor icon registry + <Icon> wrapper.

Run from the repo root:  python scripts/codemod/lucide-to-phosphor.py [--apply]

What it does, per file that imports from 'lucide-react':

1. Rewrites the import to `src/components/icons`, renaming each glyph through
   icon-map.json (lucide's `Trash2` is Phosphor's `Trash`, and so on), and
   deduping names that collapse onto the same glyph (`Repeat` and `RefreshCw`
   are both `ArrowsClockwise`).
2. Rewrites every JSX use of those glyphs to `<Icon as={Glyph} size="…" />`,
   translating the old px `size={n}` to the three-step scale. Anything that is
   not a size — className, style, key, title, strokeWidth — is carried over
   untouched, except `strokeWidth`, which Phosphor does not have.
3. Imports the wrapper. If the file already has an identifier called `Icon`
   (several views destructure one from a lookup table), the wrapper comes in as
   `AppIcon` so the local binding still wins where it is meant to.

Deliberately NOT handled, and reported instead:
- JSX whose tag is a *variable* holding a glyph (`const Icon = tone.icon`).
  Those are real, and they need a human to decide the size and active state.
- `LucideIcon` type annotations, which are renamed but worth re-reading.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MAP = json.load(open(os.path.join(ROOT, 'scripts/codemod/icon-map.json'), encoding='utf-8'))

# px -> the three-step scale. The boundaries are where the old sizes actually
# clustered: 9-15 was "inline with text", 16-18 "sidebar and toolbar", 20+
# "empty state or card header".
def size_token(px: int) -> str:
    if px <= 15:
        return 'sm'
    if px <= 18:
        return 'md'
    return 'lg'


IMPORT_RE = re.compile(r"import\s*(?:type\s+)?\{([^}]*)\}\s*from\s*'lucide-react'\s*\n?")


def parse_names(spec: str):
    """Return [(imported, local, is_type)] from an import clause body."""
    out = []
    for part in spec.split(','):
        part = part.strip()
        if not part:
            continue
        is_type = part.startswith('type ')
        part = re.sub(r'^type\s+', '', part).strip()
        if ' as ' in part:
            imported, local = [x.strip() for x in part.split(' as ')]
        else:
            imported = local = part
        out.append((imported, local, is_type))
    return out


def rewrite_file(path: str, apply: bool):
    src = open(path, encoding='utf-8').read()
    if "'lucide-react'" not in src:
        return None

    imports = list(IMPORT_RE.finditer(src))
    glyphs = {}            # local name in this file -> registry name
    type_locals = set()
    unmapped = []
    for m in imports:
        for imported, local, is_type in parse_names(m.group(1)):
            if imported == 'LucideIcon':
                type_locals.add(local)
                continue
            if imported not in MAP:
                unmapped.append(imported)
                continue
            glyphs[local] = MAP[imported]

    body = IMPORT_RE.sub('', src)

    # Rename identifiers: every use of the local lucide name becomes the
    # registry name. Word-boundary matching is safe here because these are
    # PascalCase component names, and a rename that collides with an existing
    # identifier of the same name is exactly what we want (they are the same
    # glyph).
    for local, registry in sorted(glyphs.items(), key=lambda kv: -len(kv[0])):
        if local != registry:
            body = re.sub(rf'\b{re.escape(local)}\b', registry, body)
    for local in type_locals:
        body = re.sub(rf'\b{re.escape(local)}\b', 'IconGlyph', body)

    used = sorted(set(glyphs.values()))
    wrapper = 'AppIcon' if re.search(r'\bIcon\b(?!\s*[,}])', body) and 'const Icon' in body else 'Icon'

    # <Glyph ... /> -> <Icon as={Glyph} size="…" ... />
    converted = 0
    if used:
        tag_re = re.compile(r'<(' + '|'.join(re.escape(g) for g in used) + r')\b([^>]*?)/>', re.S)

        def to_wrapper(m):
            nonlocal converted
            glyph, props = m.group(1), m.group(2)
            size = 'md'
            def take_size(mm):
                nonlocal size
                size = size_token(int(mm.group(1)))
                return ''
            props = re.sub(r'\s*size=\{(\d+)\}', take_size, props)
            props = re.sub(r'\s*strokeWidth=\{[^}]*\}', '', props)  # Phosphor has no strokeWidth
            converted += 1
            return f'<{wrapper} as={{{glyph}}} size="{size}"{props.rstrip()} />'

        body, _ = tag_re.subn(to_wrapper, body)

    # Imports, placed where the lucide import used to be: first line of the file
    # that is an import, to keep the block together.
    lines = []
    if used:
        lines.append('import { ' + ', '.join(used) + " } from '@/components/icons'")
    if type_locals:
        lines.append("import type { Icon as IconGlyph } from '@/components/icons'")
    if converted:
        rel = '@/components/Icon'
        lines.append(
            f"import {{ Icon as {wrapper} }} from '{rel}'" if wrapper != 'Icon'
            else f"import {{ Icon }} from '{rel}'"
        )
    if lines:
        first_import = re.search(r'^import .*$', body, re.M)
        at = first_import.start() if first_import else 0
        body = body[:at] + '\n'.join(lines) + '\n' + body[at:]

    if apply:
        open(path, 'w', encoding='utf-8', newline='').write(body)
    return {'file': path, 'glyphs': len(glyphs), 'jsx': converted, 'unmapped': unmapped}


def main():
    apply = '--apply' in sys.argv
    targets = []
    for base, _dirs, files in os.walk(os.path.join(ROOT, 'src')):
        for f in files:
            if f.endswith(('.tsx', '.ts')):
                targets.append(os.path.join(base, f))
    total_jsx = total_files = 0
    unmapped = set()
    for t in sorted(targets):
        r = rewrite_file(t, apply)
        if not r:
            continue
        total_files += 1
        total_jsx += r['jsx']
        unmapped.update(r['unmapped'])
    print(f"{'applied' if apply else 'dry run'}: {total_files} files, {total_jsx} JSX icons converted")
    if unmapped:
        print('UNMAPPED (left as-is):', ', '.join(sorted(unmapped)))


if __name__ == '__main__':
    main()
