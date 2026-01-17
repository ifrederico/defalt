/**
 * Workspace Module - Pure functions for workspace state management
 *
 * This module provides pure, non-React functions for:
 * - Building configs from workspace state (derive.ts)
 * - Extracting state from EditorState (hydrate.ts)
 */

// =============================================================================
// Derive Functions (State → Config)
// =============================================================================

export {
  buildPageConfigFromState,
  buildHeaderConfigFromState,
  buildFooterConfigFromState,
  normalizeMarginValue,
  resolvePaddingValue,
  type SectionState,
  type HeaderState
} from './derive.js'

// =============================================================================
// Hydrate Functions (EditorState → State)
// =============================================================================

export {
  hydrateWorkspaceState,
  resolveWorkspaceSnapshot,
  parseBgColorFromPackageJson,
  type HydrationInput,
  type HydrationResult
} from './hydrate.js'
