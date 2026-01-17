import { Fragment, useCallback } from 'react'
import type { MouseEvent } from 'react'
import { FloatingTooltip } from '../FloatingTooltip'
import { getAccentColor } from '@defalt/utils/color/getAccentColor'
import { cn } from '../../utils/cn'
import type { KoenigSwatch } from './types'

type ColorSwatchProps = {
  swatch: KoenigSwatch
  isSelected: boolean
  onSelect: (value: string) => void
}

export function ColorSwatch({ swatch, isSelected, onSelect }: ColorSwatchProps) {
  const backgroundColor = swatch.accent ? swatch.hex ?? getAccentColor() : swatch.hex

  const onSelectHandler = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()

      if (swatch.accent) {
        onSelect('accent')
      } else if (swatch.transparent) {
        onSelect('transparent')
      } else if (swatch.hex) {
        onSelect(swatch.hex.toLowerCase())
      }
    },
    [onSelect, swatch]
  )

  if (swatch.customContent) {
    return <Fragment key={swatch.title}>{swatch.customContent}</Fragment>
  }

  return (
    <FloatingTooltip content={swatch.title} placement="top">
      <button
        className={cn(
          'relative flex size-5 shrink-0 items-center rounded-full border border-border',
          isSelected && 'outline outline-2 outline-emerald-500'
        )}
        style={{ backgroundColor }}
        type="button"
        onClick={onSelectHandler}
      >
        {swatch.transparent && <div className="absolute left-0 top-0 z-10 w-[136%] origin-left rotate-45 border-b border-b-red-500" />}
      </button>
    </FloatingTooltip>
  )
}
