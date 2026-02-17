import { useEffect, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Zap, 
  Activity, 
  Users, 
  Layers,
  Sparkles,
  ArrowUpRight,
  Target,
  ShieldCheck
} from 'lucide-react';
import { SwarmVisualizer } from './SwarmVisualizer';
import { ContextHealthSnapshot } from '../../lib/types';

export function AnalyticsDashboard() {
  const [activeView, setActiveView] = useState<'overview' | 'swarms' | 'performance'>('overview');
  const [contextHealth, setContextHealth] = useState<ContextHealthSnapshot | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadContextHealth = async () => {
      try {
        const res = await fetch('/api/skills/context-health');
        if (!res.ok) return;
        const payload = (await res.json()) as ContextHealthSnapshot;
        if (!mounted) return;
        setContextHealth(payload);
      } catch (err) {
        console.error('Failed to load context health history:', err);
      }
    };

    void loadContextHealth();
    const timer = window.setInterval(() => {
      void loadContextHealth();
    }, 20_000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-zinc-900/10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <BarChart3 className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100 uppercase tracking-tight">Intelligence Analytics</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">Performance & Pipeline Telemetry</p>
            </div>
          </div>
          
          <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-white/5 shadow-2xl">
            <ViewTab active={activeView === 'overview'} onClick={() => setActiveView('overview')} label="Overview" icon={<Activity className="w-3.5 h-3.5" />} />
            <ViewTab active={activeView === 'swarms'} onClick={() => setActiveView('swarms')} label="Swarm Mesh" icon={<Layers className="w-3.5 h-3.5" />} />
            <ViewTab active={activeView === 'performance'} onClick={() => setActiveView('performance')} label="Efficiency" icon={<Zap className="w-3.5 h-3.5" />} />
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-4 gap-6">
          <MetricCard 
            label="Weekly Credits" 
            value="12.4k" 
            trend="+14%" 
            isUp={true} 
            icon={<DollarSign className="w-5 h-5 text-emerald-500" />} 
          />
          <MetricCard 
            label="Inference Load" 
            value="42 ops/m" 
            trend="-2%" 
            isUp={false} 
            icon={<Zap className="w-5 h-5 text-amber-500" />} 
          />
          <MetricCard 
            label="Task Success" 
            value="98.2%" 
            trend="+0.5%" 
            isUp={true} 
            icon={<Target className="w-5 h-5 text-blue-500" />} 
          />
          <MetricCard 
            label="Memory Saturation" 
            value="34%" 
            trend="+4%" 
            isUp={true} 
            icon={<TrendingUp className="w-5 h-5 text-purple-500" />} 
          />
        </div>
      </div>

      {/* Main Analysis Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {activeView === 'overview' && (
          <>
            <div className="grid grid-cols-3 gap-6">
               <div className="col-span-2 bg-zinc-900/20 border border-white/5 rounded-3xl p-6 h-[400px] flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                       <TrendingUp className="w-4 h-4 text-emerald-500" />
                       Throughput Projection
                    </h3>
                    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950 rounded-full text-[10px] text-zinc-500 font-bold border border-white/5">
                       Last 24 Hours
                    </div>
                  </div>
                  <div className="flex-1 flex items-end gap-2 px-2">
                    {/* Mock Graph Bars */}
                    {[40, 60, 45, 70, 85, 60, 90, 100, 80, 95, 110, 120, 100, 90, 110].map((h, i) => (
                      <div key={i} className="flex-1 group relative">
                        <div 
                           style={{ height: `${h}%` }} 
                           className={`w-full rounded-t-lg transition-all duration-1000 ${
                             i === 11 ? 'bg-amber-500' : 'bg-zinc-800 group-hover:bg-zinc-700'
                           }`} 
                        />
                        {i === 11 && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-black px-2 py-1 rounded-lg">
                            PEAK
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-700 font-black uppercase tracking-widest px-1">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>23:59</span>
                  </div>
               </div>

               <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6 flex flex-col">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-8">
                       <Users className="w-4 h-4 text-blue-500" />
                       Agent Activity Heatmap
                  </h3>
                  <div className="flex-1 grid grid-cols-5 gap-2">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`rounded-lg border border-white/5 transition-all hover:scale-105 cursor-pointer ${
                          i % 3 === 0 ? 'bg-amber-500/20 blur-[1px]' : 'bg-zinc-900/50'
                        }`}
                        title={`Node ${i} Activity: ${Math.floor(Math.random() * 100)}%`}
                      />
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-zinc-950 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                       <span className="text-zinc-500 uppercase">Top Performer</span>
                       <span className="text-amber-500">HISTORIAN-ALPHA</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8">
                 <Sparkles className="w-24 h-24 text-amber-500/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
               </div>
               <div className="relative">
                 <h2 className="text-xl font-bold text-zinc-100 mb-2">Automated Optimization Insights</h2>
                 <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed mb-6">
                   Our neural monitor detected a 12% inefficiency in the <span className="text-amber-500 underline decoration-amber-500/30">YouTube Metadata</span> pipeline. 
                   Switching to <span className="text-emerald-500 font-bold">GPT-4o-Mini</span> for initial triage could save approximately <span className="text-zinc-100 font-bold">$42/mo</span> without affecting recall quality.
                 </p>
                 <button className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl">
                   Apply recommendation
                   <ArrowUpRight className="w-4 h-4" />
                 </button>
               </div>
            </div>

            <div className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Sophie Compaction History
                </h3>
                <div className="text-xs text-zinc-500">
                  {contextHealth?.safeMode ? 'SAFE_MODE' : 'LIVE'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {contextHealth?.history.slice(-4).map((item) => (
                    <div key={item.timestamp} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest">
                        <span>{item.action}</span>
                        <span>{item.utilizationPct}%</span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-300">{new Date(item.timestamp).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Current Context Load</div>
                  <div className="mt-1 text-3xl font-black text-zinc-100">{contextHealth?.utilizationPct ?? '--'}%</div>
                  <div className="mt-2 text-xs text-zinc-400">Auto-compact at {contextHealth?.compactionThresholdPct ?? 75}%.</div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeView === 'swarms' && (
          <div className="h-[600px] border border-white/5 rounded-3xl bg-zinc-950 overflow-hidden relative">
            <SwarmVisualizer />
          </div>
        )}
      </div>
    </div>
  );
}

function ViewTab({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
        active 
          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
          : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MetricCard({ label, value, trend, isUp, icon }: { label: string, value: string, trend: string, isUp: boolean, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-amber-500/20 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-zinc-950 rounded-2xl border border-white/5">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
          isUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-1">{label}</div>
        <div className="text-3xl font-black text-zinc-100 tracking-tighter">{value}</div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-150 transition-transform duration-700">
        {icon}
      </div>
    </div>
  );
}
