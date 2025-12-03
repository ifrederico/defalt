import type {
  AnnouncementBarConfig,
  AnnouncementContentConfig
} from '@defalt/utils/config/themeConfig'

export type HeaderSettingsContext = {
  navigationLayoutValue: string
  navigationLayoutOptions: string[]
  navigationLayoutError: string | null
  stickyHeaderValue: string
  stickyHeaderOptions: string[]
  isSearchEnabled: boolean
  typographyCase: 'default' | 'uppercase'
  headerStyleValue: string
  headerTextValue: string
  backgroundImageEnabled: boolean
  showFeaturedPosts: boolean
}

export type FooterSettingsContext = {
  showImagesInFeed: boolean
  showAuthor: boolean
  showPublishDate: boolean
  showPublicationInfoSidebar: boolean
  showPostMetadata: boolean
  enableDropCapsOnPosts: boolean
  showRelatedArticles: boolean
}

export type AnnouncementSettingsContext = {
  bar: AnnouncementBarConfig
  content: AnnouncementContentConfig
}

export type ThemeContextValue = {
  packageJson: string
  onPackageJsonChange: (value: string) => void
  navigationLayoutValue: string
  navigationLayoutOptions: string[]
  navigationLayoutError: string | null
  onNavigationLayoutChange: (value: string) => void
  headerAndFooterColorValue: string
  headerAndFooterColorOptions: string[]
  onHeaderAndFooterColorChange: (value: string) => void
  titleFontValue: string
  titleFontOptions: string[]
  onTitleFontChange: (value: string) => void
  bodyFontValue: string
  bodyFontOptions: string[]
  onBodyFontChange: (value: string) => void
  signupHeadingValue: string
  onSignupHeadingChange: (value: string) => void
  signupSubheadingValue: string
  onSignupSubheadingChange: (value: string) => void
  headerStyleValue: string
  headerStyleOptions: string[]
  onHeaderStyleChange: (value: string) => void
  headerTextValue: string
  onHeaderTextChange: (value: string) => void
  backgroundImageEnabled: boolean
  onBackgroundImageToggle: (value: boolean) => void
  showFeaturedPosts: boolean
  onShowFeaturedPostsToggle: (value: boolean) => void
  postFeedStyleValue: string
  postFeedStyleOptions: string[]
  onPostFeedStyleChange: (value: string) => void
  showImagesInFeed: boolean
  onShowImagesInFeedToggle: (value: boolean) => void
  showAuthor: boolean
  onShowAuthorToggle: (value: boolean) => void
  showPublishDate: boolean
  onShowPublishDateToggle: (value: boolean) => void
  showPublicationInfoSidebar: boolean
  onShowPublicationInfoSidebarToggle: (value: boolean) => void
  showPostMetadata: boolean
  onShowPostMetadataToggle: (value: boolean) => void
  enableDropCapsOnPosts: boolean
  onEnableDropCapsOnPostsToggle: (value: boolean) => void
  showRelatedArticles: boolean
  onShowRelatedArticlesToggle: (value: boolean) => void
}
