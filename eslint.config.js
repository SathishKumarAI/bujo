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
  globalIgnores(['dist', '@']),
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
  },
])
