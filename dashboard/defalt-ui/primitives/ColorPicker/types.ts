import type { ReactNode } from 'react'

export type Swatch = {
  title: string
  hex?: string
  accent?: boolean
  value?: string
  background?: string
  customContent?: ReactNode
  transparent?: boolean
}

export type KoenigSwatch = {
  title: string
  hex?: string
  accent?: boolean
  transparent?: boolean
  image?: boolean
  customContent?: ReactNode
}

export type EyeDropperAPI = {
  open: () => Promise<{ sRGBHex: string }>
}

export type EyeDropperWindow = typeof window & { EyeDropper?: new () => EyeDropperAPI }

export type ColorPickerSettingProps = {
  label: string
  value: string
  swatches: Swatch[]
  /** Preview callback - fires on every color change (no history) */
  onChange: (color: string) => void
  /** Commit callback - fires when popover closes (creates history entry) */
  onCommit?: (color: string) => void
  onTogglePicker?: (expanded: boolean) => void
  isExpanded?: boolean
  dataTestId?: string
  disabled?: boolean
  accentColor?: string
  hasTransparentOption?: boolean
  children?: ReactNode
}
