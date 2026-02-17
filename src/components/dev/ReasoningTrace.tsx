import { useState, useEffect } from 'react';
import { Activity, Brain, CheckCircle, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface TraceStep {
    id: string;
    type: 'reasoning' | 'tool' | 'observation' | 'error';
    content: string;
    timestamp: string;
    duration?: string;
    status: 'completed' | 'running' | 'failed';
}

export function ReasoningTrace() {
    const [steps, setSteps] = useState<TraceStep[]>([
        { id: '1', type: 'reasoning', content: 'Analyzing user request for historical fact extraction from "Document_V2.pdf".', timestamp: '14:20:01', status: 'completed' },
        { id: '2', type: 'tool', content: 'Calling Brave Search for external verification of "Battle of Veridian".', timestamp: '14:20:05', status: 'completed', duration: '1.2s' },
        { id: '3', type: 'observation', content: 'Found 12 relevant sources. Cross-referencing dates...', timestamp: '14:20:07', status: 'completed' },
        { id: '4', type: 'reasoning', content: 'Drafting fact content: "The Battle of Veridian occurred in 214 PC, not 215 PC as previously thought."', timestamp: '14:20:10', status: 'running' },
    ]);

    // Mock progress for the last step
    useEffect(() => {
        const interval = setInterval(() => {
            setSteps(prev => prev.map(s => s.status === 'running' ? { ...s, content: s.content + '.' } : s));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: TraceStep['type']) => {
        switch (type) {
            case 'reasoning': return <Brain className="w-4 h-4 text-indigo-400" />;
            case 'tool': return <Activity className="w-4 h-4 text-amber-400" />;
            case 'observation': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-rose-400" />;
        }
    };

    return (
        <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[600px] shadow-2xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-950/20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Activity className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Live Agent Trace</h3>
                        <p className="text-[10px] text-zinc-500 flex items-center gap-2">
                            Session: <span className="text-zinc-400 font-mono">ag_8x2L-99</span>
                            <span className="w-1 h-1 bg-zinc-700 rounded-full" />
                            Agent: <span className="text-zinc-400">Imperial Historian</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[9px] font-mono border border-white/5">00:15 ELAPSED</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
                {steps.map((step, i) => (
                    <div key={step.id} className="relative group">
                        {/* Timeline Connector */}
                        {i < steps.length - 1 && (
                            <div className="absolute left-[19px] top-8 bottom-[-24px] w-px bg-zinc-800 group-hover:bg-zinc-700 transition-colors" />
                        )}

                        <div className="flex gap-4">
                            <div className={clsx(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 border border-white/5 shadow-inner",
                                step.status === 'running' ? "bg-zinc-800 animate-pulse border-indigo-500/20" : "bg-zinc-950"
                            )}>
                                {step.status === 'running' ? <Clock className="w-4 h-4 text-zinc-500" /> : getIcon(step.type)}
                            </div>

                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h4 className={clsx(
                                        "text-[10px] font-bold uppercase tracking-widest",
                                        step.type === 'reasoning' && "text-indigo-400",
                                        step.type === 'tool' && "text-amber-400",
                                        step.type === 'observation' && "text-emerald-400",
                                        step.type === 'error' && "text-rose-400",
                                    )}>
                                        {step.type}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        {step.duration && <span className="text-[9px] text-zinc-600 font-mono">{step.duration}</span>}
                                        <span className="text-[9px] text-zinc-600 font-mono">{step.timestamp}</span>
                                    </div>
                                </div>
                                <div className={clsx(
                                    "p-4 rounded-xl text-xs leading-relaxed transition-all",
                                    step.status === 'running' ? "bg-indigo-500/5 text-zinc-300 border border-indigo-500/10" : "text-zinc-400 group-hover:text-zinc-200"
                                )}>
                                    {step.content}
                                    {step.status === 'running' && (
                                        <span className="inline-block w-1 h-3 ml-1 bg-indigo-500 animate-pulse align-middle" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 border-t border-white/5 bg-zinc-950/40 flex items-center justify-between">
                <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Socket Connected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">Lat: 42ms</span>
                    </div>
                </div>
                <button className="text-[10px] text-zinc-500 hover:text-zinc-200 flex items-center gap-1 transition-colors">
                    Export JSON Logs
                    <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
