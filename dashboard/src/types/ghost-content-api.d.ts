declare module '@tryghost/content-api' {
  export interface GhostContentAPIOptions {
    url: string
    key: string
    version: 'v5.0' | 'v4.0' | 'v3.0' | 'v2.0' | string
    makeRequest?: (options: { url: string; method: string; headers: Record<string, string> }) => Promise<unknown>
  }

  export interface BrowseParams {
    limit?: number | 'all'
    page?: number
    order?: string
    filter?: string
    include?: string
    fields?: string
  }

  export interface ReadParams {
    id?: string
    slug?: string
    include?: string
    fields?: string
  }

  export interface GhostPost {
    id: string
    uuid: string
    title: string
    slug: string
    html: string | null
    excerpt: string | null
    feature_image: string | null
    featured: boolean
    published_at: string | null
    created_at: string
    updated_at: string
    url: string
    custom_excerpt: string | null
    reading_time?: number
    authors?: GhostAuthor[]
    tags?: GhostTag[]
    primary_author?: GhostAuthor
    primary_tag?: GhostTag
  }

  export interface GhostPage {
    id: string
    uuid: string
    title: string
    slug: string
    html: string | null
    excerpt: string | null
    feature_image: string | null
    featured: boolean
    published_at: string | null
    created_at: string
    updated_at: string
    url: string
    custom_excerpt: string | null
    tags?: GhostTag[]
  }

  export interface GhostAuthor {
    id: string
    name: string
    slug: string
    profile_image: string | null
    bio: string | null
    url: string
  }

  export interface GhostTag {
    id: string
    name: string
    slug: string
    description: string | null
    feature_image: string | null
    url: string
    visibility: string
  }

  export interface GhostSettings {
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
    navigation: Array<{ label: string; url: string }>
    secondary_navigation: Array<{ label: string; url: string }>
    url: string
  }

  export interface GhostBrowseResult<T> {
    meta: {
      pagination: {
        page: number
        limit: number
        pages: number
        total: number
        next: number | null
        prev: number | null
      }
    }
    [key: string]: T[] | unknown
  }

  export interface GhostAPI {
    posts: {
      browse(params?: BrowseParams): Promise<GhostPost[]>
      read(params: ReadParams): Promise<GhostPost>
    }
    pages: {
      browse(params?: BrowseParams): Promise<GhostPage[]>
      read(params: ReadParams): Promise<GhostPage>
    }
    tags: {
      browse(params?: BrowseParams): Promise<GhostTag[]>
      read(params: ReadParams): Promise<GhostTag>
    }
    authors: {
      browse(params?: BrowseParams): Promise<GhostAuthor[]>
      read(params: ReadParams): Promise<GhostAuthor>
    }
    settings: {
      browse(): Promise<GhostSettings>
    }
  }

  class GhostContentAPI implements GhostAPI {
    constructor(options: GhostContentAPIOptions)
    posts: GhostAPI['posts']
    pages: GhostAPI['pages']
    tags: GhostAPI['tags']
    authors: GhostAPI['authors']
    settings: GhostAPI['settings']
  }

  export default GhostContentAPI
}
