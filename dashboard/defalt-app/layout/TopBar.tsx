import {
  Monitor,
  Smartphone,
  Ellipsis,
  Archive,
  UploadCloud,
  RotateCcw,
  Trash2,
  Undo2,
  Redo2,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react'
import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AppButton, Select } from '@defalt/ui'
import { useWorkspaceContext } from '../contexts/useWorkspaceContext'
import { useHistoryContext } from '../contexts/useHistoryContext'
import type { PreviewZoom } from '../hooks/usePreview'
import type { WorkspacePage } from '../types/workspace'

const GHOST_URL = import.meta.env.VITE_GHOST_URL ?? '/'

type TopBarProps = {
  canDownload?: boolean
  onClearCache?: () => void
}

const pageLabels: Record<WorkspacePage, string> = {
  home: 'Homepage',
  about: 'Page',
  post: 'Post',
}

const zoomOptions: PreviewZoom[] = [50, 75, 100, 125, 150]

export function TopBar({ canDownload = true, onClearCache }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const {
    currentPage,
    setCurrentPage,
    previewDevice,
    setPreviewDevice,
    previewZoom,
    setPreviewZoom,
    hasUnsavedChanges,
    saveStatus,
    isDraftMode,
    handleSave,
    handleExport,
    isDownloading,
    handleBackup,
    handleRestore,
    openResetDialog,
    // Ghost data
    dataSource,
    ghostDataLoading,
    availablePosts,
    availablePages,
    selectedPostIndex,
    setSelectedPostIndex,
    selectedPageIndex,
    setSelectedPageIndex
  } = useWorkspaceContext()
  const { undo, redo, canUndo, canRedo, undoMetadata, redoMetadata, isInteractionBlocked } = useHistoryContext()
  const undoDisabled = !canUndo || isInteractionBlocked
  const redoDisabled = !canRedo || isInteractionBlocked
  const showGhostSelectors = dataSource === 'ghost'
  const resolvedPostIndex = availablePosts.length > 0
    ? Math.min(selectedPostIndex, availablePosts.length - 1)
    : -1
  const resolvedPageIndex = availablePages.length > 0
    ? Math.min(selectedPageIndex, availablePages.length - 1)
    : -1
  const selectedPost = resolvedPostIndex >= 0 ? availablePosts[resolvedPostIndex] : null
  const selectedPage = resolvedPageIndex >= 0 ? availablePages[resolvedPageIndex] : null
  const currentPageLabel = (() => {
    if (!showGhostSelectors) {
      return pageLabels[currentPage]
    }
    if (currentPage === 'about' && selectedPage) {
      return `Page: ${selectedPage.slug || selectedPage.title || 'Untitled'}`
    }
    if (currentPage === 'post' && selectedPost) {
      return `Post: ${selectedPost.slug || selectedPost.title || 'Untitled'}`
    }
    return pageLabels[currentPage]
  })()
  const menuItemClass =
    'flex items-center gap-2 px-3 py-2 text-md text-foreground transition-colors outline-none data-[highlighted]:bg-subtle data-[disabled]:text-placeholder data-[disabled]:pointer-events-none'
  const subTriggerClass =
    'flex items-center gap-2 px-3 py-2 text-md text-foreground transition-colors outline-none data-[highlighted]:bg-subtle data-[state=open]:bg-subtle data-[disabled]:text-placeholder data-[disabled]:pointer-events-none'

  return (
    <header
      className="bg-surface border-b border-border flex items-center justify-between px-8 py-4 gap-6 shrink-0"
      data-unsaved={hasUnsavedChanges ? 'true' : 'false'}
    >
      {/* Left Section - App Name / Page Selector / Draft Indicator */}
      <div className="flex items-center gap-3 flex-1 text-sm">
        <a
          className="hidden md:inline text-lg font-semibold text-foreground hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          href={GHOST_URL}
        >
          Defalt
        </a>
        <span className="hidden md:inline text-placeholder">/</span>

        <div className="relative w-[180px] -translate-y-[1px]">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="flex h-[38px] w-full items-center justify-between gap-1.5 rounded-md bg-subtle px-3 text-md text-foreground transition-colors hover:bg-subtle/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-surface"
              >
                <span className="flex-1 text-left truncate">{currentPageLabel}</span>
                <ChevronDown size={16} strokeWidth={2} className="text-foreground shrink-0 ml-auto opacity-60" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="bg-surface rounded-md shadow-lg overflow-hidden min-w-[180px] z-[100]"
                sideOffset={4}
                align="start"
                onCloseAutoFocus={(event) => event.preventDefault()}
              >
                <DropdownMenu.Item
                  onSelect={() => setCurrentPage('home')}
                  className={menuItemClass}
                >
                  <span className="flex-1 text-left truncate">{pageLabels.home}</span>
                  {currentPage === 'home' ? (
                    <Check size={16} strokeWidth={2} className="text-foreground" />
                  ) : (
                    <span className="w-4" />
                  )}
                </DropdownMenu.Item>

                {showGhostSelectors ? (
                  <>
                    <DropdownMenu.Sub>
                      <DropdownMenu.SubTrigger className={subTriggerClass}>
                        <span className="flex-1 text-left truncate">{pageLabels.about}</span>
                        <ChevronRight size={16} strokeWidth={2} className="text-foreground opacity-60" />
                      </DropdownMenu.SubTrigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.SubContent
                          className="bg-surface rounded-md shadow-lg overflow-hidden min-w-[180px] max-h-[300px] overflow-y-auto z-[100]"
                          sideOffset={6}
                          alignOffset={-4}
                          onCloseAutoFocus={(event) => event.preventDefault()}
                        >
                          {ghostDataLoading && availablePages.length === 0 && (
                            <DropdownMenu.Item disabled className={menuItemClass}>
                              <span className="flex-1 text-left truncate">Loading pages…</span>
                              <span className="w-4" />
                            </DropdownMenu.Item>
                          )}
                          {!ghostDataLoading && availablePages.length === 0 && (
                            <DropdownMenu.Item disabled className={menuItemClass}>
                              <span className="flex-1 text-left truncate">No pages found</span>
                              <span className="w-4" />
                            </DropdownMenu.Item>
                          )}
                          {availablePages.map((page, index) => (
                            <DropdownMenu.Item
                              key={page.id}
                              onSelect={() => {
                                setSelectedPageIndex(index)
                                setCurrentPage('about')
                              }}
                              className={menuItemClass}
                            >
                              <span className="flex-1 text-left truncate">
                                {page.slug || page.title || 'Untitled'}
                              </span>
                              {currentPage === 'about' && resolvedPageIndex === index ? (
                                <Check size={16} strokeWidth={2} className="text-foreground" />
                              ) : (
                                <span className="w-4" />
                              )}
                            </DropdownMenu.Item>
                          ))}
                        </DropdownMenu.SubContent>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Sub>

                    <DropdownMenu.Sub>
                      <DropdownMenu.SubTrigger className={subTriggerClass}>
                        <span className="flex-1 text-left truncate">{pageLabels.post}</span>
                        <ChevronRight size={16} strokeWidth={2} className="text-foreground opacity-60" />
                      </DropdownMenu.SubTrigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.SubContent
                          className="bg-surface rounded-md shadow-lg overflow-hidden min-w-[180px] max-h-[300px] overflow-y-auto z-[100]"
                          sideOffset={6}
                          alignOffset={-4}
                          onCloseAutoFocus={(event) => event.preventDefault()}
                        >
                          {ghostDataLoading && availablePosts.length === 0 && (
                            <DropdownMenu.Item disabled className={menuItemClass}>
                              <span className="flex-1 text-left truncate">Loading posts…</span>
                              <span className="w-4" />
                            </DropdownMenu.Item>
                          )}
                          {!ghostDataLoading && availablePosts.length === 0 && (
                            <DropdownMenu.Item disabled className={menuItemClass}>
                              <span className="flex-1 text-left truncate">No posts found</span>
                              <span className="w-4" />
                            </DropdownMenu.Item>
                          )}
                          {availablePosts.map((post, index) => (
                            <DropdownMenu.Item
                              key={post.id}
                              onSelect={() => {
                                setSelectedPostIndex(index)
                                setCurrentPage('post')
                              }}
                              className={menuItemClass}
                            >
                              <span className="flex-1 text-left truncate">
                                {post.slug || post.title || 'Untitled'}
                              </span>
                              {currentPage === 'post' && resolvedPostIndex === index ? (
                                <Check size={16} strokeWidth={2} className="text-foreground" />
                              ) : (
                                <span className="w-4" />
                              )}
                            </DropdownMenu.Item>
                          ))}
                        </DropdownMenu.SubContent>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Sub>
                  </>
                ) : (
                  <>
                    <DropdownMenu.Item
                      onSelect={() => setCurrentPage('about')}
                      className={menuItemClass}
                    >
                      <span className="flex-1 text-left truncate">{pageLabels.about}</span>
                      {currentPage === 'about' ? (
                        <Check size={16} strokeWidth={2} className="text-foreground" />
                      ) : (
                        <span className="w-4" />
                      )}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={() => setCurrentPage('post')}
                      className={menuItemClass}
                    >
                      <span className="flex-1 text-left truncate">{pageLabels.post}</span>
                      {currentPage === 'post' ? (
                        <Check size={16} strokeWidth={2} className="text-foreground" />
                      ) : (
                        <span className="w-4" />
                      )}
                    </DropdownMenu.Item>
                  </>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        <span className="text-md text-placeholder">
          {isDraftMode ? 'Draft' : 'Saved'}
        </span>
      </div>

      {/* Center Section - Device Preview Toggle & Zoom */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 bg-subtle rounded p-0.5">
          <button
            type="button"
            onClick={() => setPreviewDevice('desktop')}
            className={`px-2.5 py-1.5 rounded transition-colors ${
              previewDevice === 'desktop'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-subtle'
            }`}
            aria-pressed={previewDevice === 'desktop'}
            title="Desktop preview"
          >
            <Monitor size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setPreviewDevice('mobile')}
            className={`px-2.5 py-1.5 rounded transition-colors ${
              previewDevice === 'mobile'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-subtle'
            }`}
            aria-pressed={previewDevice === 'mobile'}
            title="Mobile preview"
          >
            <Smartphone size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="hidden md:block w-px h-6 bg-hover" />

        <div className="hidden md:block relative w-[96px]">
          <Select
            selected={previewZoom}
            items={zoomOptions.map((zoom) => ({
              value: zoom,
              label: `${zoom}%`,
            }))}
            onSelect={setPreviewZoom}
            triggerClassName="flex h-[30px] w-full items-center justify-center gap-1.5 rounded-md bg-subtle px-3 text-md text-foreground transition-colors hover:bg-subtle/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-surface tabular-nums"
            contentClassName="bg-surface rounded-md shadow-lg overflow-hidden min-w-[96px] z-[100]"
            itemClassName="flex items-center justify-end gap-2 px-3 py-2 text-md text-foreground transition-colors hover:bg-subtle outline-none data-[highlighted]:bg-subtle tabular-nums"
          />
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="cursor-pointer inline-flex h-9 w-10 items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold text-foreground transition hover:bg-subtle hover:text-foreground focus:outline-none"
              aria-label="Menu"
              title="Menu"
            >
              <Ellipsis size={16} strokeWidth={1.5} />
              <span className="sr-only">Menu</span>
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="bg-surface rounded-md shadow-lg border border-border p-1 min-w-[180px] space-y-1 z-[100]"
              sideOffset={4}
              align="end"
            >
              <DropdownMenu.Item
                onSelect={(event) => {
                  event.preventDefault()
                  handleRestore()
                }}
                className="h-9 px-2 rounded-md outline-none flex items-center gap-2 font-md text-foreground hover:bg-subtle data-[highlighted]:bg-subtle cursor-pointer"
              >
                <UploadCloud size={16} strokeWidth={1.5} />
                <span>Upload config</span>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                onSelect={(event) => {
                  event.preventDefault()
                  handleBackup()
                }}
                className="h-9 px-2 rounded-md outline-none flex items-center gap-2 font-md text-foreground hover:bg-subtle data-[highlighted]:bg-subtle cursor-pointer"
              >
                <Archive size={16} strokeWidth={1.5} />
                <span>Download config</span>
              </DropdownMenu.Item>

              {onClearCache && (
                <>
                  <DropdownMenu.Separator className="h-px bg-subtle my-1" />
                  <DropdownMenu.Item
                    onSelect={onClearCache}
                    className="h-9 px-2 rounded-md outline-none flex items-center gap-2 font-md text-warning hover:bg-warning-light data-[highlighted]:bg-warning-light cursor-pointer"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                    <span>Clear cache & reload</span>
                  </DropdownMenu.Item>
                </>
              )}

              <>
                <DropdownMenu.Separator className="h-px bg-subtle my-1" />
                <DropdownMenu.Item
                  onSelect={(event) => {
                    event.preventDefault()
                    setMenuOpen(false)
                    setTimeout(openResetDialog, 0)
                  }}
                  className="h-9 px-2 rounded-md outline-none flex items-center gap-2 font-md text-error hover:bg-error-light data-[highlighted]:bg-error-light cursor-pointer"
                >
                  <RotateCcw size={16} strokeWidth={1.5} />
                  <span>Reset to default</span>
                </DropdownMenu.Item>
              </>

            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <div className="flex items-center gap-0.5">
          <AppButton
            variant="light"
            state={undoDisabled ? 'disabled' : 'default'}
            aria-label={undoMetadata ? `Undo ${undoMetadata.label}` : 'Undo'}
            title={undoMetadata ? `Undo ${undoMetadata.label}` : 'Undo'}
            className="!px-0 !py-0 h-9 w-10 !cursor-pointer transition disabled:!cursor-default disabled:!text-placeholder"
            onClick={undo}
            disabled={undoDisabled}
          >
            <Undo2 size={16} strokeWidth={1.5} />
          </AppButton>

          <AppButton
            variant="light"
            state={redoDisabled ? 'disabled' : 'default'}
            aria-label={redoMetadata ? `Redo ${redoMetadata.label}` : 'Redo'}
            title={redoMetadata ? `Redo ${redoMetadata.label}` : 'Redo'}
            className="!px-0 !py-0 h-9 w-10 !cursor-pointer transition disabled:!cursor-default disabled:!text-placeholder"
            onClick={redo}
            disabled={redoDisabled}
          >
            <Redo2 size={16} strokeWidth={1.5} />
          </AppButton>
        </div>

        <AppButton
          onClick={() => { void handleSave() }}
          variant={saveStatus === 'saved' ? 'success' : 'light'}
          state={saveStatus === 'saving' ? 'loading' : 'default'}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? 'Saving' : saveStatus === 'saved' ? 'Saved' : 'Save'}
        </AppButton>

        <AppButton
          onClick={handleExport}
          variant="primary"
          state={
            isDownloading
              ? 'loading'
              : !canDownload
              ? 'disabled'
              : 'default'
          }
          disabled={isDownloading || !canDownload}
        >
          {isDownloading ? 'Preparing…' : 'Download'}
        </AppButton>
      </div>
    </header>
  )
}
