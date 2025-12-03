/**
 * Ghost API to PreviewData Transformer
 * Converts Ghost API responses into the format expected by HandlebarsRenderer
 *
 * SECURITY NOTE - Trust Boundary:
 * This module transforms data from a Ghost CMS instance. Ghost content (HTML, titles,
 * excerpts) is treated as trusted because:
 * 1. Ghost is a self-hosted or managed CMS with its own authentication
 * 2. Content authors must have Ghost admin access to create posts
 * 3. Ghost itself sanitizes content before storing it
 *
 * The `ghostPost.html` field contains rendered HTML that must be passed through
 * unescaped to preserve formatting (headings, links, images, embeds, etc.).
 * Text fields (title, excerpt) are passed to Handlebars which auto-escapes them.
 *
 * If integrating with untrusted Ghost instances, consider adding DOMPurify or
 * similar HTML sanitization to the html fields before rendering.
 */

import type { GhostPost, GhostPage, GhostSettings, GhostPostsResponse } from './types'

// Local type definitions to avoid cross-module imports
// PreviewData is essentially a flexible record
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PreviewData = Record<string, any>

interface PreviewAuthor {
  name: string
  profile_image?: string
  url?: string
}

interface PreviewPost {
  id?: number | string
  title: string
  slug: string
  url: string
  feature_image?: string
  feature_image_alt?: string
  feature_image_caption?: string | null
  featured?: boolean
  excerpt?: string
  custom_excerpt?: string
  published_at?: string
  reading_time?: string
  primary_tag?: {
    name?: string
    slug?: string
    url?: string
  } | null
  authors?: PreviewAuthor[]
  primary_author?: PreviewAuthor | null
}

/**
 * Transform Ghost post to PreviewPost format
 */
export type GhostPostLike = GhostPost | GhostPage

function transformGhostPost(ghostPost: GhostPostLike): PreviewPost {
  return {
    id: ghostPost.id,
    title: ghostPost.title,
    slug: ghostPost.slug,
    url: ghostPost.url,
    feature_image: ghostPost.feature_image || undefined,
    feature_image_alt: ghostPost.feature_image_alt || undefined,
    feature_image_caption: ghostPost.feature_image_caption || null,
    featured: ghostPost.featured,
    excerpt: ghostPost.excerpt,
    custom_excerpt: ghostPost.custom_excerpt || undefined,
    published_at: ghostPost.published_at || undefined,
    reading_time: ghostPost.reading_time ? `${ghostPost.reading_time} min read` : undefined,
    primary_tag: ghostPost.primary_tag
      ? {
          name: ghostPost.primary_tag.name,
          slug: ghostPost.primary_tag.slug,
          url: ghostPost.primary_tag.url
        }
      : null,
    authors: ghostPost.authors?.map(author => ({
      name: author.name,
      profile_image: author.profile_image || undefined,
      url: author.url
    })),
    primary_author: ghostPost.primary_author
      ? {
          name: ghostPost.primary_author.name,
          profile_image: ghostPost.primary_author.profile_image || undefined,
          url: ghostPost.primary_author.url
        }
      : null
  }
}

/**
 * Transform Ghost posts response to home page PreviewData
 */
export function transformGhostPostsToHomeData(
  postsResponse: GhostPostsResponse,
  settings?: GhostSettings
): PreviewData {
  const posts = postsResponse.posts.map(transformGhostPost)

  return {
    site: {
      name: settings?.title || 'Your Ghost Blog',
      base_url: settings?.url || 'https://yourblog.ghost.io',
      cover_image: settings?.cover_image || null,
      logo: settings?.logo || null,
      icon: settings?.icon || null,
      accent_color: settings?.accent_color || '#15171A'
    },
    header: {
      navigation_bar: {
        brand: {
          name: settings?.title || 'Your Ghost Blog',
          url: '/'
        },
        menu: settings?.navigation?.map(nav => ({
          label: nav.label,
          href: nav.url
        })) || [
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' }
        ],
        actions: []
      }
    },
    content: [
      {
        type: 'ghost-cards',
        layout: 'grid',
        cards: posts.slice(0, 12) // Limit to 12 posts for home page
      }
    ],
    footer: {
      brand: {
        name: settings?.title || 'Your Ghost Blog',
        url: '/'
      },
      menu: settings?.secondary_navigation?.map(nav => ({
        label: nav.label,
        href: nav.url
      })) || [],
      signup: {
        title: 'Subscribe to updates',
        description: 'Get the latest posts delivered right to your inbox.'
      }
    },
    posts, // Include full posts array for pagination
    pagination: {
      page: postsResponse.meta.pagination.page,
      pages: postsResponse.meta.pagination.pages,
      total: postsResponse.meta.pagination.total,
      limit: postsResponse.meta.pagination.limit,
      next: postsResponse.meta.pagination.next,
      prev: postsResponse.meta.pagination.prev
    },
    meta: {
      title: settings?.title || 'Your Ghost Blog',
      description: settings?.description || ''
    }
  }
}

/**
 * Transform Ghost post to single post PreviewData
 */
export function transformGhostPostToPostData(
  ghostPost: GhostPostLike,
  relatedPosts: GhostPostLike[] = [],
  settings?: GhostSettings
): PreviewData {
  const readingTime = ghostPost.reading_time ? `${ghostPost.reading_time} min read` : null

  const post = transformGhostPost(ghostPost)
  const related = relatedPosts.map(transformGhostPost)

  return {
    site: {
      name: settings?.title || 'Your Ghost Blog',
      base_url: settings?.url || 'https://yourblog.ghost.io',
      cover_image: settings?.cover_image || null,
      logo: settings?.logo || null,
      icon: settings?.icon || null,
      accent_color: settings?.accent_color || '#15171A'
    },
    header: {
      navigation_bar: {
        brand: {
          name: settings?.title || 'Your Ghost Blog',
          url: '/'
        },
        menu: settings?.navigation?.map(nav => ({
          label: nav.label,
          href: nav.url
        })) || [
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' }
        ],
        actions: []
      }
    },
    article: {
      title: ghostPost.title,
      slug: ghostPost.slug,
      url: ghostPost.url,
      feature_image: ghostPost.feature_image || null,
      feature_image_alt: ghostPost.feature_image_alt || null,
      feature_image_caption: ghostPost.feature_image_caption || null,
      excerpt: ghostPost.excerpt,
      custom_excerpt: ghostPost.custom_excerpt || null,
      html: ghostPost.html,
      published_at: ghostPost.published_at || null,
      reading_time: readingTime,
      primary_author: ghostPost.primary_author
        ? {
            name: ghostPost.primary_author.name,
            profile_image: ghostPost.primary_author.profile_image || null,
            url: ghostPost.primary_author.url
          }
        : null,
      primary_tag: ghostPost.primary_tag
        ? {
            name: ghostPost.primary_tag.name,
            slug: ghostPost.primary_tag.slug,
            url: ghostPost.primary_tag.url
          }
        : null,
      // TRUST BOUNDARY: Ghost HTML content passed through unescaped for rendering.
      // See module header for security rationale.
      content_blocks: ghostPost.html
        ? [
            {
              type: 'html',
              html: ghostPost.html
            }
          ]
        : []
    },
    related: {
      title: 'Related posts',
      cards: related.slice(0, 4) // Show up to 4 related posts to match theme
    },
    footer: {
      brand: {
        name: settings?.title || 'Your Ghost Blog',
        url: '/'
      },
      menu: settings?.secondary_navigation?.map(nav => ({
        label: nav.label,
        href: nav.url
      })) || [],
      signup: {
        title: 'Subscribe to updates',
        description: 'Get the latest posts delivered right to your inbox.'
      }
    },
    post, // Include transformed post
    meta: {
      title: ghostPost.meta_title || ghostPost.title,
      description: ghostPost.meta_description || ghostPost.excerpt
    }
  }
}

/**
 * Transform Ghost page to page PreviewData
 */
export function transformGhostPageToPageData(
  ghostPost: GhostPage, // Pages use same structure as posts (without primary_tag)
  settings?: GhostSettings
): PreviewData {
  return {
    site: {
      name: settings?.title || 'Your Ghost Blog',
      base_url: settings?.url || 'https://yourblog.ghost.io',
      cover_image: settings?.cover_image || null,
      logo: settings?.logo || null,
      icon: settings?.icon || null,
      accent_color: settings?.accent_color || '#15171A'
    },
    header: {
      navigation_bar: {
        brand: {
          name: settings?.title || 'Your Ghost Blog',
          url: '/'
        },
        menu: settings?.navigation?.map(nav => ({
          label: nav.label,
          href: nav.url
        })) || [
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' }
        ],
        actions: []
      }
    },
    // TRUST BOUNDARY: Ghost HTML content passed through unescaped for rendering.
    // See module header for security rationale.
    content: ghostPost.html
      ? [
          {
            type: 'html',
            html: ghostPost.html
          }
        ]
      : [],
    footer: {
      brand: {
        name: settings?.title || 'Your Ghost Blog',
        url: '/'
      },
      menu: settings?.secondary_navigation?.map(nav => ({
        label: nav.label,
        href: nav.url
      })) || [],
      signup: {
        title: 'Subscribe to updates',
        description: 'Get the latest posts delivered right to your inbox.'
      }
    },
    page: {
      title: ghostPost.title,
      feature_image: ghostPost.feature_image || null,
      feature_image_alt: ghostPost.feature_image_alt || null,
      feature_image_caption: ghostPost.feature_image_caption || null,
      excerpt: ghostPost.excerpt,
      custom_excerpt: ghostPost.custom_excerpt || null,
      slug: ghostPost.slug,
      url: ghostPost.url,
      html: ghostPost.html,
      tags: ghostPost.tags?.map((tag) => ({
        name: tag.name,
        slug: tag.slug,
        visibility: tag.visibility
      })),
      primary_tag: ghostPost.tags && ghostPost.tags.length
        ? {
            name: ghostPost.tags[0].name,
            slug: ghostPost.tags[0].slug,
            url: ghostPost.tags[0].url,
            visibility: ghostPost.tags[0].visibility
          }
        : null
    },
    meta: {
      title: ghostPost.meta_title || ghostPost.title,
      description: ghostPost.meta_description || ghostPost.excerpt
    }
  }
}
