import Handlebars from 'handlebars'
import { getBasePath } from '@defalt/utils/env/basePath'

export const THEME_PARTIALS = [
  'components/cta',
  'components/featured',
  'components/footer',
  'components/header-content',
  'components/header',
  'components/navigation',
  'components/post-list',
  'email-subscription',
  'feature-image',
  'icons/arrow',
  'icons/avatar',
  'icons/bluesky',
  'icons/burger',
  'icons/checkmark',
  'icons/close',
  'icons/facebook',
  'icons/fire',
  'icons/instagram',
  'icons/linkedin',
  'icons/loader',
  'icons/lock',
  'icons/mastodon',
  'icons/rss',
  'icons/search',
  'icons/threads',
  'icons/tiktok',
  'icons/twitter',
  'icons/youtube',
  'lightbox',
  'post-card',
  'search-toggle',
  'typography/fonts',
  'typography/mono',
  'typography/sans',
  'typography/serif'
]

const resourceCache = new Map<string, string>()
const registeredPartials = new Map<string, string>()

const clearCaches = () => {
  resourceCache.clear()
  registeredPartials.clear()
}

if (typeof import.meta !== 'undefined' && import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', clearCaches)
}

async function fetchWithCache(url: string): Promise<string> {
  const cached = resourceCache.get(url)
  if (cached !== undefined) {
    return cached
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`)
  }
  const text = await response.text()
  resourceCache.set(url, text)
  return text
}

/**
 * Wraps hidden sections in a hidden container based on the
 * visibility map produced by the editor. This keeps structure consistent
 * with export while preventing visible output in preview.
 *
 * @param templates - The set of raw template strings keyed by filename.
 * @param hiddenSections - Flags that indicate which sections should be hidden.
 * @returns A new templates object with matching sections wrapped.
 */
export function filterTemplatesByVisibility(
  templates: Record<string, string>,
  hiddenSections?: Record<string, boolean>
): Record<string, string> {
  if (!hiddenSections) {
    return templates
  }

  const filtered = { ...templates }

  const wrapHidden = (content: string, regex: RegExp) =>
    content.replace(regex, (match) => `<div class="hidden" data-preview-hidden="true">\n${match}\n</div>`)

  // Filter default.hbs to wrap navigation
  // Note: announcement bar visibility is handled by preview data-section-hidden flags
  // and partial generation during export (empty partial when hidden)
  if (filtered.default) {
    let defaultContent = filtered.default

    if (hiddenSections.header) {
      defaultContent = wrapHidden(
        defaultContent,
        /\{\{!-- defalt-navigation-start --\}\}[\s\S]*?\{\{!-- defalt-navigation-end --\}\}/g
      )
    }

    filtered.default = defaultContent
  }

  // Filter home.hbs to wrap subheader and featured sections
  if (filtered.home) {
    let homeContent = filtered.home

    // NOTE: "subheader" controls {{> "components/header"}} (Magazine/Search/Highlight/Landing)
    // NOT the same as "header" which controls {{> "components/navigation"}} (nav bar)
    if (hiddenSections.subheader) {
      homeContent = wrapHidden(
        homeContent,
        /\{\{!-- defalt-subscribe-start --\}\}[\s\S]*?\{\{!-- defalt-subscribe-end --\}\}/g
      )
    }

    // Featured posts section - separate from subheader, only visible with Magazine style
    if (hiddenSections.featured) {
      homeContent = wrapHidden(
        homeContent,
        /\{\{#match @custom\.header_style[^}]*\}\}[\s\S]*?\{\{>\s*"components\/featured"[^}]*\}\}[\s\S]*?\{\{\/match\}\}/g
      )
    }

    // Remove main content section
    if (hiddenSections.main) {
      homeContent = wrapHidden(
        homeContent,
        /\{\{!-- defalt-main-start --\}\}[\s\S]*?\{\{!-- defalt-main-end --\}\}/g
      )
    }

    filtered.home = homeContent
  }

  // Filter page.hbs sections
  if (filtered.page) {
    let pageContent = filtered.page

    if (hiddenSections.page) {
      pageContent = wrapHidden(
        pageContent,
        /\{\{!-- defalt-page-start --\}\}[\s\S]*?\{\{!-- defalt-page-end --\}\}/g
      )
    }

    if (hiddenSections['page-content']) {
      pageContent = wrapHidden(
        pageContent,
        /\{\{!-- defalt-page-content-start --\}\}[\s\S]*?\{\{!-- defalt-page-content-end --\}\}/g
      )
    }

    filtered.page = pageContent
  }

  // Filter post.hbs sections
  if (filtered.post) {
    let postContent = filtered.post

    if (hiddenSections.post) {
      postContent = wrapHidden(
        postContent,
        /\{\{!-- defalt-post-start --\}\}[\s\S]*?\{\{!-- defalt-post-start-end --\}\}/g
      )
    }

    if (hiddenSections['post-article']) {
      postContent = wrapHidden(
        postContent,
        /\{\{!-- defalt-post-article-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-end --\}\}/g
      )
    }

    if (hiddenSections['post-article-header']) {
      postContent = wrapHidden(
        postContent,
        /\{\{!-- defalt-post-article-header-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-header-end --\}\}/g
      )
    }

    if (hiddenSections['post-article-tag']) {
      postContent = wrapHidden(
        postContent,
        /\{\{!-- defalt-post-article-tag-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-tag-end --\}\}/g
      )
    }

    if (hiddenSections['post-article-title']) {
      postContent = wrapHidden(
        postContent,
        /\{\{!-- defalt-post-article-title-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-title-end --\}\}/g
      )
    }

    if (hiddenSections['post-article-content']) {
      postContent = wrapHidden(
        postContent,
        /\{\{!-- defalt-post-article-content-start --\}\}[\s\S]*?\{\{!-- defalt-post-article-content-end --\}\}/g
      )
    }

    filtered.post = postContent
  }

  // Load and filter footer partial separately since it needs visibility filtering
  // Footer partial is registered in loadTemplates, but we return it here for re-registration
  if (hiddenSections.footerBar || hiddenSections.footerSignup) {
    // Signal that footer needs re-registration by returning a special key
    // This will be handled in HandlebarsRenderer
  }

  return filtered
}

/**
 * Filters footer partial content based on visibility settings
 * Used when registering the footer partial in loadTemplates
 */
export function filterFooterPartial(
  footerContent: string,
  hiddenSections?: Record<string, boolean>
): string {
  if (!hiddenSections) {
    return footerContent
  }

  let filtered = footerContent

  const wrapHiddenFooter = (content: string, regex: RegExp) =>
    content.replace(regex, (match) => `<div class="hidden" data-preview-hidden="true">\n${match}\n</div>`)

  // Wrap footer bar section
  if (hiddenSections.footerBar) {
    filtered = wrapHiddenFooter(
      filtered,
      /\{\{!-- defalt-footer-bar-start --\}\}[\s\S]*?\{\{!-- defalt-footer-bar-end --\}\}/g
    )
  }

  // Wrap footer signup section
  if (hiddenSections.footerSignup) {
    filtered = wrapHiddenFooter(
      filtered,
      /\{\{!-- defalt-footer-signup-start --\}\}[\s\S]*?\{\{!-- defalt-footer-signup-end --\}\}/g
    )
  }

  return filtered
}

/**
 * Loads Handlebars templates and partials for the current page
 */
export async function loadTemplates(currentPage: string): Promise<Record<string, string>> {
  const themePath = `${getBasePath()}/themes/source-complete`

  // Determine which templates to load based on current page
  const templateFiles: Record<string, string> = {
    default: `${themePath}/default.hbs`
  }

  if (currentPage === 'home') {
    templateFiles.home = `${themePath}/home.hbs`
  }
  if (currentPage === 'page2') {
    templateFiles.index = `${themePath}/index.hbs`
  }
  if (currentPage === 'about') {
    templateFiles.page = `${themePath}/page.hbs`
  }
  if (currentPage === 'post') {
    templateFiles.post = `${themePath}/post.hbs`
  }

  // Load all templates
  const templates: Record<string, string> = {}

  for (const [name, path] of Object.entries(templateFiles)) {
    const content = await fetchWithCache(path)
    templates[name] = content
  }

  // Load partials
  await Promise.all(THEME_PARTIALS.map(async (partial) => {
    try {
      const partialPath = `${themePath}/partials/${partial}.hbs`
      const content = await fetchWithCache(partialPath)
      const cachedContent = registeredPartials.get(partial)
      if (cachedContent !== content) {
        Handlebars.registerPartial(partial, content)
        registeredPartials.set(partial, content)
      }
    } catch (err) {
      console.warn(`Could not load partial ${partial}:`, err)
    }
  }))

  return templates
}
