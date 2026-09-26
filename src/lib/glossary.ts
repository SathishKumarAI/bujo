/**
 * GLOSSARY · every abbreviation the app says out loud, in one file.
 *
 * The trigger was a demo: Cycle's day editor offers a chip labelled `pms`, and
 * the person being shown the app asked what it meant. The same question is
 * waiting behind `bbt` on the temperature chart, `halt` on Recovery, `dupr` and
 * `rpe` on Pickleball, `1rm` and `amrap` in the gym. An abbreviation the reader
 * cannot expand is not shorthand, it is a password.
 *
 * **Why JSON and not a `.ts` literal.** Two reasons, and only the second is
 * about types. First, the list is content — it will be extended by someone
 * adding a word, not by someone writing code, and a JSON file is the smallest
 * thing that is obviously safe to edit. Second, and this is the one that
 * matters here: this app has twice shipped the same knowledge written down in
 * two places that then diverged (the palette in `index.css` *and* `colors.ts`;
 * two docstrings claiming "26 principles" over a library of 46). A single JSON
 * file that both the inline marker and the Help page read means the page and the
 * tooltip **cannot** disagree about what a word means.
 *
 * The page contract bans help icons — "a label that needs a ? gets rewritten
 * instead" — and this is the deliberate exception, stated here rather than
 * argued in a review. You cannot rewrite `PMS` into plain language and keep it:
 * it is the term the user's clinician, their search results and every other app
 * will use. The fix for a domain term is not a better label, it is a definition
 * within reach of it.
 *
 * `source` is a credit, not decoration. Where a definition comes from a
 * published health body it says so and links out, because "trust me" is not a
 * citation and the reader is entitled to check.
 */
import data from '../data/glossary.json'

export interface GlossarySource {
  label: string
  url: string
}

export interface GlossaryTerm {
  /** The abbreviation as written on screen, e.g. "PMS". Unique, case-insensitive. */
  term: string
  /** What the letters stand for. One line, no full stop. */
  expansion: string
  /** Which part of the app says it — also the Help page's grouping. */
  domain: 'cycle' | 'recovery' | 'fitness' | 'pickleball' | 'nutrition'
  /** A sentence or three of plain-language explanation. */
  long: string
  /** Where the definition came from, credited and linked. `null` when it is
   *  common shorthand with no single authority behind it. */
  source: GlossarySource | null
}

/** Every term, in the order the JSON lists them. */
export const GLOSSARY = (data.terms as GlossaryTerm[]).slice()

/**
 * Lookup by term, case-insensitively.
 *
 * Case-insensitive because the call sites do not agree on case and should not
 * have to: the flag chips are lowercase (`pms`), the prose is uppercase (`PMS`),
 * and a marker that silently renders nothing because someone typed the wrong
 * case is the kind of failure no gate catches. Built once, not on every render.
 */
const BY_TERM = new Map(GLOSSARY.map((t) => [t.term.toLowerCase(), t]))

export function glossaryTerm(term: string): GlossaryTerm | undefined {
  return BY_TERM.get(term.trim().toLowerCase())
}

/** Human label for a domain, for the Help page's group headings. */
export const GLOSSARY_DOMAIN_LABEL: Record<GlossaryTerm['domain'], string> = {
  cycle: 'Cycle & fertility',
  recovery: 'Recovery & habits',
  fitness: 'Training',
  pickleball: 'Pickleball',
  nutrition: 'Food & fasting',
}

/**
 * Terms grouped by domain, each group alphabetical, groups in the order of
 * `GLOSSARY_DOMAIN_LABEL`.
 *
 * Alphabetical *within* a group and not across the whole list, because the
 * reader arrives having seen a word on a page, and the page is the thing they
 * remember. One flat A–Z would put `AMRAP` next to `BBT` and make the training
 * terms unfindable as a set.
 */
export function glossaryByDomain(): { domain: GlossaryTerm['domain']; label: string; terms: GlossaryTerm[] }[] {
  const domains = Object.keys(GLOSSARY_DOMAIN_LABEL) as GlossaryTerm['domain'][]
  return domains
    .map((domain) => ({
      domain,
      label: GLOSSARY_DOMAIN_LABEL[domain],
      terms: GLOSSARY.filter((t) => t.domain === domain).sort((a, b) => a.term.localeCompare(b.term)),
    }))
    .filter((g) => g.terms.length > 0)
}
