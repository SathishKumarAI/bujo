/**
 * Line-breaking rules that CSS cannot express.
 *
 * `text-wrap: balance` and `pretty` decide *where* to break; neither can say
 * "never here". The one rule this app needs is about the spaced em/en dash,
 * which reads as a list marker when it lands at the head of a line.
 */

/**
 * Bind a spaced en/em dash to the word before it, so a line can only ever break
 * *after* it.
 *
 *   "Short memory — flush errors"
 *     before   "Short memory" / "— flush errors"   ← reads as a bullet
 *     after    "Short memory —" / "flush errors"
 *
 * Strings only: given elements, the caller is composing its own line breaks and
 * there is nothing here to act on.
 *
 * The replacement is written `'\u00a0$1 '`, the escape rather than a literal
 * NBSP. The first version of this pasted the real character, which renders in a
 * source file as an ordinary space — invisible, and the next person deletes it
 * as a no-op.
 *
 * Lives here rather than inside `mod/Statement` because the rule is about
 * prose, not about one component. It was in `Statement` first, which fixed the
 * page's loudest line and left every principle description wrapping the wrong
 * way — a defect that only became *visible* once `text-pretty` re-flowed them.
 */
export function bindDashes<T>(text: T): T | string {
  return typeof text === 'string' ? text.replace(/ ([—–]) /g, '\u00a0$1 ') : text
}
