import { useState, useCallback, useRef, useEffect } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Sparkles, Copy, Check, ChevronDown, Loader2, X, Code, Palette } from 'lucide-react'
import { AppButton, Spinner } from '@defalt/ui'
import { useAIGenerate, type AIModel } from '../../hooks/useAIGenerate'
import { useToast } from '../../components/ToastContext'

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
  const {
    aiEnabled,
    isGenerating,
    generatedSection,
    error,
    generate,
    reset,
    copyTemplate,
    copyCSS,
    copyAll
  } = useAIGenerate({ showToast })

  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState<AIModel>('sonnet')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="font-md font-semibold text-foreground">AI Section Generator</h2>
      </div>

      {/* Prompt Input */}
      <div className={SECTION_PADDING}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="ai-prompt" className="font-sm font-medium text-foreground">
              Describe your section
            </label>
            <ModelSelector value={model} onChange={setModel} disabled={isGenerating} />
          </div>

          <textarea
            ref={textareaRef}
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., A hero section with a large heading, subtitle, and two CTA buttons..."
            className="w-full min-h-[100px] max-h-[200px] px-3 py-2 bg-subtle border border-border rounded-md font-sm text-foreground placeholder:text-placeholder resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            disabled={isGenerating}
          />

          <div className="flex items-center justify-between">
            <span className="font-xs text-muted">
              {prompt.length > 0 ? `${prompt.length} characters` : 'Cmd+Enter to generate'}
            </span>
            <AppButton
              variant="primary"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              state={isGenerating ? 'loading' : 'default'}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              )}
            </AppButton>
          </div>
        </div>
      </div>

      {/* Example Prompts (when no section generated) */}
      {!generatedSection && !isGenerating && (
        <div className={`${SECTION_PADDING} border-t border-border`}>
          <p className="font-sm font-medium text-foreground mb-2">Try an example</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleExampleClick(example)}
                className="px-2 py-1 bg-subtle hover:bg-hover text-muted hover:text-foreground font-xs rounded-md transition-colors"
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
              <p className="font-sm font-medium text-error">Generation failed</p>
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

          {/* Code Tabs */}
          <Tabs.Root defaultValue="template" className="flex-1 flex flex-col overflow-hidden">
            <Tabs.List className="flex border-b border-border shrink-0">
              <Tabs.Trigger
                value="template"
                className="flex-1 px-4 py-2 font-sm text-muted data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors flex items-center justify-center gap-1.5"
              >
                <Code className="w-3.5 h-3.5" />
                Template
              </Tabs.Trigger>
              <Tabs.Trigger
                value="css"
                className="flex-1 px-4 py-2 font-sm text-muted data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary transition-colors flex items-center justify-center gap-1.5"
              >
                <Palette className="w-3.5 h-3.5" />
                CSS
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="template" className="flex-1 overflow-auto">
              <div className="relative">
                <CopyButton
                  onClick={() => handleCopy('template')}
                  copied={copiedField === 'template'}
                />
                <pre className="p-4 font-mono font-xs text-foreground whitespace-pre-wrap break-words">
                  {generatedSection.template}
                </pre>
              </div>
            </Tabs.Content>

            <Tabs.Content value="css" className="flex-1 overflow-auto">
              <div className="relative">
                <CopyButton
                  onClick={() => handleCopy('css')}
                  copied={copiedField === 'css'}
                />
                <pre className="p-4 font-mono font-xs text-foreground whitespace-pre-wrap break-words">
                  {generatedSection.css}
                </pre>
              </div>
            </Tabs.Content>
          </Tabs.Root>

          {/* Copy All Button */}
          <div className={`${SECTION_PADDING} border-t border-border bg-surface`}>
            <AppButton
              variant="secondary"
              onClick={() => handleCopy('all')}
              className="w-full gap-2"
            >
              {copiedField === 'all' ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy All Code
                </>
              )}
            </AppButton>
          </div>
        </div>
      )}
    </div>
  )
}

type ModelSelectorProps = {
  value: AIModel
  onChange: (value: AIModel) => void
  disabled?: boolean
}

function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const selected = MODEL_OPTIONS.find(m => m.value === value)

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild disabled={disabled}>
        <button
          type="button"
          className="flex items-center gap-1 px-2 py-1 text-muted hover:text-foreground font-xs rounded-md hover:bg-subtle transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selected?.label}
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[160px] bg-surface border border-border rounded-md shadow-lg p-1 z-50"
          sideOffset={4}
          align="end"
        >
          {MODEL_OPTIONS.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              className="flex items-center justify-between px-3 py-2 font-sm text-foreground rounded hover:bg-subtle cursor-pointer outline-none"
              onSelect={() => onChange(option.value)}
            >
              <div>
                <div className="font-medium">{option.label}</div>
                <div className="font-xs text-muted">{option.description}</div>
              </div>
              {value === option.value && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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
