import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { Music, Play } from 'lucide-react';

export default function MusicPage() {
  const tracks = [
      { id: 1, title: 'Epic Chase Enhancement', artist: 'Audiomachine', viralScore: 98, used: 12 },
      { id: 2, title: 'Mystery Unfolds', artist: 'Kevin MacLeod', viralScore: 85, used: 8 },
      { id: 3, title: 'Cyber War', artist: 'Aim To Head', viralScore: 92, used: 15 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <IVBreadcrumb />
        <h1 className="text-2xl font-bold text-zinc-100 mt-2">Music Intelligence</h1>
        <p className="text-zinc-500">Viral audio tracking and performance metrics.</p>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/5 text-xs uppercase text-zinc-500 font-medium">
                  <tr>
                      <th className="px-6 py-3">Track</th>
                      <th className="px-6 py-3">Artist</th>
                      <th className="px-6 py-3">Viral Score</th>
                      <th className="px-6 py-3">Usage Count</th>
                      <th className="px-6 py-3">Actions</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                  {tracks.map(track => (
                      <tr key={track.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 font-medium text-zinc-200 flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-amber-400 transition-colors">
                                  <Music className="w-4 h-4" />
                              </div>
                              {track.title}
                          </td>
                          <td className="px-6 py-4 text-zinc-400">{track.artist}</td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                  <span className="text-emerald-400 font-mono">{track.viralScore}</span>
                                  <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500" style={{ width: `${track.viralScore}%` }} />
                                  </div>
                              </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-400">{track.used} videos</td>
                          <td className="px-6 py-4">
                              <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors">
                                  <Play className="w-4 h-4" />
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
}
