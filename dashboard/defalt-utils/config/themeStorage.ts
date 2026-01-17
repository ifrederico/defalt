// =============================================================================
// Theme Storage Functions
// =============================================================================

import { logError } from '../logging/errorLogger.js'
import { deepClone } from '../helpers/deepClone.js'
import { safeParseThemeDocument } from './themeValidation.js'
import {
  DRAFT_STORAGE_KEY,
  SAVED_STORAGE_KEY,
  SCHEMA_BACKUP_STORAGE_KEY,
  CURRENT_SCHEMA_VERSION
} from './themeDefaults.js'
import { normalizeThemeDocument, createDefaultThemeDocument } from './themeNormalization.js'
import type { ThemeDocument, StorageNormalizationEvent } from './themeConfig.types.js'

type WorkspaceStorageGlobal = typeof globalThis & { sessionStorage?: Storage, localStorage?: Storage }

// =============================================================================
// Pending Event State
// =============================================================================

let pendingStorageNormalizationEvent: StorageNormalizationEvent | null = null

export const consumeStorageNormalizationEvent = (): StorageNormalizationEvent | null => {
  const event = pendingStorageNormalizationEvent
  pendingStorageNormalizationEvent = null
  return event
}

// =============================================================================
// Storage Access Helpers
// =============================================================================

const getDraftStorage = (): Storage | null => {
  if (typeof globalThis === 'undefined') {
    return null
  }
  const storage = (globalThis as WorkspaceStorageGlobal).sessionStorage
  if (!storage) {
    return null
  }
  return storage
}

const getSavedStorage = (): Storage | null => {
  if (typeof globalThis === 'undefined') {
    return null
  }
  const storage = (globalThis as WorkspaceStorageGlobal).localStorage
  if (!storage) {
    return null
  }
  return storage
}

// =============================================================================
// Schema Mismatch Handling
// =============================================================================

const backupSchemaMismatch = (document: ThemeDocument, source: StorageNormalizationEvent['source']): void => {
  const storage = getSavedStorage()
  if (!storage) {
    return
  }

  try {
    const payload = {
      capturedAt: new Date().toISOString(),
      source,
      schemaVersion: typeof document.schemaVersion === 'number' ? document.schemaVersion : null,
      document
    }
    storage.setItem(SCHEMA_BACKUP_STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    logError(error, { scope: 'themeStorage.backupSchemaMismatch' })
  }
}

const clearPersistedDocuments = (): void => {
  const draftStorage = getDraftStorage()
  if (draftStorage) {
    draftStorage.removeItem(DRAFT_STORAGE_KEY)
  }
  const savedStorage = getSavedStorage()
  if (savedStorage) {
    savedStorage.removeItem(SAVED_STORAGE_KEY)
  }
}

const handleSchemaMismatch = (document: ThemeDocument, source: StorageNormalizationEvent['source']): ThemeDocument => {
  backupSchemaMismatch(document, source)
  pendingStorageNormalizationEvent = { source, reason: 'schema' }
  clearPersistedDocuments()
  return deepClone(createDefaultThemeDocument())
}

// =============================================================================
// Read Functions
// =============================================================================

const readDraftDocument = (): ThemeDocument | null => {
  const storage = getDraftStorage()
  if (!storage) {
    return null
  }

  const raw = storage.getItem(DRAFT_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    const validated = safeParseThemeDocument(parsed, 'draft-storage', { suppressLog: true })
    if (validated) {
      const resolved = validated as ThemeDocument
      if (resolved.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        return handleSchemaMismatch(resolved, 'draft-storage')
      }
      return resolved
    }
    pendingStorageNormalizationEvent = { source: 'draft-storage', reason: 'parse' }
    storage.removeItem(DRAFT_STORAGE_KEY)
    return null
  } catch (error) {
    logError(error, { scope: 'themeStorage.loadDraftDocument' })
    pendingStorageNormalizationEvent = { source: 'draft-storage', reason: 'parse' }
    storage.removeItem(DRAFT_STORAGE_KEY)
    return null
  }
}

const readSavedDocument = (): ThemeDocument => {
  const storage = getSavedStorage()
  if (!storage) {
    return deepClone(createDefaultThemeDocument())
  }

  const raw = storage.getItem(SAVED_STORAGE_KEY)
  if (!raw) {
    return deepClone(createDefaultThemeDocument())
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    const validated = safeParseThemeDocument(parsed, 'saved-storage', { suppressLog: true })
    if (validated) {
      const resolved = validated as ThemeDocument
      if (resolved.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        return handleSchemaMismatch(resolved, 'saved-storage')
      }
      return resolved
    }
    pendingStorageNormalizationEvent = { source: 'saved-storage', reason: 'parse' }
    storage.removeItem(SAVED_STORAGE_KEY)
    return deepClone(createDefaultThemeDocument())
  } catch (error) {
    logError(error, { scope: 'themeStorage.loadSavedDocument' })
    pendingStorageNormalizationEvent = { source: 'saved-storage', reason: 'parse' }
    storage.removeItem(SAVED_STORAGE_KEY)
    return deepClone(createDefaultThemeDocument())
  }
}

export const readPersistedDocument = (): ThemeDocument => {
  const draft = readDraftDocument()
  if (draft) {
    return draft
  }
  return readSavedDocument()
}

// =============================================================================
// Write Functions
// =============================================================================

const writeDraftDocument = (document: ThemeDocument): boolean => {
  const storage = getDraftStorage()
  if (!storage) {
    return false
  }

  try {
    const serialized = JSON.stringify(document)
    storage.setItem(DRAFT_STORAGE_KEY, serialized)
    return true
  } catch (error) {
    logError(error, { scope: 'themeStorage.persistDraftDocument' })
    return false
  }
}

const writeSavedDocument = (document: ThemeDocument): boolean => {
  const storage = getSavedStorage()
  if (!storage) {
    return false
  }

  try {
    const serialized = JSON.stringify(document)
    const estimatedSize = new Blob([serialized]).size

    // Check available quota (if supported)
    try {
      const nav = typeof navigator !== 'undefined' ? navigator : null
      if (nav && 'storage' in nav) {
        const navStorage = (nav as Navigator & { storage?: StorageManager }).storage
        if (navStorage && typeof navStorage.estimate === 'function') {
          navStorage.estimate()
            .then((estimate: StorageEstimate) => {
              const quota = estimate?.quota
              const usage = estimate?.usage
              if (quota && usage) {
                const available = quota - usage
                if (available < estimatedSize * 1.5) {
                  console.warn(`Storage quota low: ${available} bytes available, need ~${estimatedSize} bytes`)
                }
              }
            })
            .catch(() => {
              // Quota API not supported or failed, continue anyway
            })
        }
      }
    } catch {
      // Storage API not available, continue
    }

    storage.setItem(SAVED_STORAGE_KEY, serialized)
    return true
  } catch (error) {
    logError(error, { scope: 'themeStorage.persistSavedDocument' })

    // Check if it's a quota error
    const isQuotaError = error instanceof Error && (
      error.name === 'QuotaExceededError' ||
      error.message.includes('quota') ||
      error.message.includes('storage')
    )

    if (isQuotaError) {
      try {
        const globalScope = globalThis as typeof globalThis & { window?: Window }
        const win = typeof globalScope !== 'undefined' ? globalScope.window ?? null : null
        if (win && typeof win.alert === 'function') {
          const message = 'Storage quota exceeded! Your changes cannot be saved.\n\n' +
            'Please download a backup of your work immediately to prevent data loss.\n\n' +
            'You may need to:\n' +
            '- Clear browser data and re-import your backup\n' +
            '- Use a different browser\n' +
            '- Reduce custom CSS or content size'

          win.setTimeout(() => {
            win.alert(message)
          }, 0)
        }
      } catch {
        // Alert not available, continue
      }
    }

    return false
  }
}

const writePersistedDocument = (document: ThemeDocument): boolean => {
  return writeDraftDocument(document)
}

// =============================================================================
// Public API
// =============================================================================

export const hasDraftDocument = (): boolean => {
  const storage = getDraftStorage()
  if (!storage) {
    return false
  }
  const raw = storage.getItem(DRAFT_STORAGE_KEY)
  return raw !== null && raw.length > 0
}

export const clearDraftDocument = (): void => {
  const storage = getDraftStorage()
  if (!storage) {
    return
  }
  storage.removeItem(DRAFT_STORAGE_KEY)
}

export const loadDraftThemeDocument = (): ThemeDocument | null => {
  const draft = readDraftDocument()
  return draft ? deepClone(draft) : null
}

export const loadSavedThemeDocument = (): ThemeDocument => {
  return deepClone(readSavedDocument())
}

export const persistDraftThemeDocument = (document: ThemeDocument): boolean => {
  const normalized = normalizeThemeDocument(document)
  return writeDraftDocument(normalized)
}

export const persistSavedThemeDocument = (document: ThemeDocument): boolean => {
  const normalized = normalizeThemeDocument(document)
  return writeSavedDocument(normalized)
}

export const loadPersistedThemeDocument = (): ThemeDocument => deepClone(readPersistedDocument())

export const persistThemeDocument = (document: ThemeDocument): boolean => {
  const normalized = normalizeThemeDocument(document)
  return writePersistedDocument(normalized)
}
