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

export type ColorPickerSettingProps = {
  label: string
  value: string
  swatches: Swatch[]
  /** @deprecated Use onChange instead */
  onPickerChange?: (color: string) => void
  /** @deprecated Use onChange instead */
  onSwatchChange?: (color: string) => void
  /** Preview callback - fires on every color change (no history) */
  onChange?: (color: string) => void
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
