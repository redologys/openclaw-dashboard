import { Globe, RefreshCw, Clock } from 'lucide-react';

interface BrowserStatusBarProps {
  url: string;
  active: boolean;
  agentName: string | null;
  lastUpdated: string | null;
  onRefresh: () => void;
}

export function BrowserStatusBar({ url, active, agentName, lastUpdated, onRefresh }: BrowserStatusBarProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* URL Bar */}
      <div className="flex items-center gap-3 bg-zinc-900 border border-white/5 rounded-lg px-4 py-2 ring-1 ring-white/5">
        <Globe className="w-4 h-4 text-zinc-500" />
        <div className="flex-1 bg-transparent text-sm text-zinc-300 font-mono truncate select-all">
          {url}
        </div>
        <button 
          onClick={onRefresh}
          className="p-1.5 hover:bg-white/5 rounded-md text-zinc-400 hover:text-white transition-all active:scale-95"
          title="Force refresh screenshot"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                {active ? 'Browser Active' : 'Browser Idle'}
            </span>
          </div>
          {active && agentName && (
            <div className="h-3 w-px bg-white/10 mx-1" />
          )}
          {active && agentName && (
            <span className="text-[10px] text-zinc-500">
              Controlled by <span className="text-amber-500 font-semibold">{agentName}</span>
            </span>
          )}
        </div>

        {lastUpdated && (
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">Updated {lastUpdated}</span>
          </div>
        )}
      </div>
    </div>
  );
}
