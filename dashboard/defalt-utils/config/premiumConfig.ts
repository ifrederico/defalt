/** Premium vs free feature definitions */

export const PREMIUM_FEATURES = new Set<string>([
  'hero',
  'grid',
  'testimonials',
  'faq',
  'about',
  'image-with-text',
])

export function isPremium(featureId: string): boolean {
  return PREMIUM_FEATURES.has(featureId)
}

export function getPremiumFeatures(): string[] {
  return Array.from(PREMIUM_FEATURES)
}
