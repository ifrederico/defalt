import {
  Monitor,
  Smartphone,
  Ellipsis,
  Archive,
  UploadCloud,
  RotateCcw,
  Trash2,
  Undo2,
  Redo2
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { AppButton, Dropdown } from '@defalt/ui'
import { useWorkspaceContext } from '../contexts/useWorkspaceContext'
import { useHistoryContext } from '../contexts/useHistoryContext'
import type { PreviewZoom } from '../hooks/usePreview'

const GHOST_URL = import.meta.env.VITE_GHOST_URL ?? '/'

type PageType = 'home' | 'about' | 'post'

type TopBarProps = {
  canDownload?: boolean
  onClearCache?: () => void
}

const pageLabels: Record<PageType, string> = {
  home: 'Homepage',
  about: 'Page',
  post: 'Post',
}

const pageOrder: PageType[] = ['home', 'about', 'post']

const zoomOptions: PreviewZoom[] = [50, 75, 100, 125, 150]

export function TopBar({ canDownload = true, onClearCache }: TopBarProps) {
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
  const showPostSelector = showGhostSelectors && currentPage === 'post' && availablePosts.length > 0
  const showPageSelector = showGhostSelectors && currentPage === 'about' && availablePages.length > 0
  const showGhostPlaceholder = showGhostSelectors && !showPostSelector && !showPageSelector

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
          <Dropdown
            selected={currentPage}
            items={pageOrder.map((page) => ({
              value: page,
              label: pageLabels[page],
            }))}
            onSelect={setCurrentPage}
            triggerClassName="flex h-[38px] w-full items-center justify-between gap-1.5 rounded-md bg-subtle px-3 text-md text-foreground transition-colors hover:bg-subtle/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-surface"
            contentClassName="bg-surface rounded-md shadow-lg overflow-hidden min-w-[180px] z-[100]"
            itemClassName="flex items-center gap-2 px-3 py-2 text-md text-foreground transition-colors hover:bg-subtle outline-none data-[highlighted]:bg-subtle"
          />
        </div>

        {/* Content selector dropdown - shows when viewing post/page with Ghost API */}
        {showPostSelector && (
          <>
            <span className="text-placeholder">/</span>
            <div className="relative w-[180px] -translate-y-[1px]">
              <Dropdown
                selected={availablePosts[selectedPostIndex]?.id || availablePosts[0]?.id}
                items={availablePosts.map((post) => ({
                  value: post.id,
                  label: post.slug.length > 9 ? `${post.slug.slice(0, 9)}…` : post.slug
                }))}
                onSelect={(id) => {
                  const index = availablePosts.findIndex((p) => p.id === id)
                  if (index !== -1) setSelectedPostIndex(index)
                }}
                triggerClassName="flex h-[38px] w-full items-center justify-between gap-1.5 rounded-md bg-subtle px-3 text-md text-foreground transition-colors hover:bg-subtle/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-surface"
                contentClassName="bg-surface rounded-md shadow-lg overflow-hidden min-w-[180px] max-h-[300px] overflow-y-auto z-[100]"
                itemClassName="flex items-center gap-2 px-3 py-2 text-md text-foreground transition-colors hover:bg-subtle outline-none data-[highlighted]:bg-subtle"
              />
            </div>
          </>
        )}

        {showPageSelector && (
          <>
            <span className="text-placeholder">/</span>
            <div className="relative w-[180px] -translate-y-[1px]">
              <Dropdown
                selected={availablePages[selectedPageIndex]?.id || availablePages[0]?.id}
                items={availablePages.map((page) => ({
                  value: page.id,
                  label: page.slug.length > 9 ? `${page.slug.slice(0, 9)}…` : page.slug
                }))}
                onSelect={(id) => {
                  const index = availablePages.findIndex((p) => p.id === id)
                  if (index !== -1) setSelectedPageIndex(index)
                }}
                triggerClassName="flex h-[38px] w-full items-center justify-between gap-1.5 rounded-md bg-subtle px-3 text-md text-foreground transition-colors hover:bg-subtle/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-surface"
                contentClassName="bg-surface rounded-md shadow-lg overflow-hidden min-w-[180px] max-h-[300px] overflow-y-auto z-[100]"
                itemClassName="flex items-center gap-2 px-3 py-2 text-md text-foreground transition-colors hover:bg-subtle outline-none data-[highlighted]:bg-subtle"
              />
            </div>
          </>
        )}

        {showGhostPlaceholder && (
          <>
            <span className="text-placeholder">/</span>
            <div className="relative w-[180px] -translate-y-[1px]">
              <button
                type="button"
                disabled
                className="flex h-[38px] w-full items-center justify-between gap-1.5 rounded-md bg-subtle px-3 text-md text-placeholder cursor-not-allowed"
                aria-label="Select Ghost content (enabled on Post/Page)"
              >
                <span className="truncate">…</span>
              </button>
            </div>
          </>
        )}

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

        <div className="hidden md:block relative w-[80px]">
          <Dropdown
            selected={previewZoom}
            items={zoomOptions.map((zoom) => ({
              value: zoom,
              label: `${zoom}%`,
            }))}
            onSelect={setPreviewZoom}
            triggerClassName="flex h-[30px] w-full items-center justify-center gap-1.5 rounded-md bg-subtle px-3 text-md text-foreground transition-colors hover:bg-subtle/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-surface tabular-nums"
            contentClassName="bg-surface rounded-md shadow-lg overflow-hidden min-w-[80px] z-[100]"
            itemClassName="flex items-center justify-end gap-2 px-3 py-2 text-md text-foreground transition-colors hover:bg-subtle outline-none data-[highlighted]:bg-subtle tabular-nums"
          />
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        <DropdownMenu.Root>
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
                  onSelect={openResetDialog}
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
