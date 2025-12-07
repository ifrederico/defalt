import { useState, useCallback, useRef, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Sparkles, Copy, Check, Loader2, X, Code, Key, Infinity, Trash2, ExternalLink, ChevronLeft, Brain, ArrowUp } from 'lucide-react'
import { AppButton, Spinner, FloatingTooltip } from '@defalt/ui'
import { useAIGenerate, type AIModel } from '../../hooks/useAIGenerate'
import { useToast } from '../../components/ToastContext'
import { useWorkspaceContext } from '../../contexts/useWorkspaceContext'
import { useUIActions } from '../../stores'

const SECTION_PADDING = 'px-4 py-4'
const MODEL_OPTIONS: { value: AIModel; label: string; description: string }[] = [
  { value: 'haiku', label: 'Haiku', description: 'Fast & affordable' },
  { value: 'sonnet', label: 'Sonnet', description: 'Balanced' },
  { value: 'opus', label: 'Opus', description: 'Most capable' },
]

const EXAMPLE_PROMPTS = [
  'Hero section with gradient background and CTA button',
  'Testimonials grid with star ratings',
  'FAQ accordion with smooth animations',
  'Newsletter signup with email validation',
  'Feature cards with icons',
  'Pricing table with 3 tiers',
]

export function AIPanel() {
  const { showToast } = useToast()
  const { addAiSection } = useWorkspaceContext()
  const { setActiveTab } = useUIActions()
  const {
    aiEnabled,
    isGenerating,
    generatedSection,
    error,
    errorCode,
    usage,
    settings,
    isLoadingUsage,
    isSavingKey,
    generate,
    reset,
    copyTemplate,
    copyCSS,
    copyAll,
    saveOwnApiKey,
    removeOwnApiKey
  } = useAIGenerate({ showToast })

  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState<AIModel>('sonnet')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [combinedSnippet, setCombinedSnippet] = useState<string>('')
  const lastInsertedIdRef = useRef<string | null>(null)

  const slugify = useCallback(
    (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'ai-section',
    []
  )

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [prompt])

  const handleGenerate = useCallback(() => {
    void generate(prompt, { model })
  }, [generate, prompt, model])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleGenerate()
    }
  }, [handleGenerate])

  const handleCopy = useCallback(async (field: 'template' | 'css' | 'all') => {
    const copyFn = field === 'template' ? copyTemplate : field === 'css' ? copyCSS : copyAll
    const success = await copyFn()
    if (success) {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }, [copyTemplate, copyCSS, copyAll])

  const handleExampleClick = useCallback((example: string) => {
    setPrompt(example)
    textareaRef.current?.focus()
  }, [])

  const handleSaveApiKey = useCallback(async () => {
    const success = await saveOwnApiKey(apiKeyInput)
    if (success) {
      setApiKeyInput('')
      setApiKeyModalOpen(false)
    }
  }, [saveOwnApiKey, apiKeyInput])

  const handleRemoveApiKey = useCallback(async () => {
    await removeOwnApiKey()
  }, [removeOwnApiKey])

  useEffect(() => {
    if (!generatedSection || isGenerating) return
    const slug = slugify(generatedSection.id || generatedSection.name || 'ai-section')
    const html = `{{!-- ${generatedSection.name || 'AI Section'} --}}
<section data-section-id="${slug}" class="ai-generated-section">
  <style>
${generatedSection.css || ''}
  </style>
  ${generatedSection.template || ''}
</section>`

    setCombinedSnippet(html)

    // Avoid duplicate insertions
    if (lastInsertedIdRef.current !== slug) {
      addAiSection({ id: slug, name: generatedSection.name || 'AI Section', html })
      lastInsertedIdRef.current = slug
    }
  }, [generatedSection, isGenerating, addAiSection, slugify])

  if (!aiEnabled) {
    return (
      <div className={`${SECTION_PADDING} flex flex-col items-center justify-center h-full text-center`}>
        <div className="w-12 h-12 rounded-full bg-subtle flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-muted" />
        </div>
        <h3 className="font-md font-semibold text-foreground mb-1">AI Not Configured</h3>
        <p className="font-sm text-muted mb-4">
          Set VITE_AI_SERVICE_URL in your environment to enable AI section generation.
        </p>
      </div>
    )
  }

  const hasOwnKey = usage?.hasOwnKey || settings?.hasApiKey
  const isLimitReached = usage && !hasOwnKey && usage.remaining <= 0
  const usagePercent = usage ? Math.min((usage.used / usage.limit) * 100, 100) : 0
  const debugUsagePercent = 60 // TODO: remove - debug to show bar fill

  return (
    <div className="flex flex-col h-full">
      {/* Header with AI gradient */}
      <div className="shrink-0 border-b border-border">
        <header className="flex h-12 items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className="inline-flex items-center gap-2 font-md font-bold transition-colors hover:opacity-80"
          >
            <ChevronLeft size={16} className="text-muted" />
            <span>Generate block</span>
          </button>

          <div className="flex items-center gap-1">
            {/* Model Selector */}
            <DropdownMenu.Root>
              <FloatingTooltip content={`Model: ${MODEL_OPTIONS.find(m => m.value === model)?.label}`}>
                <DropdownMenu.Trigger asChild disabled={isGenerating}>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-colors focus:outline-none bg-surface hover:bg-subtle text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Select AI model"
                  >
                    <Brain size={16} strokeWidth={1.5} />
                  </button>
                </DropdownMenu.Trigger>
              </FloatingTooltip>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[120px] bg-surface border border-border rounded-md shadow-lg p-1 z-50"
                  sideOffset={4}
                  align="end"
                >
                  {MODEL_OPTIONS.map((option) => (
                    <DropdownMenu.Item
                      key={option.value}
                      className="flex items-center justify-between px-3 py-2 font-sm text-foreground rounded hover:bg-subtle cursor-pointer outline-none"
                      onSelect={() => setModel(option.value)}
                    >
                      <span>{option.label}</span>
                      {model === option.value && <Check className="w-4 h-4 text-primary" />}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            {/* API Key Modal */}
            <Dialog.Root open={isApiKeyModalOpen} onOpenChange={setApiKeyModalOpen}>
              <FloatingTooltip content={hasOwnKey ? 'API key configured' : 'Configure API key'}>
                <Dialog.Trigger asChild>
                  <button
                    type="button"
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors focus:outline-none ${
                      isApiKeyModalOpen ? 'bg-subtle' : 'bg-surface hover:bg-subtle'
                    } ${hasOwnKey ? 'text-success' : 'text-muted'}`}
                    aria-label="API key settings"
                  >
                    <Key size={16} strokeWidth={1.5} />
                  </button>
                </Dialog.Trigger>
              </FloatingTooltip>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-gradient-to-br from-black/20 to-black/10 backdrop-blur-[2px] data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut" />
              <Dialog.Content className="fixed left-1/2 top-[10%] z-50 w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg bg-surface shadow-xl focus:outline-none data-[state=open]:animate-contentShow">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <Dialog.Title className="text-lg font-semibold text-foreground">
                    API Key Settings
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Configure your Anthropic API key for unlimited AI generations
                  </Dialog.Description>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-md flex items-center justify-center text-secondary hover:bg-subtle transition-colors"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>
                <div className="p-6 space-y-4">
                  {hasOwnKey ? (
                    <>
                      <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-md">
                        <Infinity className="w-5 h-5 text-success" />
                        <div>
                          <p className="font-sm font-medium text-foreground">Unlimited generations</p>
                          <p className="font-xs text-muted">Your API key is configured and active</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveApiKey}
                        disabled={isSavingKey}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-error hover:bg-error/10 font-sm rounded-md transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove API key
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-sm text-muted">
                        Add your Anthropic API key for unlimited generations. Your key is encrypted and stored securely.
                      </p>
                      <div className="space-y-3">
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder="sk-ant-..."
                          className="w-full px-3 py-2 bg-subtle border border-border rounded-md font-sm text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                        <AppButton
                          variant="primary"
                          onClick={handleSaveApiKey}
                          disabled={isSavingKey || !apiKeyInput.trim()}
                          state={isSavingKey ? 'loading' : 'default'}
                          className="w-full"
                        >
                          {isSavingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save API Key'}
                        </AppButton>
                      </div>
                      <a
                        href="https://console.anthropic.com/account/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-xs text-primary hover:underline"
                      >
                        Get an API key from Anthropic
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          </div>
        </header>
      </div>

      {/* Usage Bar */}
      {!isLoadingUsage && usage && (
        <div className={`${SECTION_PADDING} border-b border-border bg-subtle/30`}>
          {hasOwnKey ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Infinity className="w-4 h-4 text-success" />
                <span className="font-sm text-foreground">Unlimited generations</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveApiKey}
                disabled={isSavingKey}
                className="flex items-center gap-1 px-2 py-1 text-muted hover:text-error font-xs rounded-md hover:bg-error/10 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                Remove key
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-sm text-foreground">
                  {usage.used}/{usage.limit} generations
                </span>
                <span className="font-xs text-muted">
                  Resets {new Date(usage.resetDate).toLocaleDateString()}
                </span>
              </div>
              <div className="h-2 bg-hover rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${debugUsagePercent}%`,
                    background: isLimitReached
                      ? 'var(--color-error)'
                      : 'linear-gradient(90deg, rgba(247, 110, 133, 0.75), rgba(139, 16, 214, 0.75))'
                  }}
                />
              </div>
              {isLimitReached && (
                <p className="font-xs text-error">
                  Monthly limit reached. Add your own API key for unlimited generations.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Prompt Input */}
      <div className={SECTION_PADDING}>
        <div className="space-y-3">
          <div
            className="rounded-lg p-[1px]"
            style={{
              background: 'linear-gradient(135deg, #a0cbff, #c6adff, #f4c2ff, #ffd8b7)',
              boxShadow: '0 0 4px 0px rgba(160, 203, 255, 0.4), 0 0 8px 1px rgba(198, 173, 255, 0.3), 0 0 12px 2px rgba(244, 194, 255, 0.2)',
            }}
          >
            <div className="relative bg-white rounded-[7px]">
              <textarea
                ref={textareaRef}
                id="ai-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the section you want to build"
                className="w-full min-h-[100px] max-h-[200px] px-3 py-2 pr-12 bg-transparent rounded-[7px] text-foreground placeholder:text-placeholder resize-none focus:outline-none disabled:opacity-50"
                disabled={isGenerating || isLimitReached}
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || isLimitReached}
                className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-hover text-foreground flex items-center justify-center transition-all hover:bg-border-strong disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Generate"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Example Prompts (when no section generated) */}
      {!generatedSection && !isGenerating && !isLimitReached && (
        <div className={SECTION_PADDING}>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.slice(0, 3).map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="px-2 py-1 bg-subtle hover:bg-hover text-muted hover:text-foreground font-xs rounded-md transition-colors text-left"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={`${SECTION_PADDING} border-t border-border`}>
          <div className="flex items-start gap-2 p-3 bg-error/10 border border-error/20 rounded-md">
            <X className="w-4 h-4 text-error shrink-0 mt-0.5" />
            <div>
              <p className="font-sm font-medium text-error">
                {errorCode === 'LIMIT_EXCEEDED' ? 'Generation limit reached' : 'Generation failed'}
              </p>
              <p className="font-xs text-error/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className={`${SECTION_PADDING} border-t border-border flex-1 flex items-center justify-center`}>
          <div className="text-center">
            <Spinner className="w-8 h-8 mx-auto mb-3" />
            <p className="font-sm text-muted">Generating your section...</p>
            <p className="font-xs text-placeholder mt-1">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* Generated Section Display */}
      {generatedSection && !isGenerating && (
        <div className="flex-1 flex flex-col border-t border-border overflow-hidden">
          {/* Section Info */}
          <div className={`${SECTION_PADDING} border-b border-border bg-subtle/50`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-sm font-semibold text-foreground">{generatedSection.name}</h3>
                <p className="font-xs text-muted">{generatedSection.description}</p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="p-1.5 hover:bg-hover rounded-md transition-colors"
                title="Clear and start over"
              >
                <X className="w-4 h-4 text-muted" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div
              className="relative rounded-xl p-[1px]"
              style={{
                background: 'linear-gradient(135deg, var(--sidekick-field-glow-color-1, #a0cbff), var(--sidekick-field-glow-color-2, #c6adff), var(--sidekick-field-glow-color-3, #f4c2ff), var(--sidekick-field-glow-color-4, #ffd8b7))',
                boxShadow: '0 10px 50px rgba(160,203,255,0.35)',
              }}
            >
              <div className="rounded-[12px] bg-surface/90 backdrop-blur p-4 shadow-sm border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-primary" />
                    <span className="font-sm text-foreground">Combined snippet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-xs text-success">Added to preview</span>
                    <CopyButton onClick={() => handleCopy('all')} copied={copiedField === 'all'} />
                  </div>
                </div>
                <pre className="font-mono font-xs text-foreground whitespace-pre-wrap break-words bg-subtle/60 rounded-md p-3 border border-border/50">
{combinedSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type CopyButtonProps = {
  onClick: () => void
  copied: boolean
}

function CopyButton({ onClick, copied }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-2 right-2 p-1.5 bg-surface border border-border rounded-md hover:bg-subtle transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted" />
      )}
    </button>
  )
}
