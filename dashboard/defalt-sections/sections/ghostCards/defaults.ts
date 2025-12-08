/**
 * Ghost Cards Section Defaults
 */

import type { GhostCardsSectionConfig } from './schema.js'

const DEFAULT_GHOST_CARD_HREFS = ['#ghost-card-one', '#ghost-card-two', '#ghost-card-three']

export const ghostCardsDefaults: GhostCardsSectionConfig = {
  ghostPageTag: '#ghost-card',
  heading: '',
  subheading: '',
  cards: DEFAULT_GHOST_CARD_HREFS.map((href) => ({
    title: '',
    description: '',
    buttonText: '',
    buttonHref: href
  })),
  backgroundColor: '#ffffff',
  textColor: '#151515',
  cardBackgroundColor: '#ffffff',
  cardBorderColor: '#e6e6e6',
  buttonColor: '#151515',
  showHeader: false,
  headerAlignment: 'center',
  titleSize: 'normal'
}

export const INTERNAL_TAG_BASE = '#ghost-card'
export const HIDE_TAG = '#cards-hide'
