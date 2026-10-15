import { ArrowCounterClockwise, ArrowLineRight, Pause, Play } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useEffect, useState } from 'react'
import { cat } from '../../lib/colors'
import { Button } from '../ui/button'
import {
  PRESETS, useFocusTimer, secondsLeft, isRunning, phaseSeconds,
  start, pause, resume, reset as resetTimer, setPreset, advance, setTone, TIMER_TONES,
} from '../../lib/focusTimer'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * A Pomodoro timer: visual countdown, gentle work/break cycles, and a finished
 * work block auto-logs itself as a focus session.
 *
 * **It is the biggest thing on the page now, and it is on the right.** Those are
 * one decision, not two. `styles/layout.css` puts zone 2 (act) in the RIGHT
 * column and zone 3 (review) in the LEFT on a wide screen, against DOM order and
 * deliberately — so "a big timer on the right" is the same statement as "the
 * timer is what this page is for". Below the split it comes first in DOM order,
 * which is also right: you open Focus to start a block, not to read a chart.
 *
 * The ring went 140px → 240px at its own natural size and scales with the column
 * (`max-w-[17rem]`, `w-full`), so it fills the 450px act column at 1440 and
 * still fits the 358px one a 390px phone gives it. The countdown stays at
 * `--text-display`, the scale's top step: DESIGN.md allows "display or larger"
 * for a page's identity element but bans an eighth type step outright, and a
 * one-off clamp is an eighth step with no name. The ring carries the size.
 *
 * Was `components/PomodoroCard.tsx` — a `Card` with exactly one call site. The
 * timer, the presets and the auto-log are unchanged from that component; only
 * its box and its scale have moved.
 */
export function FocusTimer() {
  /**
   * ── The state moved out of this component, and that was the point ────────
   *
   * It used to hold `mode`, `left`, `running` and `blocks` in `useState` and
   * decrement `left` on a `setInterval`. Two things were wrong with that, and
   * both of them defeated the feature rather than merely being untidy:
   *
   * **The timer died when you left the page.** Navigating to Today unmounted
   * this component and took the countdown with it — so a focus timer could
   * only be used by someone sitting on the focus screen watching it, which is
   * the one thing a focus timer exists to stop you doing.
   *
   * **A counter is not a clock.** Background tabs throttle `setInterval` to
   * once a minute and a discarded one does not run it at all, so a 25-minute
   * block finished late by however long you looked away — which is the whole
   * session.
   *
   * `lib/focusTimer.ts` holds a wall-clock `endsAt` instead, and the side
   * rail renders the same store. This component is now a view of it: the big
   * ring, which is what the Focus page is for.
   *
   * Completion is handled in ONE place — `useFocusTimerRunner`, mounted in the
   * shell. If this component also handled it, a block would be logged twice
   * whenever the rail and this page were both on screen, which is now always.
   */
  const t = useFocusTimer()
  const running = isRunning(t)
  const preset = PRESETS[t.presetIndex]
  const mode = t.mode
  const blocks = t.blocks
  const total = phaseSeconds(t)
  const [, repaint] = useState(0)

  // Repaint only. The displayed number is derived from `Date.now()`, so a
  // throttled or missed tick makes it stale, never wrong — it corrects itself
  // the moment the tab is looked at again.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => repaint((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const shown = secondsLeft(t)
  const pct = total ? ((total - shown) / total) * 100 : 0
  /* A 240px box at native size. The ring is drawn in viewBox units and scaled by
     CSS, so the stroke and the radius stay in proportion at every column width
     and nothing here is a px value that belongs to type or to a control. */
  const BOX = 240
  const R = 104
  const C = 2 * Math.PI * R
  const accent = mode === 'work' ? cat(t.tone) : cat('green')

  function reset() {
    resetTimer()
  }
  /** Skip the rest of this phase. Does NOT log it — you did not do the work. */
  function skip() {
    advance()
  }
  function choose(p: (typeof PRESETS)[number]) {
    setPreset(PRESETS.indexOf(p))
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative grid w-full max-w-[17rem] place-items-center">
        <svg viewBox={`0 0 ${BOX} ${BOX}`} className="w-full" aria-hidden>
          <circle cx={BOX / 2} cy={BOX / 2} r={R} fill="none" stroke={cat('surface1')} strokeWidth="12" />
          <circle
            cx={BOX / 2}
            cy={BOX / 2}
            r={R}
            fill="none"
            stroke={accent}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct / 100)}
            transform={`rotate(-90 ${BOX / 2} ${BOX / 2})`}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute text-center">
          {/* `aria-live` on the mode and not on the clock. A polite region that
              changes every second is a screen reader talking over itself; what a
              non-sighted user needs announced is the switch from work to break,
              which is the event the ring communicates visually. */}
          <p className="num font-display text-display font-medium text-fg-1">
            {pad(Math.floor(shown / 60))}:{pad(shown % 60)}
          </p>
          {/* `capitalize` scoped to the mode word, NOT to the paragraph. On the
              paragraph it also title-cased the screen-reader sentence, which the
              rendered-content diff caught as ", 0 Blocks Done Today" — a class
              meant for one word reaching text it was never aimed at, and
              invisible to every gate because `sr-only` text is not drawn. */}
          <p className="mt-1 text-label text-fg-2" aria-live="polite">
            <span className="capitalize">{mode}</span>
            <span className="sr-only">
              , {blocks} {blocks === 1 ? 'block' : 'blocks'} done today
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        {/* `lg`, and the only `lg` control in zone 2 besides the log form's
            submit. Start is the button this page exists for and the one a phone
            user aims at with a thumb. */}
        <Button variant="secondary" size="lg" onClick={() => (running ? pause() : (shown < total ? resume() : start('work')))}>
          {running ? (
            <>
              <Icon as={Pause} size="sm" /> Pause
            </>
          ) : (
            <>
              <Icon as={Play} size="sm" /> Start
            </>
          )}
        </Button>
        <Button variant="secondary" size="lg" onClick={skip} aria-label="Skip to next">
          <Icon as={ArrowLineRight} size="sm" />
        </Button>
        <Button variant="secondary" size="lg" onClick={reset} aria-label="Reset timer">
          <Icon as={ArrowCounterClockwise} size="sm" />
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-1" role="group" aria-label="Work and break length">
        {PRESETS.map((p) => {
          const active = preset.label === p.label
          return (
            <button
              key={p.label}
              onClick={() => choose(p)}
              aria-pressed={active}
              /* `min-h-11` is the 44px hit floor (COD-96). These were a
                 `border-b-2` text row whose target was the glyph height. */
              className={`min-h-11 rounded-control px-3 text-label transition-colors ${
                active ? 'bg-brand-wash font-medium text-brand-text' : 'text-fg-2 hover:bg-ink-2 hover:text-fg-1'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* ── Pick the colour the clock wears ──────────────────────────────
          Red is the default because a focus block is a deadline you set for
          yourself, and the colour's one job is to make the time feel like it
          is running out — which mauve, this app's calm brand accent,
          deliberately does not.

          It is choosable because urgency is not universal: red is pressure for
          some people and anxiety for others, and a timer you avoid opening is
          worse than no timer. Every swatch is a palette token, so all five
          themes move together and `npm run contrast` keeps guarding them.

          The break stays green in every case — it is the one phase whose job
          is to say stop, and letting it be red would invert the only meaning
          the colour carries. */}
      <div className="mt-3 flex items-center gap-2" role="group" aria-label="Timer colour">
        <span className="text-micro text-fg-3">Colour</span>
        {TIMER_TONES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setTone(c)}
            aria-pressed={t.tone === c}
            aria-label={`Timer colour: ${c}`}
            title={c}
            /* The 44px floor is the BUTTON, not the swatch: a 14px dot is
               under every pointer-size rule there is, and this is a control
               the whole feature's feel depends on. */
            className="grid size-11 place-items-center rounded-control transition-colors hover:bg-ink-2"
          >
            <span
              className="block size-3.5 rounded-pill"
              style={{
                background: cat(c),
                outline: t.tone === c ? `2px solid ${cat(c)}` : 'none',
                outlineOffset: 2,
              }}
            />
          </button>
        ))}
      </div>

      <p className="mt-3 text-label text-fg-2">
        {blocks > 0
          ? `${blocks} ${blocks === 1 ? 'block' : 'blocks'} done today · each one logs itself`
          : 'A finished work block logs itself as a session'}
      </p>
    </div>
  )
}
