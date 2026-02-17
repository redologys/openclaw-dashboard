import { z } from 'zod';

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  systemPrompt: z.string(),
  model: z.string().optional(),
  providerId: z.string().optional(),
  cliProfileId: z.string().optional(),
  skills: z.array(z.string()),
  canTalkToAgents: z.boolean(),
  heartbeatEnabled: z.boolean().optional(),
});

export const AgentDbSchema = z.array(AgentSchema);

export const ConversationSchema = z.object({
  id: z.string(),
  agentId: z.string(), // The "owner" agent of this context
  title: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  senderType: z.enum(['user', 'agent', 'system']),
  senderAgentId: z.string().optional(),
  agentId: z.string(), // Context owner
  text: z.string(),
  createdAt: z.string(),
  toolCalls: z.array(z.any()).optional(),
  toolResults: z.array(z.any()).optional(),
  thinkingTrace: z.string().optional(),
});

export const MessageDbSchema = z.array(MessageSchema);
export const ConversationDbSchema = z.array(ConversationSchema);

export const SwarmTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  routerAgentId: z.string(),
  workerAgentIds: z.array(z.string()),
});

export const SwarmDbSchema = z.array(SwarmTemplateSchema);
