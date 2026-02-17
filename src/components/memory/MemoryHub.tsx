import { useState, useEffect } from 'react';
import { 
  Brain, 
  Database, 
  Search, 
  HardDrive, 
  Trash2, 
  Download, 
  RefreshCw, 
  Plus,
  Key,
  FileText,
  Share2,
  ShieldCheck,
  Orbit,
  Clock3
} from 'lucide-react';
import { MemoryTimelineItem, SmartSearchResult } from '../../lib/types';

interface MemoryEntry {
  id: string;
  key: string;
  value: any;
  agentId: string;
  type: 'kv' | 'document' | 'embedding';
  createdAt: string;
  tags: string[];
}

export function MemoryHub() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'all' | 'kv' | 'documents'>('all');
  const [smartResults, setSmartResults] = useState<SmartSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [timeline, setTimeline] = useState<MemoryTimelineItem[]>([]);
  const [memoryError, setMemoryError] = useState<string | null>(null);

  // Mock data for initial UI
  useEffect(() => {
    setEntries([
      { id: '1', key: 'historical_vault_index', value: 'v2.4.1', agentId: 'historian-01', type: 'kv', createdAt: new Date().toISOString(), tags: ['vault', 'index'] },
      { id: '2', key: 'user_preferences_imperial', value: { theme: 'dark', access: 'admin' }, agentId: 'system-ops', type: 'kv', createdAt: new Date().toISOString(), tags: ['user', 'config'] },
      { id: '3', key: 'batch_processing_manifest', value: 'Pending check of 5 files', agentId: 'batch-agent', type: 'document', createdAt: new Date().toISOString(), tags: ['batch', 'manifest'] },
    ]);
  }, []);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        const res = await fetch('/api/memory/timeline');
        if (!res.ok) throw new Error(`Timeline request failed (${res.status})`);
        const payload = (await res.json()) as MemoryTimelineItem[];
        setTimeline(payload);
      } catch (err: any) {
        setMemoryError(err.message ?? 'Failed to load memory timeline.');
      }
    };

    void loadTimeline();
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSmartResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/memory/smart-search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error(`Smart search failed (${res.status})`);
        const payload = (await res.json()) as SmartSearchResult[];
        setSmartResults(payload);
        setMemoryError(null);
      } catch (err: any) {
        setMemoryError(err.message ?? 'Smart search failed.');
      } finally {
        setSearchLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const filteredEntries = entries.filter(e => 
    (view === 'all' || (view === 'kv' && e.type === 'kv') || (view === 'documents' && e.type === 'document')) &&
    (e.key.toLowerCase().includes(searchQuery.toLowerCase()) || e.agentId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-zinc-900/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <Brain className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Memory Hub</h1>
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Long-term Intelligence Storage</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl border border-white/5 transition-all text-sm font-bold">
              <RefreshCw className="w-4 h-4" />
              Re-index
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl shadow-lg shadow-amber-500/20 transition-all text-sm font-bold">
              <Plus className="w-4 h-4" />
              New Entry
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <MemoryStat label="Total Keys" value="1,284" icon={<Key className="w-4 h-4 text-amber-500" />} />
          <MemoryStat label="Documents" value="48" icon={<FileText className="w-4 h-4 text-blue-500" />} />
          <MemoryStat label="Embeddings" value="2.4M" icon={<Share2 className="w-4 h-4 text-emerald-500" />} />
          <MemoryStat label="Storage" value="124 MB" icon={<HardDrive className="w-4 h-4 text-purple-500" />} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Chaos-mind smart search across memory and sessions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setView('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'all' ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              All
            </button>
            <button 
              onClick={() => setView('kv')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'kv' ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              K-V Store
            </button>
            <button 
              onClick={() => setView('documents')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'documents' ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Documents
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="inline-flex items-center gap-1.5">
            <Orbit className="w-3.5 h-3.5 text-cyan-400" />
            chaos-mind smart matches: {smartResults.length}
          </div>
          {searchLoading && <div className="text-zinc-500">Searching...</div>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {smartResults.length > 0 && (
          <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="text-xs uppercase tracking-wider text-cyan-300 mb-3">Smart Search Results</div>
            <div className="space-y-2">
              {smartResults.map((result) => (
                <div key={result.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-zinc-500">
                    <span>{result.title}</span>
                    <span>score: {Math.round(result.score * 100)}%</span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-200">{result.snippet}</p>
                  <div className="mt-1 text-[10px] text-zinc-500">{result.source}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/50 text-zinc-500 uppercase text-[10px] font-bold tracking-widest border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Key / Identifier</th>
                <th className="px-6 py-4">Owner Agent</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Security Level</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEntries.map(entry => (
                <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        entry.type === 'kv' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {entry.type === 'kv' ? <Key className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-200 group-hover:text-amber-400 transition-colors uppercase tracking-tight">{entry.key}</div>
                        <div className="flex gap-2 mt-1">
                          {entry.tags.map(tag => (
                            <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded uppercase font-bold tracking-tighter">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-400 font-mono text-[11px]">{entry.agentId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${entry.type === 'kv' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                       <span className="text-zinc-300 capitalize">{entry.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-emerald-500 text-xs">
                       <ShieldCheck className="w-3 h-3" />
                       ENCRYPTED
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 text-xs">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white/5 text-zinc-500 hover:text-zinc-200 rounded-lg">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEntries.length === 0 && (
            <div className="p-12 text-center">
              <Database className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <div className="text-zinc-500">No memory entries found matching your search.</div>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/30 p-4">
          <div className="text-xs uppercase tracking-wider text-zinc-400 mb-3 inline-flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5 text-violet-300" />
            Continuity Memory Timeline
          </div>
          <div className="space-y-2">
            {timeline.length === 0 && <div className="text-sm text-zinc-500">No timeline entries available yet.</div>}
            {timeline.map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wide">
                  <span>{item.title}</span>
                  <span>confidence {Math.round(item.confidence * 100)}%</span>
                </div>
                <p className="mt-1 text-sm text-zinc-200">{item.summary}</p>
                <div className="mt-1 text-[10px] text-zinc-500">{new Date(item.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {memoryError && <div className="mt-3 text-xs text-rose-400">{memoryError}</div>}
      </div>
    </div>
  );
}

function MemoryStat({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
      <div>
        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">{label}</div>
        <div className="text-2xl font-bold text-zinc-100">{value}</div>
      </div>
      <div className="p-3 bg-zinc-800/50 rounded-xl">
        {icon}
      </div>
    </div>
  );
}
