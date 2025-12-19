import type { ThemeDocumentMigration } from './types.js'
import { normalizeGhostCardsTagsMigration } from './001-normalize-ghostCards-tags.js'
import { normalizeHeroTagsMigration } from './002-normalize-hero-tags.js'
import { normalizeAnnouncementBlocksMigration } from './003-normalize-announcement-blocks.js'

export const THEME_DOCUMENT_MIGRATIONS: ThemeDocumentMigration[] = [
  normalizeGhostCardsTagsMigration,
  normalizeHeroTagsMigration,
  normalizeAnnouncementBlocksMigration
]

