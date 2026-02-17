import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { Agent, Playbook } from './types';
import { SkillsRegistry } from './skillsRegistry';
import { config } from './config';
import { DATA_DIR } from './paths';

// Types for the import report
export interface ImportReport {
  timestamp: string;
  agents: { found: number; imported: number; skipped: number };
  skills: { found: number; imported: number; skipped: number };
  crons: { found: number; imported: number; skipped: number };
  playbooks: { found: number; imported: number; skipped: number };
  swarms: { found: number; imported: number; skipped: number };
  memory: { found: number; imported: number; skipped: number };
  errors: string[];
  imperialVault: { detected: boolean; path?: string };
}

export async function runOpenClawImport(skillsRegistry: SkillsRegistry): Promise<ImportReport> {
  const report: ImportReport = {
    timestamp: new Date().toISOString(),
    agents: { found: 0, imported: 0, skipped: 0 },
    skills: { found: 0, imported: 0, skipped: 0 },
    crons: { found: 0, imported: 0, skipped: 0 },
    playbooks: { found: 0, imported: 0, skipped: 0 },
    swarms: { found: 0, imported: 0, skipped: 0 },
    memory: { found: 0, imported: 0, skipped: 0 },
    imperialVault: { detected: false },
    errors: [],
  };

  const root = config.WORKSPACE_ROOT || process.cwd();

  try {
    // 1. Scan Agents
    await scanAgents(root, report);

    // 2. Scan Skills (using Registry)
    await scanSkills(skillsRegistry, report);
    
    // 3. Scan Crons
    await scanCrons(root, report);

    // 4. Scan Playbooks
    await scanPlaybooks(root, report);
    
    // 5. Scan Swarms & Memory
    await scanSwarms(root, report);
    await scanMemory(root, report);

    // 6. Imperial Vault Detection
    await scanImperialVault(root, report);

    // Persist Report
    if (!fs.existsSync(DATA_DIR)) {
      await fsPromises.mkdir(DATA_DIR, { recursive: true });
    }
    await fsPromises.writeFile(path.join(DATA_DIR, 'import_report.json'), JSON.stringify(report, null, 2));

  } catch (err: any) {
    report.errors.push(`Critical Import Error: ${err.message}`);
  }

  return report;
}

const scanAgents = async (root: string, report: ImportReport) => {
  try {
    const agentsDir = path.join(root, 'agents');
    if (!fs.existsSync(agentsDir)) return;

    const files = await fsPromises.readdir(agentsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    report.agents.found = jsonFiles.length;
    
    for (const file of jsonFiles) {
      try {
        const content = await fsPromises.readFile(path.join(agentsDir, file), 'utf-8');
        const data = JSON.parse(content) as Agent;
        if (data.id) {
            // In a real app, we would reconcile with the database here
            report.agents.imported++;
        }
      } catch (e) {
        report.errors.push(`Failed to parse agent ${file}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e: any) {
    report.errors.push(`Agent scan failed: ${e.message}`);
  }
}

async function scanSkills(registry: SkillsRegistry, report: ImportReport) {
  try {
    // Use registry to scan local skills first
    await registry.scan();
    const localSkills = registry.listSkills();
    
    report.skills.found = localSkills.length;
    report.skills.imported = localSkills.length;
  } catch (e: any) {
    report.errors.push(`Skill scan failed: ${e.message}`);
  }
}

async function scanCrons(root: string, report: ImportReport) {
    try {
        const cronFile = path.join(root, 'cron.json');
        if (fs.existsSync(cronFile)) {
            const content = await fsPromises.readFile(cronFile, 'utf-8');
            const jobs = JSON.parse(content);
            report.crons.found = Array.isArray(jobs) ? jobs.length : 1;
            report.crons.imported = report.crons.found;
        }
    } catch (e: any) {
        report.errors.push(`Cron scan failed: ${e.message}`);
    }
}

async function scanPlaybooks(root: string, report: ImportReport) {
    try {
        const playbookDir = path.join(root, 'playbooks');
        if (!fs.existsSync(playbookDir)) return;

        const files = await fsPromises.readdir(playbookDir);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        
        report.playbooks.found = jsonFiles.length;
        
        for (const file of jsonFiles) {
          try {
            const content = await fsPromises.readFile(path.join(playbookDir, file), 'utf-8');
            const data = JSON.parse(content) as Playbook;
            if (data.id) {
                report.playbooks.imported++;
            }
          } catch (e) {
            report.errors.push(`Failed to parse playbook ${file}: ${e instanceof Error ? e.message : String(e)}`);
          }
        }
    } catch (e: any) {
        report.errors.push(`Playbook scan failed: ${e.message}`);
    }
}

const scanSwarms = async (root: string, report: ImportReport) => {
    // Look for swarm configurations
    try {
        const swarmsDir = path.join(root, 'swarms');
        if (fs.existsSync(swarmsDir)) {
            const files = await fsPromises.readdir(swarmsDir);
            report.swarms.found = files.filter(f => f.endsWith('.json')).length;
            report.swarms.imported = report.swarms.found;
        }
    } catch (e: any) {
        report.errors.push(`Swarm scan failed: ${e.message}`);
    }
};

const scanMemory = async (root: string, report: ImportReport) => {
    // Look for vector stores or long-term memory dumps
    try {
        const memDir = path.join(root, 'memory');
        if (fs.existsSync(memDir)) {
            report.memory.found = 1; // Mark as found if directory exists
            report.memory.imported = 1;
        }
    } catch (e: any) {
        report.errors.push(`Memory scan failed: ${e.message}`);
    }
};

const scanImperialVault = async (root: string, report: ImportReport) => {
  try {
    // Check for Imperial Vault markers
    const vaultMarker = path.join(root, '.imperial-vault');
    const isImperialVault = fs.existsSync(vaultMarker) || root.includes('imperial-vault');
    
    if (isImperialVault) {
      report.imperialVault.detected = true;
      report.imperialVault.path = root;
    }
  } catch (e: any) {
    report.errors.push(`Imperial Vault scan failed: ${e.message}`);
  }
};
