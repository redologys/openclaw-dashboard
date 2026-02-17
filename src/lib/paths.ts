import * as path from 'path'
import { config } from './config'

const normalizeInputPath = (value: string) => value.replace(/\\/g, '/').replace(/^\.\//, '')

export const DATA_DIR = path.resolve(config.DATA_DIR)

export const dataPath = (...segments: string[]) => path.resolve(DATA_DIR, ...segments)

export const resolveDataFilePath = (filePath: string) => {
  if (path.isAbsolute(filePath)) return filePath

  const normalized = normalizeInputPath(filePath)
  if (normalized.startsWith('data/')) {
    return path.resolve(DATA_DIR, normalized.slice(5))
  }
  if (!normalized.includes('/') && normalized.endsWith('.json')) {
    return path.resolve(DATA_DIR, normalized)
  }

  return path.resolve(process.cwd(), normalized)
}

export const getDataFileName = (filePath: string) => path.basename(resolveDataFilePath(filePath))
