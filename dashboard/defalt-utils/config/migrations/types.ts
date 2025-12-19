import type { ThemeDocument } from '../themeConfig.js'

export type ThemeDocumentMigration = {
  id: string
  apply: (doc: ThemeDocument) => ThemeDocument | null
}

