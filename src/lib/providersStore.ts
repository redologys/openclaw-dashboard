import * as fs from 'fs'
import * as path from 'path'
import { z } from 'zod'
import { ProviderConnection, ProviderType } from './types'
import { dataPath } from './paths'

const providerTypeSchema = z.enum(['openai', 'anthropic', 'google', 'custom'])
const providerStatusSchema = z.enum(['connected', 'error', 'disabled'])

const providerConnectionSchema = z.object({
  id: z.string().min(1),
  provider: providerTypeSchema,
  displayName: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  status: providerStatusSchema,
  models: z.array(z.string().min(1)),
})

const providersSchema = z.array(providerConnectionSchema)

const upsertProviderInputSchema = z.object({
  id: z.string().min(1).optional(),
  provider: providerTypeSchema,
  displayName: z.string().min(1),
  status: providerStatusSchema.optional(),
  models: z.array(z.string().min(1)).optional(),
})

const PROVIDERS_FILE = dataPath('providers.json')

function ensureProvidersFile() {
  const dir = path.dirname(PROVIDERS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(PROVIDERS_FILE)) {
    fs.writeFileSync(PROVIDERS_FILE, JSON.stringify([], null, 2))
    return
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(PROVIDERS_FILE, 'utf-8'))
    const validated = providersSchema.safeParse(parsed)
    if (!validated.success) {
      fs.writeFileSync(PROVIDERS_FILE, JSON.stringify([], null, 2))
    }
  } catch {
    fs.writeFileSync(PROVIDERS_FILE, JSON.stringify([], null, 2))
  }
}

function saveProviders(providers: ProviderConnection[]) {
  fs.writeFileSync(PROVIDERS_FILE, JSON.stringify(providers, null, 2))
}

function normalizeModels(models: string[] | undefined): string[] {
  if (!models) return []
  const normalized = models
    .map((model) => model.trim())
    .filter((model) => model.length > 0)
  return Array.from(new Set(normalized))
}

function generateProviderId(provider: ProviderType, displayName: string): string {
  const slug = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'connection'

  return `${provider}-${slug}-${Date.now().toString(36)}`
}

export function listProviders(): ProviderConnection[] {
  ensureProvidersFile()
  const parsed = JSON.parse(fs.readFileSync(PROVIDERS_FILE, 'utf-8'))
  const validated = providersSchema.safeParse(parsed)
  return validated.success ? validated.data : []
}

export function getProviderById(id: string): ProviderConnection | undefined {
  return listProviders().find((provider) => provider.id === id)
}

export function upsertProvider(input: unknown): ProviderConnection {
  ensureProvidersFile()
  const parsed = upsertProviderInputSchema.parse(input)
  const providers = listProviders()
  const now = new Date().toISOString()
  const hasModels = Array.isArray(parsed.models)
  const normalizedModels = normalizeModels(parsed.models)

  if (parsed.id) {
    const existingIndex = providers.findIndex((provider) => provider.id === parsed.id)
    if (existingIndex >= 0) {
      const existing = providers[existingIndex]
      const updated: ProviderConnection = {
        ...existing,
        provider: parsed.provider,
        displayName: parsed.displayName,
        status: parsed.status ?? existing.status,
        models: hasModels ? normalizedModels : existing.models,
        updatedAt: now,
      }
      providers[existingIndex] = updated
      saveProviders(providers)
      return updated
    }
  }

  const created: ProviderConnection = {
    id: parsed.id ?? generateProviderId(parsed.provider, parsed.displayName),
    provider: parsed.provider,
    displayName: parsed.displayName,
    createdAt: now,
    updatedAt: now,
    status: parsed.status ?? 'connected',
    models: normalizedModels,
  }

  providers.push(created)
  saveProviders(providers)
  return created
}
