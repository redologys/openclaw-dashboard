import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { Download, Film, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export default function Footage() {
  const clips = [
      { id: 'clip-101', title: 'Space Marine Combat 4k', source: 'YouTube', status: 'ready', duration: '15s' },
      { id: 'clip-102', title: 'Ancient Ruins Drone Shot', source: 'Pexels', status: 'ready', duration: '12s' },
      { id: 'clip-103', title: 'Cyberpunk City Night', source: 'YouTube', status: 'downloading', progress: 45, duration: '20s' },
      { id: 'clip-104', title: 'Medieval Battle Scene', source: 'Vimeo', status: 'error', error: 'Geo-restricted', duration: '-' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <IVBreadcrumb />
        <h1 className="text-2xl font-bold text-zinc-100 mt-2">Footage Manager</h1>
        <p className="text-zinc-500">Source clip queue and validation status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="text-zinc-200 font-medium flex items-center gap-2">
                      <Film className="w-4 h-4 text-emerald-500" />
                      Active Queue
                  </h3>
                  <button className="text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors flex items-center gap-2">
                      <Download className="w-3 h-3" />
                      Download All Ready
                  </button>
              </div>

              <div className="space-y-3">
                  {clips.map(clip => (
                      <div key={clip.id} className="bg-zinc-900/50 border border-white/5 rounded-lg p-4 flex items-center justify-between group hover:border-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-black/40 rounded flex items-center justify-center text-zinc-600">
                                  <Film className="w-5 h-5" />
                              </div>
                              <div>
                                  <h4 className="text-zinc-200 font-medium text-sm">{clip.title}</h4>
                                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                      <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{clip.source}</span>
                                      <span>{clip.duration}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="text-right">
                              {clip.status === 'ready' && (
                                  <span className="flex items-center gap-1 text-emerald-500 text-xs bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                      <CheckCircle className="w-3 h-3" /> Ready
                                  </span>
                              )}
                              {clip.status === 'downloading' && (
                                  <div className="lex flex-col items-end gap-1">
                                      <span className="text-xs text-amber-400 flex items-center gap-1">
                                          <Clock className="w-3 h-3 animate-spin" /> {clip.progress}%
                                      </span>
                                      <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                          <div className="h-full bg-amber-500" style={{ width: `${clip.progress}%` }} />
                                      </div>
                                  </div>
                              )}
                              {clip.status === 'error' && (
                                  <span className="flex items-center gap-1 text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                                      <AlertTriangle className="w-3 h-3" /> {clip.error}
                                  </span>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="space-y-6">
               <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                   <h3 className="text-zinc-200 font-medium mb-4">Sourcing Stats</h3>
                   <div className="space-y-4">
                       <div className="flex justify-between text-sm">
                           <span className="text-zinc-500">Total Sourced (Today)</span>
                           <span className="text-zinc-200">15 clips</span>
                       </div>
                       <div className="flex justify-between text-sm">
                           <span className="text-zinc-500">Avg. Duration</span>
                           <span className="text-zinc-200">14.2s</span>
                       </div>
                       <div className="flex justify-between text-sm">
                           <span className="text-zinc-500">Success Rate</span>
                           <span className="text-emerald-400">92%</span>
                       </div>
                   </div>
               </div>
          </div>
      </div>
    </div>
  );
}
