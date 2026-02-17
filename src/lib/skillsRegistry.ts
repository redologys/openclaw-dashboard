import { SkillManifest } from './types'
import fs from 'fs/promises'
import path from 'path'
import { z } from 'zod'

const SkillManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  inputsSchemaName: z.string().optional(),
  permissions: z.array(z.string()).default([]),
})

const parseFrontmatter = (rawMarkdown: string): Record<string, string> => {
  const trimmed = rawMarkdown.trimStart()
  if (!trimmed.startsWith('---')) return {}

  const lines = trimmed.split(/\r?\n/)
  if (lines.length < 3) return {}

  const metadata: Record<string, string> = {}
  let index = 1

  while (index < lines.length && lines[index].trim() !== '---') {
    const line = lines[index]
    const separator = line.indexOf(':')
    if (separator > 0) {
      const key = line.slice(0, separator).trim()
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '')
      if (key.length > 0 && value.length > 0) {
        metadata[key] = value
      }
    }
    index += 1
  }

  return metadata
}

export interface SkillSourceDir {
  dir: string
  source: string
  precedenceRank: number
}

const isSkillSourceDirArray = (value: unknown): value is SkillSourceDir[] => {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        typeof (entry as SkillSourceDir).dir === 'string' &&
        typeof (entry as SkillSourceDir).source === 'string' &&
        typeof (entry as SkillSourceDir).precedenceRank === 'number',
    )
  )
}

export class SkillsRegistry {
  private skills: Map<string, SkillManifest> = new Map()
  private skillsDirs: SkillSourceDir[]

  constructor(skillsDir: string | string[] | SkillSourceDir[]) {
    if (typeof skillsDir === 'string') {
      this.skillsDirs = [{ dir: skillsDir, source: 'default', precedenceRank: 1 }]
      return
    }

    if (isSkillSourceDirArray(skillsDir)) {
      this.skillsDirs = skillsDir.slice().sort((a, b) => a.precedenceRank - b.precedenceRank)
      return
    }

    this.skillsDirs = skillsDir.map((dir, index) => ({
      dir,
      source: 'default',
      precedenceRank: index + 1,
    }))
  }

  async scan(): Promise<void> {
    this.skills.clear()

    for (const baseDir of this.skillsDirs) {
      try {
        await fs.access(baseDir.dir)
      } catch {
        console.warn(`[SkillsRegistry] Skills directory not found at ${baseDir.dir}`)
        continue
      }

      try {
        const entries = await fs.readdir(baseDir.dir, { withFileTypes: true })

        for (const entry of entries) {
          if (entry.isDirectory()) {
            await this.loadSkillFromDir(path.join(baseDir.dir, entry.name), baseDir)
          }
        }
      } catch (error) {
        console.error(`[SkillsRegistry] Error scanning ${baseDir.dir}:`, error)
      }
    }
  }

  private async loadSkillFromDir(dirPath: string, sourceDir: SkillSourceDir): Promise<void> {
    try {
      const skillId = path.basename(dirPath)
      if (this.skills.has(skillId)) {
        return
      }

      const skillJsonPath = path.join(dirPath, 'skill.json')

      try {
        const content = await fs.readFile(skillJsonPath, 'utf-8')
        const raw = JSON.parse(content)
        const parsed = SkillManifestSchema.safeParse(raw)

        if (parsed.success) {
          const manifest: SkillManifest = {
            id: skillId,
            ...parsed.data,
            inputsSchemaName: parsed.data.inputsSchemaName || 'default',
            origin: 'imported',
            path: skillJsonPath,
            source: sourceDir.source,
            precedenceRank: sourceDir.precedenceRank,
          }
          this.skills.set(manifest.id, manifest)
          return
        }
      } catch {
        // Fall through to SKILL.md parsing.
      }

      const skillMdPath = path.join(dirPath, 'SKILL.md')
      try {
        const markdown = await fs.readFile(skillMdPath, 'utf-8')
        const frontmatter = parseFrontmatter(markdown)

        const manifest: SkillManifest = {
          id: skillId,
          name: frontmatter.name || skillId,
          version: frontmatter.version || '1.0.0',
          description: frontmatter.description || `Imported skill ${skillId}`,
          inputsSchemaName: 'default',
          permissions: [],
          origin: 'imported',
          path: skillMdPath,
          source: sourceDir.source,
          precedenceRank: sourceDir.precedenceRank,
        }

        this.skills.set(manifest.id, manifest)
      } catch {
        // Directory exists but no parseable metadata.
      }
    } catch (error) {
      console.error(`[SkillsRegistry] Error loading skill from ${dirPath}:`, error)
    }
  }

  getSkill(id: string): SkillManifest | undefined {
    return this.skills.get(id)
  }

  listSkills(): SkillManifest[] {
    return Array.from(this.skills.values())
  }

  registerSkill(skill: SkillManifest) {
    this.skills.set(skill.id, skill)
  }
}
