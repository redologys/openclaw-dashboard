import { GatewayClient } from '../server/gateway';
import { Playbook, PlaybookStep, PermissionContext, UserRole } from './types';
import { v4 as uuidv4 } from 'uuid';
import { PermissionFirewall } from './permissions';
import { config } from './config';

export class PlaybookRunner {
  private gateway: GatewayClient;
  private permissionFirewall: PermissionFirewall;
  private activeRuns: Map<string, string> = new Map(); // runId -> status

  constructor(gateway: GatewayClient, permissionFirewall: PermissionFirewall) {
    this.gateway = gateway;
    this.permissionFirewall = permissionFirewall;
  }

  async run(playbook: Playbook, variables: Record<string, any> = {}, userRole: UserRole = 'user'): Promise<string> {
    const runId = uuidv4();
    console.log(`[PlaybookRunner] Starting run ${runId} for playbook ${playbook.name}`);
    
    this.activeRuns.set(runId, 'running');

    const context: PermissionContext = {
        userRole,
        agentId: 'system-playbook-runner',
        safeMode: config.SAFE_MODE
    };

    // Execute asynchronously
    this.executeSteps(runId, playbook.steps, variables, context).then(() => {
      this.activeRuns.set(runId, 'completed');
      console.log(`[PlaybookRunner] Run ${runId} completed`);
    }).catch(err => {
      this.activeRuns.set(runId, 'failed');
      console.error(`[PlaybookRunner] Run ${runId} failed:`, err);
    });

    return runId;
  }

  private async executeSteps(runId: string, steps: PlaybookStep[], variables: Record<string, any>, context: PermissionContext) {
    for (const step of steps) {
      if (this.activeRuns.get(runId) === 'cancelled') break;

      console.log(`[PlaybookRunner] Executing step: ${step.instruction}`);

      // 1. Check Permissions
      const pResult = await this.permissionFirewall.validateAndExecute(
          'execute_playbook_step',
          step.agentId || 'generic',
          context,
          { instruction: step.instruction, runId }
      );

      if (!pResult.granted && pResult.policy !== 'ask') {
          console.error(`[PlaybookRunner] Permission denied for step in ${runId}`);
          throw new Error(`Permission Denied: ${pResult.reason}`);
      }

      // If 'ask', the firewall already queued an approval. 
      // A more complex runner would wait for approval here.
      // For now, we'll continue if granted or wait for implemented approval polling.
      
      // Interpolate variables in instruction
      let instruction = step.instruction;
      for (const [key, val] of Object.entries(variables)) {
        instruction = instruction.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
      }

      // 2. Send to Agent via Gateway
      this.gateway.send({
          type: 'chat_message',
          payload: {
              id: uuidv4(),
              text: instruction,
              senderType: 'system',
              agentId: step.agentId || 'default',
              timestamp: new Date().toISOString()
          }
      });

      // Mock completion delay
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  getRunStatus(runId: string) {
    return this.activeRuns.get(runId);
  }
}
