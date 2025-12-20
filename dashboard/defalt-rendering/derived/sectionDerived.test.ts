import { describe, it, expect } from 'vitest'
import { resolveHeroDefaultTag, resolveGhostCardsDefaultTag } from './sectionDerived.js'

describe('sectionDerived', () => {
  it('derives hero default tags', () => {
    expect(resolveHeroDefaultTag('hero')).toBe('#hero')
    expect(resolveHeroDefaultTag('hero-2')).toBe('#hero-2')
  })

  it('derives ghostCards default tags', () => {
    expect(resolveGhostCardsDefaultTag('ghost-cards')).toBe('#cards')
    expect(resolveGhostCardsDefaultTag('ghost-cards-2')).toBe('#cards-2')
  })
})
