import { PlaybookRunner } from './playbookRunner';
import * as fs from 'fs';
import * as path from 'path';
import { CronJob } from './types';
import { dataPath } from './paths';

interface MaintenanceTask {
  id: string;
  intervalMinutes: number;
  handler: () => Promise<void> | void;
  lastRunAt: number | null;
}

export class CronRunner {
  private playbookRunner: PlaybookRunner;
  private jobs: CronJob[] = [];
  private maintenanceTasks: MaintenanceTask[] = [];
  private cronFile: string;
  private smokeMode: boolean;

  constructor(playbookRunner: PlaybookRunner) {
    this.playbookRunner = playbookRunner;
    this.cronFile = dataPath('cron.json');
    this.smokeMode = process.env.SMOKE_MODE === '1';
    this.loadJobs();
    
    if (this.smokeMode) {
      console.log('[CronRunner] SMOKE_MODE=1 detected. Cron ticking disabled.');
      return;
    }

    // Simple interval-based runner for demo (real cron would use a library like 'node-cron')
    setInterval(() => this.tick(), 60000); // Check every minute
  }

  private loadJobs() {
    if (fs.existsSync(this.cronFile)) {
      this.jobs = JSON.parse(fs.readFileSync(this.cronFile, 'utf8'));
    }
  }

  private saveJobs() {
    const dir = path.dirname(this.cronFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.cronFile, JSON.stringify(this.jobs, null, 2));
  }

  addJob(job: CronJob) {
    this.jobs.push(job);
    this.saveJobs();
  }

  listJobs() {
    return this.jobs;
  }

  toggleJob(id: string, enabled: boolean) {
    const job = this.jobs.find(j => j.id === id);
    if (job) {
      job.enabled = enabled;
      this.saveJobs();
    }
  }

  registerMaintenanceTask(id: string, intervalMinutes: number, handler: () => Promise<void> | void) {
    const existing = this.maintenanceTasks.find(task => task.id === id);
    if (existing) {
      existing.intervalMinutes = intervalMinutes;
      existing.handler = handler;
      return;
    }

    this.maintenanceTasks.push({
      id,
      intervalMinutes,
      handler,
      lastRunAt: null,
    });
  }

  private async tick() {
    console.log('[CronRunner] Ticking...');
    const now = Date.now();

    // In a real implementation, we'd check schedules here.
    // For now, let's just log.
    for (const job of this.jobs) {
      if (job.enabled) {
        // Trigger if schedule matches (simplified)
        console.log(`[CronRunner] Evaluating job ${job.id} for playbook ${job.playbookId}`);
        // In a real app: this.playbookRunner.run(...)
        void this.playbookRunner;
      }
    }

    for (const task of this.maintenanceTasks) {
      const intervalMs = Math.max(task.intervalMinutes, 1) * 60_000;
      if (task.lastRunAt && now - task.lastRunAt < intervalMs) {
        continue;
      }

      task.lastRunAt = now;
      try {
        await task.handler();
      } catch (error) {
        console.error(`[CronRunner] Maintenance task failed: ${task.id}`, error);
      }
    }
  }
}
