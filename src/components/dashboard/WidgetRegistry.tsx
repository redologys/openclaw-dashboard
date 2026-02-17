import { WidgetConfig } from '../../lib/types';
import { MissionControl } from '../ops/MissionControl';

import { TerminalWidget } from '../imperial/TerminalWidget';
import { OverlayStudio } from '../imperial/OverlayStudio';
import { ViralScoreDebugger } from '../imperial/ViralScoreDebugger';
import { ReasoningTrace } from '../dev/ReasoningTrace';
import { PermissionManager } from '../ops/PermissionManager';
import { ContextHealthWidget, LiveActivityWidget, SystemResourcesWidget } from './SkillWidgets';

// Placeholder components for now
const SystemWidget = ({ config }: { config: WidgetConfig }) => (
  <div className="h-full bg-zinc-900/50 p-4 border border-white/5 rounded-lg flex items-center justify-center">
    <div className="text-center">
      <div className="text-2xl font-mono text-emerald-500 mb-1">42%</div>
      <div className="text-xs text-zinc-500 uppercase tracking-wider">{config.title}</div>
    </div>
  </div>
);

const AiWidget = ({ config }: { config: WidgetConfig }) => (
  <div className="h-full bg-zinc-900/50 p-4 border border-white/5 rounded-lg flex items-center justify-center">
    <div className="text-center">
       <div className="text-2xl font-mono text-purple-400 mb-1">1,240</div>
       <div className="text-xs text-zinc-500 uppercase tracking-wider">{config.title}</div>
    </div>
  </div>
);

const DebugWidget = ({ config }: { config: WidgetConfig }) => (
  <div className="h-full bg-zinc-950 font-mono text-xs p-2 overflow-auto text-zinc-400">
    <div className="mb-2 text-amber-500 border-b border-amber-500/20 pb-1">{config.title}</div>
    <div>10:00:01 [INFO] Connected to Gateway</div>
    <div>10:00:02 [WARN] Latency spike detected (120ms)</div>
    <div>10:00:05 [INFO] Heartbeat received</div>
  </div>
);

import { Shield } from 'lucide-react';

const SecurityWidget = ({ config }: { config: WidgetConfig }) => (
  <div className="h-full bg-zinc-900/50 p-4 border border-white/5 rounded-lg flex flex-col justify-center">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-emerald-500/10 rounded-full">
        <Shield className="w-5 h-5 text-emerald-500" />
      </div>
      <div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider">{config.title}</div>
        <div className="text-sm font-bold text-emerald-400">STATUS: SECURE</div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 mt-2">
      <div className="bg-black/20 p-2 rounded border border-white/5">
        <div className="text-[10px] text-zinc-500 uppercase">Approvals</div>
        <div className="text-sm font-mono text-zinc-300">0 PENDING</div>
      </div>
      <div className="bg-black/20 p-2 rounded border border-white/5">
        <div className="text-[10px] text-zinc-500 uppercase">Alerts</div>
        <div className="text-sm font-mono text-zinc-300">0 ACTIVE</div>
      </div>
    </div>
  </div>
);

interface WidgetRendererProps {
  config: WidgetConfig;
}

export function WidgetRenderer({ config }: WidgetRendererProps) {
  const renderContent = () => {
    switch (config.type) {
        case 'system-cpu':
        case 'system-memory':
        case 'system-disk':
        case 'docker-status':
            return <SystemWidget config={config} />;
        
        case 'ai-token-gauge':
        case 'ai-api-status':
            return <AiWidget config={config} />;

        case 'mission-control':
      return <MissionControl dataMode={config.dataMode} />;
    case 'gateway-debug':
      return <DebugWidget config={config} />;
    case 'permission-manager':
      return <PermissionManager config={config} />;
    case 'security-health':
      return <SecurityWidget config={config} />;
    case 'context-health':
      return <ContextHealthWidget />;
    case 'live-activity':
      return <LiveActivityWidget />;
    case 'system-resources':
      return <SystemResourcesWidget />;
    case 'terminal':
      return <TerminalWidget />;
    case 'overlay-studio':
      return <OverlayStudio />;
    case 'viral-score':
      return <ViralScoreDebugger />;
    case 'reasoning-trace':
      return <ReasoningTrace />;
    default:
      return <div className="p-4 text-red-500">Unknown widget type: {config.type}</div>;
    }
  };

  return (
    <>
      {renderContent()}
    </>
  );
}
