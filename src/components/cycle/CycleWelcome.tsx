import { useState } from 'react'
import { Button } from '../ui/button'
import { CYCLE_DISCLAIMER_VERSION } from '../../lib/cycleGuide'

/**
 * FIRST RUN · what this page promises, before it is handed any data.
 *
 * Shown before the log, the demo banner or anything else. It gates on a real
 * checkbox because the promises here are ones the user has to be able to say
 * they were told: where the data lives, that losing it is possible, and that
 * none of this is medical care.
 *
 * **Why a version number rather than a boolean.** `settings.cycleDisclaimerAck`
 * stores `CYCLE_DISCLAIMER_VERSION`, so changing what is promised re-asks.
 * A boolean would let a later edit to this text apply retroactively to an
 * acknowledgement of *different* text, which is precisely the thing an
 * acknowledgement is for.
 *
 * The copy is deliberately plain and second-person, matching the rest of the
 * page ("Regular is a range, not a number"). It is not softened: the honest
 * version of "we cannot recover your data" is more useful than a reassuring
 * one, because the user's backup behaviour depends on believing it.
 */
export function CycleWelcome({ onAccept }: { onAccept: (version: number) => void }) {
  const [ticked, setTicked] = useState(false)

  return (
    <section
      className="mx-auto max-w-[46rem] rounded-card border border-line bg-card p-5 sm:p-7"
      aria-labelledby="cycle-welcome-title"
    >
      <h2 id="cycle-welcome-title" className="font-display text-title font-medium text-fg-1">
        Before you start
      </h2>

      <div className="mt-4 space-y-4 text-body text-fg-1">
        <p>
          <strong className="font-medium">Your data stays on this device.</strong> Everything you log
          here — temperatures, periods, symptoms, mood, notes — is saved only in this browser&rsquo;s
          local storage. It is never uploaded, synced, or sent to us or anyone else. We cannot see
          it, recover it, or delete it for you.
        </p>
        <p>
          <strong className="font-medium">That also means you&rsquo;re responsible for it.</strong> If
          you clear your browser data, use private browsing, switch browsers, or lose this device,
          your journal is gone. Use <strong className="font-medium">Export backup</strong> regularly
          and keep the file somewhere safe. Anyone with access to this device and browser can open
          this page — protect your device accordingly.
        </p>
        <p>
          <strong className="font-medium">This is not medical care.</strong> bujo is for personal
          tracking and education. Predictions are estimates based on your own entries and can be
          wrong. Temperature and symptom tracking is not a method of contraception. Nothing here
          diagnoses, treats, or replaces advice from a clinician.
        </p>
        <p>
          <strong className="font-medium">No liability.</strong> You use this feature at your own
          risk. We are not responsible for lost data, for decisions made from what this page shows,
          or for any outcome of relying on its predictions.
        </p>
      </div>

      {/* A real checkbox with a real label, not a styled div: this is the one
          control on the page whose state a user may later need to attest to. */}
      <label className="mt-6 flex cursor-pointer items-start gap-3 border-t border-line pt-4 text-body text-fg-1">
        <input
          type="checkbox"
          checked={ticked}
          onChange={(e) => setTicked(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-[var(--color-mauve)]"
        />
        <span>
          I understand my data is stored only on this device, that I&rsquo;m responsible for backing
          it up, and that this is not medical advice.
        </span>
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        {/* The page's single loud control, and it is loud only here — this is
            the one screen with exactly one thing to do. */}
        <Button disabled={!ticked} onClick={() => onAccept(CYCLE_DISCLAIMER_VERSION)} className="press-3d">
          Continue
        </Button>
        <a href="#cycle-guide" className="text-label text-mauve underline">
          Read the full guide
        </a>
      </div>
    </section>
  )
}
