// Lightweight, dependency-free input validation for the auth forms. Real
// deliverability is confirmed server-side by Supabase's email-confirmation
// link; this just catches obvious typos before a round-trip and gives the user
// a clear, friendly message (like other apps do).

// Pragmatic email shape: something@something.tld, no spaces, single @.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** True when `email` is a plausibly-valid address (format only). */
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

/** Common free-mail domains we can gently typo-correct ("gmial" → "gmail"). */
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
}

/**
 * If the address' domain looks like a typo of a common provider, return the
 * suggested correction; otherwise null. UI can offer "Did you mean …?".
 */
export function suggestEmailFix(email: string): string | null {
  const at = email.trim().toLowerCase().lastIndexOf('@')
  if (at < 0) return null
  const local = email.trim().slice(0, at)
  const domain = email.trim().toLowerCase().slice(at + 1)
  const fixed = DOMAIN_TYPOS[domain]
  return fixed ? `${local}@${fixed}` : null
}

/** Validate a password against the minimum policy. Returns an error or null. */
export function passwordError(pw: string): string | null {
  if (pw.length < 6) return 'Use at least 6 characters.'
  return null
}

/** One-shot check for the sign-in / sign-up forms. Returns an error or null. */
export function authFormError(email: string, pw: string): string | null {
  if (!email.trim()) return 'Enter your email address.'
  if (!isValidEmail(email)) return 'That email doesn’t look valid — check for typos.'
  return passwordError(pw)
}
