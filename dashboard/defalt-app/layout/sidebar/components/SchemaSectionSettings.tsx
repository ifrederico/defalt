import { useMemo } from 'react'
import { getSectionDefinition, type SectionConfigSchema, type SectionSettingSchema } from '@defalt/sections/engine'
import { SliderField, ToggleSwitch, SettingSection, ColorControl, Dropdown } from '@defalt/ui'

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
  const baseClasses = 'w-full rounded-md border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-border-strong'

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
      return (
        <textarea
          className={`${baseClasses} min-h-[100px]`}
          placeholder="Add text..."
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
    case 'color':
      return (
        <ColorControl
          label={setting.label}
          value={typeof value === 'string' ? value : (typeof setting.default === 'string' ? setting.default : '#000000')}
          onChange={(next) => onChange(next)}
        />
      )
    case 'checkbox':
      return (
        <ToggleSwitch
          checked={value === true}
          onChange={(checked) => onChange(checked)}
          ariaLabel={setting.label}
        />
      )
    case 'range':
      return (
        <SliderField
          label=""
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
        <Dropdown
          selected={typeof value === 'string' ? value : (setting.default ?? '')}
          items={setting.options}
          onSelect={(val) => onChange(val)}
        />
      )
    case 'radio':
      return (
        <div className="flex flex-wrap gap-2">
          {setting.options.map((opt) => {
            const isSelected = value === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  isSelected
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-surface text-foreground hover:border-border-strong'
                }`}
                onClick={() => onChange(opt.value)}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )
    case 'image_picker':
      return (
        <div className="space-y-2">
          <div className="border-2 border-dashed border-border rounded-md p-4 text-center hover:border-border-strong transition-colors cursor-pointer">
            {typeof value === 'string' && value ? (
              <div className="space-y-2">
                <img src={value} alt="Preview" className="max-h-32 mx-auto rounded" />
                <button
                  type="button"
                  className="text-sm text-secondary hover:text-foreground"
                  onClick={() => onChange('')}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="py-4">
                {/* Placeholder SVG - intentional empty state */}
                <svg
                  className="mx-auto h-12 w-12 text-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <p className="mt-2 text-sm text-secondary">Drop image or paste URL</p>
                <p className="text-xs text-muted mt-1">PNG, JPG up to 2MB</p>
              </div>
            )}
          </div>
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            className={`${baseClasses} text-xs`}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )
    case 'color_background':
      // Pro tier: supports gradients. For now, falls back to color picker
      return (
        <div className="space-y-2">
          <ColorControl
            label={setting.label}
            value={typeof value === 'string' ? value : (typeof setting.default === 'string' ? setting.default : '#000000')}
            onChange={(next) => onChange(next)}
          />
          <p className="text-xs text-muted">Pro: Gradient support coming soon</p>
        </div>
      )
    case 'header':
      return <h4 className="text-sm font-semibold text-foreground">{setting.label}</h4>
    case 'paragraph':
      return <p className="text-sm text-secondary">{setting.content}</p>
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

  if (!definition) {
    return <p className="text-sm text-secondary">Unknown section: {definitionId}</p>
  }

  const settings = definition.settingsSchema ?? []
  const blocks = definition.blocksSchema ?? []

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

  return (
    <>
      {settings.length > 0 && (
        <SettingSection title="Settings">
          <div className="space-y-3">
            {settings.map((setting) => {
              const currentValue = configRecord[setting.id]
              return (
                <div key={setting.id} className="space-y-1">
                  {setting.type !== 'header' && setting.type !== 'paragraph' && setting.type !== 'color' && setting.type !== 'color_background' && (
                    <label className="text-sm font-medium text-foreground block">{setting.label}</label>
                  )}
                  {renderSettingInput(setting, currentValue, (next) => handleFieldChange(setting.id, next))}
                </div>
              )
            })}
          </div>
        </SettingSection>
      )}

      {blocks.map((block) => {
        const key = resolveBlockKey(block.type)
        const list = readBlockList(key)
        const canAdd = !block.limit || list.length < block.limit
        return (
          <SettingSection key={block.type} title={block.name} action={
            canAdd ? (
              <button
                type="button"
                className="text-sm font-medium text-secondary hover:text-foreground"
                onClick={() => handleAddBlock(block.type)}
              >
                Add
              </button>
            ) : null
          }>
            {list.length === 0 && (
              <p className="text-sm text-secondary">No {block.name.toLowerCase()} items yet.</p>
            )}
            <div className="space-y-3">
              {list.map((item, idx) => (
                <div key={`${block.type}-${idx}`} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">{block.name} {idx + 1}</h4>
                    <button
                      type="button"
                      className="text-xs text-muted hover:text-foreground"
                      onClick={() => handleRemoveBlock(block.type, idx)}
                    >
                      Remove
                    </button>
                  </div>
                  {block.settings.map((setting) => (
                    <div key={setting.id} className="space-y-1">
                      {setting.type !== 'header' && setting.type !== 'paragraph' && (
                        <label className="text-sm font-medium text-foreground block">{setting.label}</label>
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
            onChange={(value) => onPaddingChange('top', value)}
            onCommit={(value) => onPaddingCommit?.('top', value)}
            variant="normal"
          />
          <SliderField
            label="Bottom"
            value={padding.bottom}
            min={0}
            max={200}
            step={1}
            onChange={(value) => onPaddingChange('bottom', value)}
            onCommit={(value) => onPaddingCommit?.('bottom', value)}
            variant="normal"
          />
          <SliderField
            label="Left"
            value={padding.left ?? 0}
            min={0}
            max={200}
            step={1}
            onChange={(value) => onPaddingChange('left', value)}
            onCommit={(value) => onPaddingCommit?.('left', value)}
            variant="normal"
          />
          <SliderField
            label="Right"
            value={padding.right ?? 0}
            min={0}
            max={200}
            step={1}
            onChange={(value) => onPaddingChange('right', value)}
            onCommit={(value) => onPaddingCommit?.('right', value)}
            variant="normal"
          />
        </SettingSection>
      )}
    </>
  )
}
