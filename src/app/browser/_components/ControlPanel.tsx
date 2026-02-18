import { useState } from 'react';
import { 
    Play, Square, ChevronLeft, ChevronRight, RotateCcw, 
    Send, Cpu, Layout, AlertOctagon, History,
    Youtube, BarChart3, Film, Cookie, BookOpen
} from 'lucide-react';

export function ControlPanel({ safeMode }: { safeMode: boolean }) {
    const [isEnabled, setIsEnabled] = useState(false);
    const [url, setUrl] = useState('');
    const [task, setTask] = useState('');
    const [selectedAgent, setSelectedAgent] = useState('research-bot');

    const handleEnableToggle = async () => {
        // const action = isEnabled ? 'browser_stop' : 'browser_start';
        setIsEnabled(!isEnabled);
    };

    const handleNavigate = async () => {
        if (!url) return;
    };

    const presets = [
        { id: 'yt-search', label: 'Search YouTube', icon: <Youtube className="w-3 h-3" />, template: "Search YouTube for documentaries on [topic]. Find 3 relevant videos and note their URLs." },
        { id: 'comp-stats', label: 'Competitor Stats', icon: <BarChart3 className="w-3 h-3" />, template: "Analyze the YouTube channel [channel]. Extract views, subscriber count, and recent upload frequency." },
        { id: 'stock-find', label: 'Find Stock Footage', icon: <Film className="w-3 h-3" />, template: "Find stock footage on Pexels or Pixabay for the topic: [topic]. Provide direct links to downloads." },
    ];

    const vaultPresets = [
        { id: 'fact-verify', label: 'Verify Facts', icon: <BookOpen className="w-3 h-3" />, template: "Verify the accuracy of these historical facts from today's batch: [facts]. Cross-reference with Wikipedia." },
        { id: 'yt-cookies', label: 'Refresh Cookies', icon: <Cookie className="w-3 h-3" />, template: "Navigate to youtube.com to check if session cookies are active and valid. Report back session status." }
    ];

    return (
        <div className="flex flex-col h-full gap-6 scrollbar-hide">
            {/* Section A: Browser Controls */}
            <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none mb-1">SECTION A</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">System Controls</p>
                    </div>
                    <button 
                        onClick={handleEnableToggle}
                        disabled={safeMode}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
                            ${isEnabled 
                                ? 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/50' 
                                : 'bg-emerald-500 text-black ring-1 ring-emerald-400'
                            } disabled:opacity-50 disabled:grayscale`}
                    >
                        {isEnabled ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                        {safeMode ? 'Disabled in Safe Mode' : (isEnabled ? 'Stop Browser' : 'Enable Browser')}
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <StatusCard icon={<Cpu className="w-3 h-3" />} label="Chromium" value="v114.0.5735" />
                    <StatusCard icon={<Layout className="w-3 h-3" />} label="Tabs" value="1 Active" />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                        <NavBtn icon={<ChevronLeft className="w-4 h-4" />} />
                        <NavBtn icon={<ChevronRight className="w-4 h-4" />} />
                        <NavBtn icon={<RotateCcw className="w-4 h-4" />} />
                    </div>
                    <div className="flex-1 flex bg-black/40 rounded-lg border border-white/5 focus-within:border-blue-500/50 transition-all overflow-hidden group">
                        <input 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                            className="bg-transparent text-xs text-zinc-300 px-3 py-2 flex-1 outline-none font-mono"
                        />
                        <button 
                            onClick={handleNavigate}
                            className="px-3 text-[10px] font-bold text-blue-400 hover:bg-white/5 border-l border-white/5 transition-colors uppercase tracking-widest"
                        >
                            Go
                        </button>
                    </div>
                </div>
            </div>

            {/* Section B: Assign Task */}
            <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-5 space-y-4 flex-1 flex flex-col">
                <div>
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none mb-1">SECTION B</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Assign Task to Agent</p>
                </div>

                <div className="flex flex-col gap-4 flex-1">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-800 rounded-lg border border-white/5 flex items-center justify-center text-zinc-500">
                             <History className="w-4 h-4" />
                        </div>
                        <select 
                            value={selectedAgent}
                            onChange={(e) => setSelectedAgent(e.target.value)}
                            className="bg-black/40 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-zinc-300 flex-1 outline-none"
                        >
                            <option value="research-bot">ResearchBot (Browser Specialist)</option>
                            <option value="writer-bot">WriterBot</option>
                        </select>
                    </div>

                    <div className="relative flex-1 group">
                        <textarea 
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                            placeholder="e.g. Go to YouTube and find the top 3 history documentary channels..."
                            className="w-full h-full min-h-[120px] bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-zinc-300 outline-none focus:border-amber-500/50 transition-all resize-none font-medium placeholder:text-zinc-600"
                        />
                        <button 
                            className="absolute bottom-4 right-4 bg-amber-500 text-black p-2 rounded-lg shadow-xl shadow-amber-500/20 hover:scale-110 active:scale-95 transition-all"
                            title="Assign Task"
                        >
                             <Send className="w-4 h-4 fill-current" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">QUICK PRESETS</p>
                            <div className="flex flex-wrap gap-2">
                                {presets.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => setTask(p.template)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-white/5 text-[10px] text-zinc-400 hover:text-white transition-all capitalize"
                                    >
                                        {p.icon}
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Imperial Vault Presets */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest">IMPERIAL VAULT TASKS</p>
                                <div className="h-px flex-1 bg-amber-500/10" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {vaultPresets.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => setTask(p.template)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/5 hover:bg-amber-500/10 rounded-lg border border-amber-500/10 text-[10px] text-amber-200 hover:text-amber-100 transition-all"
                                    >
                                        {p.icon}
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {safeMode && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-4">
                    <AlertOctagon className="w-6 h-6 text-rose-500 shrink-0" />
                    <div>
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-0.5">Safe Mode Engaged</p>
                        <p className="text-[10px] text-rose-300 opacity-70 leading-tight">Direct browser tool hooks are restricted. Switch to live gateway for full CDP control.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                {icon}
                {label}
            </div>
            <div className="text-xs font-mono text-zinc-300">{value}</div>
        </div>
    );
}

function NavBtn({ icon }: { icon: React.ReactNode }) {
    return (
        <button className="p-1 px-1.5 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
            {icon}
        </button>
    );
}
