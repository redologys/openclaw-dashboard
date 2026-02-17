import { PermissionRule, ApprovalRequest, AuditLogEntry, PermissionContext, AccessResult } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR } from './paths';

export class PermissionEngine {
  private rules: PermissionRule[] = [];

  constructor() {
    this.loadDefaultRules();
  }

  private loadDefaultRules() {
    this.rules = [
      {
        id: 'rule-root-allow-all',
        name: 'Root Allow All',
        description: 'Root users can bypass any restriction',
        resource: '*',
        action: '*',
        policy: 'allow',
        enabled: true,
      },
      {
        id: 'rule-deny-non-admin-ssh',
        name: 'Restrict SSH to Admins',
        description: 'Only root and admin users can execute shell commands',
        resource: 'shell',
        action: 'execute',
        policy: 'deny',
        enabled: true,
      },
      {
        id: 'rule-safe-mode-deny-shell',
        name: 'Safe Mode Shell Block',
        description: 'Block all shell execution in Safe Mode',
        resource: 'shell',
        action: 'execute',
        policy: 'deny',
        enabled: true,
      },
      {
        id: 'rule-deny-non-admin-browser',
        name: 'Restrict Browser Controls to Admins',
        description: 'Only root and admin users can execute browser actions',
        resource: 'web',
        action: 'execute',
        policy: 'deny',
        enabled: true,
      },
      {
        id: 'rule-safe-mode-deny-browser',
        name: 'Safe Mode Browser Block',
        description: 'Block browser execution in Safe Mode',
        resource: 'web',
        action: 'execute',
        policy: 'deny',
        enabled: true,
      },
      {
        id: 'rule-allow-admin-shell',
        name: 'Allow Admin Shell Execution',
        description: 'Allow admin shell execution when not in Safe Mode',
        resource: 'shell',
        action: 'execute',
        policy: 'allow',
        enabled: true,
      },
      {
        id: 'rule-allow-admin-browser',
        name: 'Allow Admin Browser Execution',
        description: 'Allow admin browser execution when not in Safe Mode',
        resource: 'web',
        action: 'execute',
        policy: 'allow',
        enabled: true,
      },
      {
        id: 'rule-user-ask-file-write',
        name: 'Human Verification for File Writes',
        description: 'Ask for approval before writing files',
        resource: 'files',
        action: 'write',
        policy: 'ask',
        enabled: true,
      },
      {
        id: 'rule-ask-overlay-render',
        name: 'Confirm Overlay Renders',
        description: 'Manual approval required before triggering remote video renders',
        resource: 'overlay',
        action: 'render',
        policy: 'ask',
        enabled: true,
      }
    ];
  }

  getRules() {
    return this.rules;
  }

  check(action: string, resource: string, context: PermissionContext): AccessResult {
    if (
      context.safeMode &&
      action === 'execute' &&
      (resource === 'shell' || resource === 'web')
    ) {
      return {
        granted: false,
        policy: 'deny',
        reason: 'Blocked in Safe Mode',
      };
    }

    // Root bypass
    if (context.userRole === 'root') {
      return { granted: true, policy: 'allow', reason: 'Root bypass' };
    }

    // 1. Check Deny Rules
    const denyRule = this.rules.find(r => r.enabled && r.policy === 'deny' && this.matches(r, action, resource, context));
    if (denyRule) {
      return { granted: false, policy: 'deny', ruleId: denyRule.id, reason: denyRule.description };
    }

    // 2. Check Ask Rules (High priority human-in-the-loop)
    const askRule = this.rules.find(r => r.enabled && r.policy === 'ask' && this.matches(r, action, resource, context));
    if (askRule) {
      return { granted: false, policy: 'ask', ruleId: askRule.id, reason: askRule.description };
    }

    // 3. Check Allow Rules
    const allowRule = this.rules.find(r => r.enabled && r.policy === 'allow' && this.matches(r, action, resource, context));
    if (allowRule) {
      return { granted: true, policy: 'allow', ruleId: allowRule.id, reason: allowRule.description };
    }

    // Default Deny
    return { granted: false, policy: 'deny', reason: 'Default Deny (No matching rule)' };
  }

  private matches(rule: PermissionRule, action: string, resource: string, context: PermissionContext): boolean {
    const resourceMatch = rule.resource === '*' || rule.resource === resource;
    const actionMatch = rule.action === '*' || rule.action === action;
    
    if (!resourceMatch || !actionMatch) return false;

    if (rule.id === 'rule-deny-non-admin-ssh' || rule.id === 'rule-deny-non-admin-browser') {
      return context.userRole !== 'root' && context.userRole !== 'admin';
    }

    if (rule.id === 'rule-safe-mode-deny-shell' || rule.id === 'rule-safe-mode-deny-browser') {
      return context.safeMode === true;
    }

    if (rule.id === 'rule-allow-admin-shell' || rule.id === 'rule-allow-admin-browser') {
      return context.userRole === 'root' || context.userRole === 'admin';
    }

    // Check agent scoping
    if (rule.agentIds && context.agentId && !rule.agentIds.includes(context.agentId)) {
      return false;
    }

    // Safe mode specific logic hidden in resources/actions usually, 
    // but we can check context here if rule specifies it (not in current type but could be added)

    return true;
  }
}

export class PermissionFirewall {
  private engine: PermissionEngine;
  private approvalsFile: string;
  private auditFile: string;

  constructor(engine: PermissionEngine) {
    this.engine = engine;
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    this.approvalsFile = path.join(DATA_DIR, 'approvals.json');
    this.auditFile = path.join(DATA_DIR, 'audit.json');
  }

  async validateAndExecute(
    action: string, 
    resource: string, 
    context: PermissionContext, 
    details: any
  ): Promise<AccessResult> {
    const result = this.engine.check(action, resource, context);
    
    // Log attempt to audit
    this.logAudit({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      actor: context.agentId || 'user',
      action: `${resource}:${action}`,
      params: details,
      resultSummary: result.policy
    });

    if (result.policy === 'ask') {
      const approval = await this.createApprovalRequest(action, resource, context, details);
      result.approvalId = approval.id;
    }

    return result;
  }

  private logAudit(entry: AuditLogEntry) {
    try {
      const logs = fs.existsSync(this.auditFile) ? JSON.parse(fs.readFileSync(this.auditFile, 'utf-8')) : [];
      logs.push(entry);
      fs.writeFileSync(this.auditFile, JSON.stringify(logs, null, 2));
    } catch (e) {
      console.error('[Firewall] Audit log failed', e);
    }
  }

  private async createApprovalRequest(action: string, resource: string, context: PermissionContext, details: any): Promise<ApprovalRequest> {
    const request: ApprovalRequest = {
      id: uuidv4(),
      type: 'tool_call', // Defaulting to tool_call for now
      status: 'pending',
      requesterId: context.agentId || 'system',
      details: { action, resource, ...details },
      createdAt: new Date().toISOString()
    };

    try {
      const apps = fs.existsSync(this.approvalsFile) ? JSON.parse(fs.readFileSync(this.approvalsFile, 'utf-8')) : [];
      apps.push(request);
      fs.writeFileSync(this.approvalsFile, JSON.stringify(apps, null, 2));
    } catch (e) {
      console.error('[Firewall] Approval creation failed', e);
    }

    return request;
  }

  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    if (!fs.existsSync(this.approvalsFile)) return [];
    const apps = JSON.parse(fs.readFileSync(this.approvalsFile, 'utf-8')) as ApprovalRequest[];
    return apps.filter(a => a.status === 'pending');
  }

  async updateApproval(id: string, status: 'approved' | 'rejected'): Promise<void> {
    if (!fs.existsSync(this.approvalsFile)) return;
    const apps = JSON.parse(fs.readFileSync(this.approvalsFile, 'utf-8')) as ApprovalRequest[];
    const idx = apps.findIndex(a => a.id === id);
    if (idx >= 0) {
      apps[idx].status = status;
      fs.writeFileSync(this.approvalsFile, JSON.stringify(apps, null, 2));
    }
  }
}

export const permissionEngine = new PermissionEngine();
export const permissionFirewall = new PermissionFirewall(permissionEngine);
