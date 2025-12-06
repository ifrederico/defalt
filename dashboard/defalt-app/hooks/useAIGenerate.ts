import { useState, useCallback, useRef, useEffect } from 'react'
import {
  generateSection,
  generateSectionStream,
  isAIEnabled,
  getUsage,
  getAISettings,
  saveApiKey,
  removeApiKey,
  validateApiKey,
  type GeneratedSection,
  type GenerateRequest,
  type AIUsage,
  type AISettings
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
  errorCode?: 'LIMIT_EXCEEDED' | 'INVALID_API_KEY' | 'GENERATION_FAILED'
}

export type UsageState = {
  isLoading: boolean
  usage: AIUsage | null
  settings: AISettings | null
}

export function useAIGenerate({ showToast }: UseAIGenerateParams = {}) {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    isStreaming: false,
    streamedContent: '',
    generatedSection: null,
    error: null
  })

  const [usageState, setUsageState] = useState<UsageState>({
    isLoading: true,
    usage: null,
    settings: null
  })

  const [isSavingKey, setIsSavingKey] = useState(false)

  const abortRef = useRef(false)

  const aiEnabled = isAIEnabled()

  // Fetch usage and settings on mount
  useEffect(() => {
    if (!aiEnabled) {
      setUsageState({ isLoading: false, usage: null, settings: null })
      return
    }

    const fetchData = async () => {
      setUsageState(prev => ({ ...prev, isLoading: true }))
      const [usage, settings] = await Promise.all([getUsage(), getAISettings()])
      setUsageState({ isLoading: false, usage, settings })
    }

    void fetchData()
  }, [aiEnabled])

  const refreshUsage = useCallback(async () => {
    if (!aiEnabled) return
    const [usage, settings] = await Promise.all([getUsage(), getAISettings()])
    setUsageState({ isLoading: false, usage, settings })
  }, [aiEnabled])

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

    // Check usage limits (unless user has own key)
    if (usageState.usage && !usageState.usage.hasOwnKey && usageState.usage.remaining <= 0) {
      setState(prev => ({
        ...prev,
        error: 'Monthly generation limit reached. Add your own API key for unlimited generations.',
        errorCode: 'LIMIT_EXCEEDED'
      }))
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
            // Refresh usage after generation
            void refreshUsage()
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
            errorCode: response.errorCode,
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

        // Refresh usage after successful generation
        void refreshUsage()

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
  }, [aiEnabled, showToast, usageState.usage, refreshUsage])

  // BYOK functions
  const saveOwnApiKey = useCallback(async (apiKey: string) => {
    if (!apiKey.trim()) {
      showToast?.('Invalid API key', 'Please enter a valid API key', 'error')
      return false
    }

    setIsSavingKey(true)

    // First validate the key
    const validation = await validateApiKey(apiKey)
    if (!validation.valid) {
      setIsSavingKey(false)
      showToast?.('Invalid API key', validation.error || 'The API key is invalid', 'error')
      return false
    }

    // Then save it
    const result = await saveApiKey(apiKey)
    setIsSavingKey(false)

    if (result.success) {
      showToast?.('API key saved', 'You now have unlimited generations', 'success')
      void refreshUsage()
      return true
    } else {
      showToast?.('Failed to save API key', result.error, 'error')
      return false
    }
  }, [showToast, refreshUsage])

  const removeOwnApiKey = useCallback(async () => {
    setIsSavingKey(true)
    const result = await removeApiKey()
    setIsSavingKey(false)

    if (result.success) {
      showToast?.('API key removed', 'Using included generations', 'success')
      void refreshUsage()
      return true
    } else {
      showToast?.('Failed to remove API key', result.error, 'error')
      return false
    }
  }, [showToast, refreshUsage])

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
    // Generation state
    ...state,
    aiEnabled,

    // Usage state
    usage: usageState.usage,
    settings: usageState.settings,
    isLoadingUsage: usageState.isLoading,
    isSavingKey,

    // Actions
    generate,
    reset,
    refreshUsage,
    copyTemplate,
    copyCSS,
    copyAll,
    copyToClipboard,

    // BYOK actions
    saveOwnApiKey,
    removeOwnApiKey
  }
}
