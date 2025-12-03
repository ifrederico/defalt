import * as Separator from '@radix-ui/react-separator'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import { CaseSensitive, CaseUpper } from 'lucide-react'
import {
  ToggleSwitch,
  SettingSection,
  InlineControlRow,
} from '@defalt/ui'
import { DropdownField } from './DropdownField'

export type HeaderSectionSettingsProps = {
  navigationLayoutValue: string
  navigationLayoutOptions: string[]
  navigationLayoutError: string | null
  onNavigationLayoutChange: (value: string) => void
  stickyHeaderValue: string
  stickyHeaderOptions: string[]
  onStickyHeaderChange: (value: string) => void
  isSearchEnabled: boolean
  onSearchToggle: (value: boolean) => void
  typographyCase: 'default' | 'uppercase'
  onTypographyCaseChange: (value: 'default' | 'uppercase') => void
}

export function HeaderSectionSettings({
  navigationLayoutValue,
  navigationLayoutOptions,
  navigationLayoutError,
  onNavigationLayoutChange,
  stickyHeaderValue,
  stickyHeaderOptions,
  onStickyHeaderChange,
  isSearchEnabled,
  onSearchToggle,
  typographyCase,
  onTypographyCaseChange,
}: HeaderSectionSettingsProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pl-4 pr-6 py-4">
        <div className="space-y-4">
          <SettingSection title="Appearance">
            <DropdownField
              label="Navigation layout"
              value={navigationLayoutValue}
              options={navigationLayoutOptions}
              onChange={onNavigationLayoutChange}
              helperText="Choose how your logo and navigation items are arranged."
              errorMessage={navigationLayoutError}
              disabled={Boolean(navigationLayoutError)}
            />
            <DropdownField
              label="Sticky header"
              value={stickyHeaderValue}
              options={stickyHeaderOptions}
              onChange={onStickyHeaderChange}
            />
          </SettingSection>

          <Separator.Root className="h-px bg-hover" />

          <SettingSection title="Search">
            <InlineControlRow label="Search icon">
              <ToggleSwitch
                checked={isSearchEnabled}
                onChange={onSearchToggle}
                ariaLabel="Toggle search icon visibility"
                size="small"
              />
            </InlineControlRow>
          </SettingSection>

          <Separator.Root className="h-px bg-hover" />

          <SettingSection title="Typography">
            <InlineControlRow label="Case">
              <ToggleGroup.Root
                type="single"
                value={typographyCase}
                onValueChange={(value) => {
                  if (value === 'default' || value === 'uppercase') {
                    onTypographyCaseChange(value)
                  }
                }}
                className="inline-flex gap-0.5 rounded bg-subtle p-0.5"
                aria-label="Typography case"
              >
                <ToggleGroup.Item
                  value="default"
                  className="rounded px-2.5 py-1.5 font-md font-bold transition-colors data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=off]:text-muted data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Case-sensitive"
                >
                  <CaseSensitive size={16} strokeWidth={2} />
                  <span className="sr-only">Case-sensitive</span>
                </ToggleGroup.Item>
                <ToggleGroup.Item
                  value="uppercase"
                  className="rounded px-2.5 py-1.5 font-md font-bold transition-colors data-[state=on]:bg-surface data-[state=on]:text-foreground data-[state=on]:shadow-sm data-[state=off]:text-muted data-[state=off]:hover:text-foreground data-[state=off]:hover:bg-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Case-upper"
                >
                  <CaseUpper size={16} strokeWidth={2} />
                  <span className="sr-only">Case-upper</span>
                </ToggleGroup.Item>
              </ToggleGroup.Root>
            </InlineControlRow>
          </SettingSection>
        </div>
      </div>
    </div>
  )
}
