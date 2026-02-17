import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { dataPath } from './paths';

export class JsonDb<T> {
  private filePath: string;
  private schema: z.ZodType<T>;
  private data: T | null = null;

  constructor(filename: string, schema: z.ZodType<T>, defaultData: T) {
    this.filePath = dataPath(filename);
    this.schema = schema;
    this.data = defaultData;
  }

  async init() {
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const content = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(content);
      const validation = this.schema.safeParse(parsed);
      if (validation.success) {
        this.data = validation.data;
      } else {
        console.warn(`[JsonDb] Validation failed for ${this.filePath}, using default data.`, validation.error);
        await this.write();
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await this.write();
      } else {
        throw error;
      }
    }
  }

  get(): T {
    if (this.data === null) throw new Error('Database not initialized');
    return this.data;
  }

  async set(newData: T) {
    const validation = this.schema.safeParse(newData);
    if (!validation.success) {
      throw new Error(`Invalid data for ${this.filePath}: ${validation.error}`);
    }
    this.data = newData;
    await this.write();
  }

  async update(updater: (data: T) => T) {
    const current = this.get();
    const newData = updater(current);
    await this.set(newData);
  }

  private async write() {
    if (this.data === null) return;
    await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
  }
}
