const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

const expandShortHex = (hex: string): string => {
  if (hex.length !== 4 || hex[0] !== '#') {
    return hex
  }
  const [, r, g, b] = hex
  return `#${r}${r}${g}${g}${b}${b}`
}

export const sanitizeHex = (value: string | undefined | null, fallback: string): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) {
      return fallback
    }
    if (trimmed === 'transparent') {
      return 'transparent'
    }
    const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    if (HEX_PATTERN.test(normalized)) {
      return normalized.length === 4 ? expandShortHex(normalized) : normalized
    }
  }
  return fallback
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized = sanitizeHex(hex, '#000000')
  if (normalized === 'transparent') {
    return { r: 255, g: 255, b: 255 }
  }
  const value = normalized.slice(1)
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  }
}

export const getContrastTextColor = (hex: string): string => {
  const { r, g, b } = hexToRgb(hex)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 160 ? '#151515' : '#ffffff'
}
