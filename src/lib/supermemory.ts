import { config } from './config';

export interface MemoryEntry {
  id: string;
  content: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export class Supermemory {
  private apiKey: string | undefined;
  private baseUrl: string = "https://api.supermemory.ai/v1";

  constructor() {
    this.apiKey = config.SUPERMEMORY_API_KEY;
  }

  async index(content: string, metadata: Record<string, any> = {}, tags: string[] = []): Promise<string> {
    console.log(`[Supermemory] Indexing content: ${content.substring(0, 50)}... Tags: ${tags.join(', ')}`);
    
    if (config.SAFE_MODE) {
      console.log(`[Supermemory] Safe mode enabled. Mocking index response.`);
      return `mock_${Math.random().toString(36).substr(2, 9)}`;
    }

    if (!this.apiKey) {
      throw new Error('SUPERMEMORY_API_KEY is required when SAFE_MODE=false');
    }

    try {
      const response = await fetch(`${this.baseUrl}/index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          content,
          metadata,
          tags,
          deduplicate: true // Attempting deduplication as requested
        })
      });

      if (!response.ok) {
        throw new Error(`Supermemory API error: ${response.statusText}`);
      }

      const data = await response.json() as { id: string };
      return data.id;
    } catch (error) {
      console.error('[Supermemory] Indexing failed:', error);
      throw error;
    }
  }

  async search(query: string, limit: number = 5, tags: string[] = []): Promise<MemoryEntry[]> {
    console.log(`[Supermemory] Searching for: ${query} (limit: ${limit}, tags: ${tags.join(', ')})`);
    
    if (config.SAFE_MODE) {
      return [{
        id: "mock-1",
        content: `Mock result for ${query}`,
        metadata: { source: "mock" },
        timestamp: new Date().toISOString()
      }];
    }

    if (!this.apiKey) {
      throw new Error('SUPERMEMORY_API_KEY is required when SAFE_MODE=false');
    }

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          query,
          limit,
          tags
        })
      });

      if (!response.ok) {
        throw new Error(`Supermemory API error: ${response.statusText}`);
      }

      return await response.json() as MemoryEntry[];
    } catch (error) {
      console.error('[Supermemory] Search failed:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    console.log(`[Supermemory] Deleting memory: ${id}`);
    
    if (config.SAFE_MODE) return;

    if (!this.apiKey) {
      throw new Error('SUPERMEMORY_API_KEY is required when SAFE_MODE=false');
    }

    try {
      const response = await fetch(`${this.baseUrl}/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Supermemory API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[Supermemory] Delete failed:', error);
      throw error;
    }
  }
}
