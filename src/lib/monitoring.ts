import { SystemStats, AiMetrics } from './types';

// Mock data generator for system stats
export const getMockSystemStats = (): SystemStats => {
  return {
    cpuUsage: Math.random() * 100,
    memoryUsage: Math.random() * 100,
    diskUsage: 45, // static for now
    dockerContainers: [
      { id: 'c1', name: 'postgres', state: 'running', cpu: '2%', mem: '120MB' },
      { id: 'c2', name: 'redis', state: 'running', cpu: '0.5%', mem: '40MB' },
      { id: 'c3', name: 'worker', state: 'stopped', cpu: '0%', mem: '0MB' },
    ],
    timestamp: Date.now(),
  };
};

// Placeholder for real monitoring logic
export const getSystemStats = async (): Promise<SystemStats> => {
  // TODO: Implement actual system stats collection using 'os' or 'dockerode'
  return getMockSystemStats();
};

// Mock data generator for AI metrics
export const getMockAiMetrics = (): AiMetrics => {
  return {
    totalTokensSession: Math.floor(Math.random() * 10000),
    apiLatency: {
      openai: Math.random() * 500 + 100,
      gemini: Math.random() * 400 + 50,
    },
    apiErrors: {
      openai: 0,
      gemini: Math.floor(Math.random() * 2),
    },
  };
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};
