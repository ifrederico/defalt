/**
 * Ghost Content API types
 * Based on Ghost Content API v3+ specification
 */

// ============================================================================
// Ghost API Response Types
// ============================================================================

export type GhostAuthor = {
  id: string
  name: string
  slug: string
  profile_image: string | null
  cover_image: string | null
  bio: string | null
  website: string | null
  location: string | null
  facebook: string | null
  twitter: string | null
  url: string
}

export type GhostTag = {
  id: string
  name: string
  slug: string
  description: string | null
  feature_image: string | null
  visibility: 'public' | 'internal'
  url: string
}

export type GhostPost = {
  id: string
  uuid: string
  title: string
  slug: string
  html: string | null
  comment_id: string | null
  feature_image: string | null
  feature_image_alt: string | null
  feature_image_caption: string | null
  featured: boolean
  visibility: 'public' | 'members' | 'paid'
  created_at: string
  updated_at: string
  published_at: string | null
  custom_excerpt: string | null
  excerpt: string
  reading_time: number
  url: string
  og_image: string | null
  og_title: string | null
  og_description: string | null
  twitter_image: string | null
  twitter_title: string | null
  twitter_description: string | null
  meta_title: string | null
  meta_description: string | null
  primary_author: GhostAuthor | null
  primary_tag: GhostTag | null
  authors?: GhostAuthor[]
  tags?: GhostTag[]
}

export type GhostPage = Omit<GhostPost, 'primary_tag'> & {
  // Pages can have internal tags (e.g., #ghost-card) when using include=tags
  primary_tag?: GhostTag | null
}

export type GhostNavigation = {
  label: string
  url: string
}

export type GhostSettings = {
  title: string
  description: string
  logo: string | null
  icon: string | null
  accent_color: string | null
  cover_image: string | null
  facebook: string | null
  twitter: string | null
  lang: string
  timezone: string
  codeinjection_head: string | null
  codeinjection_foot: string | null
  navigation: GhostNavigation[]
  secondary_navigation: GhostNavigation[]
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  og_title: string | null
  og_description: string | null
  twitter_image: string | null
  twitter_title: string | null
  twitter_description: string | null
  url: string
}

export type GhostPagination = {
  page: number
  limit: number
  pages: number
  total: number
  next: number | null
  prev: number | null
}

// API Response wrappers
export type GhostPostsResponse = {
  posts: GhostPost[]
  meta: {
    pagination: GhostPagination
  }
}

export type GhostPagesResponse = {
  pages: GhostPage[]
  meta: {
    pagination: GhostPagination
  }
}

export type GhostTagsResponse = {
  tags: GhostTag[]
  meta: {
    pagination: GhostPagination
  }
}

export type GhostAuthorsResponse = {
  authors: GhostAuthor[]
  meta: {
    pagination: GhostPagination
  }
}

export type GhostSettingsResponse = {
  settings: GhostSettings
}

// ============================================================================
// User Profile Types (Database)
// ============================================================================

export type GhostCredentials = {
  ghost_api_url: string | null
  ghost_content_key: string | null
  ghost_integration_name: string | null
}

// ============================================================================
// API Request/Response Types (for /api/ghost/content endpoint)
// ============================================================================

export type GhostContentRequest = {
  type: 'posts' | 'pages' | 'settings' | 'tags' | 'authors'
  limit?: number
  page?: number
  include?: string // e.g., 'authors,tags'
  filter?: string // e.g., 'featured:true'
  fields?: string // e.g., 'id,title,slug,feature_image'
}

export type GhostContentResponse = {
  success: boolean
  data?: GhostPostsResponse | GhostPagesResponse | GhostSettingsResponse | GhostTagsResponse | GhostAuthorsResponse
  error?: string
  cached?: boolean
  timestamp?: string
}

export type GhostConnectionTestResponse = {
  success: boolean
  message: string
  error?: string
  siteTitle?: string
}
