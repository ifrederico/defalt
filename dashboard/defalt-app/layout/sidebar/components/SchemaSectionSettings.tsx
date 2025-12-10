import { useMemo } from 'react'
import * as Separator from '@radix-ui/react-separator'
import { ChevronUp, ChevronDown, CircleHelp } from 'lucide-react'
import { getSectionDefinition, type SectionConfigSchema } from '@defalt/sections/engine'
import { SliderField, SettingSection } from '@defalt/ui'
import { groupSettingsByHeader, renderSettingInput } from './settingsRenderUtils'

type SchemaSectionSettingsProps = {
  definitionId: string
  config: SectionConfigSchema
  padding: { top: number, bottom: number, left?: number, right?: number }
  onPaddingChange?: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onPaddingCommit?: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onUpdateConfig: (updater: (config: SectionConfigSchema) => SectionConfigSchema) => void
}

function resolveBlockKey(blockType: string) {
  // Convention: pluralize by adding 's'
  return `${blockType}s`
}

export function SchemaSectionSettings({
  definitionId,
  config,
  padding,
  onPaddingChange,
  onPaddingCommit,
  onUpdateConfig
}: SchemaSectionSettingsProps) {
  const definition = useMemo(() => getSectionDefinition(definitionId), [definitionId])

  // Must call all hooks unconditionally before any early returns
  const settings = useMemo(() => definition?.settingsSchema ?? [], [definition])
  const blocks = useMemo(() => definition?.blocksSchema ?? [], [definition])
  const settingGroups = useMemo(() => groupSettingsByHeader(settings), [settings])

  const configRecord = config as Record<string, unknown>

  const handleFieldChange = (id: string, next: unknown) => {
    onUpdateConfig((current) => ({
      ...current,
      [id]: next
    }))
  }

  const readBlockList = (key: string): Record<string, unknown>[] => {
    const value = configRecord[key]
    return Array.isArray(value) ? [...value] as Record<string, unknown>[] : []
  }

  const handleBlockChange = (blockType: string, idx: number, fieldId: string, next: unknown) => {
    const key = resolveBlockKey(blockType)
    const list = readBlockList(key)
    const updatedItem = { ...(list[idx] || {}), [fieldId]: next }
    list[idx] = updatedItem
    onUpdateConfig((current) => ({
      ...current,
      [key]: list
    }))
  }

  const handleAddBlock = (blockType: string) => {
    const key = resolveBlockKey(blockType)
    const list = readBlockList(key)
    list.push({})
    onUpdateConfig((current) => ({
      ...current,
      [key]: list
    }))
  }

  const handleRemoveBlock = (blockType: string, idx: number) => {
    const key = resolveBlockKey(blockType)
    const list = readBlockList(key)
    list.splice(idx, 1)
    onUpdateConfig((current) => ({
      ...current,
      [key]: list
    }))
  }

  const handleMoveBlock = (blockType: string, idx: number, direction: 'up' | 'down') => {
    const key = resolveBlockKey(blockType)
    const list = readBlockList(key)
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= list.length) return
    // Swap items
    const temp = list[idx]
    list[idx] = list[newIdx]
    list[newIdx] = temp
    onUpdateConfig((current) => ({
      ...current,
      [key]: list
    }))
  }

  if (!definition) {
    return <p className="font-sm text-secondary">Unknown section: {definitionId}</p>
  }

  return (
    <div className="pl-4 pr-6 pt-3 pb-5 space-y-4">
      {settingGroups.map((group, groupIdx) => (
        <div key={group.title || `group-${groupIdx}`}>
          {groupIdx > 0 && <Separator.Root className="h-px bg-hover mb-4" />}
          <SettingSection
            title={group.title || 'Settings'}
            action={group.helpUrl ? (
              <a
                href={group.helpUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-placeholder transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Learn more"
              >
                <CircleHelp size={16} />
              </a>
            ) : undefined}
          >
            <div className="space-y-4">
              {group.settings.map((setting) => {
                const currentValue = configRecord[setting.id]
                // These types render their own labels or don't need them
                const selfLabeledTypes = ['paragraph', 'color', 'checkbox', 'range', 'select', 'radio']
                const needsLabel = !selfLabeledTypes.includes(setting.type)
                return (
                  <div key={setting.id} className="space-y-1.5">
                    {needsLabel && 'label' in setting && (
                      <label className="font-md text-secondary block">{setting.label}</label>
                    )}
                    {renderSettingInput(setting, currentValue, (next) => handleFieldChange(setting.id, next))}
                  </div>
                )
              })}
            </div>
          </SettingSection>
        </div>
      ))}

      {blocks.map((block) => {
        const key = resolveBlockKey(block.type)
        const list = readBlockList(key)
        const canAdd = !block.limit || list.length < block.limit
        return (
          <SettingSection key={block.type} title={block.name} action={
            canAdd ? (
              <button
                type="button"
                className="font-sm font-medium text-secondary hover:text-foreground"
                onClick={() => handleAddBlock(block.type)}
              >
                Add
              </button>
            ) : null
          }>
            {list.length === 0 && (
              <p className="font-sm text-secondary">No {block.name.toLowerCase()} items yet.</p>
            )}
            <div className="space-y-4">
              {list.map((item, idx) => (
                <div key={`${block.type}-${idx}`} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <h4 className="font-sm font-semibold text-foreground">{block.name} {idx + 1}</h4>
                      {list.length > 1 && (
                        <div className="flex items-center ml-1">
                          <button
                            type="button"
                            className="p-0.5 text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={() => handleMoveBlock(block.type, idx, 'up')}
                            disabled={idx === 0}
                            title="Move up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="p-0.5 text-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                            onClick={() => handleMoveBlock(block.type, idx, 'down')}
                            disabled={idx === list.length - 1}
                            title="Move down"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-foreground"
                      onClick={() => handleRemoveBlock(block.type, idx)}
                    >
                      Remove
                    </button>
                  </div>
                  {block.settings.map((setting) => (
                    <div key={setting.id} className="space-y-1.5">
                      {setting.type !== 'header' && setting.type !== 'paragraph' && setting.type !== 'color' && setting.type !== 'checkbox' && setting.type !== 'range' && setting.type !== 'select' && setting.type !== 'radio' && (
                        <label className="font-md text-secondary block">{setting.label}</label>
                      )}
                      {renderSettingInput(setting, item?.[setting.id], (next) => handleBlockChange(block.type, idx, setting.id, next))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </SettingSection>
        )
      })}

      {onPaddingChange && (
        <SettingSection title="Padding">
          <SliderField
            label="Top"
            value={padding.top}
            min={0}
            max={200}
            step={1}
            unit="px"
            onChange={(value) => onPaddingChange('top', value)}
            onCommit={(value) => onPaddingCommit?.('top', value)}
          />
          <SliderField
            label="Bottom"
            value={padding.bottom}
            min={0}
            max={200}
            step={1}
            unit="px"
            onChange={(value) => onPaddingChange('bottom', value)}
            onCommit={(value) => onPaddingCommit?.('bottom', value)}
          />
          <SliderField
            label="Left"
            value={padding.left ?? 0}
            min={0}
            max={200}
            step={1}
            unit="px"
            onChange={(value) => onPaddingChange('left', value)}
            onCommit={(value) => onPaddingCommit?.('left', value)}
          />
          <SliderField
            label="Right"
            value={padding.right ?? 0}
            min={0}
            max={200}
            step={1}
            unit="px"
            onChange={(value) => onPaddingChange('right', value)}
            onCommit={(value) => onPaddingCommit?.('right', value)}
          />
        </SettingSection>
      )}
    </div>
  )
}
