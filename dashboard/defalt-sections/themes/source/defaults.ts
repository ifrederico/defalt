/**
 * Source Theme Defaults
 *
 * Default configuration values for the Ghost Source theme.
 * These match the defaults in the Source theme's package.json.
 */

import type { SourceThemeConfig } from './schema.js'

export const sourceThemeDefaults: SourceThemeConfig = {
  // Appearance
  postFeedStyle: 'List',
  showImagesInFeed: true,
  showAuthor: true,
  showPublishDate: true,
  showPublicationInfoSidebar: false,

  // Post Settings
  showPostMetadata: true,
  enableDropCapsOnPosts: false,
  showRelatedArticles: true,

  // Spacing
  padding: {
    top: 0,
    bottom: 0
  },
  margin: undefined
}
