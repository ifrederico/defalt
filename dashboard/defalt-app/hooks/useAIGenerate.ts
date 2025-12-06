import { useState, useCallback, useRef } from 'react'
import {
  generateSection,
  generateSectionStream,
  isAIEnabled,
  type GeneratedSection,
  type GenerateRequest
} from '@defalt/utils/api/aiService'
import { logError } from '@defalt/utils/logging/errorLogger'

export type AIModel = 'haiku' | 'sonnet' | 'opus'

export type UseAIGenerateParams = {
  showToast?: (title: string, description?: string, type?: 'success' | 'error' | 'info') => void
}

export type GenerationState = {
  isGenerating: boolean
  isStreaming: boolean
  streamedContent: string
  generatedSection: GeneratedSection | null
  error: string | null
}

export function useAIGenerate({ showToast }: UseAIGenerateParams = {}) {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    isStreaming: false,
    streamedContent: '',
    generatedSection: null,
    error: null
  })

  const abortRef = useRef(false)

  const aiEnabled = isAIEnabled()

  const reset = useCallback(() => {
    abortRef.current = true
    setState({
      isGenerating: false,
      isStreaming: false,
      streamedContent: '',
      generatedSection: null,
      error: null
    })
  }, [])

  const generate = useCallback(async (
    prompt: string,
    options: { model?: AIModel; stream?: boolean; context?: GenerateRequest['context'] } = {}
  ) => {
    if (!aiEnabled) {
      setState(prev => ({ ...prev, error: 'AI service not configured' }))
      return null
    }

    if (!prompt.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a prompt' }))
      return null
    }

    abortRef.current = false

    setState({
      isGenerating: true,
      isStreaming: options.stream ?? false,
      streamedContent: '',
      generatedSection: null,
      error: null
    })

    const request: GenerateRequest = {
      prompt: prompt.trim(),
      model: options.model ?? 'sonnet',
      context: options.context
    }

    try {
      if (options.stream) {
        // Streaming mode
        await generateSectionStream(request, {
          onToken: (token) => {
            if (abortRef.current) return
            setState(prev => ({
              ...prev,
              streamedContent: prev.streamedContent + token
            }))
          },
          onSection: (section) => {
            if (abortRef.current) return
            setState(prev => ({
              ...prev,
              generatedSection: section,
              isGenerating: false,
              isStreaming: false
            }))
            showToast?.('Section generated', section.name, 'success')
          },
          onError: (error) => {
            if (abortRef.current) return
            setState(prev => ({
              ...prev,
              error,
              isGenerating: false,
              isStreaming: false
            }))
            showToast?.('Generation failed', error, 'error')
          },
          onComplete: () => {
            if (abortRef.current) return
            setState(prev => ({
              ...prev,
              isGenerating: false,
              isStreaming: false
            }))
          }
        })
        return null // Streaming handles state internally
      } else {
        // Non-streaming mode
        const response = await generateSection(request)

        if (abortRef.current) return null

        if (!response.success || !response.section) {
          const errorMsg = response.error ?? 'Generation failed'
          setState(prev => ({
            ...prev,
            error: errorMsg,
            isGenerating: false
          }))
          showToast?.('Generation failed', errorMsg, 'error')
          return null
        }

        setState(prev => ({
          ...prev,
          generatedSection: response.section ?? null,
          isGenerating: false
        }))

        showToast?.('Section generated', response.section.name, 'success')
        return response.section
      }
    } catch (err) {
      if (abortRef.current) return null

      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      logError(err, { scope: 'useAIGenerate.generate' })

      setState(prev => ({
        ...prev,
        error: errorMsg,
        isGenerating: false,
        isStreaming: false
      }))

      showToast?.('Generation failed', errorMsg, 'error')
      return null
    }
  }, [aiEnabled, showToast])

  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      showToast?.('Copied to clipboard', undefined, 'success')
      return true
    } catch (err) {
      logError(err, { scope: 'useAIGenerate.copyToClipboard' })
      showToast?.('Copy failed', 'Could not copy to clipboard', 'error')
      return false
    }
  }, [showToast])

  const copyTemplate = useCallback(() => {
    if (state.generatedSection?.template) {
      return copyToClipboard(state.generatedSection.template)
    }
    return Promise.resolve(false)
  }, [state.generatedSection, copyToClipboard])

  const copyCSS = useCallback(() => {
    if (state.generatedSection?.css) {
      return copyToClipboard(state.generatedSection.css)
    }
    return Promise.resolve(false)
  }, [state.generatedSection, copyToClipboard])

  const copyAll = useCallback(() => {
    if (!state.generatedSection) return Promise.resolve(false)

    const { template, css, name } = state.generatedSection
    const combined = `{{!-- ${name} --}}
${template}

<style>
${css}
</style>`

    return copyToClipboard(combined)
  }, [state.generatedSection, copyToClipboard])

  return {
    // State
    ...state,
    aiEnabled,

    // Actions
    generate,
    reset,
    copyTemplate,
    copyCSS,
    copyAll,
    copyToClipboard
  }
}
