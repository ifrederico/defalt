import { useState, useCallback, useEffect } from 'react'
import { STORAGE_KEYS } from '@defalt/utils/constants'

export interface AiSection {
  id: string
  name: string
  html: string
}

export interface UseAiSectionsReturn {
  aiSections: AiSection[]
  addAiSection: (section: { id?: string; name: string; html: string }) => void
  removeAiSection: (id: string) => void
  renameAiSection: (id: string, newName: string) => void
  reorderAiSections: (startIndex: number, endIndex: number) => void
}

const slugify = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'ai-section'

export function useAiSections(): UseAiSectionsReturn {
  const [aiSections, setAiSections] = useState<AiSection[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AI_SECTIONS)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AI_SECTIONS, JSON.stringify(aiSections))
    } catch {
      // localStorage might be full or unavailable
    }
  }, [aiSections])

  const addAiSection = useCallback((section: { id?: string; name: string; html: string }) => {
    setAiSections((prev) => {
      const baseId = section.id ? slugify(section.id) : `ai-${slugify(section.name)}`
      const baseName = section.name
      let uniqueId = baseId
      let uniqueName = baseName
      let counter = 1
      while (prev.some((s) => s.id === uniqueId || s.name === uniqueName)) {
        uniqueId = `${baseId}-${counter}`
        uniqueName = `${baseName} (${counter})`
        counter += 1
      }
      return [...prev, { id: uniqueId, name: uniqueName, html: section.html }]
    })
  }, [])

  const removeAiSection = useCallback((id: string) => {
    setAiSections((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const renameAiSection = useCallback((id: string, newName: string) => {
    setAiSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    )
  }, [])

  const reorderAiSections = useCallback((startIndex: number, endIndex: number) => {
    setAiSections((prev) => {
      const result = Array.from(prev)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }, [])

  return {
    aiSections,
    addAiSection,
    removeAiSection,
    renameAiSection,
    reorderAiSections
  }
}
