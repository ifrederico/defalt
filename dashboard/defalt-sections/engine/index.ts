/**
 * Theme Engine - Main entry point
 *
 * This module provides the complete theme engine API for:
 * - Section schema definitions (Zod-validated)
 * - Common/shared setting presets
 * - Handlebars template rendering
 * - Section auto-discovery and registry
 * - Runtime config validation
 *
 * @example
 * // Importing schema types
 * import { type SectionDefinition, type SettingSchema } from '@defalt/sections/engine'
 *
 * // Using common settings
 * import { backgroundSettings, paddingSettings } from '@defalt/sections/engine'
 *
 * // Rendering a section
 * import { renderSection, getSectionDefinition } from '@defalt/sections/engine'
 *
 * // Validating config
 * import { validateSectionConfig, getDefaultConfig } from '@defalt/sections/engine'
 */

// =============================================================================
// Schema Types
// =============================================================================

export {
  // Input type enum
  SettingInputType,

  // Individual setting schemas
  textSettingSchema,
  textareaSettingSchema,
  richtextSettingSchema,
  urlSettingSchema,
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

  // Helper functions for creating settings
  createTextSetting,
  createColorSetting,
  createRangeSetting,
  createSelectSetting,
  createCheckboxSetting,
  createHeaderSetting,

  // Types
  type SettingSchema,
  type BlockSchema,
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
  // Zod schema fragments for config
  paddingConfigSchema,
  fullPaddingConfigSchema,
  backgroundConfigSchema,
  textColorsConfigSchema,
  borderRadiusConfigSchema,
  buttonConfigSchema,
  alignmentConfigSchema,
  widthConfigSchema,
  darkBackgroundConfigSchema,
  cardBorderRadiusConfigSchema,
  heightModeConfigSchema,

  // Zod shapes for spreading into section schemas
  paddingShape,
  fullPaddingShape,
  backgroundShape,
  textColorsShape,
  borderRadiusShape,
  buttonShape,
  alignmentShape,
  widthShape,
  darkBackgroundShape,
  cardBorderRadiusShape,
  heightModeShape,

  // UI Settings presets
  paddingSettings,
  unifiedPaddingSettings,
  backgroundSettings,
  darkBackgroundSettings,
  textColorSettings,
  fullTextColorSettings,
  borderRadiusSettings,
  cardBorderRadiusSettings,
  buttonToggleSettings,
  buttonContentSettings,
  buttonStyleSettings,
  fullButtonSettings,
  alignmentSettings,
  widthSettings,
  layoutSettings,
  heightModeSettings,
  sectionHeaderSettings,
  toggleableSectionHeaderSettings,
  lightSchemeSettings,
  darkSchemeSettings,
  ghostPageTagSettings
} from './commonSettings.js'

// =============================================================================
// HBS Renderer
// =============================================================================

export {
  // Core rendering
  renderSection,
  renderSectionSync,

  // Template management
  preloadTemplate,
  preloadTemplates,
  clearTemplateCache,
  invalidateTemplate,
  isTemplateCached,
  getTemplateSource,

  // Helper registration
  registerSectionHelpers,

  // Style utilities
  buildPaddingStyle,
  buildCssVariables,
  sanitizeHexColor,
  sanitizeHref,
  escapeHtml,

  // Types
  type SectionRenderContext,
  type RenderSectionOptions
} from './hbsRenderer.js'

// =============================================================================
// Section Registry
// =============================================================================

export {
  // Registry state
  sectionDefinitions,
  sectionDefinitionMap,

  // Lookup functions
  getSectionDefinition,
  hasSection,
  getSectionIds,
  getSectionsByCategory,
  getPremiumSections,
  getFreeSections,
  getSectionTemplatePath,

  // Instance building
  buildSectionInstance,

  // Utilities
  listSections,
  debugLogSections,

  // Types
  type SectionModule,
  type RegisteredSection
} from './sectionRegistry.js'

// =============================================================================
// Validation
// =============================================================================

export {
  // Full validation
  validateSectionConfig,
  parseConfigOrThrow,

  // Partial validation
  validatePartialConfig,

  // Field validation
  validateField,

  // Batch validation
  validateAllConfigs,

  // Default config
  getDefaultConfig,
  mergeWithDefaults,

  // Error formatting
  formatZodError,
  extractFieldErrors,
  getFieldError,

  // Schema access
  getSectionSchema,
  hasConfigSchema,

  // Utilities
  getNestedValue,

  // Types
  type ValidationResult,
  type ValidationSuccess,
  type ValidationError,
  type FieldError
} from './validation.js'

// =============================================================================
// Premium Config
// =============================================================================

export { isPremium, isFree, getPremiumFeatures, getFreeFeatures } from '../premiumConfig.js'

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
  type GhostCardsCardConfig,
  ghostCardsConfigSchema,
  ghostCardsSettingsSchema,
  ghostCardsBlocksSchema
} from '../sections/ghostCards/schema.js'
export { ghostCardsDefaults } from '../sections/ghostCards/defaults.js'

// Ghost Grid section
export {
  type GhostGridSectionConfig,
  type GhostGridCardConfig,
  ghostGridConfigSchema,
  ghostGridSettingsSchema,
  ghostGridBlocksSchema
} from '../sections/ghostGrid/schema.js'
export { ghostGridDefaults } from '../sections/ghostGrid/defaults.js'

// Image With Text section
export {
  type ImageWithTextSectionConfig,
  imageWithTextConfigSchema,
  imageWithTextSettingsSchema
} from '../sections/image-with-text/schema.js'
export { imageWithTextDefaults } from '../sections/image-with-text/defaults.js'

// Announcement Bar section
export {
  type AnnouncementBarSectionConfig,
  announcementBarConfigSchema,
  announcementBarSettingsSchema
} from '../sections/announcement-bar/schema.js'
export { announcementBarDefaults } from '../sections/announcement-bar/defaults.js'

// Announcement section (content text)
export {
  type AnnouncementSectionConfig,
  announcementConfigSchema,
  announcementSettingsSchema
} from '../sections/announcement/schema.js'
export { announcementDefaults } from '../sections/announcement/defaults.js'

// Header section
export {
  type HeaderSectionConfig,
  headerConfigSchema,
  headerSettingsSchema
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
export interface PreviewPageData {
  id?: number | string
  title: string
  slug: string
  url: string
  feature_image?: string
  feature_image_alt?: string
  html?: string
  excerpt?: string
  custom_excerpt?: string
  tags?: Array<{ name?: string; slug?: string; visibility?: string }>
}
