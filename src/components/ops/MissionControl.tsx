import { Activity, AlertOctagon, Terminal, User } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'log' | 'error' | 'cmd' | 'chat';
  message: string;
  agent?: string;
  timestamp: string;
  severity?: 'info' | 'warn' | 'error';
}

const MOCK_ACTIVITY: ActivityItem[] = [
    { id: '1', type: 'cmd', message: 'Executed skill: web-search', agent: 'ResearchBot', timestamp: '10:00:23', severity: 'info' },
    { id: '2', type: 'chat', message: 'Analyzed competitor pricing models', agent: 'ResearchBot', timestamp: '10:00:25', severity: 'info' },
    { id: '3', type: 'error', message: 'Rate limit exceeded for search provider', agent: 'System', timestamp: '10:01:12', severity: 'error' },
    { id: '4', type: 'log', message: 'Cron job "daily-digest" started', timestamp: '10:05:00', severity: 'info' },
];

export function MissionControl({ dataMode }: { dataMode?: 'mock' | 'live' }) {
    const items = dataMode === 'mock' ? MOCK_ACTIVITY : []; 

    return (
        <div className="h-full flex flex-col font-mono text-xs">
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scroller">
                {items.length === 0 && <div className="text-zinc-500 italic text-center mt-4">No activity</div>}
                {items.map((item) => (
                    <div key={item.id} className="flex items-start space-x-2 group hover:bg-white/5 p-1 rounded transition-colors cursor-pointer">
                        <div className="mt-0.5 shrink-0 opacity-70">
                            {item.type === 'error' && <AlertOctagon className="w-3 h-3 text-red-500" />}
                            {item.type === 'cmd' && <Terminal className="w-3 h-3 text-emerald-500" />}
                            {item.type === 'chat' && <User className="w-3 h-3 text-sky-500" />}
                            {item.type === 'log' && <Activity className="w-3 h-3 text-zinc-500" />}
                        </div>
                        <div className="min-w-0 flex-1">
                             <div className="flex items-center justify-between">
                                <span className={`truncate ${item.severity === 'error' ? 'text-red-400' : 'text-zinc-300'}`}>
                                    {item.message}
                                </span>
                                <span className="text-[10px] text-zinc-600 shrink-0 ml-2">{item.timestamp}</span>
                             </div>
                             {item.agent && (
                                <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center">
                                    <span className="w-1 h-1 rounded-full bg-zinc-600 mr-1.5" />
                                    {item.agent}
                                </div>
                             )}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Quick Actions Footer */}
            <div className="shrink-0 p-2 border-t border-white/5 bg-black/20 flex items-center justify-between">
                 <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Gateway Connected" />
                    <span className="text-[10px] text-zinc-500">LIVE</span>
                 </div>
                 <button className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-zinc-400 transition-colors">
                    Filter
                 </button>
            </div>
        </div>
    );
}
