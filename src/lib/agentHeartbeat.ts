
export interface AgentStatus {
  agentId: string;
  status: 'online' | 'offline' | 'busy';
  lastSeen: string;
}

export class AgentHeartbeat {
  private statusMap: Map<string, AgentStatus> = new Map();
  private timeoutMs: number = 60000; // 1 minute timeout for offline status

  constructor() {
    // Periodically check for timeouts
    setInterval(() => this.checkTimeouts(), 30000);
  }

  recordHeartbeat(agentId: string) {
    this.statusMap.set(agentId, {
      agentId,
      status: 'online',
      lastSeen: new Date().toISOString()
    });
  }

  setBusy(agentId: string, isBusy: boolean) {
    const status = this.statusMap.get(agentId);
    if (status) {
      status.status = isBusy ? 'busy' : 'online';
      status.lastSeen = new Date().toISOString();
    }
  }

  getStatus(agentId: string): AgentStatus {
    return this.statusMap.get(agentId) || {
      agentId,
      status: 'offline',
      lastSeen: 'never'
    };
  }

  listStatuses(): AgentStatus[] {
    return Array.from(this.statusMap.values());
  }

  private checkTimeouts() {
    const now = Date.now();
    this.statusMap.forEach((status) => {
      if (status.lastSeen === 'never') return;
      const lastSeenTime = new Date(status.lastSeen).getTime();
      if (now - lastSeenTime > this.timeoutMs) {
        status.status = 'offline';
      }
    });
  }
}
