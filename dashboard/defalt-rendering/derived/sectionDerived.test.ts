import { describe, it, expect } from 'vitest'
import { resolveHeroFallbackTag, resolveGhostCardsFallbackTag } from './sectionDerived.js'

describe('sectionDerived', () => {
  it('derives hero fallback tags', () => {
    expect(resolveHeroFallbackTag('hero')).toBe('#hero')
    expect(resolveHeroFallbackTag('hero-2')).toBe('#hero-2')
  })

  it('derives ghostCards fallback tags', () => {
    expect(resolveGhostCardsFallbackTag('ghost-cards')).toBe('#cards')
    expect(resolveGhostCardsFallbackTag('ghost-cards-2')).toBe('#cards-2')
  })
})
