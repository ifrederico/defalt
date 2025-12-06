/**
 * AI Section Generator Service Client
 *
 * This client communicates with the external AI service (defalt-ai)
 * to generate Ghost Handlebars sections from natural language prompts.
 *
 * The AI service is optional - if VITE_AI_SERVICE_URL is not set,
 * isAIEnabled() returns false and the AI features are hidden.
 */

export type GeneratedSection = {
  id: string
  name: string
  description: string
  template: string      // Handlebars template code
  css: string          // CSS styles for the section
  settings?: {         // Optional settings schema
    key: string
    type: 'text' | 'color' | 'toggle' | 'select' | 'number'
    label: string
    default: unknown
    options?: { value: string; label: string }[]
  }[]
  defaultData?: Record<string, unknown>
}

export type GenerateRequest = {
  prompt: string
  model?: 'haiku' | 'sonnet' | 'opus'
  context?: {
    currentPage?: string
    existingSections?: string[]
  }
}

export type GenerateResponse = {
  success: boolean
  section?: GeneratedSection
  error?: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export type StreamCallbacks = {
  onToken?: (token: string) => void
  onSection?: (section: GeneratedSection) => void
  onError?: (error: string) => void
  onComplete?: () => void
}

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL as string | undefined
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY as string | undefined

/**
 * Check if AI features are enabled (service URL is configured)
 */
export function isAIEnabled(): boolean {
  return Boolean(AI_SERVICE_URL)
}

/**
 * Generate a section from a natural language prompt
 */
export async function generateSection(
  request: GenerateRequest
): Promise<GenerateResponse> {
  if (!AI_SERVICE_URL) {
    return {
      success: false,
      error: 'AI service not configured'
    }
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/generate-section`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AI_API_KEY && { 'Authorization': `Bearer ${AI_API_KEY}` })
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.text()
      return {
        success: false,
        error: error || `HTTP ${response.status}`
      }
    }

    const data = await response.json() as GenerateResponse
    return data
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }
  }
}

/**
 * Generate a section with streaming response
 * Allows showing partial results as they're generated
 */
export async function generateSectionStream(
  request: GenerateRequest,
  callbacks: StreamCallbacks
): Promise<void> {
  if (!AI_SERVICE_URL) {
    callbacks.onError?.('AI service not configured')
    return
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/generate-section/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AI_API_KEY && { 'Authorization': `Bearer ${AI_API_KEY}` })
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.text()
      callbacks.onError?.(error || `HTTP ${response.status}`)
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      callbacks.onError?.('No response body')
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE events
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            callbacks.onComplete?.()
            return
          }
          try {
            const parsed = JSON.parse(data) as { type: string; content?: string; section?: GeneratedSection; error?: string }
            if (parsed.type === 'token' && parsed.content) {
              callbacks.onToken?.(parsed.content)
            } else if (parsed.type === 'section' && parsed.section) {
              callbacks.onSection?.(parsed.section)
            } else if (parsed.type === 'error' && parsed.error) {
              callbacks.onError?.(parsed.error)
            }
          } catch {
            // Ignore parse errors for partial data
          }
        }
      }
    }

    callbacks.onComplete?.()
  } catch (err) {
    callbacks.onError?.(err instanceof Error ? err.message : 'Unknown error')
  }
}

/**
 * Validate a generated section's Handlebars template
 */
export async function validateSection(
  template: string
): Promise<{ valid: boolean; errors?: string[] }> {
  if (!AI_SERVICE_URL) {
    return { valid: false, errors: ['AI service not configured'] }
  }

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/validate-section`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(AI_API_KEY && { 'Authorization': `Bearer ${AI_API_KEY}` })
      },
      body: JSON.stringify({ template })
    })

    if (!response.ok) {
      return { valid: false, errors: ['Validation request failed'] }
    }

    return await response.json()
  } catch (err) {
    return {
      valid: false,
      errors: [err instanceof Error ? err.message : 'Unknown error']
    }
  }
}
