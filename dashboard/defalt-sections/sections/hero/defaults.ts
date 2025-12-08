/**
 * Hero Section Defaults
 *
 * Default configuration values for the Hero section.
 * These are used when creating a new instance of the section.
 */

import type { HeroConfig } from './schema.js'

/**
 * Default Hero configuration
 */
export const heroDefaults: HeroConfig = {
  ghostPageTag: 'hero-preview',
  placeholder: {
    title: '',
    description: '',
    buttonText: '',
    buttonHref: ''
  },
  imagePosition: 'background',
  contentAlignment: 'center',
  contentWidth: 'full',
  heightMode: 'regular',
  backgroundColor: '#000000',
  buttonColor: '#ffffff',
  buttonTextColor: '#151515',
  buttonBorderRadius: 3,
  cardBorderRadius: 24,
  showButton: true
}

/**
 * Placeholder sample text (shown when fields are empty)
 */
export const heroPlaceholders = {
  title: 'Enter heading text',
  description: 'Enter subheading text',
  buttonText: 'Add button text',
  buttonHref: 'https://example.com'
}
