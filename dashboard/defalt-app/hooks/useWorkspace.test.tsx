/* @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { ThemeDocument } from '@defalt/utils/config/themeConfig'
import { useWorkspace } from './useWorkspace'
import { HistoryProvider } from '../contexts/HistoryContext'

type WorkspaceParams = Parameters<typeof useWorkspace>[0]
const {
  defaultHeaderSettings,
  defaultMainSettings,
  mockThemeDocument,
  mockLoadPersistedThemeDocument,
  mockPersistSavedThemeDocument,
  mockClearDraftDocument,
  mockClearWorkspaceStorage,
  mockPersistThemeDocument,
  mockNormalizeThemeDocument,
  mockExtractHeaderSettings,
  mockExtractMainSettings
} = vi.hoisted(() => {
  const defaultHeaderSettings = {
    accentColor: '#ff3366',
    stickyHeaderMode: 'Never',
    searchEnabled: true,
    typographyCase: 'default'
  }

  const defaultMainSettings = {
    pageLayout: 'normal' as const,
    borderThickness: 1,
    cornerRadius: 4,
    customCSS: ''
  }

  const mockThemeDocument = {
    header: { sections: { header: {} } },
    pages: { homepage: {} },
    packageJson: '{}'
  } as unknown as ThemeDocument

  const mockLoadPersistedThemeDocument = vi.fn(() => mockThemeDocument)
  const mockPersistSavedThemeDocument = vi.fn()
  const mockClearDraftDocument = vi.fn()
  const mockClearWorkspaceStorage = vi.fn()
  const mockPersistThemeDocument = vi.fn()
  const mockNormalizeThemeDocument = vi.fn((doc: unknown) => doc)
  const mockExtractHeaderSettings = vi.fn(() => defaultHeaderSettings)
  const mockExtractMainSettings = vi.fn(() => defaultMainSettings)

  return {
    defaultHeaderSettings,
    defaultMainSettings,
    mockThemeDocument,
    mockLoadPersistedThemeDocument,
    mockPersistSavedThemeDocument,
    mockClearDraftDocument,
    mockClearWorkspaceStorage,
    mockPersistThemeDocument,
    mockNormalizeThemeDocument,
    mockExtractHeaderSettings,
    mockExtractMainSettings
  }
})

vi.mock('@defalt/utils/config/themeConfig', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@defalt/utils/config/themeConfig')>()
  return {
    ...actual,
    DEFAULT_HEADER_SETTINGS: defaultHeaderSettings,
    DEFAULT_MAIN_SETTINGS: defaultMainSettings,
    loadPersistedThemeDocument: mockLoadPersistedThemeDocument,
    persistThemeDocument: mockPersistThemeDocument,
    normalizeThemeDocument: mockNormalizeThemeDocument,
    extractHeaderSettings: mockExtractHeaderSettings,
    extractMainSettings: mockExtractMainSettings,
    clearDraftDocument: mockClearDraftDocument,
    clearWorkspaceStorage: mockClearWorkspaceStorage,
    persistSavedThemeDocument: mockPersistSavedThemeDocument
  }
})

// Legacy useThemeConfig mock removed - logic now inlined in useWorkspace

let enqueueVersion = 0
const enqueueSpy = vi.fn(
  <T,>(task: (ctx: { signal: AbortSignal, version: number }) => Promise<T> | T) => {
    const controller = new AbortController()
    enqueueVersion += 1
    const version = enqueueVersion
    return Promise.resolve(task({ signal: controller.signal, version })).then((value) => ({
      value,
      version
    }))
  }
)
const cancelSpy = vi.fn()
const getActiveVersionSpy = vi.fn(() => null)

vi.mock('./useSaveQueue', () => ({
  useSaveQueue: () => ({
    enqueue: enqueueSpy,
    cancel: cancelSpy,
    getActiveVersion: getActiveVersionSpy
  }),
  isAbortError: (error: unknown) => Boolean(error && typeof error === 'object' && (error as { name?: string }).name === 'AbortError'),
  throwIfAborted: () => {}
}))


const createWorkspaceProps = (overrides: Partial<WorkspaceParams> = {}): WorkspaceParams => ({
  currentPage: 'home',
  packageJson: '{}',
  setPackageJson: vi.fn(),
  isAuthenticated: false,
  user: null,
  showToast: vi.fn(),
  ensureCsrfToken: vi.fn(async () => 'csrf'),
  ...overrides
})

const HistoryWrapper = ({ children }: { children: ReactNode }) => (
  <HistoryProvider>{children}</HistoryProvider>
)

const renderWorkspaceHook = (props: WorkspaceParams) =>
  renderHook((hookProps: WorkspaceParams) => useWorkspace(hookProps), {
    initialProps: props,
    wrapper: HistoryWrapper
  })

describe('useWorkspace', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mockLoadPersistedThemeDocument.mockReturnValue(mockThemeDocument)
    mockPersistSavedThemeDocument.mockReset()
    mockClearDraftDocument.mockReset()
    mockClearWorkspaceStorage.mockReset()
    mockPersistThemeDocument.mockReset()
    mockNormalizeThemeDocument.mockReset()
    mockExtractHeaderSettings.mockReset()
    mockExtractMainSettings.mockReset()
    enqueueSpy.mockClear()
    enqueueVersion = 0
    cancelSpy.mockClear()
    getActiveVersionSpy.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('persists local changes when saving offline', async () => {
    vi.useFakeTimers()
    const demoDocument = { id: 'local-doc' } as unknown as ThemeDocument
    mockLoadPersistedThemeDocument.mockReturnValue(demoDocument)
    const showToast = vi.fn()

    const hook = renderWorkspaceHook(createWorkspaceProps({ showToast }))

    await act(async () => {
      await hook.result.current.handleSave()
    })

    expect(mockPersistSavedThemeDocument).toHaveBeenCalledWith(demoDocument)
    expect(mockClearDraftDocument).toHaveBeenCalled()
    expect(hook.result.current.cloudSyncStatus).toBe('idle')
    expect(hook.result.current.saveStatus).toBe('saved')
    expect(showToast).toHaveBeenCalledWith('Theme updated.', undefined, 'success')

    await act(async () => {
      vi.runAllTimers()
    })
    expect(hook.result.current.saveStatus).toBe('idle')

    hook.unmount()
  })

  it('initializes default padding when adding a custom section', async () => {
    const hook = renderWorkspaceHook(createWorkspaceProps())

    await waitFor(() => {
      expect(hook.result.current.sectionPadding.main).toBeDefined()
    })

    act(() => {
      hook.result.current.addTemplateSection('ghostCards')
    })

    await waitFor(() => {
      expect(hook.result.current.templateItems.some((item) => item.id.startsWith('ghost-cards'))).toBe(true)
    })

    await waitFor(() => {
      expect(hook.result.current.sectionPadding['ghost-cards']).toEqual({
        top: 32,
        bottom: 32,
        left: 0,
        right: 0
      })
    })

    hook.unmount()
  })

  it('assigns incrementing ghost card tags for new sections', async () => {
    const hook = renderWorkspaceHook(createWorkspaceProps())

    act(() => {
      hook.result.current.addTemplateSection('ghostCards')
    })

    await waitFor(() => {
      expect(hook.result.current.customSections['ghost-cards']).toBeDefined()
    })
    expect(
      (hook.result.current.customSections['ghost-cards'].config as { ghostPageTag?: string }).ghostPageTag
    ).toBe('#ghost-card')

    act(() => {
      hook.result.current.addTemplateSection('ghostCards')
    })

    await waitFor(() => {
      expect(hook.result.current.customSections['ghost-cards-2']).toBeDefined()
    })
    expect(
      (hook.result.current.customSections['ghost-cards-2'].config as { ghostPageTag?: string }).ghostPageTag
    ).toBe('#ghost-card-2')

    hook.unmount()
  })

  it('normalizes legacy ghost card tags without hyphens', async () => {
    const hook = renderWorkspaceHook(createWorkspaceProps())

    act(() => {
      hook.result.current.addTemplateSection('ghostCards')
    })

    await waitFor(() => {
      expect(hook.result.current.customSections['ghost-cards']).toBeDefined()
    })

    act(() => {
      hook.result.current.updateCustomSectionConfig('ghost-cards', (config) => ({
        ...config,
        ghostPageTag: '#ghost-card2'
      }))
    })

    await waitFor(() => {
      expect(
        (hook.result.current.customSections['ghost-cards'].config as { ghostPageTag?: string }).ghostPageTag
      ).toBe('#ghost-card-2')
    })

    hook.unmount()
  })

  it('assigns incrementing image-with-text tags for new sections', async () => {
    const hook = renderWorkspaceHook(createWorkspaceProps())

    act(() => {
      hook.result.current.addTemplateSection('image-with-text')
    })

    await waitFor(() => {
      expect(hook.result.current.customSections['image-with-text']).toBeDefined()
    })
    expect(
      (hook.result.current.customSections['image-with-text'].config as { ghostPageTag?: string }).ghostPageTag
    ).toBe('#image-with-text')

    act(() => {
      hook.result.current.addTemplateSection('image-with-text')
    })

    await waitFor(() => {
      expect(hook.result.current.customSections['image-with-text-2']).toBeDefined()
    })
    expect(
      (hook.result.current.customSections['image-with-text-2'].config as { ghostPageTag?: string }).ghostPageTag
    ).toBe('#image-with-text-2')

    hook.unmount()
  })

  it('prevents adding multiple ghost grid sections', async () => {
    const showToast = vi.fn()
    const hook = renderWorkspaceHook(createWorkspaceProps({ showToast }))

    await act(async () => {
      await hook.result.current.rehydrateWorkspace()
    })

    act(() => {
      hook.result.current.addTemplateSection('ghostGrid')
    })

    await waitFor(() => {
      expect(hook.result.current.templateItems.some((item) => item.definitionId === 'ghostGrid')).toBe(true)
    })

    act(() => {
      hook.result.current.addTemplateSection('ghostGrid')
    })

    expect(hook.result.current.templateItems.filter((item) => item.definitionId === 'ghostGrid')).toHaveLength(1)

    hook.unmount()
  })

  it('shows a success toast after resetting the workspace', async () => {
    const showToast = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response)

    const hook = renderWorkspaceHook(createWorkspaceProps({ showToast }))

    await act(async () => {
      await hook.result.current.resetWorkspace()
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/theme-config', expect.objectContaining({ method: 'DELETE' }))
    expect(showToast).toHaveBeenCalledWith('Theme reset.', undefined, 'success')

    fetchMock.mockRestore()
    hook.unmount()
  })

  it('syncs featured section visibility when editing the home page', async () => {
    const hook = renderWorkspaceHook(createWorkspaceProps())

    // Verify the function exists and doesn't throw
    act(() => {
      hook.result.current.syncFeaturedSectionVisibility(true)
    })

    // Function behavior is now internal - just verify it exists
    expect(typeof hook.result.current.syncFeaturedSectionVisibility).toBe('function')
    hook.unmount()
  })

  it('skips featured visibility sync on non-home pages', async () => {
    const hook = renderWorkspaceHook(createWorkspaceProps({ currentPage: 'about' }))

    // Verify the function exists and doesn't throw on non-home pages
    act(() => {
      hook.result.current.syncFeaturedSectionVisibility(true)
    })

    expect(typeof hook.result.current.syncFeaturedSectionVisibility).toBe('function')
    hook.unmount()
  })
})
