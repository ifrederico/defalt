import { useState, useMemo, useCallback, useEffect } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import type { LucideIcon } from 'lucide-react'
import {
  CirclePlus,
  Ghost as GhostIcon,
  Grid3x3,
  MessageSquareQuote,
  MessageCircleQuestionMark,
  SquareUserRound,
  Images,
  ChartArea,
  MapPin,
  FileText,
  Component,
  Crown,
  LayoutList,
  GalleryVertical
} from 'lucide-react'
import { FloatingTooltip } from '@defalt/ui'
import type { SectionDefinition } from '@defalt/sections/engine'

type UpcomingSection = {
  id: string
  label: string
  icon: LucideIcon
}

const UPCOMING_TEMPLATE_SECTIONS: UpcomingSection[] = [
  { id: 'grid', label: 'Grid', icon: Grid3x3 },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { id: 'faq', label: 'FAQ', icon: MessageCircleQuestionMark },
  { id: 'about', label: 'About', icon: SquareUserRound },
  { id: 'slideshow', label: 'Slideshow', icon: Images },
  { id: 'metrics', label: 'Metrics', icon: ChartArea },
  { id: 'map', label: 'Map', icon: MapPin },
  { id: 'blog-post', label: 'Blog post', icon: FileText },
  { id: 'logo-list', label: 'Logo list', icon: Component },
]

const SECTION_ICON_MAP: Record<string, LucideIcon> = {
  'hero': GalleryVertical,
  'image-with-text': LayoutList,
  'grid': Grid3x3,
  'testimonials': MessageSquareQuote,
  'faq': MessageCircleQuestionMark,
  'about': SquareUserRound,
  'ghostCards': GhostIcon,
  'ghostGrid': GhostIcon,
}

export type AddSectionCardProps = {
  definitions: SectionDefinition[]
  onSelect: (definitionId: string) => void
  disabled?: boolean
}

export function AddSectionCard({ definitions, onSelect, disabled = false }: AddSectionCardProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const hasDefinitions = definitions.length > 0
  const isEnabled = hasDefinitions && !disabled

  const filteredDefinitions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const list = normalized
      ? definitions.filter((definition) =>
          definition.label.toLowerCase().includes(normalized) ||
          definition.description?.toLowerCase().includes(normalized)
        )
      : definitions
    return list.slice().sort((a, b) => a.label.localeCompare(b.label))
  }, [definitions, query])

  const filteredUpcomingSections = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return UPCOMING_TEMPLATE_SECTIONS
    }
    return UPCOMING_TEMPLATE_SECTIONS.filter((section) =>
      section.label.toLowerCase().includes(normalized)
    )
  }, [query])

  const hasAvailableEntries =
    filteredDefinitions.length > 0 ||
    filteredUpcomingSections.length > 0

  const handleSelect = useCallback((definitionId: string) => {
    onSelect(definitionId)
    setOpen(false)
    setQuery('')
  }, [onSelect])

  useEffect(() => {
    if (!isEnabled && open) {
      setOpen(false)
    }
  }, [isEnabled, open])

  return (
    <DropdownMenu.Root open={open} onOpenChange={isEnabled ? setOpen : undefined}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          disabled={!isEnabled}
          className={`group flex w-full items-center gap-1 rounded-md bg-surface px-2 py-2 font-md font-normal transition-colors ${
            isEnabled ? 'text-foreground hover:bg-subtle cursor-pointer' : 'text-placeholder cursor-not-allowed bg-subtle'
          }`}
        >
          <span className="w-4 shrink-0" />
          <span className={`flex h-7 w-7 items-center justify-center ${isEnabled ? 'text-secondary' : 'text-placeholder'}`}>
            <CirclePlus size={16} strokeWidth={1.5} />
          </span>
          <span className="flex-1 truncate text-left">Add section</span>
        </button>
      </DropdownMenu.Trigger>
      {isEnabled && (
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="right"
            align="start"
            sideOffset={6}
            className="w-64 rounded-md border border-border bg-surface shadow-xl"
          >
            <div className="px-3 py-3">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sections"
                className="w-full rounded-md border border-border-strong px-3 py-2 font-md text-foreground placeholder:text-placeholder shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="h-px w-full bg-hover" />
            <div className="max-h-60 overflow-auto py-2">
              {!hasAvailableEntries ? (
                <p className="px-4 py-6 font-sm text-muted">No matching sections</p>
              ) : (
                <>
                  {filteredDefinitions.map((definition) => {
                    const DefinitionIcon = SECTION_ICON_MAP[definition.id] || GhostIcon
                    const isPremiumSection = definition.premium === true
                    return (
                      <DropdownMenu.Item
                        key={definition.id}
                        onSelect={() => handleSelect(definition.id)}
                        className="mx-1 flex cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 font-md text-foreground hover:bg-subtle focus:bg-subtle focus:outline-none group"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface text-secondary">
                          <DefinitionIcon size={16} strokeWidth={1.5} />
                        </span>
                        <span className="flex-1 flex items-center justify-between font-normal leading-none text-foreground min-w-0">
                          <span className="min-w-0">{definition.label}</span>
                          {isPremiumSection && (
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 shrink-0 ml-2">
                              <Crown size={9} strokeWidth={0} fill="currentColor" className="text-amber-600" />
                            </span>
                          )}
                        </span>
                      </DropdownMenu.Item>
                    )
                  })}

                  {filteredDefinitions.length > 0 &&
                    filteredUpcomingSections.length > 0 && (
                      <div className="mx-3 my-2 h-px bg-subtle" />
                    )}

                  {filteredUpcomingSections.length > 0 && (
                    <>
                      {filteredUpcomingSections.map((section) => {
                        const ComingSoonIcon = section.icon
                        return (
                          <FloatingTooltip key={`upcoming-${section.id}`} content="Coming soon to Defalt Plus.">
                            <DropdownMenu.Item
                              disabled
                              className="mx-1 flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-1.5 font-md text-placeholder opacity-60 data-[disabled]:bg-transparent"
                            >
                              <span className="flex h-8 w-8 items-center justify-center text-placeholder">
                                <ComingSoonIcon size={16} strokeWidth={1.5} />
                              </span>
                              <span className="font-normal leading-none text-placeholder">{section.label}</span>
                            </DropdownMenu.Item>
                          </FloatingTooltip>
                        )
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      )}
    </DropdownMenu.Root>
  )
}
