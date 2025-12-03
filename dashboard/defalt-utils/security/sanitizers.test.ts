import { describe, it, expect } from 'vitest'
import { sanitizeCustomCss, sanitizeHexColor, sanitizeToken } from './sanitizers'

const normalize = (css: string) => css.replace(/\s+/g, '')

describe('sanitizeCustomCss', () => {
  it('keeps safe declarations', () => {
    const css = `
      .badge {
        color: #fff;
        margin: 4px;
      }
    `
    const sanitized = sanitizeCustomCss(css)
    expect(normalize(sanitized)).toBe('.badge{color:#fff;margin:4px}')
  })

  it('removes attribute selectors entirely', () => {
    const css = `.badge[data-state="open"] { color: red; }`
    expect(sanitizeCustomCss(css)).toBe('')
  })

  it('drops declarations with url values', () => {
    const css = `
      .hero {
        background-image: url('https://evil.com/payload.svg');
        color: #111;
      }
    `
    const sanitized = sanitizeCustomCss(css)
    expect(normalize(sanitized)).toBe('.hero{color:#111}')
    expect(sanitized).not.toContain('url')
  })

  it('keeps allowed at-rules and removes blocked ones', () => {
    const css = `
      @import url('https://evil.com/styles.css');
      @media (min-width: 768px) { .grid { display: grid; } }
      @supports (display: grid) { .grid { gap: 1rem; } }
      @unknown { .bad { color: red; } }
    `
    const sanitized = sanitizeCustomCss(css)
    expect(sanitized).toContain('@media')
    expect(sanitized).toContain('@supports')
    expect(sanitized).not.toContain('@import')
    expect(sanitized).not.toContain('@unknown')
  })

  it('removes :has selectors', () => {
    const css = `.card:has(img) { border: 1px solid red; }`
    expect(sanitizeCustomCss(css)).toBe('')
  })
})

describe('sanitizeHexColor', () => {
  it('accepts css variables and named colors', () => {
    expect(sanitizeHexColor('var(--accent)', '#000000')).toBe('var(--accent)')
    expect(sanitizeHexColor('White', '#000000')).toBe('white')
  })

  it('falls back for invalid input', () => {
    expect(sanitizeHexColor('url(evil)', '#123456')).toBe('#123456')
  })
})

describe('sanitizeToken', () => {
  it('removes script-sensitive characters', () => {
    expect(sanitizeToken('<script>alert(1)</script>')).toBe('scriptalert(1)/script')
  })
})
