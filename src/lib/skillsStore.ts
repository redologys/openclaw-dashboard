import * as fs from 'fs'
import * as path from 'path'
import { Skill } from './types'
import { PREINSTALLED_SKILLS } from './preinstalledSkills'
import { dataPath } from './paths'

interface SkillsFileObject {
  skills: Skill[]
  updatedAt?: string
  [key: string]: unknown
}

type SkillsFileFormat = 'array' | 'object'

interface SkillsSnapshot {
  skills: Skill[]
  format: SkillsFileFormat
  meta: Record<string, unknown>
}

const SKILLS_FILE = dataPath('skills.json')

const normalizeSkill = (raw: unknown): Skill | null => {
  if (!raw || typeof raw !== 'object') return null

  const obj = raw as Record<string, unknown>
  if (typeof obj.id !== 'string' || obj.id.trim().length === 0) return null

  const permissions = Array.isArray(obj.permissions)
    ? obj.permissions.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : []

  const normalized: Skill = {
    ...obj,
    id: obj.id,
    name: typeof obj.name === 'string' && obj.name.trim().length > 0 ? obj.name : obj.id,
    version: typeof obj.version === 'string' && obj.version.trim().length > 0 ? obj.version : '1.0.0',
    description: typeof obj.description === 'string' ? obj.description : '',
    inputsSchemaName: typeof obj.inputsSchemaName === 'string' ? obj.inputsSchemaName : 'default',
    permissions,
    origin:
      obj.origin === 'imported' ||
      obj.origin === 'marketplace' ||
      obj.origin === 'preinstalled' ||
      obj.origin === 'manual'
        ? obj.origin
        : 'imported',
  }

  return normalized
}

const ensureSkillsFile = () => {
  const dir = path.dirname(SKILLS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(SKILLS_FILE)) {
    const initial: SkillsFileObject = {
      skills: [],
      updatedAt: new Date().toISOString(),
    }
    fs.writeFileSync(SKILLS_FILE, JSON.stringify(initial, null, 2))
  }
}

const readSnapshot = (): SkillsSnapshot => {
  ensureSkillsFile()

  try {
    const raw = JSON.parse(fs.readFileSync(SKILLS_FILE, 'utf-8')) as unknown

    if (Array.isArray(raw)) {
      const skills = raw
        .map((entry) => normalizeSkill(entry))
        .filter((entry): entry is Skill => entry !== null)
      return { skills, format: 'array', meta: {} }
    }

    if (raw && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>
      const skillsRaw = Array.isArray(obj.skills) ? obj.skills : []
      const skills = skillsRaw
        .map((entry) => normalizeSkill(entry))
        .filter((entry): entry is Skill => entry !== null)
      const { skills: _ignored, ...meta } = obj
      return { skills, format: 'object', meta }
    }
  } catch {
    // fall through to reset
  }

  const resetSnapshot: SkillsSnapshot = {
    skills: [],
    format: 'object',
    meta: { updatedAt: new Date().toISOString() },
  }
  writeSnapshot(resetSnapshot)
  return resetSnapshot
}

const writeSnapshot = (snapshot: SkillsSnapshot) => {
  if (snapshot.format === 'array') {
    fs.writeFileSync(SKILLS_FILE, JSON.stringify(snapshot.skills, null, 2))
    return
  }

  const payload: SkillsFileObject = {
    ...snapshot.meta,
    skills: snapshot.skills,
    updatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(SKILLS_FILE, JSON.stringify(payload, null, 2))
}

const mergeSkill = (existing: Skill | undefined, incoming: Skill): Skill => {
  const merged: Skill = {
    ...(existing ?? {}),
    ...incoming,
    permissions: incoming.permissions ?? existing?.permissions ?? [],
    inputsSchemaName: incoming.inputsSchemaName ?? existing?.inputsSchemaName ?? 'default',
  }

  if (existing && 'enabled' in (existing as Record<string, unknown>) && !('enabled' in (incoming as Record<string, unknown>))) {
    ;(merged as Record<string, unknown>).enabled = (existing as Record<string, unknown>).enabled
  }

  return merged
}

const dedupeAndSort = (skills: Skill[]): Skill[] => {
  const map = new Map<string, Skill>()
  for (const skill of skills) {
    map.set(skill.id, skill)
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export const listConfiguredSkills = (): Skill[] => {
  return readSnapshot().skills
}

export const upsertConfiguredSkills = (incomingSkills: Skill[]): Skill[] => {
  const snapshot = readSnapshot()
  const currentById = new Map(snapshot.skills.map((skill) => [skill.id, skill]))

  for (const incoming of incomingSkills) {
    const normalized = normalizeSkill(incoming)
    if (!normalized) continue

    const existing = currentById.get(normalized.id)
    currentById.set(normalized.id, mergeSkill(existing, normalized))
  }

  const merged = dedupeAndSort(Array.from(currentById.values()))
  writeSnapshot({ ...snapshot, skills: merged })
  return merged
}

export const ensurePreinstalledSkills = (): Skill[] => {
  return upsertConfiguredSkills(PREINSTALLED_SKILLS)
}

export const mergeWithConfiguredSkills = (runtimeSkills: Skill[]): Skill[] => {
  const configured = ensurePreinstalledSkills()
  const mergedById = new Map<string, Skill>()

  for (const runtimeSkill of runtimeSkills) {
    const normalized = normalizeSkill(runtimeSkill)
    if (!normalized) continue
    mergedById.set(normalized.id, normalized)
  }

  for (const configuredSkill of configured) {
    const runtime = mergedById.get(configuredSkill.id)
    mergedById.set(configuredSkill.id, mergeSkill(runtime, configuredSkill))
  }

  return dedupeAndSort(Array.from(mergedById.values()))
}

