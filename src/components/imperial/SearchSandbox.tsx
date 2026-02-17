import { useState } from 'react';
import { Search, Globe, Filter, Play, ExternalLink, Image, Film, RefreshCw } from 'lucide-react';

interface SearchResult {
    title: string;
    url: string;
    type: 'image' | 'video' | 'article';
    thumbnail?: string;
    description: string;
}

export function SearchSandbox() {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);

    const handleSearch = () => {
        if (!query) return;
        setIsSearching(true);
        // Mock search results
        setTimeout(() => {
            setResults([
                {
                    title: 'Roman Legionary Equipment and Tactics',
                    url: 'https://example.com/roman-legion',
                    type: 'article',
                    description: 'Detailed analysis of the weapons and armor used by late Roman legionaries.'
                },
                {
                    title: 'Boudica\'s Uprising: A Visual History',
                    url: 'https://example.com/boudica',
                    type: 'video',
                    thumbnail: 'https://via.placeholder.com/320x180/1a1a1a/amber?text=Boudica+Video',
                    description: 'High-quality reconstruction of the battle of Watling Street.'
                },
                {
                    title: 'Ancient Celtic Ornamentation Patterns',
                    url: 'https://example.com/celtic-patterns',
                    type: 'image',
                    thumbnail: 'https://via.placeholder.com/320x320/1a1a1a/amber?text=Celtic+Pattern',
                    description: 'SVG pattern collection for historical overlays.'
                }
            ]);
            setIsSearching(false);
        }, 1200);
    };

    return (
        <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                            type="text"
                            placeholder="Sandbox Query: e.g. 'cinematic footage of roman shields'"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-zinc-950 border border-white/5 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
                        />
                    </div>
                    <button 
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-zinc-950 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all min-w-[140px]"
                    >
                        {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {isSearching ? 'SEARCHING...' : 'RUN QUERY'}
                    </button>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                    {['Source: Brave', 'Safe Search: Off', 'Region: US', 'Freshness: 24h'].map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-zinc-800 text-zinc-500 text-[10px] font-bold rounded flex items-center gap-1.5 uppercase tracking-tighter">
                            <Filter className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((result: SearchResult, i: number) => (
                        <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden group hover:border-amber-500/30 transition-all shadow-xl">
                            {result.thumbnail && (
                                <div className="aspect-video relative overflow-hidden bg-zinc-950">
                                    <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-2 right-2">
                                        <span className="px-1.5 py-0.5 bg-zinc-950/80 backdrop-blur-md rounded text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                            {result.type === 'video' ? <Film className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                                            {result.type}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="p-4 space-y-2">
                                <h4 className="text-sm font-bold text-zinc-200 line-clamp-1">{result.title}</h4>
                                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{result.description}</p>
                                <div className="pt-2 flex items-center justify-between border-t border-white/5">
                                    <span className="text-[10px] font-mono text-zinc-600 truncate max-w-[150px]">{result.url}</span>
                                    <button className="text-amber-500 hover:text-amber-400 transition-colors">
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!isSearching && results.length === 0 && (
                <div className="bg-zinc-900/30 border border-dashed border-white/5 rounded-xl py-20 text-center">
                    <Search className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                    <p className="text-zinc-500 max-w-sm mx-auto">
                        Test your footage search queries here before committing them to the automated pipeline agents.
                    </p>
                </div>
            )}
        </div>
    );
}
