import * as Separator from '@radix-ui/react-separator'
import { SettingSection, InlineControlRow, ToggleSwitch } from '@defalt/ui'
import { DropdownField } from './DropdownField'
import { SectionPaddingSettings } from './SectionPaddingSettings'

type MainAppearanceSettingsProps = {
  padding: { top: number, bottom: number, left?: number, right?: number }
  margin?: { top?: number, bottom?: number }
  postFeedStyleValue: string
  postFeedStyleOptions: string[]
  onPostFeedStyleChange: (value: string) => void
  showImagesInFeed: boolean
  onShowImagesInFeedToggle: (value: boolean) => void
  showAuthor: boolean
  onShowAuthorToggle: (value: boolean) => void
  showPublishDate: boolean
  onShowPublishDateToggle: (value: boolean) => void
  showPublicationInfoSidebar: boolean
  onShowPublicationInfoSidebarToggle: (value: boolean) => void
  onPaddingChange: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
  onPaddingCommit: (direction: 'top' | 'bottom' | 'left' | 'right', value: number) => void
}

export function MainAppearanceSettings({
  padding,
  margin,
  postFeedStyleValue,
  postFeedStyleOptions,
  onPostFeedStyleChange,
  showImagesInFeed,
  onShowImagesInFeedToggle,
  showAuthor,
  onShowAuthorToggle,
  showPublishDate,
  onShowPublishDateToggle,
  showPublicationInfoSidebar,
  onShowPublicationInfoSidebarToggle,
  onPaddingChange,
  onPaddingCommit
}: MainAppearanceSettingsProps) {
  const imagesInFeedEnabled = postFeedStyleValue === 'List'

  const handleImagesToggle = (next: boolean) => {
    if (!imagesInFeedEnabled) {
      return
    }
    onShowImagesInFeedToggle(next)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto pl-4 pr-6 py-4 space-y-6">
        <SettingSection title="Appearance">
          <div className="space-y-4">
            <DropdownField
              label="Post feed style"
              value={postFeedStyleValue}
              options={postFeedStyleOptions}
              onChange={onPostFeedStyleChange}
            />
            <InlineControlRow label="Show images in feed">
              <ToggleSwitch
                checked={showImagesInFeed}
                onChange={handleImagesToggle}
                ariaLabel="Toggle images in feed"
                size="small"
                disabled={!imagesInFeedEnabled}
              />
            </InlineControlRow>
            <InlineControlRow label="Show author">
              <ToggleSwitch
                checked={showAuthor}
                onChange={onShowAuthorToggle}
                ariaLabel="Toggle author in feed"
                size="small"
              />
            </InlineControlRow>
            <InlineControlRow label="Show publish date">
              <ToggleSwitch
                checked={showPublishDate}
                onChange={onShowPublishDateToggle}
                ariaLabel="Toggle publish date in feed"
                size="small"
              />
            </InlineControlRow>
            <InlineControlRow label="Show publication info sidebar">
              <ToggleSwitch
                checked={showPublicationInfoSidebar}
                onChange={onShowPublicationInfoSidebarToggle}
                ariaLabel="Toggle publication info sidebar"
                size="small"
              />
            </InlineControlRow>
          </div>
        </SettingSection>

        <Separator.Root className="h-px bg-hover" />

        <SectionPaddingSettings
          sectionId="main"
          padding={padding}
          margin={margin}
          onChange={onPaddingChange}
          onCommit={onPaddingCommit}
        />
      </div>
    </div>
  )
}
