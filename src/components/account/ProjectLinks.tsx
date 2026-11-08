import { Cell, Cells } from '../ui/cells'

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
  // Each link a row that opens it; the privacy note is the group footer.
  return (
    <div className="flex flex-col gap-1.5">
      <Cells title="Help build it">
        {LINKS.map((l) => <Cell key={l.href} title={l.label} subtitle={l.detail} href={l.href} />)}
      </Cells>
      <p className="px-3 text-label text-fg-2">An issue shares only what you type into it</p>
    </div>
  )
}
