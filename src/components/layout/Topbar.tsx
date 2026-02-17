import { useState } from 'react';
import { Layout, Wifi, WifiOff, PlusSquare } from 'lucide-react';
import { ThemePicker } from '../ui/theme-picker';

interface TopbarProps {
  currentLayout: string;
  layouts: string[];
  onLayoutChange: (id: string) => void;
  gatewayConnected: boolean;
  serverConnected: boolean;
}

export function Topbar({ currentLayout, layouts, onLayoutChange, gatewayConnected, serverConnected }: TopbarProps) {
  const [capturePending, setCapturePending] = useState(false);

  const handleQuickCapture = async () => {
    const note = window.prompt('Quick capture (BrainRepo):');
    if (!note || note.trim().length === 0) return;

    try {
      setCapturePending(true);
      const res = await fetch('/api/memory/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? `Capture failed (${res.status})`);
      window.alert(payload.message ?? 'Quick capture completed.');
    } catch (err: any) {
      window.alert(err.message ?? 'Quick capture failed.');
    } finally {
      setCapturePending(false);
    }
  };

  return (
    <div className="h-12 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-zinc-400">
           <Layout className="w-4 h-4" />
           <select 
             value={currentLayout}
             onChange={(e) => onLayoutChange(e.target.value)}
             className="bg-transparent border-none text-sm font-medium text-zinc-200 focus:ring-0 cursor-pointer"
           >
             {layouts.map(l => (
               <option key={l} value={l} className="bg-zinc-900">{l.charAt(0).toUpperCase() + l.slice(1)}</option>
             ))}
           </select>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button
          onClick={() => {
            void handleQuickCapture();
          }}
          disabled={capturePending}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200 hover:bg-amber-500/20 disabled:opacity-60"
        >
          <PlusSquare className="w-3.5 h-3.5" />
          {capturePending ? 'Capturing...' : 'Quick Capture'}
        </button>

        {/* Connection Health Indicators */}
        <div className="flex items-center space-x-4 text-xs font-mono">
            <div className="flex items-center space-x-1.5" title="Browser <-> Server">
                <div className={`w-2 h-2 rounded-full ${serverConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`} />
                <span className={serverConnected ? 'text-zinc-400' : 'text-red-400'}>APP</span>
            </div>
            
            <div className="w-px h-3 bg-white/10" />

            <div className="flex items-center space-x-1.5" title="Server <-> OpenClaw Gateway">
                {gatewayConnected ? (
                    <Wifi className="w-3 h-3 text-emerald-500" />
                ) : (
                    <WifiOff className="w-3 h-3 text-amber-500" />
                )}
                <span className={gatewayConnected ? 'text-zinc-400' : 'text-amber-500'}>GATEWAY</span>
            </div>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <ThemePicker />
      </div>
    </div>
  );
}
