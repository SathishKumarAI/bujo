import { describe, it, expect } from 'vitest'
import { isValidEmail, suggestEmailFix, passwordError, authFormError } from './validate'

describe('validate', () => {
  it('isValidEmail accepts real addresses, rejects junk', () => {
    expect(isValidEmail('a@b.com')).toBe(true)
    expect(isValidEmail('sathish.kumar+tag@gmail.com')).toBe(true)
    expect(isValidEmail('  spaced@mail.io  ')).toBe(true)
    expect(isValidEmail('nope')).toBe(false)
    expect(isValidEmail('no@domain')).toBe(false)
    expect(isValidEmail('two@@at.com')).toBe(false)
    expect(isValidEmail('space @x.com')).toBe(false)
  })

  it('suggestEmailFix catches common gmail typos', () => {
    expect(suggestEmailFix('me@gmial.com')).toBe('me@gmail.com')
    expect(suggestEmailFix('me@gamil.com')).toBe('me@gmail.com')
    expect(suggestEmailFix('me@gmail.com')).toBeNull()
    expect(suggestEmailFix('notanemail')).toBeNull()
  })

  it('passwordError enforces the 6-char minimum', () => {
    expect(passwordError('12345')).toBeTruthy()
    expect(passwordError('123456')).toBeNull()
  })

  it('authFormError reports the first problem, else null', () => {
    expect(authFormError('', 'secret1')).toMatch(/email/i)
    expect(authFormError('bad', 'secret1')).toMatch(/valid/i)
    expect(authFormError('ok@mail.com', '123')).toMatch(/characters/i)
    expect(authFormError('ok@mail.com', 'secret1')).toBeNull()
  })
})
