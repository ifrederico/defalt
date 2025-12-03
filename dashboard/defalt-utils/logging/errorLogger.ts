type ErrorLike = unknown

const resolveError = (error: ErrorLike): Error => {
  if (error instanceof Error) {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message?: unknown }).message ?? 'Unknown error'))
  }
  if (typeof error === 'string') {
    return new Error(error)
  }
  return new Error(String(error ?? 'Unknown error'))
}

const withContext = (context?: Record<string, unknown>) => ({
  ...context,
  timestamp: new Date().toISOString(),
  ...(typeof window !== 'undefined' ? { page: window.location.pathname } : {})
})

export function logError(error: ErrorLike, context?: Record<string, unknown>) {
  const normalized = resolveError(error)
  console.error('[ERROR]', normalized.message, {
    stack: normalized.stack,
    ...withContext(context)
  })
}

export function logWarning(message: string, context?: Record<string, unknown>) {
  console.warn('[WARN]', message, withContext(context))
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  console.info('[INFO]', message, withContext(context))
}

type ImportMetaWithEnv = {
  env?: { MODE?: string; DEV?: boolean }
}

export function logDebug(message: string, context?: Record<string, unknown>) {
  const meta = import.meta as ImportMetaWithEnv
  // In Vite, import.meta.env.DEV is true in development mode
  if (meta.env?.DEV === false || meta.env?.MODE === 'production') {
    return
  }
  console.debug('[DEBUG]', message, withContext(context))
}
