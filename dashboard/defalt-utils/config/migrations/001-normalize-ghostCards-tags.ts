import type { ThemeDocument, SectionConfig } from '../themeConfig.js'
import type { ThemeDocumentMigration } from './types.js'
import { normalizeGhostCardsTag } from '../../../defalt-sections/utils/tagUtils.js'

const migrateSection = (section: SectionConfig): SectionConfig | null => {
  const settings = section.settings
  if (!settings || settings.definitionId !== 'ghostCards') {
    return null
  }

  const customConfig = settings.customConfig
  if (!customConfig || typeof customConfig !== 'object' || Array.isArray(customConfig)) {
    return null
  }

  const currentTag = (customConfig as { tag?: unknown }).tag
  const normalizedTag = normalizeGhostCardsTag(currentTag)
  if (!normalizedTag || normalizedTag === currentTag) {
    return null
  }

  return {
    ...section,
    settings: {
      ...settings,
      customConfig: {
        ...(customConfig as Record<string, unknown>),
        tag: normalizedTag
      }
    }
  }
}

const migrateSections = (sections: Record<string, SectionConfig>) => {
  let changed = false
  const next: Record<string, SectionConfig> = { ...sections }
  for (const [key, section] of Object.entries(sections)) {
    const migrated = migrateSection(section)
    if (!migrated) {
      continue
    }
    next[key] = migrated
    changed = true
  }
  return changed ? next : null
}

export const normalizeGhostCardsTagsMigration: ThemeDocumentMigration = {
  id: '001-normalize-ghostCards-tags',
  apply: (doc: ThemeDocument) => {
    let changed = false

    const nextHeaderSections = migrateSections(doc.header.sections)
    if (nextHeaderSections) {
      changed = true
    }

    const nextFooterSections = migrateSections(doc.footer.sections)
    if (nextFooterSections) {
      changed = true
    }

    let nextPages: ThemeDocument['pages'] | null = null
    for (const [pageKey, page] of Object.entries(doc.pages)) {
      const nextSections = migrateSections(page.sections)
      if (!nextSections) {
        continue
      }
      if (!nextPages) {
        nextPages = { ...doc.pages }
      }
      nextPages[pageKey] = {
        ...page,
        sections: nextSections
      }
      changed = true
    }

    if (!changed) {
      return null
    }

    return {
      ...doc,
      header: nextHeaderSections ? { ...doc.header, sections: nextHeaderSections } : doc.header,
      footer: nextFooterSections ? { ...doc.footer, sections: nextFooterSections } : doc.footer,
      pages: nextPages ?? doc.pages
    }
  }
}

