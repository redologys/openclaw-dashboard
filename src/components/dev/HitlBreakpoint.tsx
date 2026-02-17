import { Shield, AlertTriangle, CheckCircle, XCircle, Info, Lock } from 'lucide-react';

interface BreakpointProps {
    isOpen: boolean;
    onResolve: (action: 'resume' | 'abort') => void;
    reason: string;
    description: string;
    skillName: string;
}

export function HitlBreakpoint({ isOpen, onResolve, reason, description, skillName }: BreakpointProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-2xl shadow-[0_0_50px_-12px_rgba(244,63,94,0.3)] overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-rose-500/10 p-6 border-b border-rose-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/40">
                        <Lock className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-rose-500 uppercase tracking-tighter">Security Intercept</h2>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-rose-500/70 uppercase">
                            <Shield className="w-3 h-3" />
                            HITL Breakpoint Triggered
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Trigger Reason</label>
                        <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-sm font-bold text-zinc-200">{reason}</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Skill Involved</label>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg w-fit border border-white/5">
                            <span className="text-xs font-mono text-indigo-400">{skillName}</span>
                        </div>
                    </div>

                    <div className="p-4 bg-zinc-950/50 rounded-xl border border-white/5 space-y-2">
                        <div className="flex items-center gap-2">
                            <Info className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-tight">Technical Description</span>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed italic">
                            "{description}"
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button 
                            onClick={() => onResolve('resume')}
                            className="w-full h-12 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-xl border-b-4 border-zinc-300 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3"
                        >
                            <CheckCircle className="w-5 h-5" />
                            AUTHORIZE & RESUME
                        </button>
                        <button 
                            onClick={() => onResolve('abort')}
                            className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-rose-500 font-bold rounded-xl border-b-4 border-zinc-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3"
                        >
                            <XCircle className="w-5 h-5" />
                            ABORT EXECUTION
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-zinc-950/50 border-t border-white/5 flex items-center justify-center">
                    <p className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                        Handshake UUID: {Math.random().toString(36).substring(7).toUpperCase()}
                    </p>
                </div>
            </div>
        </div>
    );
}
