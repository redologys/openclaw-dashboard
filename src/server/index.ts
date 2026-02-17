import { createApp } from './app';
import { PlaybookRunner } from '../lib/playbookRunner';
import { SkillsRegistry } from '../lib/skillsRegistry';
import { ChatService } from '../lib/chatService';
import { AgentHeartbeat } from '../lib/agentHeartbeat';
import { CronRunner } from '../lib/cronRunner';
import { gateway } from './gateway';
import { PermissionEngine, PermissionFirewall } from '../lib/permissions';
import { config } from '../lib/config';
import { SentinelService } from '../lib/sentinelService';
import * as path from 'path';
import { ensurePreinstalledSkills } from '../lib/skillsStore';
import { getContextHealthSnapshot, runContextCompaction } from '../lib/skillInsights';
import { ensureDataFiles, safeWriteJSON, validateDataFiles } from '../lib/dataIntegrity';
import { runWorkspaceImport } from '../lib/workspaceImporter';
import * as fsPromises from 'fs/promises';
import { dataPath } from '../lib/paths';

interface HeartbeatState {
  autoImport?: {
    lastBootId?: string;
    status?: 'running' | 'success' | 'error';
    startedAt?: string;
    finishedAt?: string;
    workspaceRoot?: string;
    reportSummary?: {
      success: boolean;
      agentsImported: number;
      skillsImported: number;
      conflicts: number;
    };
    lastError?: string;
  };
  [key: string]: unknown;
}

const HEARTBEAT_STATE_FILE = dataPath('heartbeat-state.json');

const readHeartbeatState = async (): Promise<HeartbeatState> => {
  try {
    const raw = await fsPromises.readFile(HEARTBEAT_STATE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as HeartbeatState) : {};
  } catch {
    return {};
  }
};

const writeHeartbeatState = async (state: HeartbeatState) => {
  await safeWriteJSON(HEARTBEAT_STATE_FILE, state);
};

async function start() {
  console.log('--- OpenClaw Command Center Backend ---');
  console.log(`[Backend] Mode: ${process.env.NODE_ENV}`);
  console.log(`[Backend] Safe Mode: ${config.SAFE_MODE}`);

  try {
    await ensureDataFiles();
    const integrity = await validateDataFiles();
    if (!integrity.valid) {
      console.error('[Backend] Data integrity check FAILED:');
      integrity.errors.forEach((error) => console.error(`  - ${error}`));
      process.exit(1);
    }
    console.log('[Backend] Data integrity: OK');

    ensurePreinstalledSkills();

    const skillDirs = [
      {
        dir: path.join(config.WORKSPACE_ROOT, 'skills'),
        source: 'workspace-root',
        precedenceRank: 1,
      },
      {
        dir: '/home/ubuntu/.openclaw/skills',
        source: 'global-openclaw',
        precedenceRank: 2,
      },
      ...config.SKILLS_EXTRA_DIRS.map((dir, index) => ({
        dir,
        source: 'skills-extra-dir',
        precedenceRank: 3 + index,
      })),
    ];

    const uniqueSkillDirs = skillDirs.filter(
      (entry, index, all) => all.findIndex((candidate) => candidate.dir === entry.dir) === index,
    );

    const skillsRegistry = new SkillsRegistry(uniqueSkillDirs);
    await skillsRegistry.scan();
    const chatService = new ChatService();
    const agentHeartbeat = new AgentHeartbeat();
    const permissionEngine = new PermissionEngine();
    const permissionFirewall = new PermissionFirewall(permissionEngine);
    const sentinelService = new SentinelService();
    
    // PlaybookRunner takes (gateway, permissionFirewall)
    const playbookRunner = new PlaybookRunner(gateway, permissionFirewall);
    
    // CronRunner takes (playbookRunner)
    const cronRunner = new CronRunner(playbookRunner);
    cronRunner.registerMaintenanceTask('sentinel-health-check', 1, async () => {
      sentinelService.runScheduledHealthChecks({
        safeMode: config.SAFE_MODE,
        gatewayStatus: gateway.getConnectionStatus(),
        agentStatuses: agentHeartbeat.listStatuses(),
      });
    });
    let lastSophieCronDate: string | null = null;
    cronRunner.registerMaintenanceTask('sophie-context-compaction', 15, async () => {
      const now = new Date();
      const dateKey = now.toISOString().slice(0, 10);

      if (now.getHours() !== 3 || lastSophieCronDate === dateKey) {
        return;
      }

      const snapshot = getContextHealthSnapshot(config.SAFE_MODE);
      if (snapshot.autoCompactionEligible) {
        runContextCompaction(config.SAFE_MODE);
      }

      lastSophieCronDate = dateKey;
    });

    const bootId = `${process.pid}-${Date.now().toString(36)}`;
    let importInFlight = false;

    gateway.setOnConnect(() => {
      if (!config.ENABLE_WORKSPACE_IMPORT) {
        console.log('[Backend] Workspace import is disabled (ENABLE_WORKSPACE_IMPORT=false).');
        return;
      }
      if (importInFlight) {
        console.log('[Backend] Workspace import already running; skipping duplicate connect trigger.');
        return;
      }

      importInFlight = true;

      const runOneTimeImport = async () => {
        const heartbeatState = await readHeartbeatState();
        if (heartbeatState.autoImport?.lastBootId === bootId) {
          console.log('[Backend] Workspace import already attempted for this backend boot; skipping.');
          return;
        }

        const startedAt = new Date().toISOString();
        await writeHeartbeatState({
          ...heartbeatState,
          autoImport: {
            ...heartbeatState.autoImport,
            lastBootId: bootId,
            status: 'running',
            startedAt,
            finishedAt: undefined,
            workspaceRoot: config.WORKSPACE_ROOT,
            reportSummary: undefined,
            lastError: undefined,
          },
        });

        console.log(
          `[Backend] Gateway connected. Starting one-time workspace import (bootId=${bootId}, workspaceRoot=${config.WORKSPACE_ROOT})`,
        );

        try {
          const report = await runWorkspaceImport({ workspaceRoot: config.WORKSPACE_ROOT });
          const finishedAt = new Date().toISOString();
          const latestState = await readHeartbeatState();
          await writeHeartbeatState({
            ...latestState,
            autoImport: {
              ...latestState.autoImport,
              lastBootId: bootId,
              status: report.success ? 'success' : 'error',
              startedAt: latestState.autoImport?.startedAt ?? startedAt,
              finishedAt,
              workspaceRoot: config.WORKSPACE_ROOT,
              reportSummary: {
                success: report.success,
                agentsImported: report.summary.agents.imported,
                skillsImported: report.summary.skills.imported,
                conflicts: report.conflicts.length,
              },
              lastError: report.errors[0],
            },
          });

          console.log(
            `[Backend] Workspace import finished (success=${report.success}, agents=${report.summary.agents.imported}, skills=${report.summary.skills.imported}, conflicts=${report.conflicts.length})`,
          );
        } catch (error: any) {
          const finishedAt = new Date().toISOString();
          const latestState = await readHeartbeatState();
          await writeHeartbeatState({
            ...latestState,
            autoImport: {
              ...latestState.autoImport,
              lastBootId: bootId,
              status: 'error',
              finishedAt,
              workspaceRoot: config.WORKSPACE_ROOT,
              lastError: error?.message ?? 'Unknown workspace import error',
            },
          });
          console.error('[Backend] Workspace import on connect failed:', error);
        }
      };

      runOneTimeImport().finally(() => {
        importInFlight = false;
      });
    });

    await gateway.init();
    
    const app = createApp(
      playbookRunner,
      skillsRegistry,
      chatService,
      agentHeartbeat,
      cronRunner,
      permissionFirewall,
      permissionEngine,
      sentinelService,
    );

    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`[Backend] Server listening on http://localhost:${port}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
        console.log('[Backend] SIGTERM received. Shutting down...');
        gateway.disconnect();
        process.exit(0);
    });

  } catch (error) {
    console.error('[Backend] Bootstrap failed:', error);
    process.exit(1);
  }
}

start();
