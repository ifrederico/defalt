import { useMemo, useCallback } from 'react'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Separator from '@radix-ui/react-separator'
import type { AnnouncementContentConfig } from '@defalt/utils/config/themeConfig'
import { SettingSection, InlineControlRow, Dropdown, ToggleSwitch } from '@defalt/ui'
import { ChevronsRightLeft, ChevronsLeftRight, AlignJustify, CaseSensitive, CaseUpper, Info } from 'lucide-react'

const sizeOptions: AnnouncementContentConfig['typographySize'][] = ['small', 'normal', 'large', 'x-large']
const weightOptions: AnnouncementContentConfig['typographyWeight'][] = ['light', 'normal', 'bold']
const spacingOptions: AnnouncementContentConfig['typographySpacing'][] = ['tight', 'normal', 'wide']

type AnnouncementSettingsProps = {
  config: AnnouncementContentConfig
  onChange: (updater: (config: AnnouncementContentConfig) => AnnouncementContentConfig) => void
}

export function AnnouncementSettings({ config, onChange }: AnnouncementSettingsProps) {
  const handlePartialChange = useCallback((patch: Partial<AnnouncementContentConfig>) => {
    onChange((prev) => ({
      ...prev,
      ...patch
    }))
  }, [onChange])

  const spacingToggleItems = useMemo(() => spacingOptions.map((choice) => {
    const Icon = choice === 'tight'
      ? ChevronsRightLeft
      : choice === 'wide'
        ? ChevronsLeftRight
        : AlignJustify
    return (
      <ToggleGroup.Item
        key={choice}
        value={choice}
        className="rounded px-2.5 py-1.5 font-md transition-colors data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=off]:text-muted data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon size={16} strokeWidth={2} />
        <span className="sr-only">{choice}</span>
      </ToggleGroup.Item>
    )
  }), [])

  const dropdownTriggerClasses = 'flex h-[38px] min-w-[160px] items-center justify-between gap-1.5 rounded-md bg-subtle px-3 text-md text-foreground transition-colors hover:bg-subtle/80 focus:outline-none focus-visible:outline-none'
  const dropdownContentClasses = 'bg-surface rounded-md shadow-lg overflow-hidden min-w-[160px] z-[100]'
  const dropdownItemClasses = 'flex items-center gap-2 px-3 py-2 text-md text-foreground transition-colors hover:bg-subtle'

  const sizeItems = sizeOptions.map((value) => ({
    value,
    label: value.replace(/(?:^| |-)(\w)/g, (_, char) => char.toUpperCase()),
  }))

  const weightItems = weightOptions.map((value) => ({
    value,
    label: value === 'normal'
      ? 'Default'
      : value.replace(/(?:^| |-)(\w)/g, (_, char) => char.toUpperCase()),
  }))

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pl-4 pr-6 py-4">
        <div className="space-y-4">
          <SettingSection title="Content">
            <AnnouncementTagCallout />
            <div className="space-y-3">
              <label className="block space-y-2">
                <span className="font-sm text-secondary">Preview text (Defalt only)</span>
                <textarea
                  className="w-full rounded-md border border-border px-3 py-2 font-md text-foreground placeholder:text-placeholder focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={3}
                  value={config.previewText}
                  onChange={(event) => handlePartialChange({ previewText: event.target.value })}
                  placeholder="Tag #announcement-bar to a published Ghost page."
                />
              </label>
            </div>
          </SettingSection>

          <Separator.Root className="h-px bg-hover" />

          <SettingSection title="Typography">
            <div className="space-y-3">
              <InlineControlRow label="Size">
                <Dropdown<AnnouncementContentConfig['typographySize']>
                  selected={config.typographySize}
                  items={sizeItems}
                  onSelect={(value) => handlePartialChange({ typographySize: value })}
                  triggerClassName={dropdownTriggerClasses}
                  contentClassName={dropdownContentClasses}
                  itemClassName={dropdownItemClasses}
                />
              </InlineControlRow>
              <InlineControlRow label="Weight">
                <Dropdown<AnnouncementContentConfig['typographyWeight']>
                  selected={config.typographyWeight}
                  items={weightItems}
                  onSelect={(value) => handlePartialChange({ typographyWeight: value })}
                  triggerClassName={dropdownTriggerClasses}
                  contentClassName={dropdownContentClasses}
                  itemClassName={dropdownItemClasses}
                />
              </InlineControlRow>
            </div>

            <InlineControlRow label="Spacing">
              <ToggleGroup.Root
                type="single"
                value={config.typographySpacing}
                onValueChange={(value) => {
                  if (value === 'tight' || value === 'normal' || value === 'wide') {
                    handlePartialChange({ typographySpacing: value })
                  }
                }}
                className="inline-flex gap-0.5 rounded bg-subtle p-0.5"
              >
                {spacingToggleItems}
              </ToggleGroup.Root>
            </InlineControlRow>

            <InlineControlRow label="Case">
              <ToggleGroup.Root
                type="single"
                value={config.typographyCase}
                onValueChange={(value) => {
                  if (value === 'default' || value === 'uppercase') {
                    handlePartialChange({ typographyCase: value })
                  }
                }}
                className="inline-flex gap-0.5 rounded bg-subtle p-0.5"
              >
                <ToggleGroup.Item
                  value="default"
                  className="rounded px-2.5 py-1.5 font-md font-bold transition-colors data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=off]:text-muted data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CaseSensitive size={16} strokeWidth={2} />
                </ToggleGroup.Item>
                <ToggleGroup.Item
                  value="uppercase"
                  className="rounded px-2.5 py-1.5 font-md font-bold transition-colors data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=off]:text-muted data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <CaseUpper size={16} strokeWidth={2} />
                </ToggleGroup.Item>
              </ToggleGroup.Root>
            </InlineControlRow>

            <InlineControlRow label="Underline links">
              <ToggleSwitch
                checked={config.underlineLinks}
                onChange={(checked) => handlePartialChange({ underlineLinks: checked })}
                ariaLabel="Toggle link underline"
              />
            </InlineControlRow>
          </SettingSection>
        </div>
      </div>
    </div>
  )
}

function AnnouncementTagCallout() {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-md border border-info-border bg-info-light px-3 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-info" />
        <div className="text-sm leading-5 text-info">
          <p>
            Tag{' '}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-info border border-info-border">
              #announcement-bar
            </code>{' '}
            to a published Ghost page and Defalt renders the first paragraph. Without that tag the bar stays hidden in your exported theme. Use the preview text below to visualize styles inside Defalt.
          </p>
        </div>
      </div>
    </div>
  )
}
