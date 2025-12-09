import { useCallback, useMemo, useState } from 'react'
import { ColorIndicator } from './ColorPicker/ColorPicker'
import { sanitizeHex } from '@defalt/utils/color/colorUtils'

export type ColorControlProps = {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  allowTransparent?: boolean
}

export function ColorControl({ label, value, onChange, disabled = false, allowTransparent = false }: ColorControlProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const normalizedValue = useMemo(() => {
    if (allowTransparent && value === 'transparent') {
      return 'transparent'
    }
    return sanitizeHex(value, '#000000')
  }, [allowTransparent, value])

  const handleChange = useCallback((next: string) => {
    if (disabled) {
      return
    }

    if (allowTransparent && next === 'transparent') {
      onChange('transparent')
      return
    }

    const sanitized = sanitizeHex(next, normalizedValue)
    onChange(sanitized)
  }, [allowTransparent, disabled, normalizedValue, onChange])

  return (
    <div className={disabled ? 'pointer-events-none opacity-60' : ''}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-md text-secondary whitespace-nowrap">{label}</p>
        <ColorIndicator
          value={normalizedValue}
          swatches={[]}
          onSwatchChange={handleChange}
          onTogglePicker={(expanded) => setIsExpanded(expanded)}
          onChange={handleChange}
          isExpanded={isExpanded}
          hasTransparentOption={allowTransparent}
          eyedropper={false}
        />
      </div>
    </div>
  )
}
