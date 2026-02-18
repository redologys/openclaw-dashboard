import { useState } from 'react';
import { Play, Download, RefreshCw, Eye, Layers, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { useGatewayStatus } from '../../lib/useGatewayStatus';

interface FactV2 {
    id: string;
    text: string;
    score: number;
    rendered?: boolean;
    overlayUrl?: string;
}

export function OverlayStudio() {
    const { status } = useGatewayStatus(5000);
    const safeMode = status.safeMode;

    const [facts, setFacts] = useState<FactV2[]>([
        { id: '1', text: 'The Roman Empire used a complex system of roads that spanned over 250,000 miles.', score: 8 },
        { id: '2', text: 'Vikings didn’t actually wear horned helmets in battle; this was a later myth.', score: 7 },
        { id: '3', text: 'The Great Wall of China is not visible from space with the naked eye.', score: 9 },
    ]);
    const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const selectedFact = facts.find(f => f.id === selectedFactId);

    const handleRender = async () => {
        if (!selectedFact) return;
        
        if (safeMode) {
            console.warn('[OverlayStudio] SAFE_MODE active. Render blocked.');
            setIsRendering(true);
            setTimeout(() => {
                setPreviewUrl(`https://via.placeholder.com/1080x1920/1a1a1a/amber?text=SAFE_MODE_ACTIVE`);
                setIsRendering(false);
            }, 1000);
            return;
        }

        setIsRendering(true);
        
        try {
            const response = await fetch('/api/ssh/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command: `python3 /home/ubuntu/imperial-vault/scripts/render_overlay.py --text "${selectedFact.text}" --output /home/ubuntu/imperial-vault/output/${selectedFact.id}.png`
                })
            });
            
            if (!response.ok) throw new Error('Render failed');
            
            // Mock preview update
            setTimeout(() => {
                setPreviewUrl(`https://via.placeholder.com/1080x1920/1a1a1a/amber?text=${encodeURIComponent(selectedFact.text.substring(0, 20))}...`);
                setIsRendering(false);
            }, 3000);
            
        } catch (error) {
            console.error('Render error:', error);
            setIsRendering(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
            {/* Sidebar: Fact Selector */}
            <div className="lg:col-span-4 space-y-4">
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Select Fact to Render
                    </h3>
                    
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {facts.map(fact => (
                            <button
                                key={fact.id}
                                onClick={() => setSelectedFactId(fact.id)}
                                className={clsx(
                                    "w-full text-left p-4 rounded-lg border transition-all group",
                                    selectedFactId === fact.id 
                                        ? "bg-amber-500/10 border-amber-500/50" 
                                        : "bg-zinc-950/50 border-white/5 hover:border-white/10"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-mono text-zinc-500">ID: {fact.id}</span>
                                    <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Score: {fact.score}</span>
                                </div>
                                <p className="text-sm text-zinc-300 line-clamp-2 group-hover:text-zinc-100 transition-colors">
                                    {fact.text}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

                {selectedFact && (
                    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-2">
                        <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Fact Details
                        </h3>
                        <textarea 
                            className="w-full bg-zinc-950 border border-white/5 rounded-lg p-3 text-sm text-zinc-300 h-32 focus:outline-none focus:border-amber-500/50 transition-colors"
                            value={selectedFact.text}
                            onChange={(e) => {
                                setFacts(facts.map(f => f.id === selectedFact.id ? { ...f, text: e.target.value } : f));
                            }}
                        />
                        <div className="mt-4 flex gap-2">
                            <button 
                                onClick={handleRender}
                                disabled={isRendering}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {isRendering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                {isRendering ? 'Rendering...' : 'Render Overlay'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content: Preview */}
            <div className="lg:col-span-8">
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 h-full flex flex-col min-h-[700px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-medium text-zinc-200 flex items-center gap-2">
                            <Eye className="w-5 h-5 text-amber-500" />
                            Live Preview
                        </h3>
                        {previewUrl && (
                            <button className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded flex items-center gap-2 transition-colors">
                                <Download className="w-3.5 h-3.5" />
                                Download PNG
                            </button>
                        )}
                    </div>

                    <div className="flex-1 bg-zinc-950 border border-white/5 rounded-lg overflow-hidden relative flex items-center justify-center group">
                        {isRendering && (
                            <div className="absolute inset-0 z-10 bg-zinc-950/80 flex flex-col items-center justify-center backdrop-blur-sm">
                                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
                                <p className="text-amber-500 font-mono text-sm animate-pulse tracking-widest">EXECUTING RENDER SCRIPT...</p>
                            </div>
                        )}

                        {safeMode && (
                            <div className="absolute top-4 left-4 z-20 bg-rose-500/10 border border-rose-500/50 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2">
                                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Safe Mode Active</span>
                            </div>
                        )}
                        
                        {previewUrl ? (
                            <img 
                                src={previewUrl} 
                                alt="Overlay Preview" 
                                className="max-w-full max-h-full object-contain shadow-2xl"
                            />
                        ) : (
                            <div className="text-center space-y-3 p-10">
                                <Layers className="w-12 h-12 text-zinc-800 mx-auto" />
                                <p className="text-zinc-600 text-sm">Select a fact and click Render to generate a preview.</p>
                            </div>
                        )}
                        
                        {/* Overlay Guidelines Over Mock Image */}
                        {previewUrl && (
                            <div className="absolute inset-0 pointer-events-none border border-amber-500/10 border-dashed" />
                        )}
                    </div>
                    
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="bg-zinc-950/50 border border-white/5 p-3 rounded-lg">
                            <span className="block text-[10px] text-zinc-600 uppercase mb-1 font-bold">Resolution</span>
                            <span className="text-sm text-zinc-400 font-mono">1080 x 1920</span>
                        </div>
                        <div className="bg-zinc-950/50 border border-white/5 p-3 rounded-lg">
                            <span className="block text-[10px] text-zinc-600 uppercase mb-1 font-bold">Font</span>
                            <span className="text-sm text-zinc-400 font-mono">Imperial Bold</span>
                        </div>
                        <div className="bg-zinc-950/50 border border-white/5 p-3 rounded-lg">
                            <span className="block text-[10px] text-zinc-600 uppercase mb-1 font-bold">Safe Zone</span>
                            <span className="text-sm text-emerald-500 font-mono">Active (90%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
