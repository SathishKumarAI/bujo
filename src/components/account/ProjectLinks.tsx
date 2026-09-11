import { Card } from '../ui'

/**
 * Where to go when the app does not do what you need.
 *
 * bujo has no support address, because it has no accounts and no server holding
 * your data — there is nothing to look up on your behalf, and asking for an
 * email would give away the one thing this design is careful not to collect.
 * The issue tracker is the whole support channel, and saying so plainly is
 * better than an empty "Contact us".
 *
 * One constant for the repo, not a URL pasted per link — the repo has moved
 * once already, and three hard-coded copies is three chances to miss one.
 */
const REPO = 'https://github.com/SathishKumarAI/bujo'

const LINKS = [
  {
    href: `${REPO}/issues/new`,
    label: 'Report a problem',
    detail: 'Something broken, or wrong, or missing',
  },
  {
    href: `${REPO}/issues`,
    label: 'Read open issues',
    detail: 'What is already known, and what is being worked on',
  },
  {
    href: REPO,
    label: 'Contribute',
    detail: 'The source, the docs and the diagrams — pull requests welcome',
  },
]

export function ProjectLinks() {
  return (
    <Card band title="Help build it" subtitle="No support inbox — the issue tracker is the whole channel">
      <ul className="flex flex-col">
        {LINKS.map((l) => (
          <li key={l.href} className="border-t border-line first:border-t-0">
            <a
              href={l.href}
              target="_blank"
              rel="noreferrer noopener"
              className="group/link flex items-baseline justify-between gap-4 py-2.5 hover:bg-ink-2/50"
            >
              <span className="min-w-0">
                <span className="block text-body text-fg-1 group-hover/link:text-brand-text">{l.label}</span>
                <span className="block text-label text-fg-2">{l.detail}</span>
              </span>
              {/* Not an aria-label: the link text already names the destination,
                  and "opens in a new tab" belongs to every one of these. */}
              <span aria-hidden className="shrink-0 text-label text-fg-3">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-label text-fg-2">
        Opening an issue shares only what you type into it. Your journal never leaves this device
        unless you turn on sync yourself.
      </p>
    </Card>
  )
}
