import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { Flame, Trophy, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function Calendar() {
  const days = Array.from({ length: 35 }, (_, i) => {
    const day = i + 1;
    const isPast = i < 18;
    const isToday = i === 18;
    const hasContent = isPast || isToday;
    const score = hasContent ? Math.floor(Math.random() * 5000) + 1000 : 0;
    const status: 'posted' | 'rendering' | 'draft' | 'none' = datus(i);
    
    return { day, hasContent, isToday, score, status };
  });

  function datus(i: number) {
    if (i < 18) return 'posted';
    if (i === 18) return 'rendering';
    if (i === 19) return 'draft';
    return 'none';
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <BackButton />
          <IVBreadcrumb />
          <h1 className="text-2xl font-bold text-zinc-100 mt-2">Content Calendar</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-zinc-500">Production Schedule & Streak Tracking</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-500">
              <Flame className="w-3 h-3 fill-current" />
              <span className="font-bold">12 Day Streak</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-500">
              <Trophy className="w-3 h-3" />
              <span className="font-bold">Personal Best: 24</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
           <button className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              Schedule Batch
           </button>
           <button className="px-3 py-1.5 bg-amber-500 text-black font-medium rounded-lg text-sm hover:bg-amber-400 transition-colors">
              + New Slot
           </button>
        </div>
      </div>

      {/* Consistency Heatmap */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            Consistency History (Last 6 Months)
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-zinc-600">
             <span>Less</span>
             <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-zinc-800" />
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/20" />
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/40" />
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
             </div>
             <span>More</span>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap overflow-hidden h-24">
           {Array.from({ length: 180 }).map((_, i) => (
             <div 
               key={i} 
               className={clsx(
                 "w-2.5 h-2.5 rounded-sm transition-colors cursor-help",
                 Math.random() > 0.3 ? "bg-amber-500" : "bg-zinc-800",
                 i > 150 && "opacity-40"
               )}
               style={{ opacity: Math.random() * 0.8 + 0.2 }}
               title={`Day -${i}: Generated 4 videos`}
             />
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
            <div className="grid grid-cols-7 gap-4 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-zinc-500 text-xs font-semibold uppercase tracking-wider">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-4">
                {days.map((d, i) => (
                    <div key={i} className={clsx(
                        "aspect-square rounded-xl border flex flex-col items-center justify-between p-2 relative group transition-all duration-300",
                        d.isToday ? 'bg-amber-500/5 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'bg-black/20 border-white/5',
                        d.status === 'posted' ? 'hover:border-emerald-500/30' : 'hover:border-white/10'
                    )}>
                        <div className="flex justify-between w-full">
                          <span className={clsx("text-xs font-medium", d.isToday ? 'text-amber-400' : 'text-zinc-500')}>{d.day % 30 || 30}</span>
                          {d.status === 'posted' && <CheckCircle2 className="w-3 h-3 text-emerald-500/40" />}
                          {d.status === 'rendering' && <Clock className="w-3 h-3 text-amber-500 animate-pulse" />}
                          {d.status === 'draft' && <AlertCircle className="w-3 h-3 text-blue-500/40" />}
                        </div>
                        
                        {d.hasContent && (
                            <div className="text-[10px] font-mono text-zinc-600 transition-colors group-hover:text-zinc-400">
                                {d.score > 0 ? `${(d.score / 1000).toFixed(1)}k` : '-'}
                            </div>
                        )}

                        {d.isToday && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-zinc-950 z-10" />
                        )}
                    </div>
                ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
            <h3 className="text-zinc-200 font-medium mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Live Performance Feed
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Ancient Rome Secrets', time: '2h ago', views: '45.2k', viral: 1.8 },
                { label: 'Legion Dark Side', time: '8h ago', views: '12.1k', viral: 0.9 },
                { label: 'Space Marine Trivia', time: '1d ago', views: '102.5k', viral: 4.2 },
              ].map((item, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-zinc-300 font-medium truncate group-hover:text-amber-400 transition-colors">{item.label}</span>
                    <span className="text-[10px] text-zinc-600 whitespace-nowrap">{item.time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-zinc-600" />
                      <span className="text-[10px] text-zinc-500 font-mono">{item.views} views</span>
                    </div>
                    <div className={clsx(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      item.viral > 2 ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                    )}>
                      V: {item.viral}x
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 bg-white/5 hover:bg-white/10 text-xs text-zinc-400 rounded-lg transition-colors border border-white/5">
              View Analytics Details
            </button>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
            <h3 className="text-zinc-200 font-medium mb-3 text-sm">Upcoming Slots</h3>
            <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg border border-white/5">
                  <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-500 font-bold">19</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 truncate font-medium">Space Marine Secrets</div>
                    <div className="text-[10px] text-zinc-500">Scheduled for 10:00 AM</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg border border-white/5 opacity-60">
                  <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-xs text-zinc-500 font-bold">20</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-zinc-300 truncate font-medium">Grimdark Architecture</div>
                    <div className="text-[10px] text-zinc-500">Awaiting Script...</div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
