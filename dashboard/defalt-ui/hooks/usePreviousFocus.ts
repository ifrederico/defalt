import { useRef } from 'react'

export function usePreviousFocus(onClick: (name: string) => void, name: string) {
  const previousRangeRef = useRef<Range | null>(null)

  const handleMousedown = () => {
    const selection = document.getSelection()
    previousRangeRef.current = selection && selection.rangeCount === 0 ? null : selection?.getRangeAt(0) ?? null
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onClick(name)

    if (previousRangeRef.current) {
      const selection = document.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(previousRangeRef.current)
      previousRangeRef.current = null
    }
  }

  return { handleMousedown, handleClick }
}
