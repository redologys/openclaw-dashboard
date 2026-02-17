import { useState } from 'react';
import { 
  Database,
  Code,
  Zap,
  CheckCircle2,
  Box,
  Terminal,
  Activity,
  Clock
} from 'lucide-react';
import { ChatMessage } from '../../lib/types';

interface XRayPanelProps {
  messages: ChatMessage[];
  loading: boolean;
}

export function XRayPanel({ messages, loading }: XRayPanelProps) {
  const [activeTab, setActiveTab] = useState<'trace' | 'tools' | 'logs' | 'stats'>('trace');
  
  const lastAgentMessage = [...messages].reverse().find(m => m.senderType === 'agent');

  return (
    <div className="h-full flex flex-col bg-zinc-950 font-mono text-xs">
      {/* Sub Tabs */}
      <div className="flex border-b border-white/5">
        <TabButton 
          active={activeTab === 'trace'} 
          onClick={() => setActiveTab('trace')} 
          icon={<Zap className="w-3 h-3" />} 
          label="Thinking Trace" 
        />
        <TabButton 
          active={activeTab === 'tools'} 
          onClick={() => setActiveTab('tools')} 
          icon={<Box className="w-3 h-3" />} 
          label="Tool Calls" 
        />
        <TabButton 
          active={activeTab === 'logs'} 
          onClick={() => setActiveTab('logs')} 
          icon={<Terminal className="w-3 h-3" />} 
          label="Raw Logs" 
        />
        <TabButton 
          active={activeTab === 'stats'} 
          onClick={() => setActiveTab('stats')} 
          icon={<Activity className="w-3 h-3" />} 
          label="Performance" 
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'trace' && (
          <div className="space-y-4">
            {lastAgentMessage?.thinkingTrace ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-500/80 text-[10px] uppercase font-bold">
                  <Clock className="w-3 h-3" />
                  Reasoning Process
                </div>
                <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-lg text-zinc-400 leading-relaxed whitespace-pre-wrap">
                  {lastAgentMessage.thinkingTrace}
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center gap-2 text-zinc-600 italic">
                <Activity className="w-3 h-3 animate-pulse" />
                Interpreting neural activations...
              </div>
            ) : (
              <div className="text-zinc-600 italic text-center py-10">
                No reasoning trace available for current context.
              </div>
            )}
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-4">
            {lastAgentMessage?.toolCalls && lastAgentMessage.toolCalls.length > 0 ? (
              lastAgentMessage.toolCalls.map((tc) => {
                const result = lastAgentMessage.toolResults?.find(tr => tr.toolCallId === tc.id);
                return (
                  <div key={tc.id} className="border border-white/5 rounded-lg overflow-hidden bg-zinc-900/40">
                    <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/80 border-b border-white/5">
                      <div className="flex items-center gap-2 text-amber-400 font-bold">
                        <Code className="w-3.5 h-3.5" />
                        {tc.toolId}
                      </div>
                      <div className="text-[9px] text-zinc-500">{tc.id}</div>
                    </div>
                    <div className="p-3 space-y-3">
                      <div>
                        <div className="text-[9px] text-zinc-600 uppercase mb-1">Arguments</div>
                        <pre className="text-zinc-300 text-[10px] bg-black/30 p-2 rounded border border-white/5">
                          {JSON.stringify(tc.args, null, 2)}
                        </pre>
                      </div>
                      {result && (
                        <div>
                          <div className="text-[9px] text-zinc-600 uppercase mb-1">Output</div>
                          <pre className="text-zinc-400 text-[10px] bg-black/30 p-2 rounded border border-white/5">
                            {JSON.stringify(result.result, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-zinc-600 italic text-center py-10">
                No tool executions tracked.
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-500 text-[9px] mb-2 border-b border-white/5 pb-2">
              <span className="text-amber-500">[SYSTEM]</span> LOG VERSION 1.0.4-DEBUG
            </div>
            {messages.slice(-5).map((m, idx) => (
              <div key={idx} className="flex gap-2 text-[10px] py-1 border-b border-white/5 last:border-0">
                <span className="text-zinc-600 shrink-0">[{new Date(m.createdAt).toLocaleTimeString()}]</span>
                <span className={`shrink-0 uppercase font-bold ${m.senderType === 'user' ? 'text-blue-500' : 'text-amber-500'}`}>
                  {m.senderType}
                </span>
                <span className="text-zinc-400 break-all">{m.text.substring(0, 150)}...</span>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 text-[10px] py-1 animate-pulse">
                 <span className="text-zinc-600">[{new Date().toLocaleTimeString()}]</span>
                 <span className="text-amber-500 uppercase font-bold">EVENT</span>
                 <span className="text-zinc-500 italic">Awaiting AI streaming response payload...</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 gap-4">
            <StatCard 
              label="Latency" 
              value="1,492ms" 
              subValue="Response time" 
              icon={<Clock className="w-4 h-4 text-emerald-500" />} 
            />
            <StatCard 
              label="Efficiency" 
              value="84 tokens/s" 
              subValue="Stream optimization" 
              icon={<Zap className="w-4 h-4 text-amber-500" />} 
            />
            <StatCard 
              label="Tool Success" 
              value="100%" 
              subValue="1/1 Executed" 
              icon={<CheckCircle2 className="w-4 h-4 text-blue-500" />} 
            />
            <StatCard 
              label="Memory Usage" 
              value="24kb" 
              subValue="Current session k-v" 
              icon={<Database className="w-4 h-4 text-zinc-400" />} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 flex items-center gap-2 border-r border-white/5 transition-colors ${
        active ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {active && <div className="ml-auto w-1 h-1 bg-amber-500 rounded-full" />}
    </button>
  );
}

function StatCard({ label, value, subValue, icon }: { label: string, value: string, subValue: string, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
      <div>
        <div className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest mb-1">{label}</div>
        <div className="text-xl font-bold text-zinc-100">{value}</div>
        <div className="text-[10px] text-zinc-500">{subValue}</div>
      </div>
      <div className="p-3 bg-zinc-800/50 rounded-lg">
        {icon}
      </div>
    </div>
  );
}
