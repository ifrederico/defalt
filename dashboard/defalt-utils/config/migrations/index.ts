import type { ThemeDocument } from '../themeConfig.js'
import { THEME_DOCUMENT_MIGRATIONS } from './migrations.js'

export function runThemeDocumentMigrations(doc: ThemeDocument): { doc: ThemeDocument; applied: string[] } {
  let nextDoc = doc
  const applied: string[] = []

  for (const migration of THEME_DOCUMENT_MIGRATIONS) {
    const result = migration.apply(nextDoc)
    if (!result) {
      continue
    }
    nextDoc = result
    applied.push(migration.id)
  }

  return { doc: nextDoc, applied }
}

