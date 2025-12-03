import { z } from 'zod'

const sectionPaddingSchema = z.object({
  top: z.number().optional(),
  bottom: z.number().optional(),
  left: z.number().optional(),
  right: z.number().optional()
}).partial()

const sectionSettingsSchema = z.object({
  visible: z.boolean().optional(),
  padding: sectionPaddingSchema.optional(),
  paddingBlock: z.number().optional()
}).catchall(z.unknown())

const sectionConfigSchema = z.object({
  type: z.string().optional(),
  settings: sectionSettingsSchema.optional()
}).catchall(z.unknown())

const footerConfigSchema = z.object({
  order: z.array(z.string()).optional(),
  sections: z.record(z.string(), sectionConfigSchema).optional()
}).catchall(z.unknown())

const pageConfigSchema = z.object({
  order: z.array(z.string()).optional(),
  sections: z.record(z.string(), sectionConfigSchema).optional()
}).catchall(z.unknown())

export const editorStateSchema = z.object({
  header: sectionConfigSchema,
  footer: footerConfigSchema,
  page: pageConfigSchema,
  packageJson: z.string().optional()
}).catchall(z.unknown())

export const themeDocumentSchema = z.object({
  name: z.string().optional(),
  version: z.number().optional(),
  accentColor: z.string().optional(),
  packageJson: z.string().optional(),
  header: z.object({
    sections: z.record(z.string(), sectionConfigSchema).optional()
  }).optional(),
  footer: footerConfigSchema.optional(),
  pages: z.record(z.string(), pageConfigSchema).optional()
}).catchall(z.unknown())

export const workspaceBackupSchema = z.object({
  version: z.number(),
  exportedAt: z.string(),
  document: themeDocumentSchema
}).catchall(z.unknown())

export type WorkspaceBackup = z.infer<typeof workspaceBackupSchema>

export type ThemeDocumentShape = z.infer<typeof themeDocumentSchema>

export const themeExportRequestSchema = z.object({
  document: themeDocumentSchema.optional()
}).passthrough()

export type ThemeExportRequest = z.infer<typeof themeExportRequestSchema>

type ThemeValidationOptions = {
  suppressLog?: boolean
}

export const safeParseThemeDocument = (
  value: unknown,
  context: string,
  options?: ThemeValidationOptions
): ThemeDocumentShape | null => {
  const parsed = themeDocumentSchema.safeParse(value)
  if (!parsed.success) {
    if (!options?.suppressLog) {
      console.warn(`[theme-validation] Invalid theme document (${context}):`, parsed.error.flatten().fieldErrors)
    }
    return null
  }
  return parsed.data
}

export const safeParseWorkspaceBackup = (value: unknown): WorkspaceBackup | null => {
  const parsed = workspaceBackupSchema.safeParse(value)
  if (!parsed.success) {
    console.warn('[theme-validation] Invalid workspace backup:', parsed.error.flatten().fieldErrors)
    return null
  }
  return parsed.data
}
