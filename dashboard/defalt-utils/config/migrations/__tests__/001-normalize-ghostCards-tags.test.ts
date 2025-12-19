import { describe, it, expect } from 'vitest'
import type { ThemeDocument } from '../../themeConfig.js'
import { runThemeDocumentMigrations } from '../index.js'

describe('001-normalize-ghostCards-tags', () => {
  it.each([
    { input: '#cards', expected: '#cards', applied: [] },
    { input: '#cards2', expected: '#cards-2', applied: ['001-normalize-ghostCards-tags'] },
    { input: '#cards-2', expected: '#cards-2', applied: [] },
    { input: '#ghost-cards', expected: '#cards', applied: ['001-normalize-ghostCards-tags'] },
    { input: '#ghost-cards-2', expected: '#cards-2', applied: ['001-normalize-ghostCards-tags'] },
    { input: '#ghost-card2', expected: '#cards-2', applied: ['001-normalize-ghostCards-tags'] },
    { input: 'cards2', expected: '#cards-2', applied: ['001-normalize-ghostCards-tags'] },
    { input: '#my-tag', expected: '#my-tag', applied: [] }
  ])('normalizes $input', ({ input, expected, applied }) => {
    const doc: ThemeDocument = {
      name: 'test-doc',
      version: 1,
      header: { sections: {} },
      footer: { order: [], sections: {} },
      pages: {
        homepage: {
          order: [],
          sections: {
            'ghost-cards': {
              type: 'custom',
              settings: {
                visible: true,
                definitionId: 'ghostCards',
                customConfig: { tag: input }
              }
            }
          }
        }
      }
    }

    const result = runThemeDocumentMigrations(doc)
    const tag = (
      result.doc.pages.homepage.sections['ghost-cards'].settings.customConfig as { tag?: unknown } | undefined
    )?.tag
    expect(tag).toBe(expected)
    expect(result.applied).toEqual(applied)
  })

  it('is idempotent', () => {
    const doc: ThemeDocument = {
      name: 'test-doc',
      version: 1,
      header: { sections: {} },
      footer: { order: [], sections: {} },
      pages: {
        homepage: {
          order: [],
          sections: {
            'ghost-cards': {
              type: 'custom',
              settings: {
                visible: true,
                definitionId: 'ghostCards',
                customConfig: { tag: '#ghost-card2' }
              }
            }
          }
        }
      }
    }

    const first = runThemeDocumentMigrations(doc)
    const second = runThemeDocumentMigrations(first.doc)
    expect(second.applied).toEqual([])
    expect(second.doc).toEqual(first.doc)
  })
})

