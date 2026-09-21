import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `@/` is not source. The shadcn CLI cannot resolve this repo's `@` alias —
  // the root tsconfig is solution-style (`files: []` + project references) and
  // carries no `paths` — so `shadcn add` writes its output into a literal `@`
  // directory at the repo root instead of `src/components/ui`. The files that
  // were wanted are copied into place by hand; what is left is stock upstream
  // output kept for diffing against the next `shadcn add`, and it should not be
  // linted or committed (see .gitignore).
  // `.claude/worktrees/*` are git worktrees other sessions check out inside the
  // repo. They contain a full second copy of the app, so linting them doubles
  // every finding — and because each carries its own tsconfig, typescript-eslint
  // cannot decide which root it is looking at and errors on every file.
  globalIgnores(['dist', '@', '.claude/worktrees']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      /**
       * A control that only appears on hover does not exist on a phone.
       *
       * Tailwind v4 wraps `hover:` in `@media (hover: hover)`, so
       * `opacity-0 group-hover:opacity-100` resolves to a permanently
       * invisible element on any touch device — measured: that media query is
       * `false` in a touch browser context. The app shipped **25 of these
       * across 18 files**: every Edit, Remove and × it has. Deleting a habit
       * row, a gym set, a book or a mis-tapped urge was impossible on a
       * phone, and the buttons were still in the layout the whole time.
       *
       * Neither rendering gate can see it. `npm run clipped` asks whether an
       * element shows less than it holds — a zero-opacity button shows
       * everything it holds. `npm run a11y` asks whether the tree is sound —
       * it is; axe does not fail an `opacity: 0` control. So this is a lint
       * rule rather than a gate: the only place it is catchable is the source.
       *
       * `.reveal` in `src/index.css` is the replacement. It inverts the
       * default — visible unless the device can genuinely hover — and brings
       * the control back on `:focus-visible` / `:focus-within` so keyboard
       * users on a mouse still reach it.
       *
       * Matched on any string literal rather than only on `className`,
       * because several class strings in this repo live in constants outside
       * JSX (`CARD.band` in `ui.tsx`, `tabClass` in `Settings.tsx`). A string
       * carrying both of these Tailwind classes is a class list; there is no
       * plausible false positive.
       */
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/opacity-0[^"\']*group-hover(\\u002F[\\w-]+)?:opacity-100|group-hover(\\u002F[\\w-]+)?:opacity-100[^"\']*opacity-0/]',
          message:
            'Hover-only control: `opacity-0 group-hover:opacity-100` is invisible on touch, because Tailwind wraps `hover:` in `@media (hover: hover)`. Use the `reveal` class from src/index.css instead — it shows the control on touch and hides it until hover on a mouse.',
        },
        {
          selector:
            'TemplateElement[value.raw=/opacity-0[^`]*group-hover(\\u002F[\\w-]+)?:opacity-100|group-hover(\\u002F[\\w-]+)?:opacity-100[^`]*opacity-0/]',
          message:
            'Hover-only control: `opacity-0 group-hover:opacity-100` is invisible on touch, because Tailwind wraps `hover:` in `@media (hover: hover)`. Use the `reveal` class from src/index.css instead — it shows the control on touch and hides it until hover on a mouse.',
        },
      ],
    },
  },
])
