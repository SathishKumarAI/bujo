import { useState } from 'react'
import { BookOpen, Heart } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Card } from '../ui'
import { onRaised } from '../../lib/colors'
import { LAPSE_TRUTH, TECHNIQUES } from '../../lib/coping'

/**
 * HOW TO GET THROUGH IT · the reading half of the page.
 *
 * WHAT THIS FILE OWNS: how a technique is laid out and which one is open.
 * WHAT IT DOES NOT OWN: the words or the evidence — `lib/coping.ts`.
 *
 * ── One technique open at a time ─────────────────────────────────────────
 *
 * Four techniques with their steps and their evidence all expanded is about
 * 1,100px of prose, which is the "it should look like there's a lot of text
 * over there" report before it is written. One open, the rest as a row of
 * names, is the same instruction to "focus on one thing at a time" the deck
 * answers one level up.
 *
 * It opens on the FIRST one rather than on nothing: a page of four closed
 * headings is a table of contents, and somebody arriving here mid-urge should
 * land on something they can do.
 *
 * ── The source line is not decoration ────────────────────────────────────
 *
 * This is the only content in the app that makes a claim about the world
 * rather than about the reader's own numbers. Every technique names who
 * developed it and links the study, because the difference between "the
 * research says" and "we think" belongs on the page where the reader can see
 * it — and `coping.test.ts` fails if a source is missing or is not a URL.
 */
export function CopingChapter() {
  const [open, setOpen] = useState(TECHNIQUES[0].id)
  const t = TECHNIQUES.find((x) => x.id === open) ?? TECHNIQUES[0]

  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={BookOpen} size="sm" style={{ color: onRaised('mauve') }} /> How to get through it</span>}
      subtitle="Four things that work on an urge, and what was measured about each"
    >
      {/* The names, as a row. `aria-pressed` rather than a tab list: these
          switch content in place and there is no panel to own. */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {TECHNIQUES.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setOpen(x.id)}
            aria-pressed={x.id === open}
            className={`min-h-11 rounded-pill border px-3 text-label transition-colors ${
              x.id === open
                ? 'border-line-strong bg-ink-3 text-fg-1'
                : 'border-line bg-ink-2 text-fg-2 hover:border-line-strong hover:text-fg-1'
            }`}
          >
            {x.title}
          </button>
        ))}
      </div>

      <p className="text-body text-fg-1">{t.summary}</p>
      <p className="mt-0.5 text-label text-fg-2">Takes {t.minutes}</p>

      <ol className="mt-3 space-y-1.5">
        {t.steps.map((s, i) => (
          <li key={s} className="flex gap-2.5 text-body text-fg-1">
            <span className="num mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-pill bg-ink-2 text-micro text-fg-2">{i + 1}</span>
            <span className="min-w-0">{s}</span>
          </li>
        ))}
      </ol>

      <div className="mt-3 border-t border-line pt-2.5">
        <p className="mb-1 text-label font-medium text-fg-2">Why this one</p>
        <ul className="space-y-1 text-label text-fg-2">
          {t.why.map((w) => <li key={w} className="flex gap-2"><span aria-hidden className="text-fg-3">·</span><span className="min-w-0">{w}</span></li>)}
        </ul>
        {/* Built as a real link with an underline. `.prose-doc a` is the only
            anchor rule in the app, so an inline link outside it inherits its
            parent unless the call site says otherwise — the trap in CLAUDE.md
            whose one casualty was a source citation, which is exactly this. */}
        <p className="mt-2 text-micro text-fg-2">
          Source:{' '}
          <a href={t.source.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg-1">
            {t.source.label}
          </a>
        </p>
      </div>
    </Card>
  )
}

/**
 * THE ANSWER TO "IS IT OKAY TO BREAK THE CYCLE AND START AGAIN".
 *
 * Its own card rather than a fifth technique, because it is not something you
 * do during an urge — it is what you read after one went badly, and it is the
 * single most load-bearing piece of writing on this page.
 *
 * It names the mechanism instead of reassuring: the abstinence violation
 * effect is what turns one slip into a return to the old pattern, and it is a
 * *response*, not a property of the person. A reader who knows that has
 * something to do with it.
 */
export function LapseTruthCard() {
  return (
    <Card
      band
      collapsible
      title={<span className="inline-flex items-center gap-2"><Icon as={Heart} size="sm" style={{ color: onRaised('green') }} /> {LAPSE_TRUTH.title}</span>}
      subtitle="What the research says about slipping, and what actually makes it stick"
    >
      <ul className="space-y-2 text-body text-fg-1">
        {LAPSE_TRUTH.points.map((p) => (
          <li key={p} className="flex gap-2.5">
            <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-pill bg-green" />
            <span className="min-w-0">{p}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-micro text-fg-2">
        Source:{' '}
        <a href={LAPSE_TRUTH.source.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg-1">
          {LAPSE_TRUTH.source.label}
        </a>
      </p>
    </Card>
  )
}
