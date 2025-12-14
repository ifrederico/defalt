/** Premium vs free feature definitions */

export const PREMIUM_FEATURES = new Set<string>([
  'hero',
  'grid',
  'testimonials',
  'faq',
  'about',
  'image-with-text',
])

export const FREE_FEATURES = new Set<string>([
  'announcement-bar',
  'ghostCards',
  'ghostGrid',
  'custom-css',
])

export function isPremium(featureId: string): boolean {
  return PREMIUM_FEATURES.has(featureId)
}

export function isFree(featureId: string): boolean {
  return FREE_FEATURES.has(featureId)
}

export function getPremiumFeatures(): string[] {
  return Array.from(PREMIUM_FEATURES)
}

export function getFreeFeatures(): string[] {
  return Array.from(FREE_FEATURES)
}
