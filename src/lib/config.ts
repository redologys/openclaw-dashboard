import 'dotenv/config'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { z } from 'zod'

const pathExists = (value: string | undefined): value is string => {
  if (!value || value.trim().length === 0) return false
  try {
    return fs.existsSync(value)
  } catch {
    return false
  }
}

const expandHome = (value: string | undefined) => {
  if (!value) return value
  if (!value.startsWith('~')) return value
  return path.join(os.homedir(), value.slice(1))
}

const normalizeDir = (value: string | undefined) => {
  if (!value || value.trim().length === 0) return undefined
  return path.resolve(expandHome(value) ?? value)
}

const detectWorkspaceRoot = () => {
  const envWorkspace = normalizeDir(process.env.WORKSPACE_ROOT)
  if (envWorkspace) return envWorkspace

  const ubuntuCandidate = '/home/ubuntu/.openclaw/workspace'
  if (pathExists(ubuntuCandidate)) return ubuntuCandidate

  const homeCandidate = path.join(os.homedir(), '.openclaw', 'workspace')
  if (pathExists(homeCandidate)) return homeCandidate

  return homeCandidate
}

const detectOpenClawConfigPath = (workspaceRoot: string) => {
  const envConfig = normalizeDir(process.env.OPENCLAW_CONFIG_PATH)
  if (envConfig) return envConfig

  const ubuntuCandidate = '/home/ubuntu/.openclaw/openclaw.json'
  if (pathExists(ubuntuCandidate)) return ubuntuCandidate

  const workspaceCandidate = path.join(workspaceRoot, 'openclaw.json')
  if (pathExists(workspaceCandidate)) return workspaceCandidate

  const homeCandidate = path.join(os.homedir(), '.openclaw', 'openclaw.json')
  if (pathExists(homeCandidate)) return homeCandidate

  return homeCandidate
}

const parseBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false
  }
  return fallback
}

const parseExtraDirs = (raw: string | undefined): string[] => {
  if (!raw || raw.trim().length === 0) return []
  return Array.from(
    new Set(
      raw
        .split(/[,;]+/)
        .map((entry) => normalizeDir(entry.trim()))
        .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0),
    ),
  )
}

const detectedWorkspaceRoot = detectWorkspaceRoot()
const detectedOpenClawConfigPath = detectOpenClawConfigPath(detectedWorkspaceRoot)
const detectedDataDir = normalizeDir(process.env.DATA_DIR) ?? path.resolve(process.cwd(), 'data')

const envSchema = z.object({
  GATEWAY_URL: z.string().url().default('ws://127.0.0.1:18789'),
  GATEWAY_TOKEN: z.string().min(1).default('mock-token'),

  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  LOCAL_MODEL_PATH: z.string().optional(),
  SUPERMEMORY_API_KEY: z.string().optional(),

  SSH_HOST: z.string().default('127.0.0.1'),
  SSH_USER: z.string().default('ubuntu'),
  SSH_PASSWORD: z.string().optional(),
  SSH_KEY_PATH: z.string().optional(),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  SAFE_MODE: z.preprocess((value) => parseBoolean(value, false), z.boolean()),
  ENABLE_WORKSPACE_IMPORT: z.preprocess((value) => parseBoolean(value, true), z.boolean()),

  DATA_DIR: z.string().default(detectedDataDir),
  WORKSPACE_ROOT: z.string().default(detectedWorkspaceRoot),
  OPENCLAW_CONFIG_PATH: z.string().default(detectedOpenClawConfigPath),
  SKILLS_EXTRA_DIRS: z.string().optional(),
})

const processEnv = {
  GATEWAY_URL: process.env.GATEWAY_URL,
  GATEWAY_TOKEN: process.env.GATEWAY_TOKEN,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  LOCAL_MODEL_PATH: process.env.LOCAL_MODEL_PATH,
  SUPERMEMORY_API_KEY: process.env.SUPERMEMORY_API_KEY,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  SAFE_MODE: process.env.SAFE_MODE,
  ENABLE_WORKSPACE_IMPORT: process.env.ENABLE_WORKSPACE_IMPORT,
  OPENCLAW_CONFIG_PATH: process.env.OPENCLAW_CONFIG_PATH,
  WORKSPACE_ROOT: process.env.WORKSPACE_ROOT,
  DATA_DIR: process.env.DATA_DIR,
  SKILLS_EXTRA_DIRS: process.env.SKILLS_EXTRA_DIRS,
  SSH_HOST: process.env.SSH_HOST,
  SSH_USER: process.env.SSH_USER,
  SSH_PASSWORD: process.env.SSH_PASSWORD,
  SSH_KEY_PATH: process.env.SSH_KEY_PATH,
}

const parsed = envSchema.safeParse(processEnv)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format())
}

const resolved = parsed.success ? parsed.data : envSchema.parse(processEnv)

export const config = {
  ...resolved,
  DATA_DIR: normalizeDir(resolved.DATA_DIR) ?? detectedDataDir,
  WORKSPACE_ROOT: normalizeDir(resolved.WORKSPACE_ROOT) ?? detectedWorkspaceRoot,
  OPENCLAW_CONFIG_PATH: normalizeDir(resolved.OPENCLAW_CONFIG_PATH) ?? detectedOpenClawConfigPath,
  SKILLS_EXTRA_DIRS: parseExtraDirs(resolved.SKILLS_EXTRA_DIRS),
}
