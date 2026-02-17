import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from './types';
import { DATA_DIR } from './paths';

export interface Conversation {
  id: string;
  agentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export class ChatService {
  private dataDir: string;
  private conversationsFile: string;
  private conversations: Map<string, Conversation> = new Map();

  constructor() {
    this.dataDir = DATA_DIR;
    this.conversationsFile = path.join(this.dataDir, 'conversations.json');
    this.ensureDataDir();
    this.loadConversations();
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadConversations() {
    try {
      if (fs.existsSync(this.conversationsFile)) {
        const data = fs.readFileSync(this.conversationsFile, 'utf8');
        const list: Conversation[] = JSON.parse(data);
        list.forEach(c => this.conversations.set(c.id, c));
      }
    } catch (error) {
      console.error('[ChatService] Error loading conversations:', error);
    }
  }

  private saveConversations() {
    try {
      const list = Array.from(this.conversations.values());
      fs.writeFileSync(this.conversationsFile, JSON.stringify(list, null, 2));
    } catch (error) {
      console.error('[ChatService] Error saving conversations:', error);
    }
  }

  async createConversation(agentId: string, title: string = 'New Conversation'): Promise<Conversation> {
    const conv: Conversation = {
      id: uuidv4(),
      agentId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    this.conversations.set(conv.id, conv);
    this.saveConversations();
    return conv;
  }

  async listConversations(agentId?: string): Promise<Conversation[]> {
    const list = Array.from(this.conversations.values());
    if (agentId) {
      return list.filter(c => c.agentId === agentId);
    }
    return list;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) || null;
  }

  async addMessage(id: string, message: ChatMessage): Promise<void> {
    const conv = this.conversations.get(id);
    if (!conv) throw new Error('Conversation not found');
    
    conv.messages.push(message);
    conv.updatedAt = new Date().toISOString();
    this.saveConversations();
  }

  async switchAgent(id: string, newAgentId: string): Promise<void> {
    const conv = this.conversations.get(id);
    if (!conv) throw new Error('Conversation not found');
    
    conv.agentId = newAgentId;
    conv.updatedAt = new Date().toISOString();
    this.saveConversations();
  }

  async deleteConversation(id: string): Promise<void> {
    this.conversations.delete(id);
    this.saveConversations();
  }
}
