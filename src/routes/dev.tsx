import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Database,
  FileJson,
  RefreshCw,
  Shield,
  Terminal,
} from 'lucide-react';
import { SecurityAlertItem } from '../lib/types';

type ConflictResolution = 'pending' | 'keep_existing' | 'use_imported' | 'merge_both';

interface WorkspaceImportConflict {
  id: string;
  key: 'agents' | 'subagents' | 'skills' | 'workflows' | 'crons' | 'swarms';
  targetFile: string;
  name: string;
  existing: Record<string, unknown>;
  imported: Record<string, unknown>;
  resolution: ConflictResolution;
  createdAt: string;
}

interface WorkspaceImportReport {
  timestamp: string;
  success: boolean;
  summary: {
    agents: { found: number; imported: number; skipped: number; conflicts: number };
    subagents: { found: number; imported: number; skipped: number };
    skills: { found: number; imported: number; skipped: number };
    workflows: { found: number; imported: number; skipped: number };
    crons: { found: number; imported: number; skipped: number };
    swarms: { found: number; imported: number; skipped: number };
    imperialVault: { detected: boolean; agents: string[] };
  };
  conflicts: WorkspaceImportConflict[];
  errors: string[];
}

type DevTab = 'import' | 'security' | 'logs';

export default function Dev() {
  const [activeTab, setActiveTab] = useState<DevTab>('import');
  const [report, setReport] = useState<WorkspaceImportReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [resolvingConflictId, setResolvingConflictId] = useState<string | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlertItem[]>([]);
  const [safeMode, setSafeMode] = useState<boolean>(true);

  useEffect(() => {
    void loadReport();
    void loadSecurityAlerts();
    void loadGatewayStatus();
  }, []);

  const pendingConflicts = useMemo(
    () => (report?.conflicts ?? []).filter((conflict) => conflict.resolution === 'pending'),
    [report],
  );

  const loadGatewayStatus = async () => {
    try {
      const res = await fetch('/api/gateway/status');
      if (!res.ok) return;
      const payload = (await res.json()) as { safeMode?: boolean };
      setSafeMode(Boolean(payload.safeMode));
    } catch {
      // keep default
    }
  };

  const loadReport = async () => {
    setLoadingReport(true);
    setReportError(null);
    try {
      const res = await fetch('/api/import/status');
      if (!res.ok) throw new Error('Failed to load import report.');
      const payload = (await res.json()) as WorkspaceImportReport | { available?: boolean; message?: string };
      if ('available' in payload && payload.available === false) {
        setReport(null);
        return;
      }
      setReport(payload as WorkspaceImportReport);
    } catch (error: any) {
      setReportError(error.message ?? 'Failed to load import report.');
    } finally {
      setLoadingReport(false);
    }
  };

  const runImportNow = async () => {
    setLoadingReport(true);
    setReportError(null);
    try {
      const res = await fetch('/api/import/run', { method: 'POST' });
      if (!res.ok) throw new Error('Import run failed.');
      const payload = (await res.json()) as WorkspaceImportReport;
      setReport(payload);
    } catch (error: any) {
      setReportError(error.message ?? 'Import run failed.');
    } finally {
      setLoadingReport(false);
    }
  };

  const resolveConflict = async (
    conflictId: string,
    resolution: Exclude<ConflictResolution, 'pending'>,
  ) => {
    setResolvingConflictId(conflictId);
    try {
      const res = await fetch(`/api/import/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? 'Conflict resolution failed.');
      }
      const payload = (await res.json()) as WorkspaceImportReport;
      setReport(payload);
    } catch (error: any) {
      setReportError(error.message ?? 'Conflict resolution failed.');
    } finally {
      setResolvingConflictId(null);
    }
  };

  const loadSecurityAlerts = async () => {
    try {
      const res = await fetch('/api/skills/security-alerts');
      if (!res.ok) return;
      setSecurityAlerts((await res.json()) as SecurityAlertItem[]);
    } catch {
      // no-op
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-6">
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Terminal className="h-6 w-6 text-emerald-400" />
            Developer Console
          </h1>
        </div>
        <span
          className={`rounded-md border px-3 py-1 text-xs uppercase tracking-wide ${
            safeMode
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
          }`}
        >
          {safeMode ? 'Safe Mode' : 'Live Mode'}
        </span>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <TabButton
          active={activeTab === 'import'}
          onClick={() => setActiveTab('import')}
          icon={<Database className="h-4 w-4" />}
          label="Import Log"
        />
        <TabButton
          active={activeTab === 'security'}
          onClick={() => setActiveTab('security')}
          icon={<Shield className="h-4 w-4" />}
          label="Security Alerts"
        />
        <TabButton
          active={activeTab === 'logs'}
          onClick={() => setActiveTab('logs')}
          icon={<FileJson className="h-4 w-4" />}
          label="System Logs"
        />
      </div>

      <div className="min-h-[520px] rounded-xl border border-white/10 bg-zinc-950/80 p-6">
        {activeTab === 'import' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Workspace Import Report</h2>
                <p className="text-xs text-zinc-500">
                  Tracks imported agents, skills, workflows, cron jobs, and conflict decisions.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadReport}
                  disabled={loadingReport}
                  className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingReport ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={runImportNow}
                  disabled={loadingReport}
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <Database className="h-4 w-4" />
                  Run Import
                </button>
              </div>
            </div>

            {reportError && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {reportError}
              </div>
            )}

            {!report && !loadingReport && (
              <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-6 text-sm text-zinc-400">
                No import report found yet. Run an import to initialize `data/import_report.json`.
              </div>
            )}

            {report && (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <ImportStatCard title="Agents" found={report.summary.agents.found} imported={report.summary.agents.imported} skipped={report.summary.agents.skipped} />
                  <ImportStatCard title="Skills" found={report.summary.skills.found} imported={report.summary.skills.imported} skipped={report.summary.skills.skipped} />
                  <ImportStatCard title="Workflows" found={report.summary.workflows.found} imported={report.summary.workflows.imported} skipped={report.summary.workflows.skipped} />
                  <ImportStatCard title="Sub-agents" found={report.summary.subagents.found} imported={report.summary.subagents.imported} skipped={report.summary.subagents.skipped} />
                  <ImportStatCard title="Cron Jobs" found={report.summary.crons.found} imported={report.summary.crons.imported} skipped={report.summary.crons.skipped} />
                  <ImportStatCard title="Swarms" found={report.summary.swarms.found} imported={report.summary.swarms.imported} skipped={report.summary.swarms.skipped} />
                </div>

                <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-100">Imperial Vault Detection</h3>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        report.summary.imperialVault.detected
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {report.summary.imperialVault.detected ? 'Detected' : 'Not Detected'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Agents detected: {report.summary.imperialVault.agents.length > 0 ? report.summary.imperialVault.agents.join(', ') : 'none'}
                  </p>
                </div>

                {pendingConflicts.length > 0 && (
                  <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                    <h3 className="text-sm font-semibold text-amber-200">Conflicts Detected ({pendingConflicts.length})</h3>
                    {pendingConflicts.map((conflict) => (
                      <div key={conflict.id} className="rounded-md border border-white/10 bg-black/30 p-3">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-medium text-zinc-100">{conflict.name}</div>
                            <div className="text-xs text-zinc-500">
                              Type: {conflict.key} | Target: {conflict.targetFile}
                            </div>
                          </div>
                          <div className="text-xs text-zinc-500">{new Date(conflict.createdAt).toLocaleString()}</div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <JsonPreview title="Existing" payload={conflict.existing} />
                          <JsonPreview title="Imported" payload={conflict.imported} />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => resolveConflict(conflict.id, 'keep_existing')}
                            disabled={resolvingConflictId === conflict.id}
                            className="rounded border border-zinc-600 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                          >
                            Keep Existing
                          </button>
                          <button
                            onClick={() => resolveConflict(conflict.id, 'use_imported')}
                            disabled={resolvingConflictId === conflict.id}
                            className="rounded border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
                          >
                            Use Imported
                          </button>
                          <button
                            onClick={() => resolveConflict(conflict.id, 'merge_both')}
                            disabled={resolvingConflictId === conflict.id}
                            className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            Merge Both
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-zinc-100">Import Errors</h3>
                  {report.errors.length === 0 ? (
                    <div className="text-xs text-zinc-500">No errors recorded.</div>
                  ) : (
                    <ul className="space-y-1 text-xs text-rose-300">
                      {report.errors.map((error, index) => (
                        <li key={`${error}-${index}`} className="flex items-start gap-2">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-100">Security Monitor Alerts</h2>
            {securityAlerts.length === 0 && (
              <div className="rounded-md border border-white/10 bg-zinc-900/60 p-4 text-sm text-zinc-500">
                No security alerts recorded.
              </div>
            )}
            {securityAlerts.map((alert) => (
              <div key={alert.id} className="rounded-md border border-white/10 bg-zinc-900/60 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-100">{alert.title}</span>
                  <span
                    className={
                      alert.severity === 'high'
                        ? 'text-rose-300'
                        : alert.severity === 'medium'
                          ? 'text-amber-300'
                          : 'text-emerald-300'
                    }
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">{alert.details}</p>
                <p className="mt-1 text-[11px] text-zinc-500">{new Date(alert.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2 font-mono text-xs text-zinc-400">
            <p>[{new Date().toISOString()}] [INFO] Developer console ready.</p>
            <p>[{new Date().toISOString()}] [INFO] Import API available at /api/import/*</p>
            <p>[{new Date().toISOString()}] [INFO] Security feed source: /api/skills/security-alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
        active
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
          : 'border-white/10 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ImportStatCard({
  title,
  found,
  imported,
  skipped,
}: {
  title: string;
  found: number;
  imported: number;
  skipped: number;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-100">{title}</span>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">Found: {found}</span>
      </div>
      <div className="space-y-1 text-xs">
        <StatLine label="Imported" value={imported} className="text-emerald-300" />
        <StatLine label="Skipped" value={skipped} className="text-amber-300" />
      </div>
    </div>
  );
}

function StatLine({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-500">{label}</span>
      <span className={className}>{value}</span>
    </div>
  );
}

function JsonPreview({ title, payload }: { title: string; payload: Record<string, unknown> }) {
  return (
    <div className="rounded border border-white/10 bg-zinc-950/80 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-300">
        <CheckCircle2 className="h-3.5 w-3.5 text-zinc-500" />
        {title}
      </div>
      <pre className="max-h-44 overflow-auto text-[10px] text-zinc-400">{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}
