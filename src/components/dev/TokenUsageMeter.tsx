import { useState } from 'react';
import { CreditCard, TrendingUp, Zap, BarChart3, AlertCircle, PieChart } from 'lucide-react';

interface UsageStats {
    totalTokens: number;
    totalCost: number;
    promptTokens: number;
    completionTokens: number;
    sessionsCount: number;
}

export function TokenUsageMeter() {
    const [stats] = useState<UsageStats>({
        totalTokens: 145280,
        totalCost: 1.24,
        promptTokens: 112000,
        completionTokens: 33280,
        sessionsCount: 12,
    });

    return (
        <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Tokens</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-zinc-100 font-mono tracking-tighter">{stats.totalTokens.toLocaleString()}</div>
                        <div className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +12%
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Estimated Cost</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-emerald-500 font-mono tracking-tighter">${stats.totalCost.toFixed(2)}</div>
                        <div className="text-[10px] text-zinc-600 font-bold flex items-center gap-1">
                            Current Period
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Efficiency</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-zinc-100 font-mono tracking-tighter">94%</div>
                        <div className="text-[10px] text-emerald-500 font-bold">OPTIMAL</div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <PieChart className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">P/C Ratio</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div className="text-2xl font-black text-zinc-100 font-mono tracking-tighter">3.4x</div>
                        <div className="text-[10px] text-zinc-600 font-bold">Input vs Output</div>
                    </div>
                </div>
            </div>

            {/* Visual Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-zinc-200 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Resource Allocation
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-zinc-500 uppercase tracking-wider">Prompt Tokens</span>
                                <span className="text-zinc-300 font-mono">{stats.promptTokens.toLocaleString()}</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: '77%' }} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-zinc-500 uppercase tracking-wider">Completion Tokens</span>
                                <span className="text-zinc-300 font-mono">{stats.completionTokens.toLocaleString()}</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: '23%' }} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                        <div className="p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Avg / Session</div>
                            <div className="text-sm font-black text-zinc-200 font-mono">12.1k</div>
                        </div>
                        <div className="p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Peak Tokens</div>
                            <div className="text-sm font-black text-zinc-200 font-mono">24.5k</div>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-zinc-200 mb-4">Cost Projection</h3>
                    <div className="flex-1 flex flex-col items-center justify-center py-8">
                        <div className="w-32 h-32 rounded-full border-8 border-emerald-500/20 flex flex-col items-center justify-center relative">
                            <div className="absolute inset-2 border-4 border-emerald-500/40 rounded-full border-l-transparent animate-spin" />
                            <span className="text-2xl font-black text-emerald-500 font-mono">$1.24</span>
                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">USD</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-6 text-center max-w-xs">
                            Projected monthly cost: <span className="text-zinc-100 font-bold">$28.40</span> based on current processing volume and model tier.
                        </p>
                    </div>
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Quota Warning</h4>
                            <p className="text-[10px] text-zinc-500 mt-0.5">82% of allocated budget used. Auto-scaling might be restricted.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
