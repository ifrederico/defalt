/**
 * Shared utilities for schema-driven settings rendering
 *
 * This file contains helper functions for rendering settings UI.
 * It's intentionally separate from component files to satisfy react-refresh.
 */

import * as ToggleGroup from '@radix-ui/react-toggle-group'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  CaseSensitive,
  CaseUpper,
  Image,
  Minus,
  RectangleEllipsis,
  Bookmark,
  Images,
  Eye,
  MousePointer,
  MessageSquareWarning,
  UserPlus,
  GalleryVertical,
  ChevronDown,
  Play,
  Music4,
  Paperclip,
  Star,
  Code,
  BookOpen,
  type LucideIcon
} from 'lucide-react'
import type { SectionSettingSchema } from '@defalt/sections/engine'
import { SliderField, ToggleSwitch, ColorPickerSetting, Dropdown, InlineControlRow } from '@defalt/ui'

// Icon name to component mapping for radio buttons and card lists
const ICON_MAP: Record<string, LucideIcon> = {
  AlignLeft,
  AlignCenter,
  AlignRight,
  CaseSensitive,
  CaseUpper,
  // Card list icons
  Image,
  Minus,
  RectangleEllipsis,
  Bookmark,
  Images,
  Eye,
  MousePointer,
  MessageSquareWarning,
  UserPlus,
  GalleryVertical,
  ChevronDown,
  Play,
  Music4,
  Paperclip,
  Star,
  Code,
  BookOpen
}

// Group settings by header - each header starts a new group
export type SettingGroup = {
  title: string
  helpUrl?: string
  settings: SectionSettingSchema[]
}

export function groupSettingsByHeader(settings: SectionSettingSchema[]): SettingGroup[] {
  const groups: SettingGroup[] = []
  let currentGroup: SettingGroup | null = null

  for (const setting of settings) {
    if (setting.type === 'header') {
      // Start a new group, preserving helpUrl if present
      currentGroup = {
        title: setting.label,
        helpUrl: 'helpUrl' in setting ? setting.helpUrl : undefined,
        settings: []
      }
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

export function renderSettingInput(
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
          placeholder="Enter content..."
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
    case 'radio': {
      const hasIcons = setting.options.some((opt) => opt.icon)
      const iconOnly = setting.iconOnly && hasIcons
      return (
        <InlineControlRow label={setting.label}>
          <ToggleGroup.Root
            type="single"
            value={typeof value === 'string' ? value : ''}
            onValueChange={(next) => next && onChange(next)}
            className="inline-flex items-center gap-0.5 rounded-md bg-subtle p-0.5"
            aria-label={setting.label}
          >
            {setting.options.map((opt) => {
              const IconComponent = opt.icon ? ICON_MAP[opt.icon] : null
              return (
                <ToggleGroup.Item
                  key={opt.value}
                  value={opt.value}
                  title={opt.label}
                  className={`flex items-center justify-center rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=off]:hover:bg-subtle/80 ${
                    iconOnly ? 'p-2' : 'px-3 py-1.5'
                  }`}
                >
                  {IconComponent && <IconComponent size={16} className={iconOnly ? '' : 'mr-1.5'} />}
                  {!iconOnly && <span className="max-w-[64px] truncate font-md text-foreground">{opt.label}</span>}
                </ToggleGroup.Item>
              )
            })}
          </ToggleGroup.Root>
        </InlineControlRow>
      )
    }
    case 'image_picker':
      // TODO: Add drag-drop image upload with preview
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
    case 'cardList':
      return (
        <div className="space-y-2">
          {setting.items.map((item) => {
            const IconComponent = ICON_MAP[item.icon]
            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-subtle text-secondary">
                    {IconComponent && <IconComponent size={16} />}
                  </span>
                  <span className="font-md font-medium text-foreground">{item.label}</span>
                </div>
                <span className="font-md text-xs text-placeholder">{item.suffix}</span>
              </div>
            )
          })}
        </div>
      )
    default:
      return null
  }
}
