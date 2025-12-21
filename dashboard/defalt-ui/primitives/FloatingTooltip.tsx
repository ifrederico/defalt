import React, { useState, cloneElement, type ReactElement, type ReactNode } from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  type Placement,
} from '@floating-ui/react'

export type FloatingTooltipProps = {
  children: ReactElement
  content: ReactNode
  placement?: Placement
  offsetDistance?: number
  delayDuration?: number
}

export function FloatingTooltip({
  children,
  content,
  placement = 'right',
  offsetDistance = 4,
  delayDuration = 100,
}: FloatingTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    middleware: [
      offset(offsetDistance),
      flip({ fallbackPlacements: ['top', 'bottom', 'left', 'right'] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  const hover = useHover(context, { delay: { open: delayDuration, close: 0 } })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ])

  return (
    <>
      {cloneElement(children, {
        ...getReferenceProps(),
        ref: refs.setReference,
      } as React.HTMLAttributes<HTMLElement> & { ref: typeof refs.setReference })}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-[200] rounded-md bg-inverse px-3 py-1.5 text-xs font-medium text-white shadow-lg"
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
