import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, Tag, X } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { FloatingTooltip } from '../primitives/FloatingTooltip'
import { TextInput } from '../primitives/TextInput'

export type TagConfig = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

export type PanelHeaderProps = {
  title: string
  onBack?: () => void
  /** Single Ghost tag (for backward compatibility) */
  tag?: string
  /** Callback when single tag is changed */
  onTagChange?: (tag: string) => void
  /** Multiple tags configuration (takes precedence over tag/onTagChange) */
  tags?: TagConfig[]
}

function MultiTagInput({ config, onSave }: { config: TagConfig; onSave: () => void }) {
  const [inputValue, setInputValue] = useState(config.value)

  useEffect(() => {
    setInputValue(config.value)
  }, [config.value])

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) {
      const normalizedTag = inputValue.trim().startsWith('#')
        ? inputValue.trim()
        : `#${inputValue.trim()}`
      config.onChange(normalizedTag)
    }
  }, [inputValue, config])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
      onSave()
    }
  }, [handleBlur, onSave])

  return (
    <div className="space-y-1">
      <label className="block font-sm text-muted">{config.label}</label>
      <TextInput
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="#your-tag"
      />
    </div>
  )
}

export function PanelHeader({ title, onBack, tag, onTagChange, tags }: PanelHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(tag || '')

  useEffect(() => {
    if (tag) setInputValue(tag)
  }, [tag])

  const handleSave = useCallback(() => {
    if (onTagChange && inputValue.trim()) {
      const normalizedTag = inputValue.trim().startsWith('#')
        ? inputValue.trim()
        : `#${inputValue.trim()}`
      onTagChange(normalizedTag)
    }
    setIsOpen(false)
  }, [inputValue, onTagChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setInputValue(tag || '')
      setIsOpen(false)
    }
  }, [handleSave, tag])

  const handleClose = useCallback(() => {
    setInputValue(tag || '')
    setIsOpen(false)
  }, [tag])

  // Use multiple tags if provided, otherwise fall back to single tag
  const hasTags = tags && tags.length > 0
  const hasSingleTag = tag !== undefined && onTagChange !== undefined

  // Build tooltip content for multiple tags
  const multiTagTooltip = hasTags
    ? tags.map(t => `${t.label}: ${t.value}`).join(' | ')
    : ''

  return (
    <div className="shrink-0 border-b border-border">
      <header className="flex h-12 items-center justify-between px-4">
        <div className="flex items-center min-w-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 font-md font-bold text-foreground transition-colors hover:text-secondary"
            >
              <ChevronLeft size={16} className="text-muted" />
              <span className="truncate">{title}</span>
            </button>
          ) : (
            <h2 className="font-lg text-foreground truncate">{title}</h2>
          )}
        </div>
        {hasTags ? (
          <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
            <FloatingTooltip content={multiTagTooltip}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-colors focus:outline-none bg-surface hover:bg-subtle text-muted"
                  aria-label="Ghost tags"
                >
                  <Tag size={16} strokeWidth={1.5} />
                </button>
              </Popover.Trigger>
            </FloatingTooltip>
            <Popover.Portal>
              <Popover.Content
                className="bg-surface border border-border rounded-md shadow-lg p-3 z-50 w-[240px]"
                sideOffset={4}
                align="end"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-md text-secondary">Ghost tags</label>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="w-6 h-6 rounded flex items-center justify-center text-muted hover:text-foreground hover:bg-subtle transition-colors"
                      aria-label="Close"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {tags.map((tagConfig) => (
                    <MultiTagInput
                      key={tagConfig.id}
                      config={tagConfig}
                      onSave={() => setIsOpen(false)}
                    />
                  ))}
                  <p className="font-sm text-muted">
                    Pages with these tags will appear in each column
                  </p>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        ) : hasSingleTag ? (
          <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
            <FloatingTooltip content={`Ghost tag: ${tag}`}>
              <Popover.Trigger asChild>
                <button
                  type="button"
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-colors focus:outline-none bg-surface hover:bg-subtle text-muted"
                  aria-label={`Ghost tag: ${tag}`}
                >
                  <Tag size={16} strokeWidth={1.5} />
                </button>
              </Popover.Trigger>
            </FloatingTooltip>
            <Popover.Portal>
              <Popover.Content
                className="bg-surface border border-border rounded-md shadow-lg p-3 z-50 w-[220px]"
                sideOffset={4}
                align="end"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-md text-secondary">Ghost tag</label>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-6 h-6 rounded flex items-center justify-center text-muted hover:text-foreground hover:bg-subtle transition-colors"
                      aria-label="Close"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <TextInput
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleSave}
                    placeholder="#your-tag"
                  />
                  <p className="font-sm text-muted">
                    Pages with this tag will appear in this section
                  </p>
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        ) : tag ? (
          <FloatingTooltip content={`Ghost tag: ${tag}`}>
            <button
              type="button"
              className="w-8 h-8 rounded-md flex items-center justify-center transition-colors focus:outline-none bg-surface hover:bg-subtle text-muted"
              aria-label={`Ghost tag: ${tag}`}
            >
              <Tag size={16} strokeWidth={1.5} />
            </button>
          </FloatingTooltip>
        ) : null}
      </header>
    </div>
  )
}
