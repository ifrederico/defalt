/**
 * Ghost Grid Section Defaults
 */

import type { GhostGridSectionConfig } from './schema.js'

export const ghostGridDefaults: GhostGridSectionConfig = {
  heading: '',
  subheading: '',
  leftColumnTag: '#ghost-grid-1',
  rightColumnTag: '#ghost-grid-2',
  cards: [
    { title: '', description: '', buttonText: '', buttonHref: '' },
    { title: '', description: '', buttonText: '', buttonHref: '' }
  ],
  backgroundColor: '#ffffff',
  textColor: '#151515',
  cardBackgroundColor: '#ffffff',
  cardBorderColor: '#e6e6e6',
  buttonColor: '#151515',
  showHeader: false,
  headerAlignment: 'center',
  titleSize: 'normal',
  stackOnMobile: true,
  columnGap: 20
}

export const DEFAULT_LEFT_TAG = '#ghost-grid-1'
export const DEFAULT_RIGHT_TAG = '#ghost-grid-2'
export const HIDE_TAG = '#grid-hide'
