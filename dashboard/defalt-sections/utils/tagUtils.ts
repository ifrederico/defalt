/**
 * Tag utilities for Ghost section definitions
 *
 * Re-exports primitives from defalt-utils and adds section-specific utilities.
 *
 * NOTE: Uses relative imports because this file is in the Vite plugin dependency chain.
 * Path aliases like @defalt/* aren't resolved during config bundling.
 */

import type { PreviewPageData } from '../engine/previewTypes.js'

// Re-export primitives from defalt-utils
export {
  formatInternalTag,
  toApiTagSlug,
  toTagFilter,
  resolveHeroDefaultTag,
  resolveImageWithTextDefaultTag,
  resolveGhostCardsDefaultTag,
  parseGhostCardIdSuffix,
  resolveGhostGridDefaultTags
} from '../../defalt-utils/helpers/tagFilterUtils.js'

// Re-export the type for convenience
export type { PreviewPageData }
