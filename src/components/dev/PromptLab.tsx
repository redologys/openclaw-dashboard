import { useState } from 'react';
import { Beaker, Save, RotateCcw, Sparkles, Code, MessageSquare, Shield } from 'lucide-react';
import { clsx } from 'clsx';

interface PromptVersion {
    active: boolean;
    id: string;
    timestamp: string;
    content: string;
    author: string;
}

export function PromptLab() {
    const [activePrompt, setActivePrompt] = useState(`You are the OpenClaw Imperial Historian. 
Your goal is to extract verified historical facts from provided documents.
Constraints:
- Only use primary sources.
- Format results as JSON.
- Maintain a formal tone.`);

    const [versions] = useState<PromptVersion[]>([
        { id: 'v1', active: false, timestamp: '2024-02-15 10:00', content: 'Base historical extractor prompt...', author: 'System' },
        { id: 'v2', active: true, timestamp: '2024-02-16 14:30', content: 'Updated with verification logic...', author: 'Admin' },
    ]);

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor Panel */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-zinc-900 border border-white/5 rounded-xl flex flex-col h-[500px]">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <Beaker className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-zinc-200">System Instructions Editor</h3>
                                <p className="text-[10px] text-zinc-500">Persona: Imperial Historian</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className={clsx(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all",
                                    isSaving ? "bg-zinc-800 text-zinc-500" : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950"
                                )}
                            >
                                <Save className="w-3.5 h-3.5" />
                                {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
                            </button>
                        </div>
                    </div>
                    
                    <textarea 
                        value={activePrompt}
                        onChange={(e) => setActivePrompt(e.target.value)}
                        className="flex-1 bg-transparent p-6 text-sm font-mono text-zinc-300 focus:outline-none resize-none leading-relaxed"
                        spellCheck={false}
                    />

                    <div className="p-3 border-t border-white/5 flex items-center justify-between bg-zinc-950/30">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                <Code className="w-3 h-3" />
                                Markdown Supported
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                <Sparkles className="w-3 h-3" />
                                AI Optimized
                            </div>
                        </div>
                        <div className="text-[10px] text-zinc-500">
                            {activePrompt.length} characters
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Test Sandbox</h4>
                        <p className="text-[11px] text-zinc-400 mt-1">
                            Use the Brain Sandbox below to test how these instructions affect agent responses in real-time.
                        </p>
                    </div>
                </div>
            </div>

            {/* Sidebar: History & Settings */}
            <div className="space-y-6">
                <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Version History</h3>
                    <div className="space-y-3">
                        {versions.map(v => (
                            <div key={v.id} className={clsx(
                                "p-3 rounded-lg border transition-all cursor-pointer group",
                                v.active ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-800/50 border-white/5 hover:border-white/10"
                            )}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-zinc-200">{v.id}</span>
                                    {v.active && <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded uppercase font-bold">Active</span>}
                                </div>
                                <p className="text-[10px] text-zinc-500 truncate">{v.content}</p>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                    <span className="text-[9px] text-zinc-600 font-mono">{v.timestamp}</span>
                                    <span className="text-[9px] text-zinc-600">by {v.author}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 rounded-xl p-5">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Guardrails</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Strict Factuality</span>
                            <div className="w-8 h-4 bg-emerald-500 rounded-full relative">
                                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-lg" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Source Citations Required</span>
                            <div className="w-8 h-4 bg-emerald-500 rounded-full relative">
                                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-lg" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Creativity / Temperature</span>
                            <span className="font-mono text-zinc-500 text-[10px]">0.1</span>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 italic">
                            <Shield className="w-3 h-3 text-amber-500" />
                            These settings override global model defaults.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
