/**
 * Theme Engine - Main entry point
 *
 * This module provides the complete theme engine API for:
 * - Section schema definitions (Zod-validated)
 * - Common/shared setting presets
 * - Handlebars template rendering
 * - Section auto-discovery and registry
 * - Config validation (via schema boundaries)
 *
 * @example
 * // Importing schema types
 * import { type SectionDefinition, type SettingSchema } from '@defalt/sections/engine'
 *
 * // Using common settings (shapes for Zod, settings for UI)
 * import { contentWidthPxShape, textAlignmentShape, contentWidthPxSetting } from '@defalt/sections/engine'
 *
 * // Rendering a section
 * import { renderSection, getSectionDefinition } from '@defalt/sections/engine'
 */

// =============================================================================
// Schema Types
// =============================================================================

export {
  // Input type enum
  SettingInputType,

  // Individual setting schemas
  textSettingSchema,
  colorSettingSchema,
  checkboxSettingSchema,
  rangeSettingSchema,
  selectSettingSchema,
  headerSettingSchema,
  paragraphSettingSchema,

  // Combined setting schema
  settingSchema,

  // Block schema
  blockSchema,

  // Section padding schema
  sectionPaddingSchema,

  // Types
  type SettingSchema,
  type BlockSchema,
  type PaddingControls,
  type SectionPadding,
  type SectionCategory,
  type SectionDefinition,
  type SectionInstance,
  type RenderOptions
} from './schemaTypes.js'

// =============================================================================
// Common Settings Presets
// =============================================================================

export {
  // Content width (pixel-based)
  contentWidthPxShape,
  contentWidthPxSetting,

  // Text alignment
  textAlignmentShape,
  createTextAlignmentSetting,

  // Background (transparent default)
  transparentBackgroundShape,
  transparentBackgroundSetting,

  // Image appearance
  imageAppearanceShape,
  imageAspectSetting,
  imageBorderRadiusSetting,

  // Image layout
  imageLayoutShape,
  invertSetting,
  imageWidthSetting
} from './commonSettings.js'

// =============================================================================
// HBS Renderer
// =============================================================================

export {
  // Core rendering
  renderSection,

  // Template management
  preloadTemplates,
} from './hbsRenderer.js'

// =============================================================================
// Section Registry
// =============================================================================

export {
  // Registry state
  sectionDefinitions,

  // Lookup functions
  getSectionDefinition,
  getSectionTemplatePath,

  // Instance building
  buildSectionInstance,
} from './sectionRegistry.js'

// =============================================================================
// Premium Config
// =============================================================================

export { isPremium, isFree, getPremiumFeatures, getFreeFeatures } from '@defalt/utils/config/premiumConfig.js'

// =============================================================================
// Section Config Types (from individual section schemas)
// =============================================================================

// Hero section
export { type HeroConfig, heroConfigSchema, heroSettingsSchema } from '../sections/hero/schema.js'
export { heroDefaults } from '../sections/hero/defaults.js'
// Backward compatibility alias
export type { HeroConfig as HeroSectionConfig } from '../sections/hero/schema.js'

// Ghost Cards section
export {
  type GhostCardsSectionConfig,
  ghostCardsConfigSchema,
  ghostCardsSettingsSchema
} from '../sections/ghostCards/schema.js'
export { ghostCardsDefaults } from '../sections/ghostCards/defaults.js'

// Ghost Grid section
export {
  type GhostGridSectionConfig,
  ghostGridConfigSchema,
  ghostGridSettingsSchema
} from '../sections/ghostGrid/schema.js'
export { ghostGridDefaults } from '../sections/ghostGrid/defaults.js'

// Image With Text section
export {
  type ImageWithTextSectionConfig,
  imageWithTextConfigSchema,
  imageWithTextSettingsSchema
} from '../sections/image-with-text/schema.js'
export { imageWithTextDefaults } from '../sections/image-with-text/defaults.js'

// Announcement Bar section (Engine V2: Block Architecture)
export {
  type AnnouncementBarSectionConfig,
  type AnnouncementBlockConfig,
  announcementBarConfigSchema,
  announcementBarSettingsSchema,
  announcementBarBlocksSchema
} from '../sections/announcement-bar/schema.js'
export { announcementBarDefaults } from '../sections/announcement-bar/defaults.js'

// Header section
export {
  type HeaderSectionConfig,
  headerConfigSchema,
  headerSettingsSchema,
  NAVIGATION_LAYOUT_OPTIONS,
  NAVIGATION_LAYOUT_VALUES
} from '../sections/header/schema.js'
export { headerDefaults } from '../sections/header/defaults.js'

// =============================================================================
// Theme Schema Types
// =============================================================================

export {
  themePaddingSchema,
  themeMarginSchema,
  type ThemePadding,
  type ThemeMargin,
  type ThemeDefinition,
  type ThemeSettingsGroup,
  type ThemeInstance
} from './themeSchemaTypes.js'

// =============================================================================
// Source Theme
// =============================================================================

export {
  sourceThemeDefinition,
  sourceThemeConfigSchema,
  sourceThemeSettingsGroups,
  sourceThemeDefaults,
  type SourceThemeConfig
} from '../themes/index.js'

// =============================================================================
// Backward Compatibility
// =============================================================================

// Generic config type alias
export type SectionConfigSchema = Record<string, unknown>

// Backward compatibility alias for SettingSchema
export type { SettingSchema as SectionSettingSchema } from './schemaTypes.js'

// Alias for getSectionsByCategory (old name)
export { getSectionsByCategory as listDefinitionsByCategory } from './sectionRegistry.js'

// Preview page data type (used by tagUtils)
export type { PreviewPageData } from './previewTypes.js'
