import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { TrendingUp, Users, Target, Zap, ArrowUpRight, BarChart3, Globe, Flame } from 'lucide-react';

export default function Intel() {
  const competitors = [
      { name: 'LoremMaster', subs: '1.2M', growth: '+5%', topVideo: 'The Hidden Truth', views: '450k', score: 88 },
      { name: 'FactVault', subs: '890k', growth: '+2%', topVideo: 'Top 10 Secrets', views: '210k', score: 72 },
      { name: 'HistoryShorts', subs: '2.5M', growth: '+12%', topVideo: 'Ancient Rome in 60s', views: '1.2M', score: 95 },
  ];

  const trends = [
    { topic: 'Roman Engineering', intensity: 90, velocity: '+12%' },
    { topic: '40k Lore', intensity: 75, velocity: '+5%' },
    { topic: 'Medieval Siege', intensity: 60, velocity: '-2%' },
    { topic: 'Victorian Curios', intensity: 45, velocity: '+8%' },
    { topic: 'Samurai Rituals', intensity: 30, velocity: '+15%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <BackButton />
          <IVBreadcrumb />
          <h1 className="text-2xl font-bold text-zinc-100 mt-2">Competitor Intelligence</h1>
          <p className="text-zinc-500">Market analysis and real-time trend detection.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Global Scan
           </button>
           <button className="px-3 py-1.5 bg-amber-500 text-black font-medium rounded-lg text-sm hover:bg-amber-400 transition-all flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analyze Trends
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Trend Matrix Heatmap */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Niche Trend Matrix
              </h3>
              <div className="flex gap-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                <span>7D Analysis</span>
                <span>Viral Projection</span>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-5">
                {trends.map((trend, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium">{trend.topic}</span>
                      <span className="text-emerald-400 font-mono">{trend.velocity}</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500/20 to-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                        style={{ width: `${trend.intensity}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Competitor Grid */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
               <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                   <h3 className="font-medium text-zinc-200 text-sm">Tracked Channels</h3>
                   <span className="text-[10px] text-zinc-500 bg-black/40 border border-white/5 px-2 py-1 rounded uppercase font-bold tracking-tighter">Last scan: 2h ago</span>
               </div>
               <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead className="text-zinc-500 border-b border-white/5 bg-black/20 text-[11px] uppercase tracking-wider font-bold">
                           <tr>
                               <th className="px-6 py-4">Channel</th>
                               <th className="px-6 py-4">Growth (7d)</th>
                               <th className="px-6 py-4">Top Short</th>
                               <th className="px-6 py-4">Viral Index</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                           {competitors.map((comp, i) => (
                               <tr key={i} className="hover:bg-amber-500/5 transition-colors group">
                                   <td className="px-6 py-5">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-400 group-hover:border-amber-500/30">
                                          {comp.name[0]}
                                        </div>
                                        <div>
                                          <div className="text-zinc-200 font-medium">{comp.name}</div>
                                          <div className="text-[10px] text-zinc-500">{comp.subs} subs</div>
                                        </div>
                                      </div>
                                   </td>
                                   <td className="px-6 py-5">
                                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                        <ArrowUpRight className="w-3 h-3" />
                                        {comp.growth}
                                      </div>
                                   </td>
                                   <td className="px-6 py-5">
                                      <div className="max-w-[140px] truncate text-zinc-400 group-hover:text-amber-400 transition-colors">{comp.topVideo}</div>
                                      <div className="text-[10px] text-zinc-600">{comp.views} views</div>
                                   </td>
                                   <td className="px-6 py-5">
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 w-12 bg-zinc-800 rounded-full overflow-hidden">
                                          <div className="h-full bg-amber-500" style={{ width: `${comp.score}%` }} />
                                        </div>
                                        <span className="text-xs font-mono text-zinc-400">{comp.score}</span>
                                      </div>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Automated Gap Detection */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-12 h-12 text-amber-500" />
            </div>
            <h3 className="text-zinc-200 font-medium mb-4 flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-amber-500" />
                Gap Detection
            </h3>
            <div className="space-y-4">
               {[
                 { title: 'The Fall of Cadia', match: '85%', detail: 'High demand, zero shorts in last 14d' },
                 { title: 'Custodes Rituals', match: '72%', detail: 'Trending #warhammer tags, no coverage' },
               ].map((gap, i) => (
                 <div key={i} className="p-3 bg-black/20 border border-white/5 rounded-lg hover:border-amber-500/30 transition-colors cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-medium text-zinc-300">{gap.title}</span>
                      <span className="text-[10px] font-bold text-amber-500">{gap.match} Match</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">{gap.detail}</p>
                 </div>
               ))}
            </div>
            <button className="w-full mt-6 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-[10px] text-amber-500 uppercase tracking-widest font-bold rounded-lg transition-colors border border-amber-500/20">
              Generate Briefs
            </button>
          </div>

          {/* Hook Analysis */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
              <h3 className="text-zinc-200 font-medium mb-4 flex items-center gap-2 text-sm">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Top Viral Hooks
              </h3>
              <div className="space-y-4">
                  {[
                    { hook: '"The one thing they never told you about..."', rate: '+42% Ret' },
                    { hook: '"This is why the Emperor hides..."', rate: '+35% Ret' },
                    { hook: '"3 Secrets forgotten for 10,000 years"', rate: '+28% Ret' },
                  ].map((hook, i) => (
                    <div key={i} className="flex justify-between items-center p-2 hover:bg-white/5 rounded transition-all group">
                      <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200 italic">"{hook.hook}"</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold whitespace-nowrap">{hook.rate}</span>
                    </div>
                  ))}
              </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
              <h3 className="text-zinc-200 font-medium mb-4 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-purple-500" />
                  Audience Overlap
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                  High correlation detected between your subscribers and viewers of <b className="text-zinc-300">FactVault</b>. 
                  <span className="block mt-2 text-[10px] text-purple-400">Suggests pivot to: Dark History / Occultism</span>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}
