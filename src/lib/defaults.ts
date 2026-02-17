import { DashboardLayout, WidgetConfig } from './types';

export const DEFAULT_WIDGETS: Record<string, WidgetConfig> = {
  'cpu': { id: 'cpu', type: 'system-cpu', title: 'CPU Usage', dataMode: 'mock', refreshInterval: 1000 },
  'memory': { id: 'memory', type: 'system-memory', title: 'Memory', dataMode: 'mock', refreshInterval: 1000 },
  'ai-tokens': { id: 'ai-tokens', type: 'ai-token-gauge', title: 'Session Tokens', dataMode: 'mock' },
  'context-health': { id: 'context-health', type: 'context-health', title: 'Context Health', dataMode: 'live', refreshInterval: 15000 },
  'live-activity': { id: 'live-activity', type: 'live-activity', title: 'Live Activity', dataMode: 'live', refreshInterval: 8000 },
  'system-resources': { id: 'system-resources', type: 'system-resources', title: 'System Resources', dataMode: 'live', refreshInterval: 30000 },
  'mission-control': { id: 'mission-control', type: 'mission-control', title: 'Mission Control', dataMode: 'mock' },
  'gateway-debug': { id: 'gateway-debug', type: 'gateway-debug', title: 'Gateway Logs', dataMode: 'live' },
  'security-health': { id: 'security-health', type: 'security-health', title: 'Security Health', dataMode: 'live' },
};

export const DEFAULT_LAYOUTS: Record<string, DashboardLayout> = {
  'default': {
    id: 'default',
    name: 'Default',
    items: [
      { i: 'context-health', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'live-activity', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'system-resources', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'security-health', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'mission-control', x: 0, y: 2, w: 9, h: 6, minW: 4, minH: 4 },
      { i: 'gateway-debug', x: 9, y: 2, w: 3, h: 6, minW: 2, minH: 4 },
    ],
    widgets: DEFAULT_WIDGETS,
  },
  'ops': {
    id: 'ops',
    name: 'Ops View',
    items: [
      { i: 'mission-control', x: 0, y: 0, w: 8, h: 8, minW: 4, minH: 4 },
      { i: 'gateway-debug', x: 8, y: 0, w: 4, h: 8, minW: 2, minH: 4 },
    ],
    widgets: DEFAULT_WIDGETS,
  }
};
