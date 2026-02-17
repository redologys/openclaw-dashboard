import * as fs from 'fs/promises'
import * as path from 'path'
import { z, type ZodTypeAny } from 'zod'
import { dataPath, getDataFileName, resolveDataFilePath } from './paths'

const unknownArraySchema = z.array(z.unknown())
const maybeArrayOrObject = z.union([
  unknownArraySchema,
  z
    .object({
      agents: unknownArraySchema.optional(),
      subagents: unknownArraySchema.optional(),
      skills: unknownArraySchema.optional(),
      workflows: unknownArraySchema.optional(),
      updatedAt: z.string().optional(),
    })
    .passthrough(),
])

const schemaMap: Record<string, ZodTypeAny> = {
  'agents.json': maybeArrayOrObject,
  'skills.json': maybeArrayOrObject,
  'messages.json': unknownArraySchema,
  'cron.json': unknownArraySchema,
  'audit.json': unknownArraySchema,
  'approvals.json': unknownArraySchema,
  'conversations.json': unknownArraySchema,
  'providers.json': unknownArraySchema,
  'playbooks.json': maybeArrayOrObject,
  'swarms.json': maybeArrayOrObject,
  'system_health.json': unknownArraySchema,
  'sentinel_config.json': z.object({
    enabled: z.boolean().optional(),
    retriesBeforeEscalation: z.number().optional(),
    checkIntervalMinutes: z.number().optional(),
    maxStoredChecks: z.number().optional(),
  }).passthrough(),
  'import_report.json': z.unknown(),
  'imperialVault.json': z.unknown(),
  'heartbeat-state.json': z.unknown(),
}

const defaults: Record<string, unknown> = {
  'agents.json': [],
  'skills.json': { skills: [] },
  'messages.json': [],
  'cron.json': [],
  'audit.json': [],
  'approvals.json': [],
  'conversations.json': [],
  'providers.json': [],
  'playbooks.json': [],
  'swarms.json': [],
  'system_health.json': [],
  'sentinel_config.json': {
    enabled: true,
    retriesBeforeEscalation: 3,
    checkIntervalMinutes: 5,
    maxStoredChecks: 500,
  },
}

const coreValidationFiles = [
  'agents.json',
  'skills.json',
  'messages.json',
  'cron.json',
  'audit.json',
  'approvals.json',
]

export const getSchemaForFile = (filePath: string): ZodTypeAny => {
  const key = getDataFileName(filePath)
  return schemaMap[key] ?? z.unknown()
}

export const validateSchema = (data: unknown, schema: ZodTypeAny): boolean => {
  return schema.safeParse(data).success
}

export const validateDataFiles = async (fileNames: string[] = coreValidationFiles) => {
  const errors: string[] = []

  for (const fileName of fileNames) {
    try {
      const absolute = resolveDataFilePath(fileName)
      const content = await fs.readFile(absolute, 'utf-8')
      const parsed = JSON.parse(content)
      const schema = getSchemaForFile(fileName)
      if (!validateSchema(parsed, schema)) {
        errors.push(`${fileName}: Schema validation failed`)
      }
    } catch (error: any) {
      errors.push(`${fileName}: ${error.message}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

export const ensureDataFiles = async () => {
  await fs.mkdir(dataPath(), { recursive: true })

  for (const [fileName, value] of Object.entries(defaults)) {
    const absolute = dataPath(fileName)
    try {
      await fs.access(absolute)
    } catch {
      await fs.writeFile(absolute, JSON.stringify(value, null, 2))
    }
  }
}

export const safeWriteJSON = async <T>(filePath: string, data: T) => {
  const absolute = resolveDataFilePath(filePath)
  const backupPath = `${absolute}.backup`
  const schema = getSchemaForFile(absolute)

  await fs.mkdir(path.dirname(absolute), { recursive: true })

  try {
    await fs.copyFile(absolute, backupPath)
  } catch {
    // file may not exist yet
  }

  if (!validateSchema(data, schema)) {
    throw new Error(`Schema validation failed for ${getDataFileName(absolute)}`)
  }

  await fs.writeFile(absolute, JSON.stringify(data, null, 2))

  try {
    const verify = JSON.parse(await fs.readFile(absolute, 'utf-8')) as unknown
    if (!validateSchema(verify, schema)) {
      throw new Error('Written data failed validation check')
    }
  } catch (error) {
    try {
      await fs.copyFile(backupPath, absolute)
    } catch {
      // ignore backup restore failure
    }
    throw error
  }
}
