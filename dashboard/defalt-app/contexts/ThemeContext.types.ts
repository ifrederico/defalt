export type ThemeContextValue = {
  packageJson: string
  onPackageJsonChange: (value: string) => void
  resetPackageJson: () => void
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
