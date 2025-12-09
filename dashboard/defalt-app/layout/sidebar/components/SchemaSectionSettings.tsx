import { useMemo } from 'react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Separator from '@radix-ui/react-separator'
import { getSectionDefinition, type SectionConfigSchema, type SectionSettingSchema } from '@defalt/sections/engine'
import { SliderField, ToggleSwitch, SettingSection, ColorPickerSetting, Dropdown, InlineControlRow } from '@defalt/ui'

// Group settings by header - each header starts a new group
type SettingGroup = {
  title: string
  settings: SectionSettingSchema[]
}

function groupSettingsByHeader(settings: SectionSettingSchema[]): SettingGroup[] {
  const groups: SettingGroup[] = []
  let currentGroup: SettingGroup | null = null

  for (const setting of settings) {
    if (setting.type === 'header') {
      // Start a new group
      currentGroup = { title: setting.label, settings: [] }
      groups.push(currentGroup)
    } else if (currentGroup) {
      // Add to current group
      currentGroup.settings.push(setting)
    } else {
      // No header yet, create unnamed group
      currentGroup = { title: '', settings: [setting] }
      groups.push(currentGroup)
    }
  }

  return groups
}

type SchemaSectionSettingsProps = {
  definitionId: string
  config: SectionConfigSchema
  padding: { top: number, bottom: number, left?: number, right?: number }
  onPaddingChange?: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onPaddingCommit?: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onUpdateConfig: (updater: (config: SectionConfigSchema) => SectionConfigSchema) => void
}

function renderSettingInput(
  setting: SectionSettingSchema,
  value: unknown,
  onChange: (next: unknown) => void
) {
  const baseClasses = 'w-full rounded-md border border-transparent bg-subtle px-3 py-2 font-md text-foreground placeholder:text-placeholder focus:outline-none focus:bg-surface focus:border-[rgb(48,207,67)] focus:shadow-[0_0_0_2px_rgba(48,207,67,0.25)]'

  switch (setting.type) {
    case 'text':
      return (
        <input
          type="text"
          className={baseClasses}
          placeholder={setting.placeholder || 'Enter text...'}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'url':
      return (
        <input
          type="url"
          className={baseClasses}
          placeholder={setting.placeholder || 'https://...'}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value || '#')}
        />
      )
    case 'textarea':
      return (
        <textarea
          className={`${baseClasses} min-h-[80px]`}
          placeholder={setting.placeholder || 'Enter content...'}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'richtext':
      // TODO: Replace with TipTap rich text editor when implementing WYSIWYG
      return (
        <textarea
          className={`${baseClasses} min-h-[80px]`}
          placeholder={setting.placeholder || 'Enter content...'}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'color':
      return (
        <ColorPickerSetting
          label={setting.label}
          value={typeof value === 'string' ? value : (typeof setting.default === 'string' ? setting.default : '#000000')}
          swatches={[
            { title: 'Accent', hex: '#AC1E3E', accent: true },
            { title: 'Grey', hex: '#e5e7eb' },
            { title: 'Black', hex: '#000000' },
            { title: 'White', hex: '#ffffff' }
          ]}
          onChange={(next) => onChange(next)}
          hasTransparentOption={false}
        />
      )
    case 'checkbox':
      return (
        <InlineControlRow label={setting.label} labelWidth="lg">
          <ToggleSwitch
            checked={value === true}
            onChange={(checked) => onChange(checked)}
            ariaLabel={setting.label}
          />
        </InlineControlRow>
      )
    case 'range':
      return (
        <SliderField
          label={setting.label}
          value={typeof value === 'number' && Number.isFinite(value) ? value : setting.default}
          min={setting.min}
          max={setting.max}
          step={setting.step}
          unit={setting.unit}
          onChange={(val) => onChange(val)}
        />
      )
    case 'select':
      return (
        <InlineControlRow label={setting.label}>
          <Dropdown
            selected={typeof value === 'string' ? value : (setting.default ?? '')}
            items={setting.options}
            onSelect={(val) => onChange(val)}
            triggerClassName="flex h-[38px] min-w-[120px] items-center justify-between gap-1.5 rounded-md bg-subtle px-3 font-md text-foreground transition-colors hover:bg-subtle/80 focus:outline-none focus-visible:outline-none"
            contentClassName="bg-surface rounded-md shadow-lg overflow-hidden min-w-[120px] z-[100]"
            itemClassName="flex items-center gap-2 px-3 py-2 font-md text-foreground transition-colors hover:bg-subtle"
          />
        </InlineControlRow>
      )
    case 'radio':
      return (
        <InlineControlRow label={setting.label} labelWidth="sm">
          <ToggleGroup.Root
            type="single"
            value={typeof value === 'string' ? value : ''}
            onValueChange={(next) => next && onChange(next)}
            className="inline-flex items-center gap-0.5 rounded-md bg-subtle p-0.5"
            aria-label={setting.label}
          >
            {setting.options.map((opt) => (
              <ToggleGroup.Item
                key={opt.value}
                value={opt.value}
                title={opt.label}
                className="flex items-center justify-center rounded px-3 py-1.5 font-md text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=off]:hover:bg-subtle/80"
              >
                <span className="max-w-[64px] truncate">{opt.label}</span>
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </InlineControlRow>
      )
    case 'image_picker':
      // TODO: Add drag-drop image upload with preview
      // <div className="border-2 border-dashed border-border rounded-md p-4 text-center hover:border-border-strong transition-colors cursor-pointer">
      //   {value ? <img src={value} alt="Preview" className="max-h-32 mx-auto rounded" /> : 'Drop image here'}
      // </div>
      return (
        <div className="space-y-2">
          <label className="font-md text-foreground">{setting.label}</label>
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            className={baseClasses}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )
    case 'header':
      return <h4 className="font-md font-semibold text-foreground pt-2 first:pt-0">{setting.label}</h4>
    case 'paragraph':
      return <p className="font-sm text-muted leading-relaxed">{setting.content}</p>
    default:
      return null
  }
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

  if (!definition) {
    return <p className="font-sm text-secondary">Unknown section: {definitionId}</p>
  }

  return (
    <div className="pl-4 pr-6 pt-3 pb-5 space-y-4">
      {settingGroups.map((group, groupIdx) => (
        <div key={group.title || `group-${groupIdx}`}>
          {groupIdx > 0 && <Separator.Root className="h-px bg-hover mb-4" />}
          <SettingSection title={group.title || 'Settings'}>
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
                    <h4 className="font-sm font-semibold text-foreground">{block.name} {idx + 1}</h4>
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
                      {setting.type !== 'header' && setting.type !== 'paragraph' && setting.type !== 'color' && setting.type !== 'color_background' && setting.type !== 'checkbox' && setting.type !== 'range' && (
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
