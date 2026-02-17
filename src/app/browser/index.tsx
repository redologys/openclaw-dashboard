import { BrowserPreview } from './_components/BrowserPreview';
import { ControlPanel } from './_components/ControlPanel';
import { TaskQueue } from './_components/TaskQueue';

export default function BrowserPage() {
    return (
        <div className="flex-1 flex flex-col min-h-0 h-screen bg-transparent p-6 gap-6 overflow-hidden">
            {/* Header */}
            <header className="flex flex-col shrink-0">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <h1 className="text-xl font-black text-white uppercase tracking-tighter">Browser Command Center</h1>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-500 font-medium">Headless Chromium CDP Controller — Secure Remote Visual Bridge</p>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gateway Connected</span>
                        </div>
                        <div className="h-3 w-px bg-white/10" />
                        <div className="text-[10px] font-mono text-zinc-600 tracking-tighter">
                            LATENCY: 42ms
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* Visual Preview - Left Side (8/12) */}
                <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0">
                    <BrowserPreview />
                </div>

                {/* Controls & Queue - Right Side (4/12) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 min-h-0 overflow-y-auto scrollbar-hide">
                    <div className="shrink-0">
                        <ControlPanel />
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <TaskQueue />
                    </div>
                </div>
            </div>

            {/* Sub-footer / Stats */}
            <footer className="shrink-0 flex items-center justify-between px-2">
                <div className="flex items-center gap-6">
                    <Stat label="CPU" value="12%" />
                    <Stat label="MEM" value="1.2GB" />
                    <Stat label="FPS" value="30" />
                </div>
                <div className="text-[10px] text-zinc-600 font-medium uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                    Encrypted over SSH Logic-Tunnel
                </div>
            </footer>
        </div>
    );
}

function Stat({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
            <span className="text-[10px] font-mono text-zinc-400">{value}</span>
        </div>
    );
}
