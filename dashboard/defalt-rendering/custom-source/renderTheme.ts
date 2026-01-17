/**
 * Theme Rendering - Helper function for rendering Ghost theme templates
 *
 * This module contains the pure rendering logic for compiling and
 * rendering Handlebars templates with preview data.
 */

import Handlebars from 'handlebars'
import {
  buildTemplateContext,
  buildDataFrame,
  buildPagination,
  type PreviewData,
  type PreviewPost
} from './handlebars/dataResolvers'

/**
 * Renders a complete theme page from templates and preview data
 */
export function renderTheme(
  templates: Record<string, string>,
  previewData: PreviewData,
  currentPage: string,
  posts: PreviewPost[],
  accentColor: string,
  backgroundColor: string,
  pageLayout: 'narrow' | 'normal',
  navigationLayout: string,
  siteUrl: string,
  pageNumber: number,
  customSettingsOverrides: Record<string, unknown>
): string {
  // Compile default template
  const defaultTemplate = Handlebars.compile(templates.default)
  const postsPerPage = previewData?.config?.posts_per_page ?? 12
  const pagination = buildPagination(pageNumber, posts.length, postsPerPage)
  const pagedPosts = posts // Show all posts on every page in preview mode

  // Build render context
  const renderContext = buildTemplateContext(
    previewData,
    currentPage,
    pagedPosts,
    siteUrl,
    pagination
  )

  // Build data frame for Handlebars
  const dataFrame = buildDataFrame(
    previewData,
    pagedPosts,
    accentColor,
    backgroundColor,
    pageLayout,
    navigationLayout,
    siteUrl,
    currentPage,
    customSettingsOverrides
  )

  // Select page template based on current page
  let pageTemplate: HandlebarsTemplateDelegate | null = null
  if (currentPage === 'home' && templates.home) {
    pageTemplate = Handlebars.compile(templates.home)
  } else if (currentPage === 'page2' && templates.index) {
    pageTemplate = Handlebars.compile(templates.index)
  } else if (currentPage === 'about' && templates.page) {
    pageTemplate = Handlebars.compile(templates.page)
  } else if (currentPage === 'post' && templates.post) {
    pageTemplate = Handlebars.compile(templates.post)
  }

  if (!pageTemplate) {
    return ''
  }

  // Render page content
  const pageContent = pageTemplate(renderContext, { data: dataFrame })

  // Inject page content into default layout
  const fullHtml = defaultTemplate(
    {
      ...renderContext,
      body: pageContent
    },
    { data: dataFrame }
  )

  return fullHtml
}
