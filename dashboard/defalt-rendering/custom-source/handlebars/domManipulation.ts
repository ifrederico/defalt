import type { MutableRefObject } from 'react'
import {
  FOOTER_INNER_SELECTOR,
  FOOTER_ROOT_SELECTOR,
  FOOTER_SECTION_SELECTORS,
  TEMPLATE_CONTAINER_SELECTOR,
  TEMPLATE_SECTION_SELECTORS,
  toSelectorList,
  getSectionSelector,
} from './sectionSelectors'
import { throttle } from '@defalt/utils/performance/throttle'
import {
  applyHeaderCustomizations,
  type HeaderCustomizationOptions,
} from './headerCustomization'
import {
  DEFAULT_ANNOUNCEMENT_BAR_CONFIG,
  DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG,
  type AnnouncementBarConfig,
  type AnnouncementContentConfig
} from '@defalt/utils/config/themeConfig'
import { sanitizeCustomCss } from '@defalt/utils/security/sanitizers'

const BASE_PATH = (import.meta.env.VITE_BASE_PATH ?? '/').replace(/\/$/, '')

let portalMockElement: HTMLDivElement | null = null
const CUSTOM_CSS_STYLE_ID = 'gh-editor-custom-css'
const PREVIEW_STYLES_ID = 'gh-editor-preview-styles'
const THEME_CSS_LINK_ID = 'gh-editor-theme-css'
const THEME_CSS_HREF = `${BASE_PATH}/themes/source-complete/assets/built/screen.css`
const PREVIEW_INLINE_STYLES = `
body.app-hide-announcement-bar #gh-announcement-bar,
body.app-hide-announcement-bar .gh-announcement-bar {
  display: none !important;
}

body.app-hide-header #gh-navigation,
body.app-hide-header .gh-navigation {
  display: none !important;
}

body.app-hide-subheader section.gh-header,
body.app-hide-subheader section.gh-cta {
  display: none !important;
}

body.app-hide-main section.gh-container {
  display: none !important;
}

body.app-hide-footer-bar .gh-footer-bar {
  display: none !important;
}

body.app-hide-footer-signup .gh-footer-signup {
  display: none !important;
}

[data-section-hidden="true"] {
  display: none !important;
}

.gd-hero-card {
  background-color: var(--gd-hero-background, #000000);
  color: var(--gd-hero-text-color, #ffffff);
  padding-top: var(--gd-hero-inner-padding-top, 0px);
  padding-bottom: var(--gd-hero-inner-padding-bottom, 0px);
  padding-left: clamp(2.5rem, 6vw, 4em);
  padding-right: clamp(2.5rem, 6vw, 4em);
  display: flex;
  justify-content: center;
}

.gd-hero-section {
  padding-top: var(--gd-hero-padding-top, min(12vmax, 5rem));
  padding-bottom: var(--gd-hero-padding-bottom, min(12vmax, 5rem));
}

.gd-hero-section.gd-hero-section-regular {
  padding-left: var(--container-gap, clamp(24px, 1.7032rem + 1.9355vw, 48px));
  padding-right: var(--container-gap, clamp(24px, 1.7032rem + 1.9355vw, 48px));
}

.gd-hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  max-width: 680px;
  width: 100%;
  margin: 0 auto;
  text-align: center;
}

.gd-hero-content.gd-align-left {
  align-items: flex-start;
  text-align: left;
}

.gd-hero-content.gd-align-right {
  align-items: flex-end;
  text-align: right;
}

.gd-hero-content.gd-width-regular {
  max-width: var(--container-width, 1120px);
  padding-left: var(--container-gap, clamp(24px, 1.7032rem + 1.9355vw, 48px));
  padding-right: var(--container-gap, clamp(24px, 1.7032rem + 1.9355vw, 48px));
}

.gd-hero-content.gd-width-full {
  max-width: none;
}

.gd-hero-content.gd-width-full.gd-align-left {
  margin-left: 0;
  margin-right: auto;
}

.gd-hero-content.gd-width-full.gd-align-right {
  margin-left: auto;
  margin-right: 0;
}

.gd-hero-heading {
  margin: 0;
  font-family: var(--gh-font-heading, var(--font-sans));
  font-size: calc(clamp(3rem, 1.82vw + 2.27rem, 4.6rem) * var(--factor, 1));
  letter-spacing: -0.028em;
  line-height: 1.1;
  color: inherit;
}

.gd-hero-subheading {
  margin: 12px 0 0;
  max-width: 640px;
  font-size: 1.8rem;
  font-weight: 450;
  line-height: 1.4;
  letter-spacing: -0.014em;
  color: inherit;
}

.gd-hero-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.7em;
  min-height: 46px;
  padding: 0 1.2em;
  border-radius: var(--gd-hero-button-radius, 3px);
  font-size: 1.05em;
  font-weight: 600;
  line-height: 1em;
  text-decoration: none;
  letter-spacing: 0.2px;
  white-space: nowrap;
  text-overflow: ellipsis;
  background-color: var(--gd-hero-button-color, #ffffff);
  color: var(--gd-hero-button-text-color, #151515);
  margin-top: 2em;
}

.gd-hero-button:hover {
  opacity: 0.85;
}

.gd-hero-card .kg-button-card {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 2em;
}

.gd-hero-card .kg-button-card .kg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 1.2em;
  border-radius: var(--gd-hero-button-radius, 3px);
  font-size: 1.05em;
  font-weight: 600;
  line-height: 1em;
  letter-spacing: 0.2px;
  text-decoration: none;
  white-space: nowrap;
  background-color: var(--gd-hero-button-color, #ffffff);
  color: var(--gd-hero-button-text-color, #151515);
}

.gd-hero-card .kg-button-card .kg-btn:hover {
  opacity: 0.85;
}

.gd-hero-placeholder {
  opacity: 0.65;
}

.gd-hero-button.gd-hero-placeholder,
.gd-hero-card .kg-button-card.gd-hero-placeholder,
.gd-hero-card .kg-button-card .kg-btn.gd-hero-placeholder {
  opacity: 0.7;
}

.gd-hero-content-placeholder .kg-button-card,
.gd-hero-content-placeholder .kg-button-card .kg-btn {
  opacity: 0.7;
}

.gd-ghost-cards-section {
  background-color: var(--gd-ghost-cards-background, #ffffff);
  color: var(--gd-ghost-cards-text, #151515);
}

.gd-ghost-cards-inner {
  padding-top: var(--gd-ghost-cards-padding-top, 32px);
  padding-bottom: var(--gd-ghost-cards-padding-bottom, 32px);
  padding-left: var(--gd-ghost-cards-padding-left, 0px);
  padding-right: var(--gd-ghost-cards-padding-right, 0px);
}

.gd-ghost-cards-container {
  width: min(1120px, calc(100% - clamp(48px, 6vw, 96px)));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(32px, 5vw, 48px);
}

.gd-ghost-cards-intro {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gd-ghost-cards-title {
  margin: 0;
  font-family: var(--gh-font-heading, var(--font-sans));
  font-size: clamp(2.4rem, 1.25rem + 1.5vw, 3.2rem);
  letter-spacing: -0.016em;
  line-height: 1.15;
  color: inherit;
}

.gd-ghost-cards-subtitle {
  margin: 0;
  color: inherit;
  opacity: 0.85;
  font-size: 1.125rem;
  line-height: 1.6;
}

.gd-ghost-cards-grid {
  display: grid;
  gap: clamp(20px, 3vw, 32px);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

[data-section-type="ghost-grid"] .gd-ghost-cards-grid {
  gap: var(--gd-ghost-grid-gap, clamp(20px, 3vw, 32px));
}

[data-section-type="ghost-grid"].gd-ghost-grid-no-stack .gd-ghost-cards-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gd-ghost-cards-content {
  display: contents;
}

.gd-ghost-cards-hide-header .gd-ghost-cards-content header.gh-article-header,
.gd-ghost-cards-hide-header header.gh-article-header {
  display: none;
}

.gd-ghost-cards-hide-header .gd-ghost-placeholder-header {
  display: none;
}

.gd-ghost-cards-header-center .gh-article-header,
.gd-ghost-cards-header-center .gh-article-title {
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}

.gd-ghost-cards-header-left .gh-article-header,
.gd-ghost-cards-header-left .gh-article-title {
  text-align: left;
  margin-left: 0;
  margin-right: auto;
}

.gd-ghost-cards-header-right .gh-article-header,
.gd-ghost-cards-header-right .gh-article-title {
  text-align: right;
  margin-left: auto;
  margin-right: 0;
}

.gd-ghost-card {
  background-color: var(--gd-ghost-cards-card-background, #ffffff);
  border: 1px solid var(--gd-ghost-cards-card-border, rgba(0, 0, 0, 0.08));
  border-radius: 18px;
  padding: clamp(24px, 3vw, 32px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.gd-ghost-card-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.gd-ghost-card-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: inherit;
}

.gd-ghost-card-description {
  margin: 0;
  color: inherit;
  opacity: 0.8;
  font-size: 1rem;
  line-height: 1.5;
}

.gd-ghost-card-button {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55em 1.4em;
  font-weight: 600;
  font-size: 0.95rem;
  border-radius: 999px;
  text-decoration: none;
  background-color: var(--gd-ghost-cards-button-color, #151515);
  color: #ffffff;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.gd-ghost-card-button:hover {
  transform: translateY(-1px);
  opacity: 0.9;
}

.gd-ghost-cards-placeholder {
  border: 1px dashed #d4d4d4;
  border-radius: 12px;
  padding: 24px;
  background-color: #fafafa;
  text-align: center;
  color: #6b7280;
}

.gd-ghost-cards-placeholder-title {
  margin: 0 0 8px;
  font-weight: 600;
  color: #151515;
}

.gd-ghost-cards-placeholder-copy {
  margin: 0;
  color: inherit;
  line-height: 1.6;
}

.gd-ghost-cards-placeholder code {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  margin: 0 2px;
  border-radius: 4px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  font-size: 12px;
  font-family: inherit;
}

.gd-ghost-cards-placeholder-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 12px;
  text-align: left;
}

.gd-ghost-cards-placeholder-column {
  border: 1px dashed rgba(107, 114, 128, 0.45);
  border-radius: 10px;
  background: #f5f5f5;
  padding: 12px;
}

.gd-ghost-placeholder-header {
  margin: 0 0 20px;
  opacity: 0.5;
}

.gd-ghost-placeholder-header .gh-article-title {
  color: rgba(21, 21, 21, 0.55);
}

.gd-ghost-title-small .gh-article-header .gh-article-title {
  font-family: var(--gh-font-heading, var(--font-sans));
  font-size: calc(2.4rem * var(--factor, 1));
  font-weight: 725;
  letter-spacing: -0.015em;
  line-height: 1.1;
}

.gd-ghost-title-normal .gh-article-header .gh-article-title {
  font-family: var(--gh-font-heading, var(--font-sans));
  font-size: calc(clamp(2.8rem, 1.36vw + 2.25rem, 4rem) * var(--factor, 1));
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.gd-ghost-title-large .gh-article-header .gh-article-title {
  font-family: var(--gh-font-heading, var(--font-sans));
  font-size: calc(clamp(3rem, 1.82vw + 2.27rem, 4.6rem) * var(--factor, 1));
  font-weight: 700;
  letter-spacing: -0.028em;
  line-height: 1.1;
}

.gd-ghost-grid-placeholder {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--gd-ghost-grid-gap, 20px);
}

[data-section-type="ghost-grid"].gd-ghost-grid-no-stack .gd-ghost-grid-placeholder {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.gd-ghost-grid-placeholder-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gd-ghost-grid-placeholder-card {
  border: 1px dashed rgba(107, 114, 128, 0.45);
  border-radius: 10px;
  background: #fafafa;
  padding: 16px;
  text-align: left;
  color: #6b7280;
}

.gd-ghost-grid-placeholder-title {
  margin: 0;
  font-weight: 600;
  color: #151515;
}

.gd-ghost-grid-placeholder-copy {
  margin: 0;
  line-height: 1.5;
}

.gd-ghost-grid-placeholder code {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  margin: 0 2px;
  border-radius: 4px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  font-size: 12px;
  font-family: inherit;
}

/* Grid Section */
.gd-grid-section {
  background-color: var(--gd-grid-background, #ffffff);
  color: var(--gd-grid-text-color, #151515);
  padding-top: var(--gd-grid-padding-top, 32px);
  padding-bottom: var(--gd-grid-padding-bottom, 32px);
}

.gd-grid-container {
  width: min(1120px, calc(100% - clamp(48px, 6vw, 96px)));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(32px, 5vw, 48px);
}

.gd-grid-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 720px;
}

.gd-grid-header-center {
  align-items: center;
  text-align: center;
  margin: 0 auto;
}

.gd-grid-header-left {
  align-items: flex-start;
  text-align: left;
}

.gd-grid-header-right {
  align-items: flex-end;
  text-align: right;
  margin-left: auto;
}

.gd-grid-heading {
  margin: 0;
  font-family: var(--gh-font-heading, var(--font-sans));
  font-size: clamp(2.8rem, 1.36vw + 2.25rem, 4rem);
  font-weight: 700;
  letter-spacing: -0.022em;
  line-height: 1.1;
  color: inherit;
}

.gd-grid-subheading {
  margin: 0;
  font-size: 1.8rem;
  line-height: 1.4;
  letter-spacing: -0.015em;
  opacity: 0.85;
  color: inherit;
}

.gd-grid-items {
  display: grid;
  gap: clamp(20px, 3vw, 32px);
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.gd-grid-item {
  background-color: var(--gd-grid-card-background, #ffffff);
  border: 1px solid var(--gd-grid-card-border, #e6e6e6);
  border-radius: 12px;
  padding: clamp(20px, 3vw, 28px);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gd-grid-item-icon {
  font-size: 2rem;
  line-height: 1;
}

.gd-grid-item-title {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: -0.014em;
  line-height: 1.3;
  color: inherit;
}

.gd-grid-item-description {
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.5;
  opacity: 0.8;
  color: inherit;
}

.gd-grid-placeholder {
  opacity: 0.65;
}

.gd-image-with-text-placeholder {
  display: flex;
  gap: 32px;
  border: 1px dashed #d4d4d4;
  border-radius: 12px;
  padding: 24px;
  background-color: #fafafa;
  align-items: center;
}

.gd-image-with-text-placeholder.gd-image-right {
  flex-direction: row-reverse;
}

.gd-image-with-text-placeholder-image {
  width: 50%;
  background-color: #e5e5e5;
  border-radius: 8px;
}

.gd-image-with-text-placeholder-content {
  width: 50%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  color: #6b7280;
}

.gd-image-with-text-placeholder-title {
  margin: 0 0 8px;
  font-weight: 600;
  color: #151515;
}

.gd-image-with-text-placeholder .gd-header-left {
  text-align: left;
}

.gd-image-with-text-placeholder .gd-header-center {
  text-align: center;
}

.gd-image-with-text-placeholder .gd-header-right {
  text-align: right;
}

.gd-image-with-text-placeholder-copy {
  margin: 0;
  line-height: 1.6;
}

.gd-image-with-text-placeholder code {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  margin: 0 2px;
  border-radius: 4px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  font-size: 12px;
  font-family: inherit;
}

/* Image with Text Content (Ghost page) */
.gd-image-with-text-content {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.gd-image-with-text-content.gd-image-right {
  flex-direction: row-reverse;
}

.gd-image-with-text-image {
  width: 50%;
  flex-shrink: 0;
}

.gd-image-with-text-image img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
}

.gd-image-with-text-content .gh-article {
  width: 50%;
}

.gd-image-with-text-content .gd-header-left {
  text-align: left;
}

.gd-image-with-text-content .gd-header-center {
  text-align: center;
}

.gd-image-with-text-content .gd-header-right {
  text-align: right;
}

@media (max-width: 768px) {
  .gd-image-with-text-content {
    flex-direction: column;
  }
  .gd-image-with-text-content.gd-image-right {
    flex-direction: column;
  }
  .gd-image-with-text-image,
  .gd-image-with-text-content .gh-article {
    width: 100%;
  }
}

/* Testimonials Section */
.gd-testimonials-section {
  background-color: var(--gd-testimonials-background, #ffffff);
  color: var(--gd-testimonials-text-color, #151515);
  padding-top: var(--gd-testimonials-padding-top, 32px);
  padding-bottom: var(--gd-testimonials-padding-bottom, 32px);
}

.gd-testimonials-container {
  width: min(1120px, calc(100% - clamp(48px, 6vw, 96px)));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(32px, 5vw, 48px);
}

.gd-testimonials-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 720px;
  align-items: center;
  text-align: center;
  margin: 0 auto;
}

.gd-testimonials-heading {
  margin: 0;
  font-family: var(--gh-font-heading, var(--font-sans));
  font-size: clamp(2.8rem, 1.36vw + 2.25rem, 4rem);
  font-weight: 700;
  letter-spacing: -0.022em;
  line-height: 1.1;
  color: inherit;
}

.gd-testimonials-subheading {
  margin: 0;
  font-size: 1.8rem;
  line-height: 1.4;
  letter-spacing: -0.015em;
  opacity: 0.85;
  color: inherit;
}

.gd-testimonials-items {
  display: grid;
  gap: clamp(20px, 3vw, 32px);
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.gd-testimonial-item {
  background-color: var(--gd-testimonials-card-background, #ffffff);
  border-radius: 12px;
  padding: clamp(24px, 3vw, 32px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.gd-testimonial-quote {
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.5;
  font-style: italic;
  color: inherit;
}

.gd-testimonial-author {
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.gd-testimonial-avatar {
  font-size: 3.2rem;
  line-height: 1;
  flex-shrink: 0;
}

.gd-testimonial-author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gd-testimonial-author-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 650;
  letter-spacing: -0.009em;
  color: inherit;
}

.gd-testimonial-author-title {
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.25;
  opacity: 0.7;
  color: inherit;
}

.gd-testimonials-placeholder {
  opacity: 0.65;
}

/* FAQ Section */
.gd-faq-section {
  background-color: var(--gd-faq-background, #ffffff);
  color: var(--gd-faq-text-color, #151515);
  padding-top: var(--gd-faq-padding-top, 32px);
  padding-bottom: var(--gd-faq-padding-bottom, 32px);
}

.gd-faq-container {
  width: min(820px, calc(100% - clamp(48px, 6vw, 96px)));
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(32px, 5vw, 48px);
}

.gd-faq-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  text-align: center;
}

.gd-faq-heading {
  margin: 0;
  font-family: var(--gh-font-heading, var(--font-sans));
  font-size: clamp(2.8rem, 1.36vw + 2.25rem, 4rem);
  font-weight: 700;
  letter-spacing: -0.022em;
  line-height: 1.1;
  color: inherit;
}

.gd-faq-subheading {
  margin: 0;
  font-size: 1.8rem;
  line-height: 1.4;
  letter-spacing: -0.015em;
  opacity: 0.85;
  color: inherit;
}

.gd-faq-items {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.gd-faq-item {
  border-bottom: 1px solid var(--gd-faq-item-border, #e6e6e6);
  padding: clamp(20px, 3vw, 24px) 0;
}

.gd-faq-item:first-child {
  padding-top: 0;
}

.gd-faq-question {
  margin: 0 0 12px;
  font-size: 1.9rem;
  font-weight: 700;
  letter-spacing: -0.014em;
  line-height: 1.3;
  color: inherit;
}

.gd-faq-answer {
  margin: 0;
  font-size: 1.6rem;
  line-height: 1.5;
  opacity: 0.85;
  color: inherit;
}

.gd-faq-placeholder {
  opacity: 0.65;
}

/* About Section */
.gd-about-section {
  background-color: var(--gd-about-background, #ffffff);
  color: var(--gd-about-text-color, #151515);
  padding-top: var(--gd-about-padding-top, 32px);
  padding-bottom: var(--gd-about-padding-bottom, 32px);
}

.gd-about-container {
  width: min(1120px, calc(100% - clamp(48px, 6vw, 96px)));
  margin: 0 auto;
}

.gd-about-content {
  display: grid;
  gap: clamp(32px, 5vw, 64px);
  grid-template-columns: repeat(2, 1fr);
  align-items: center;
}

.gd-about-content-reverse {
  direction: rtl;
}

.gd-about-content-reverse > * {
  direction: ltr;
}

@media (max-width: 768px) {
  .gd-about-content {
    grid-template-columns: 1fr;
  }
  .gd-about-content-reverse {
    direction: ltr;
  }
}

.gd-about-image {
  font-size: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border-radius: 12px;
  background-color: #f5f5f5;
}

.gd-about-text {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gd-about-heading {
  margin: 0;
  font-family: var(--gh-font-heading, var(--font-sans));
  font-size: clamp(2.8rem, 1.36vw + 2.25rem, 4rem);
  font-weight: 700;
  letter-spacing: -0.022em;
  line-height: 1.1;
  color: inherit;
}

.gd-about-description {
  margin: 0;
  font-size: 1.8rem;
  line-height: 1.4;
  letter-spacing: -0.015em;
  opacity: 0.85;
  color: inherit;
}

.gd-about-placeholder {
  opacity: 0.65;
}

/* Image with Text Section */
.gd-image-text-section {
  background-color: var(--gd-image-text-background, #ffffff);
  color: var(--gd-image-text-text-color, #151515);
  padding-top: var(--gd-image-text-padding-top, 32px);
  padding-bottom: var(--gd-image-text-padding-bottom, 32px);
}

.gd-image-text-container {
  width: min(1120px, calc(100% - clamp(48px, 6vw, 96px)));
  margin: 0 auto;
}

.gd-image-text-content {
  display: grid;
  gap: clamp(32px, 5vw, 64px);
  grid-template-columns: repeat(2, 1fr);
  align-items: center;
}

.gd-image-text-content-reverse {
  direction: rtl;
}

.gd-image-text-content-reverse > * {
  direction: ltr;
}

@media (max-width: 768px) {
  .gd-image-text-content {
    grid-template-columns: 1fr;
  }
  .gd-image-text-content-reverse {
    direction: ltr;
  }
}

.gd-image-text-image {
  font-size: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4/3;
  border-radius: 12px;
  background-color: #f5f5f5;
}

.gd-image-text-text {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.gd-image-text-heading {
  margin: 0;
  font-family: var(--gh-font-heading, var(--font-sans));
  font-size: clamp(2.8rem, 1.36vw + 2.25rem, 4rem);
  font-weight: 700;
  letter-spacing: -0.022em;
  line-height: 1.1;
  color: inherit;
}

.gd-image-text-description {
  margin: 0;
  font-size: 1.8rem;
  line-height: 1.4;
  letter-spacing: -0.015em;
  opacity: 0.85;
  color: inherit;
}

.gd-image-text-button {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.8em 1.4em;
  font-weight: 600;
  font-size: 1.5rem;
  border-radius: 100px;
  text-decoration: none;
  background-color: var(--gd-image-text-button-color, #151515);
  color: var(--gd-image-text-button-text-color, #ffffff);
  transition: opacity 0.15s ease;
}

.gd-image-text-button:hover {
  opacity: 0.9;
}

.gd-image-text-placeholder {
  opacity: 0.65;
}

/* Ghost Koenig CTA Card Styles */
.kg-cta-card,
.kg-cta-card * {
  box-sizing: border-box;
}

.kg-cta-card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
}

.kg-cta-bg-grey {
  background: rgba(151, 163, 175, 0.14);
}

.kg-cta-bg-white {
  background: transparent;
  box-shadow: inset 0 0 0 1px rgba(124, 139, 154, 0.2);
}

.kg-cta-bg-blue {
  background: rgba(33, 172, 232, 0.12);
}

.kg-cta-bg-green {
  background: rgba(52, 183, 67, 0.12);
}

.kg-cta-bg-yellow {
  background: rgba(240, 165, 15, 0.13);
}

.kg-cta-bg-red {
  background: rgba(209, 46, 46, 0.11);
}

.kg-cta-bg-pink {
  background: rgba(225, 71, 174, 0.11);
}

.kg-cta-bg-purple {
  background: rgba(135, 85, 236, 0.12);
}

.kg-cta-sponsor-label-wrapper {
  margin: 0 1.5em;
  padding: 0.7em 0;
  border-bottom: 1px solid rgba(124, 139, 154, 0.2);
}

.kg-cta-bg-none .kg-cta-sponsor-label-wrapper {
  margin: 0;
  padding-top: 0;
}

.kg-cta-has-img .kg-cta-sponsor-label-wrapper:not(.kg-cta-bg-none .kg-cta-sponsor-label-wrapper):not(.kg-cta-minimal .kg-cta-sponsor-label-wrapper),
.kg-cta-bg-none.kg-cta-no-dividers .kg-cta-sponsor-label-wrapper {
  border-bottom: 0;
}

.kg-cta-sponsor-label {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.kg-cta-sponsor-label span:not(a span) {
  opacity: 0.45;
}

.kg-cta-sponsor-label a,
.kg-cta-sponsor-label a span {
  color: currentColor;
  transition: opacity 0.15s ease-in-out;
}

.kg-cta-sponsor-label a:hover,
.kg-cta-sponsor-label a:hover span {
  color: currentColor;
  opacity: 0.85;
}

.kg-cta-link-accent .kg-cta-sponsor-label a {
  color: var(--ghost-accent-color);
}

.kg-cta-content {
  display: flex;
  padding: 1.5em;
  gap: 1.5em;
}

.kg-cta-has-img .kg-cta-sponsor-label-wrapper + .kg-cta-content:not(.kg-cta-bg-none .kg-cta-content):not(.kg-cta-minimal .kg-cta-content) {
  padding-top: 0;
}

.kg-cta-bg-none .kg-cta-content {
  padding: 1.5em 0;
  border-bottom: 1px solid rgba(124, 139, 154, 0.2);
}

.kg-cta-bg-none.kg-cta-no-dividers .kg-cta-content {
  padding: 0;
  border-bottom: none;
}

.kg-cta-bg-none:not(.kg-cta-no-dividers) .kg-cta-content:not(.kg-cta-sponsor-label-wrapper + .kg-cta-content) {
  border-top: 1px solid rgba(124, 139, 154, 0.2);
}

.kg-cta-minimal .kg-cta-content {
  flex-direction: row;
}

.kg-cta-immersive .kg-cta-content {
  flex-direction: column;
}

.kg-cta-content-inner {
  display: flex;
  flex-direction: column;
  gap: 1.5em;
}

.kg-cta-immersive.kg-cta-centered .kg-cta-content-inner {
  align-items: center;
}

.kg-cta-image-container {
  flex-shrink: 0;
}

.kg-cta-image-container img {
  width: 100%;
  height: auto;
  margin: 0;
  object-fit: cover;
  border-radius: 6px;
}

.kg-cta-minimal .kg-cta-image-container img {
  width: 64px;
  height: 64px;
}

.kg-cta-text p {
  margin: 0;
  line-height: 1.5em;
}

.kg-cta-bg-none .kg-cta-text p {
  line-height: unset;
}

.kg-cta-immersive.kg-cta-centered .kg-cta-text {
  text-align: center;
}

.kg-cta-text p + p {
  margin-top: 1.25em;
}

.kg-cta-text a {
  color: currentColor;
  transition: opacity 0.15s ease-in-out;
}

.kg-cta-text a:hover {
  color: currentColor;
  opacity: 0.85;
}

.kg-cta-link-accent .kg-cta-text a {
  color: var(--ghost-accent-color);
}

a.kg-cta-button {
  display: flex;
  position: static;
  align-items: center;
  justify-content: center;
  padding: 0 1em;
  height: 2.5em;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  font-size: 0.95em;
  font-weight: 500;
  line-height: 1.65;
  text-decoration: none;
  border-radius: 6px;
  transition: opacity 0.15s ease-in-out;
}

a.kg-cta-button:hover {
  opacity: 0.85;
}

a.kg-cta-button.kg-style-accent {
  background-color: var(--ghost-accent-color);
}

a.kg-cta-button {
  width: max-content;
}

.kg-cta-immersive.kg-cta-has-img a.kg-cta-button {
  width: 100%;
}

/* Ghost Koenig Button Card Styles */
.kg-button-card,
.kg-button-card * {
  box-sizing: border-box;
}

.kg-button-card {
  display: flex;
  position: static;
  align-items: center;
  width: 100%;
  justify-content: center;
}

.kg-button-card.kg-align-left {
  justify-content: flex-start;
}

.kg-button-card a.kg-btn {
  display: flex;
  position: static;
  align-items: center;
  padding: 0 1.2em;
  height: 2.4em;
  line-height: 1em;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  font-size: 0.95em;
  font-weight: 600;
  text-decoration: none;
  border-radius: 5px;
  transition: opacity 0.2s ease-in-out;
}

.kg-button-card a.kg-btn:hover {
  opacity: 0.85;
}

.kg-button-card a.kg-btn-accent {
  background-color: var(--ghost-accent-color);
  color: #fff;
}

`

type InjectPreviewOptions = {
  templateOrder: string[]
  footerOrder: string[]
  headerOptions: HeaderCustomizationOptions
  announcementBarConfig: AnnouncementBarConfig
  announcementContentConfig: AnnouncementContentConfig
  selectedSectionId?: string | null
  sectionIds?: string[]
  onSelectSection?: (sectionId: string) => void
  customCss?: string
  customSections?: Array<{ id: string, html: string, hidden: boolean }>
  onNavigate?: (href: string) => boolean
}

function escapeSectionId(sectionId: string): string {
  const css = typeof globalThis !== 'undefined' && typeof (globalThis as { CSS?: { escape?: (value: string) => string } }).CSS?.escape === 'function'
    ? (globalThis as { CSS: { escape: (value: string) => string } }).CSS.escape
    : null
  if (css) {
    return css(sectionId)
  }
  return sectionId.replace(/["\\]/g, '\\$&')
}

function getCustomSectionSelector(sectionId: string) {
  return `[data-section-id="${escapeSectionId(sectionId)}"]`
}

function findCommentMarker(doc: Document, key: string, position: 'start' | 'end'): Comment | null {
  const walker = doc.createTreeWalker(doc, NodeFilter.SHOW_COMMENT)
  const marker = `defalt-${key}-${position}`
  let node = walker.nextNode()
  while (node) {
    const comment = node as Comment
    if (comment.nodeValue?.includes(marker)) {
      return comment
    }
    node = walker.nextNode()
  }
  return null
}

function collectCommentRange(doc: Document, key: string): Node[] {
  const start = findCommentMarker(doc, key, 'start')
  const end = findCommentMarker(doc, key, 'end')
  if (!start || !end) {
    return []
  }

  const nodes: Node[] = []
  let current: Node | null = start
  // safeguard against infinite loops
  const safetyLimit = 1000
  let steps = 0
  while (current && steps < safetyLimit) {
    nodes.push(current)
    if (current === end) {
      break
    }
    current = current.nextSibling
    steps += 1
  }
  return nodes
}

function ensurePreviewStyles(doc: Document) {
  if (doc.getElementById(PREVIEW_STYLES_ID)) {
    return
  }

  const styleEl = doc.createElement('style')
  styleEl.id = PREVIEW_STYLES_ID
  styleEl.type = 'text/css'
  styleEl.appendChild(doc.createTextNode(PREVIEW_INLINE_STYLES))

  const head = doc.head || doc.body
  head.appendChild(styleEl)

  // Ensure theme CSS (includes Koenig card styles) is present for Ghost content
  const existingThemeLink = doc.getElementById(THEME_CSS_LINK_ID) as HTMLLinkElement | null
  const foundScreenLink = doc.querySelector<HTMLLinkElement>('link[href*="screen.css"]')
  if (!existingThemeLink) {
    if (foundScreenLink) {
      foundScreenLink.id = THEME_CSS_LINK_ID
    } else {
      const themeLink = doc.createElement('link')
      themeLink.id = THEME_CSS_LINK_ID
      themeLink.rel = 'stylesheet'
      themeLink.href = THEME_CSS_HREF
      head.prepend(themeLink)
    }
  }
}

export function syncTemplateSections(doc: Document, sections: Array<{ id: string, html: string, hidden: boolean }>) {
  ensurePreviewStyles(doc)

  const viewport = doc.querySelector(TEMPLATE_CONTAINER_SELECTOR)
  if (!viewport) return

  const desiredIds = new Set(sections.map((section) => section.id))

  Array.from(viewport.querySelectorAll<HTMLElement>('[data-section-id]')).forEach((element) => {
    const sectionId = element.getAttribute('data-section-id')
    if (!sectionId) {
      return
    }
    if (!desiredIds.has(sectionId)) {
      element.remove()
    }
  })

  sections.forEach((section) => {
    const selector = getCustomSectionSelector(section.id)
    const template = doc.createElement('template')
    template.innerHTML = section.html
    const newElement = template.content.firstElementChild as HTMLElement | null

    if (!newElement) {
      return
    }

    newElement.setAttribute('data-section-id', section.id)
    newElement.dataset.sectionType = 'custom'
    newElement.dataset.sectionHidden = section.hidden ? 'true' : 'false'
    newElement.setAttribute('aria-hidden', section.hidden ? 'true' : 'false')

    const existing = viewport.querySelector<HTMLElement>(selector)
    if (existing) {
      existing.replaceWith(newElement)
    } else {
      viewport.appendChild(newElement)
    }
  })
}

/**
 * Reorders template sections in the rendered DOM based on the provided order.
 * Template sections: subheader (.gh-header) and main (.gh-container.is-grid)
 * This is called AFTER the HTML is injected into the iframe.
 */
/**
 * Reorders template sections inside the preview iframe to match the
 * user-defined order from the sidebar drag-and-drop interface.
 *
 * @param doc - Document instance inside the preview iframe.
 * @param order - Array of section identifiers in their desired order.
 */
export function reorderTemplateInDOM(doc: Document, order: string[]) {
  const viewport = doc.querySelector(TEMPLATE_CONTAINER_SELECTOR)
  if (!viewport) {
    return
  }

  const footerAnchor =
    viewport.querySelector(FOOTER_ROOT_SELECTOR) ??
    viewport.querySelector('footer.gh-footer')

  const sections: Record<string, Node[]> = {}

  order.forEach((key) => {
    const selectorDef = TEMPLATE_SECTION_SELECTORS[key as keyof typeof TEMPLATE_SECTION_SELECTORS]
    const elements: Node[] = []

    // Try standard selectors first
    if (selectorDef) {
      toSelectorList(selectorDef).forEach((selector) => {
        const matches = Array.from(doc.querySelectorAll(selector))
        matches.forEach((match) => {
          if (viewport.contains(match) && !elements.includes(match)) {
            elements.push(match)
          }
        })
      })
    }

    // Try comment-based ranges
    const commentNodes = collectCommentRange(doc, key)
    if (commentNodes.length > 0) {
      commentNodes.forEach((node) => {
        if (node.parentNode && viewport.contains(node.parentNode)) {
          if (!elements.includes(node)) {
            elements.push(node)
          }
        }
      })
      const lastNode = commentNodes[commentNodes.length - 1]
      if (lastNode) {
        let sibling = lastNode.nextSibling
        while (sibling && sibling.nodeType === Node.TEXT_NODE && sibling.textContent?.trim() === '') {
          sibling = sibling.nextSibling
        }
        if (sibling && !elements.includes(sibling)) {
          elements.push(sibling)
        }
      }
    }

    // Try custom section selector as fallback
    if (elements.length === 0) {
      const customSelector = getCustomSectionSelector(key)
      const customElement = doc.querySelector(customSelector)
      if (customElement && viewport.contains(customElement)) {
        elements.push(customElement)
      }
    }

    if (elements.length > 0) {
      sections[key] = elements
    }
  })

  if (Object.keys(sections).length === 0) {
    return
  }

  // Remove all sections from DOM (but keep them in memory)
  const sectionsToRemove: Node[] = []
  Object.values(sections).forEach((sectionElements) => {
    sectionElements.forEach((section) => {
      if (section.parentNode) {
        sectionsToRemove.push(section)
      }
    })
  })

  sectionsToRemove.forEach((section) => {
    section.parentNode?.removeChild(section)
  })

  // Build fragment in correct order
  const fragment = doc.createDocumentFragment()
  order.forEach((key) => {
    const sectionElements = sections[key]
    if (sectionElements) {
      sectionElements.forEach((section) => {
        fragment.appendChild(section)
      })
    }
  })

  // Insert fragment before footer
  if (footerAnchor && footerAnchor.parentElement === viewport) {
    viewport.insertBefore(fragment, footerAnchor)
  } else {
    viewport.appendChild(fragment)
  }
}

/**
 * Reorders footer sections in the rendered DOM based on the provided order.
 * This is called AFTER the HTML is injected into the iframe.
 */
/**
 * Reorders footer sections in the preview to reflect editor changes.
 *
 * @param doc - Document instance inside the preview iframe.
 * @param order - Array of footer section ids (e.g., footerBar).
 */
export function reorderFooterInDOM(doc: Document, order: string[]) {
  const footerInner =
    doc.querySelector(FOOTER_INNER_SELECTOR) ??
    doc.querySelector('.gh-footer-inner')
  if (!footerInner) return

  const sections: Record<string, Element> = {}

  order.forEach((key) => {
    const selector = FOOTER_SECTION_SELECTORS[key as keyof typeof FOOTER_SECTION_SELECTORS]
    if (!selector) {
      return
    }

    const element = footerInner.querySelector(selector) ?? doc.querySelector(selector)
    if (element) {
      sections[key] = element
    }
  })

  if (Object.keys(sections).length === 0) {
    return
  }

  Object.values(sections).forEach((section) => {
    section.remove()
  })

  // Re-append in the correct order
  order.forEach(key => {
    const section = sections[key]
    if (section) {
      footerInner.appendChild(section)
    }
  })
}

/**
 * Sets up portal link previews in the iframe
 */
export function setupPortalPreview(doc: Document) {
  const portalLinks = Array.from(
    doc.querySelectorAll<HTMLAnchorElement>('a[href="#/portal/signup"], a[href="#/portal/signin"]')
  )

  if (!portalLinks.length || typeof document === 'undefined') {
    return
  }

  portalLinks.forEach((link) => {
    link.classList.add('gh-portal-close')
    link.addEventListener('click', (event) => {
      event.preventDefault()
      const mode = link.getAttribute('href')?.includes('signup') ? 'signup' : 'signin'
      showPortalMock(mode === 'signup' ? 'signup' : 'signin')
    })
  })
}

/**
 * Sets up click handling for navigation within the preview
 */
export function setupPreviewNavigation(doc: Document, onNavigate?: (href: string) => boolean) {
  if (!onNavigate) {
    return
  }

  doc.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }

    const target = event.target as HTMLElement | null
    const anchor = target?.closest('a')
    if (!anchor) {
      return
    }

    const href = anchor.getAttribute('href')
    if (!href || href.startsWith('#/portal')) {
      return
    }

    if (anchor.target && anchor.target.toLowerCase() === '_blank') {
      return
    }

    const handled = onNavigate(href)
    if (handled) {
      event.preventDefault()
    }
  })
}

export function setupSectionSelection(
  doc: Document,
  sectionIds: string[],
  onSelectSection?: (sectionId: string) => void
) {
  if (!onSelectSection || sectionIds.length === 0) {
    return () => {}
  }

  const entries = Array.from(new Set(sectionIds))
    .map((id) => ({
      id,
      selectors: (() => {
        const base = getSectionSelector(id)
        const escaped = escapeSectionId(id)
        const fallback = `[data-section-id="${escaped}"]`
        return Array.from(new Set([...base, fallback]))
      })()
    }))
    .filter((entry) => entry.selectors.length > 0)

  if (entries.length === 0) {
    return () => {}
  }

  ensureHighlightStyles(doc)

  const findMatch = (target: Element | null): { id: string, element: Element } | null => {
    if (!target) return null
    const dataEl = target.closest('[data-section-id]')
    if (dataEl) {
      const attrId = dataEl.getAttribute('data-section-id')
      if (attrId) {
        return { id: attrId, element: dataEl }
      }
    }
    // Collect all matches, then pick the innermost (most specific) one
    const matches: { id: string, element: Element }[] = []
    for (const entry of entries) {
      for (const selector of entry.selectors) {
        const match = target.closest(selector)
        if (match) {
          matches.push({ id: entry.id, element: match })
          break // Only one match per entry
        }
      }
    }
    if (matches.length === 0) return null
    if (matches.length === 1) return matches[0]
    // Return innermost: the element that contains no other matched elements
    return matches.reduce((innermost, current) => {
      return current.element.contains(innermost.element) ? innermost : current
    })
  }

  let hoveredEl: Element | null = null
  let currentHoverId: string | null = null

  const clearHover = () => {
    if (!hoveredEl) return
    if (hoveredEl.classList.contains(SECTION_OVERLAY_CLASS)) {
      hoveredEl.remove()
    } else {
      hoveredEl.classList.remove(SECTION_HOVER_CLASS)
    }
    hoveredEl = null
    currentHoverId = null
  }

  const applyHover = (el: Element, sectionId: string) => {
    // Prevent re-applying if already hovering this section
    if (currentHoverId === sectionId) return

    clearHover()
    currentHoverId = sectionId

    const target = getHighlightTarget(sectionId, el)
    if (target.classList.contains(SECTION_HIGHLIGHT_CLASS)) {
      return
    }
    // Check if element has margins - if so, use overlay to include them
    const computedStyle = getComputedStyle(el)
    const hasMargins = (parseFloat(computedStyle.marginTop) || 0) > 0 ||
                       (parseFloat(computedStyle.marginBottom) || 0) > 0
    if ((target !== el && FOOTER_SECTION_IDS.has(sectionId.toLowerCase())) || hasMargins) {
      hoveredEl = createOverlayForSection(target as HTMLElement, el, [SECTION_OVERLAY_CLASS, SECTION_HOVER_CLASS], hasMargins)
    } else {
      hoveredEl = target
      target.classList.add(SECTION_HOVER_CLASS)
    }
  }

  const handleClick = (event: MouseEvent) => {
    const target = event.target as Element | null
    if (!target) {
      return
    }

    const match = findMatch(target)
    if (match) {
      onSelectSection(match.id)
    }
  }

  // Parent sections with children - don't hover these in preview, only their children
  // Users can select parents via sidebar
  const parentSections = new Set(['footer', 'announcement-bar'])

  // Check if point is within element's box INCLUDING its margins
  const isInMarginArea = (el: Element, x: number, y: number): boolean => {
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    const marginTop = parseFloat(style.marginTop) || 0
    const marginBottom = parseFloat(style.marginBottom) || 0
    const expandedTop = rect.top - marginTop
    const expandedBottom = rect.bottom + marginBottom
    return x >= rect.left && x <= rect.right && y >= expandedTop && y <= expandedBottom
  }

  // Throttle pointermove to 50ms for performance (Puck pattern)
  const handlePointerMove = throttle((event: PointerEvent) => {
    const target = event.target as Element | null
    const match = findMatch(target)
    if (!match) {
      clearHover()
      return
    }
    // For parent sections, check if we're in a child's margin area
    if (parentSections.has(match.id)) {
      // Check footerBar's margin area when inside footer
      if (match.id === 'footer') {
        const footerBar = doc.querySelector('.gh-footer-bar')
        if (footerBar && isInMarginArea(footerBar, event.clientX, event.clientY)) {
          if (currentHoverId !== 'footerBar') {
            applyHover(footerBar, 'footerBar')
          }
          return
        }
      }
      // announcement-bar and announcement are the same element
      // Show hover for 'announcement' (the child ID in sidebar)
      if (match.id === 'announcement-bar') {
        if (currentHoverId !== 'announcement') {
          applyHover(match.element, 'announcement')
        }
        return
      }
      clearHover()
      return
    }
    // Compare against ID to prevent overlay recreation loop
    if (match.id !== currentHoverId) {
      applyHover(match.element, match.id)
    }
  }, 50)

  const handlePointerLeave = () => {
    // Cancel any pending throttled calls to prevent stale hover
    handlePointerMove.cancel()
    clearHover()
  }

  doc.addEventListener('click', handleClick, true)
  doc.addEventListener('pointermove', handlePointerMove as unknown as EventListener, true)
  // Use multiple events for reliable hover clearing when leaving iframe
  doc.documentElement.addEventListener('pointerleave', handlePointerLeave)
  doc.documentElement.addEventListener('mouseleave', handlePointerLeave)
  if (doc.body) {
    doc.body.addEventListener('mouseleave', handlePointerLeave)
  }
  return () => {
    doc.removeEventListener('click', handleClick, true)
    doc.removeEventListener('pointermove', handlePointerMove as unknown as EventListener, true)
    doc.documentElement.removeEventListener('pointerleave', handlePointerLeave)
    doc.documentElement.removeEventListener('mouseleave', handlePointerLeave)
    if (doc.body) {
      doc.body.removeEventListener('mouseleave', handlePointerLeave)
    }
    handlePointerMove.cancel()
    clearHover()
  }
}

/**
 * Injects HTML into iframe and sets up DOM manipulations
 */
export function applyCustomCss(doc: Document, css?: string) {
  const existing = doc.getElementById(CUSTOM_CSS_STYLE_ID)
  if (existing?.parentNode) {
    existing.parentNode.removeChild(existing)
  }

  const sanitized = sanitizeCustomCss(css)
  if (!sanitized) {
    return
  }

  const styleEl = doc.createElement('style')
  styleEl.id = CUSTOM_CSS_STYLE_ID
  styleEl.type = 'text/css'
  styleEl.appendChild(doc.createTextNode(sanitized))

  const target = doc.head || doc.body
  target?.appendChild(styleEl)
}

/**
 * Updates CSS color variables incrementally without full document re-render.
 * This prevents scroll jumps when only colors change.
 */
export function updateColorVariables(
  doc: Document,
  accentColor: string,
  backgroundColor: string,
  pageLayout: 'narrow' | 'normal'
) {
  const root = doc.documentElement
  if (!root) return

  const layoutWidth = pageLayout === 'narrow' ? '1000px' : '1200px'

  root.style.setProperty('--ghost-accent-color', accentColor)
  root.style.setProperty('--background-color', backgroundColor)
  root.style.setProperty('--container-width', layoutWidth)

  // Also update body background if needed
  if (doc.body) {
    doc.body.style.backgroundColor = backgroundColor
  }
}

/**
 * Injects rendered Handlebars output into the preview iframe and applies
 * all editor-driven customizations (hidden sections, custom CSS, portal mock).
 *
 * @param iframeRef - Reference to the iframe hosting the preview.
 * @param html - Rendered HTML string to write into the iframe.
 * @param options - Flags/configurations used during injection.
 */
export function injectHtmlIntoIframe(
  html: string,
  iframeRef: MutableRefObject<HTMLIFrameElement | null>,
  options: InjectPreviewOptions
) {
  const iframe = iframeRef.current
  if (!iframe) return

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) return

  // Save scroll position before any updates
  const scrollTop = doc.documentElement?.scrollTop || doc.body?.scrollTop || 0
  const scrollLeft = doc.documentElement?.scrollLeft || doc.body?.scrollLeft || 0

  // Always do a full document write (simple and reliable)
  doc.open()
  doc.write(html)
  doc.close()

  // Wait for iframe to fully load before manipulating DOM
  const applyPostProcessing = () => {
    ensurePreviewStyles(doc)
    applyCustomCss(doc, options.customCss)
    syncTemplateSections(doc, options.customSections ?? [])
    reorderTemplateInDOM(doc, options.templateOrder)
    reorderFooterInDOM(doc, options.footerOrder)
    setupPortalPreview(doc)
    setupPreviewNavigation(doc, options.onNavigate)
    applyHeaderCustomizations(doc, options.headerOptions)
    applyAnnouncementBarCustomizations(doc, options.announcementBarConfig, options.announcementContentConfig)
    if (options.sectionIds && options.sectionIds.length && options.onSelectSection) {
      setupSectionSelection(doc, options.sectionIds, options.onSelectSection)
    }
    if (typeof options.selectedSectionId !== 'undefined') {
      highlightSection(doc, options.selectedSectionId ?? null)
    }
  }

  // Use DOMContentLoaded or readystatechange to ensure DOM is parsed
  if (doc.readyState === 'complete') {
    // Already loaded, apply immediately
    const win = doc.defaultView
    if (win) {
      win.requestAnimationFrame(applyPostProcessing)
    } else {
      applyPostProcessing()
    }
  } else {
    // Wait for load
    iframe.addEventListener('load', () => {
      const updatedDoc = iframe.contentDocument
      if (updatedDoc) {
        const win = updatedDoc.defaultView
        if (win) {
          win.requestAnimationFrame(applyPostProcessing)
        } else {
          applyPostProcessing()
        }
      }
    }, { once: true })
  }

  // Restore scroll position after content is loaded
  // Use multiple rAF frames and disable smooth scrolling for instant restoration
  if (scrollTop > 0 || scrollLeft > 0) {
    const win = doc.defaultView
    if (win) {
      const restoreScroll = () => {
        // Temporarily disable smooth scrolling
        const originalBehavior = doc.documentElement?.style.scrollBehavior
        if (doc.documentElement) {
          doc.documentElement.style.scrollBehavior = 'auto'
        }

        // Use scrollTo for more reliable restoration
        win.scrollTo({
          top: scrollTop,
          left: scrollLeft,
          behavior: 'instant'
        })

        // Fallback for older browsers
        if (doc.documentElement) {
          doc.documentElement.scrollTop = scrollTop
          doc.documentElement.scrollLeft = scrollLeft
        }
        if (doc.body) {
          doc.body.scrollTop = scrollTop
          doc.body.scrollLeft = scrollLeft
        }

        // Restore original scroll behavior after a frame
        win.requestAnimationFrame(() => {
          if (doc.documentElement && originalBehavior !== undefined) {
            doc.documentElement.style.scrollBehavior = originalBehavior
          }
        })
      }

      // Wait for two animation frames to ensure content is painted
      win.requestAnimationFrame(() => {
        win.requestAnimationFrame(restoreScroll)
      })
    }
  }
}

const ANNOUNCEMENT_BAR_CLASSES = [
  'gh-inner',
  'announcement-bar--size-small',
  'announcement-bar--size-large',
  'announcement-bar--size-x-large',
  'announcement-bar--weight-light',
  'announcement-bar--weight-bold',
  'announcement-bar--spacing-tight',
  'announcement-bar--spacing-wide',
  'announcement-bar--uppercase',
  'announcement-bar--underline-links'
]

export function applyAnnouncementBarCustomizations(
  doc: Document,
  barConfig?: AnnouncementBarConfig,
  contentConfig?: AnnouncementContentConfig
) {
  const normalizedBar = barConfig ?? DEFAULT_ANNOUNCEMENT_BAR_CONFIG
  const normalizedContent = contentConfig ?? DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG
  const bar = doc.querySelector<HTMLElement>('.announcement-bar')
  if (!bar) {
    return
  }
  const previewCopy = doc.querySelector<HTMLElement>('.announcement-bar__preview-copy')
  if (previewCopy) {
    const previewText = normalizedContent.previewText?.trim().length
      ? normalizedContent.previewText.trim()
      : DEFAULT_ANNOUNCEMENT_CONTENT_CONFIG.previewText
    previewCopy.innerHTML = renderPreviewTextWithHashtags(previewText)
  }
  ANNOUNCEMENT_BAR_CLASSES.forEach((className) => bar.classList.remove(className))

  if (normalizedContent.typographySize === 'small') {
    bar.classList.add('announcement-bar--size-small')
  } else if (normalizedContent.typographySize === 'large') {
    bar.classList.add('announcement-bar--size-large')
  } else if (normalizedContent.typographySize === 'x-large') {
    bar.classList.add('announcement-bar--size-x-large')
  }

  if (normalizedContent.typographyWeight === 'light') {
    bar.classList.add('announcement-bar--weight-light')
  } else if (normalizedContent.typographyWeight === 'bold') {
    bar.classList.add('announcement-bar--weight-bold')
  }

  if (normalizedContent.typographySpacing === 'tight') {
    bar.classList.add('announcement-bar--spacing-tight')
  } else if (normalizedContent.typographySpacing === 'wide') {
    bar.classList.add('announcement-bar--spacing-wide')
  }

  if (normalizedContent.typographyCase === 'uppercase') {
    bar.classList.add('announcement-bar--uppercase')
  }
  bar.classList.toggle('announcement-bar--underline-links', normalizedContent.underlineLinks === true)
  bar.classList.toggle('gh-inner', normalizedBar.width === 'narrow')

  bar.style.setProperty('--announcement-bar-padding-top', `${normalizedBar.paddingTop}px`)
  bar.style.setProperty('--announcement-bar-padding-bottom', `${normalizedBar.paddingBottom}px`)
  bar.style.setProperty('--announcement-bar-background-color', normalizedBar.backgroundColor)
  bar.style.setProperty('--announcement-bar-text-color', normalizedBar.textColor)
  bar.style.setProperty('--announcement-bar-divider-thickness', `${normalizedBar.dividerThickness}px`)

}

function escapeHtmlBasic(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderPreviewTextWithHashtags(value: string) {
  const escaped = escapeHtmlBasic(value)
  return escaped.replace(/(^|\s)(#([\w-]+))/g, (_, prefix, tag, slug) => {
    return `${prefix}<a href="#" class="announcement-bar__preview-link" data-preview-tag="${slug}">${tag}</a>`
  })
}

// Portal mock helpers
function ensurePortalMock() {
  if (portalMockElement) {
    return portalMockElement
  }

  const wrapper = document.createElement('div')
  wrapper.setAttribute('data-portal-mock', 'true')
  wrapper.style.cssText = `
    position: fixed;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.45);
    z-index: 9999;
  `

  wrapper.innerHTML = `
    <div style="background: white; width: 360px; max-width: 92vw; border-radius: 18px; padding: 32px; box-shadow: 0 25px 65px rgba(15, 15, 15, 0.25); position: relative;">
      <button data-portal-close style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 20px; cursor: pointer; color: #0f172a;">×</button>
      <header style="margin-bottom: 16px;">
        <p style="text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px; color: #94a3b8; margin-bottom: 6px;">Ghost Portal</p>
        <h1 data-portal-title style="margin: 0; font-size: 28px; font-weight: 700; color: #111827;">Sign in</h1>
      </header>
      <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">Portal interactions are disabled in the editor, so this static preview shows what members see when they sign in.</p>
      <label style="display:block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 6px;">Email</label>
      <input type="email" placeholder="jamie@example.com" style="width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; margin-bottom: 16px;" />
      <button data-portal-primary style="width: 100%; padding: 12px; border: none; border-radius: 999px; background-color: #fb6ade; color: white; font-weight: 600; font-size: 15px; cursor: not-allowed;">Continue</button>
      <div style="text-align: center; font-size: 14px; color: #475569; margin-top: 14px;">
        <span data-portal-helper>Don't have an account?</span>
        <button data-portal-switch style="background: none; border: none; color: #fb6ade; font-weight: 600; margin-left: 4px; cursor: pointer;">Sign up</button>
      </div>
    </div>
  `

  wrapper.addEventListener('click', (event) => {
    if (event.target === wrapper) {
      hidePortalMock()
    }
  })

  wrapper.querySelector('[data-portal-close]')?.addEventListener('click', () => hidePortalMock())

  wrapper.querySelector('[data-portal-switch]')?.addEventListener('click', () => {
    const nextMode = wrapper.dataset.mode === 'signup' ? 'signin' : 'signup'
    showPortalMock(nextMode === 'signup' ? 'signup' : 'signin')
  })

  document.body.appendChild(wrapper)
  portalMockElement = wrapper as HTMLDivElement
  return portalMockElement
}

function showPortalMock(mode: 'signin' | 'signup') {
  if (typeof document === 'undefined') {
    return
  }

  const wrapper = ensurePortalMock()
  wrapper.dataset.mode = mode

  const title = wrapper.querySelector<HTMLElement>('[data-portal-title]')
  if (title) {
    title.textContent = mode === 'signup' ? 'Sign up' : 'Sign in'
  }

  const helper = wrapper.querySelector<HTMLElement>('[data-portal-helper]')
  if (helper) {
    helper.textContent = mode === 'signup' ? 'Already have an account?' : "Don't have an account?"
  }

  const switchButton = wrapper.querySelector<HTMLElement>('[data-portal-switch]')
  if (switchButton) {
    switchButton.textContent = mode === 'signup' ? 'Sign in' : 'Sign up'
  }

  const primaryButton = wrapper.querySelector<HTMLElement>('[data-portal-primary]')
  if (primaryButton) {
    primaryButton.textContent = mode === 'signup' ? 'Subscribe' : 'Continue'
  }

  wrapper.style.display = 'flex'
}

function hidePortalMock() {
  if (portalMockElement) {
    portalMockElement.style.display = 'none'
  }
}

// Section highlight styles
const SECTION_HIGHLIGHT_STYLE_ID = 'gh-editor-section-highlight'
const SECTION_HIGHLIGHT_CLASS = 'gh-editor-section-highlighted'
const SECTION_HOVER_CLASS = 'gh-editor-section-hover'
const SECTION_OVERLAY_CLASS = 'gh-editor-section-overlay'
const SECTION_HIGHLIGHT_COLOR = '#4dd831'
const SECTION_HOVER_COLOR = 'rgba(77, 216, 49, 0.6)'
// Canonical footer ids (lowercase) for preview-only overlays
const FOOTER_SECTION_IDS = new Set(['footer', 'footerbar', 'footersignup'])

function ensureHighlightStyles(doc: Document) {
  let styleEl = doc.getElementById(SECTION_HIGHLIGHT_STYLE_ID) as HTMLStyleElement | null

  const css = `
    .${SECTION_OVERLAY_CLASS} {
      position: absolute;
      left: 0;
      right: 0;
      pointer-events: none;
      border-radius: 0;
      z-index: 2;
    }
    .${SECTION_HIGHLIGHT_CLASS} {
      position: relative;
      z-index: 1;
      border-radius: 0;
      outline: 2px solid ${SECTION_HIGHLIGHT_COLOR} !important;
      outline-offset: -3px;
    }
    .${SECTION_HOVER_CLASS} {
      position: relative;
      z-index: 1;
      border-radius: 0;
      outline: 2px solid ${SECTION_HOVER_COLOR} !important;
      outline-offset: -3px;
    }
  `

  if (!styleEl) {
    styleEl = doc.createElement('style')
    styleEl.id = SECTION_HIGHLIGHT_STYLE_ID
    styleEl.type = 'text/css'
    styleEl.textContent = css
    const head = doc.head || doc.body
    head.appendChild(styleEl)
  }
}

function getHighlightTarget(sectionId: string, element: Element): Element {
  const normalized = sectionId.toLowerCase()
  if (FOOTER_SECTION_IDS.has(normalized)) {
    const footerRoot = element.closest('footer.gh-footer')
    if (footerRoot) {
      return footerRoot
    }
  }
  return element
}

function createOverlayForSection(
  container: HTMLElement | null,
  refElement: Element,
  classNames: string[],
  useViewportWidth = false
): HTMLElement {
  const doc = refElement.ownerDocument
  const overlay = doc.createElement('div')
  overlay.classList.add(...classNames)

  // Get computed margins to include them in the overlay
  const computedStyle = getComputedStyle(refElement)
  const marginTop = parseFloat(computedStyle.marginTop) || 0
  const marginBottom = parseFloat(computedStyle.marginBottom) || 0

  if (useViewportWidth || !container) {
    const refRect = refElement.getBoundingClientRect()
    const scrollTop = (doc.documentElement?.scrollTop ?? 0) || (doc.body?.scrollTop ?? 0)
    overlay.style.position = 'absolute'
    overlay.style.top = `${refRect.top + scrollTop - marginTop}px`
    overlay.style.left = '0'
    overlay.style.right = '0'
    overlay.style.width = '100%'
    overlay.style.pointerEvents = 'none'
    doc.body.appendChild(overlay)
    overlay.style.height = `${refRect.height + marginTop + marginBottom}px`
    return overlay
  }

  const containerRect = container.getBoundingClientRect()
  const refRect = refElement.getBoundingClientRect()
  const scrollTop = container.scrollTop ?? 0
  const top = refRect.top - containerRect.top + scrollTop - marginTop
  overlay.style.top = `${top}px`
  overlay.style.height = `${refRect.height + marginTop + marginBottom}px`
  overlay.style.position = 'absolute'
  overlay.style.left = '0'
  overlay.style.right = '0'
  overlay.style.pointerEvents = 'none'
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative'
  }
  container.appendChild(overlay)
  return overlay
}

/**
 * Highlights a section in the preview iframe and scrolls it into view.
 *
 * @param doc - Document instance inside the preview iframe
 * @param sectionId - The section ID to highlight (null to clear highlight)
 */
/**
 * Scrolls to a section in the preview iframe without selecting or highlighting it.
 * Used for hover-delayed scroll from sidebar.
 */
export function scrollToSection(doc: Document, sectionId: string | null) {
  if (!sectionId) return

  const selectors = getSectionSelector(sectionId)
  let element: Element | null = null

  for (const selector of selectors) {
    element = doc.querySelector(selector)
    if (element) break
  }

  if (!element) return

  const target = getHighlightTarget(sectionId, element)
  target.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
  })
}

export function highlightSection(
  doc: Document,
  sectionId: string | null,
  options?: { scroll?: boolean }
) {
  const shouldScroll = options?.scroll ?? true
  // Remove existing highlights
  const existing = doc.querySelectorAll(`.${SECTION_HIGHLIGHT_CLASS}, .${SECTION_OVERLAY_CLASS}`)
  existing.forEach((el) => {
    el.classList.remove(SECTION_HIGHLIGHT_CLASS)
    if (el.classList.contains(SECTION_OVERLAY_CLASS)) {
      el.remove()
    }
  })

  if (!sectionId) {
    return
  }

  // Ensure highlight styles are present
  ensureHighlightStyles(doc)

  // Find the section element
  const selectors = getSectionSelector(sectionId)
  let element: Element | null = null

  for (const selector of selectors) {
    element = doc.querySelector(selector)
    if (element) break
  }

  if (!element) {
    return
  }

  const target = getHighlightTarget(sectionId, element)

  // Check if element has margins - if so, use overlay to include them
  const computedStyle = getComputedStyle(element)
  const hasMargins = (parseFloat(computedStyle.marginTop) || 0) > 0 ||
                     (parseFloat(computedStyle.marginBottom) || 0) > 0

  // Add highlight class (use overlay for footer or sections with margins)
  if ((target !== element && FOOTER_SECTION_IDS.has(sectionId.toLowerCase())) || hasMargins) {
    createOverlayForSection(target as HTMLElement, element, [SECTION_OVERLAY_CLASS, SECTION_HIGHLIGHT_CLASS], hasMargins)
  } else {
    target.classList.add(SECTION_HIGHLIGHT_CLASS)
  }

  // Scroll into view only when explicitly requested (e.g., new selection, not padding updates)
  if (shouldScroll) {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }
}

/**
 * Highlights a section in the preview iframe on hover (from sidebar).
 * Uses a subtler highlight style than selection.
 *
 * @param doc - Document instance inside the preview iframe
 * @param sectionId - The section ID to highlight (null to clear hover highlight)
 */
export function highlightHoveredSection(
  doc: Document,
  sectionId: string | null
) {
  // Remove existing hover highlights (but not selection highlights)
  const existing = doc.querySelectorAll(`.${SECTION_HOVER_CLASS}`)
  existing.forEach((el) => {
    if (el.classList.contains(SECTION_OVERLAY_CLASS)) {
      el.remove()
    } else {
      el.classList.remove(SECTION_HOVER_CLASS)
    }
  })

  if (!sectionId) {
    return
  }

  // Ensure highlight styles are present
  ensureHighlightStyles(doc)

  // Find the section element
  const selectors = getSectionSelector(sectionId)
  let element: Element | null = null

  for (const selector of selectors) {
    element = doc.querySelector(selector)
    if (element) break
  }

  if (!element) {
    return
  }

  const target = getHighlightTarget(sectionId, element)

  // Don't apply hover if already selected
  if (target.classList.contains(SECTION_HIGHLIGHT_CLASS)) {
    return
  }

  // Check if element has margins - if so, use overlay to include them
  const computedStyle = getComputedStyle(element)
  const hasMargins = (parseFloat(computedStyle.marginTop) || 0) > 0 ||
                     (parseFloat(computedStyle.marginBottom) || 0) > 0

  // Add hover class (use overlay for footer or sections with margins)
  if ((target !== element && FOOTER_SECTION_IDS.has(sectionId.toLowerCase())) || hasMargins) {
    createOverlayForSection(target as HTMLElement, element, [SECTION_OVERLAY_CLASS, SECTION_HOVER_CLASS], hasMargins)
  } else {
    target.classList.add(SECTION_HOVER_CLASS)
  }
}
