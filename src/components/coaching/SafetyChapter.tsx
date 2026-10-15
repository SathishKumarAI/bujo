import { useState, type ComponentProps, type ReactNode } from 'react'
import { Heartbeat, ShieldPlus, ShieldWarning, Timer, Warning } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { Pill } from '../ui'
import { ChipPick } from '../ui/quickpick'
import { ShowMore } from '../ShowMore'
import { useCappedList } from '../../lib/useCappedList'
import { onRaised } from '../../lib/colors'
import { KNEE_REHAB, type RehabEquip } from '../../lib/pickleballAcademy'
import {
  AFTER_PLAY, COURT_INJURIES, PROTECTIVE_GEAR, SAFETY_DISCLAIMER, SAFETY_SOURCES, WARMUP,
  sourceSearchUrl,
} from '../../lib/pickleballSafety'

/**
 * KNEE & SAFETY · what happens, when it happens, and what to do about it.
 *
 * WHAT THIS FILE OWNS: the rendering of the safety chapter. WHAT IT DOES NOT:
 * the content (`lib/pickleballSafety.ts` and `KNEE_REHAB`), the bar that
 * chooses this chapter (`views/Coaching.tsx`), or anything about the program.
 *
 * Its own file because `views/Coaching.tsx` was already 684 lines — past this
 * repo's 500 ceiling — before a word of this was added.
 *
 * **Order is the argument.** Warm-up first, because it is the only thing on
 * the page you do *before* anything goes wrong and it is what the calf and
 * shoulder scenarios both point at. Then the scenarios, then the exercises
 * that the scenarios keep referring to, then the gear, then who said so.
 *
 * **Capped, not folded.** Six scenarios at full height measured well past a
 * phone screen each, and a fold would have hidden them from `npm run a11y`,
 * which walks the rendered page (`docs/REUSABLE-PATTERNS.md` §6). Two are
 * shown and the affordance carries the total.
 *
 * **Two rows, not one — and that is a reversal.** Play safe was folded into
 * the knee chapter one commit ago, on the measurement that five one-line tips
 * were 0.36 desktop screens and a facet rather than a peer. Then the content
 * arrived: the merged chapter measured **3.32 desktop screens and 7.53 on a
 * phone**, the worst on the page by a factor of two. The facet rule did not
 * stop being true; the thing it was applied to stopped being small. So the
 * split is by WHEN YOU READ IT — `prep` is what you do before and after
 * playing, `injury` is what you read when something has already gone wrong —
 * which is a better seam than the one the original rows had anyway.
 */
export function SafetyChapter({ part }: { part: 'prep' | 'injury' }) {
  const [equip, setEquip] = useState<RehabEquip | 'all'>('all')
  const rehab = KNEE_REHAB.filter((e) => equip === 'all' || e.equip === equip)
  const injuries = useCappedList(COURT_INJURIES, 2)
  const exercises = useCappedList(rehab, 8)

  return (
    <>
      {/* The long disclaimer, in the one chapter that makes claims about
          bodies. Every chapter carries the short line above the panel. */}
      <p className="mb-3 flex items-start gap-2 rounded-card bg-red/10 p-2.5 text-label text-fg-2">
        <Icon as={ShieldWarning} size="sm" className="mt-0.5 shrink-0 text-red" />
        {SAFETY_DISCLAIMER.long}
      </p>

      {part === 'prep' && <>
      <Section icon={Timer} color="green" title="Warm up — eight minutes, in this order"
        blurb="Temperature, then range, then load, then the movements of the game, then the shot at 60%.">
        <ol className="space-y-1.5">
          {WARMUP.map((w) => (
            <li key={w.name} className="grid grid-cols-[3.2rem_minmax(0,1fr)] gap-x-2 rounded-card bg-ink-2 p-2.5">
              <span className="num text-label text-fg-2">{w.mins}</span>
              <span className="min-w-0">
                <span className="block text-body font-medium text-fg-1">{w.name}</span>
                <span className="block text-label text-fg-2">{w.how}</span>
                {/* Every block says which injury it is for. A warm-up nobody
                    believes in is a warm-up nobody does. */}
                <span className="mt-0.5 block text-label" style={{ color: onRaised('green') }}>{w.why}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section icon={Timer} color="green" title="After the last point"
        blurb="The half people skip twice. Static stretching belongs here, not before you play.">
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {AFTER_PLAY.map((t) => <li key={t} className="rounded-card bg-ink-2 p-2.5 text-label text-fg-2">{t}</li>)}
        </ul>
      </Section>

      <Section icon={ShieldPlus} color="sky" title="Gear, and what it will not do"
        blurb="Every row carries its limit, because the useful half is the one the box does not print.">
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {PROTECTIVE_GEAR.map((g) => (
            <li key={g.item} className="rounded-card bg-ink-2 p-2.5">
              <p className="text-body font-medium text-fg-1">{g.item}</p>
              <p className="text-label text-fg-2">{g.helps}</p>
              <p className="mt-0.5 text-label" style={{ color: onRaised('peach') }}>Will not: {g.limit}</p>
            </li>
          ))}
        </ul>
      </Section>
      </>}

      {part === 'injury' && <>
      <Section icon={Warning} color="peach" title="Where it actually goes wrong"
        blurb="Six scenarios, the moment each one happens, and what to do."
        right={<ShowMore list={injuries} />}>
        <ul className="space-y-2.5">
          {injuries.shown.map((x) => (
            <li key={x.id} className="rounded-card border border-line bg-ink-1 p-3">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <h4 className="text-body font-medium text-fg-1">{x.name}</h4>
                <Pill color="sky" size="micro">{x.area}</Pill>
              </div>
              {/* THE MOMENT, first and in the body size. "Protect the ankles"
                  is true and unusable; the shot you were playing when it
                  happened is the part you can train. */}
              <p className="text-body text-fg-1">{x.where}</p>
              <p className="mt-1 text-label text-fg-2">{x.mechanism}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Lines title="If it just happened" color="peach" items={x.now} />
                <Lines title="What makes it less likely" color="green" items={x.prevent} />
              </div>
              <div className="mt-2 rounded-card bg-red/10 p-2">
                <p className="mb-0.5 text-label font-medium" style={{ color: onRaised('red') }}>Stop and see somebody if</p>
                <ul className="space-y-0.5">
                  {x.redFlags.map((f) => <li key={f} className="text-label text-fg-2">{f}</li>)}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={Heartbeat} color="red" title="Prehab & rehab exercises"
        blurb="Build the knee that does not do the above. After an injury, follow a physio's plan instead of this list."
        right={<ShowMore list={exercises} />}>
        {/* `ChipPick`, not four hand-styled buttons. The page shipped those
            with inline `cat('mauve') + '22'` backgrounds, which is the trap
            CLAUDE.md records: reach for the component before the token, and
            the token before a hex. */}
        <ChipPick
          label="Equipment I have"
          tone="teal"
          dense
          value={equip}
          onChange={(v) => setEquip(v)}
          options={[
            { value: 'all' as const, label: 'All' },
            { value: 'none' as const, label: 'None', name: 'No equipment' },
            { value: 'band' as const, label: 'Band' },
            { value: 'weights' as const, label: 'Weights' },
          ]}
          className="mb-2.5"
        />
        {exercises.total === 0 ? (
          /* A filter that matches nothing says so and names the filter — an
             empty grid reads as "there are no exercises", which is a claim
             about the library rather than about the chip you pressed. */
          <p className="text-label text-fg-2">Nothing in the library needs only that. Try <span className="text-fg-1">All</span>.</p>
        ) : (
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {exercises.shown.map((e) => (
              <li key={e.name} className="rounded-card bg-ink-2 p-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-body font-medium text-fg-1">{e.name}</span>
                  <Pill color="sky" size="micro">{e.target}</Pill>
                  <span className="rounded-pill bg-ink-0 px-1.5 py-0.5 text-micro text-fg-2">{e.phase}</span>
                </div>
                <p className="mt-0.5 text-label text-fg-2">{e.how}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      </>}

      <div className="mt-4 border-t border-line pt-2">
        <p className="text-label text-fg-2">
          Gathered from:{' '}
          {SAFETY_SOURCES.map((s, i) => (
            <span key={s.name}>
              {i > 0 && ' · '}
              {/* Built from the name, never pinned — a pinned page rots and a
                  search always lands (`lib/video.ts`, and CLAUDE.md). */}
              <a href={sourceSearchUrl(s.name, s.topic)} target="_blank" rel="noreferrer" title={s.good}>{s.name}</a>
            </span>
          ))}
        </p>
      </div>
    </>
  )
}

/** A titled block inside the chapter. Five of them were five shapes once. */
function Section({ icon, color, title, blurb, right, children }: {
  icon: ComponentProps<typeof Icon>['as']
  color: string
  title: string
  blurb: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2.5">
        <h4 className="flex items-center gap-1.5 text-body font-medium text-fg-1">
          <Icon as={icon} size="sm" style={{ color: onRaised(color) }} /> {title}
        </h4>
        <p className="min-w-0 flex-1 text-label text-fg-2">{blurb}</p>
        {right}
      </div>
      {children}
    </section>
  )
}

function Lines({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div>
      <p className="mb-0.5 text-label font-medium" style={{ color: onRaised(color) }}>{title}</p>
      <ul className="space-y-0.5">
        {items.map((t) => <li key={t} className="text-label text-fg-2">{t}</li>)}
      </ul>
    </div>
  )
}
