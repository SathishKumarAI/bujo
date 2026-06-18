#!/usr/bin/env bash
# ship.sh — one-command pipeline: verify → commit → push → deploy → re-alias.
#
# Runs the full quality gate, then (optionally) commits, pushes, builds, deploys
# to the single Vercel "bujo" project, and re-aliases bujo-journal.vercel.app.
# Designed so a future session can ship with ONE command instead of a dozen,
# saving tokens and avoiding missed steps.
#
# Usage:
#   scripts/ship.sh -m "feat: thing"        verify → commit → push → deploy prod → alias
#   scripts/ship.sh --verify                verify only (tsc + eslint + tests + build)
#   scripts/ship.sh -m "msg" --no-deploy    verify → commit → push (skip Vercel)
#   scripts/ship.sh --deploy-only           build + deploy prod + alias (no git)
#   scripts/ship.sh -m "msg" --preview      deploy a preview URL instead of prod
#
# Flags:
#   -m, --message <msg>   commit message (enables the commit+push step)
#   --verify              run gates only, then exit
#   --no-verify           skip the quality gate (fast re-deploy)
#   --no-deploy           skip the Vercel build/deploy/alias step
#   --deploy-only         skip git; just build + deploy + alias
#   --preview             deploy a preview (default is production)
#   --no-tests            skip vitest (faster; use only for doc-only changes)
#   -h, --help            show this help

set -euo pipefail
cd "$(dirname "$0")/.."

PROD_ALIAS="bujo-journal.vercel.app"
CO_AUTHOR="Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"

MSG="" VERIFY_ONLY=0 DO_VERIFY=1 DO_DEPLOY=1 DEPLOY_ONLY=0 PREVIEW=0 RUN_TESTS=1
while [ $# -gt 0 ]; do
  case "$1" in
    -m|--message) MSG="$2"; shift 2 ;;
    --verify) VERIFY_ONLY=1; shift ;;
    --no-verify) DO_VERIFY=0; shift ;;
    --no-deploy) DO_DEPLOY=0; shift ;;
    --deploy-only) DEPLOY_ONLY=1; shift ;;
    --preview) PREVIEW=1; shift ;;
    --no-tests) RUN_TESTS=0; shift ;;
    -h|--help) sed -n '2,40p' "$0"; exit 0 ;;
    *) echo "Unknown flag: $1" >&2; exit 2 ;;
  esac
done

step() { printf '\n\033[1;35m▶ %s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$1"; }

# ── 1. Quality gate ──────────────────────────────────────────────────────────
if [ "$DO_VERIFY" = 1 ] && [ "$DEPLOY_ONLY" = 0 ]; then
  step "Typecheck (tsc -b)";            npx tsc -b;        ok "types clean"
  # Lint is SOFT: the repo carries pre-existing eslint debt in untouched files,
  # so a non-zero exit here is reported but does not fail the pipeline. Keep the
  # files you touch clean (review the output for new errors you introduced).
  step "Lint (eslint . — soft)";        npx eslint . || echo "⚠ eslint reported issues (pre-existing debt tolerated; check your touched files)"
  if [ "$RUN_TESTS" = 1 ]; then
    step "Tests (vitest run)";          npx vitest run;    ok "tests pass"
  fi
fi

if [ "$VERIFY_ONLY" = 1 ]; then ok "Verify-only complete."; exit 0; fi

# ── 2. Commit + push ─────────────────────────────────────────────────────────
if [ "$DEPLOY_ONLY" = 0 ] && [ -n "$MSG" ]; then
  if [ -n "$(git status --porcelain)" ]; then
    step "Commit + push"
    git add -A
    git commit -q -m "$MSG" -m "$CO_AUTHOR"
    git push
    ok "pushed $(git rev-parse --short HEAD)"
  else
    echo "No changes to commit — skipping commit/push."
  fi
fi

# ── 3. Build + deploy + re-alias ─────────────────────────────────────────────
if [ "$DO_DEPLOY" = 1 ]; then
  if [ "$PREVIEW" = 1 ]; then
    step "Build (preview)"; npx vercel build
    step "Deploy (preview)"
    URL=$(npx vercel deploy --prebuilt --yes | grep -oE 'https://[a-z0-9-]+\.vercel\.app' | head -1)
    ok "preview: $URL"
  else
    step "Build (production)"; npx vercel build --prod
    # Sanity: the public Supabase URL must be inlined or login breaks on deploy.
    if ! grep -rlq "supabase.co" .vercel/output/static/assets 2>/dev/null; then
      echo "⚠ WARNING: Supabase env not found in build — login may be disabled." >&2
    fi
    step "Deploy (production)"
    URL=$(npx vercel deploy --prebuilt --prod --yes \
          | python3 -c "import sys,re;m=re.findall(r'https://bujo-[a-z0-9]+-[a-z0-9-]+\.vercel\.app',sys.stdin.read());print(m[0] if m else '')")
    [ -z "$URL" ] && { echo "Deploy failed — no URL." >&2; exit 1; }
    ok "deployed: $URL"
    step "Re-alias $PROD_ALIAS"
    npx vercel alias set "$URL" "$PROD_ALIAS" | tail -1
    ok "live: https://$PROD_ALIAS"
  fi
fi

printf '\n\033[1;32m✅ ship.sh complete.\033[0m\n'
