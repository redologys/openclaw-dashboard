import { useState } from 'react';
import { ShieldCheck, ShieldAlert, TrendingUp, History, Info, Save } from 'lucide-react';
import { clsx } from 'clsx';

interface ScoreCriteria {
    name: string;
    description: string;
    score: number;
    weight: number;
}

interface FactScore {
    id: string;
    text: string;
    totalScore: number;
    criteria: ScoreCriteria[];
    isApproved: boolean;
}

export function ViralScoreDebugger() {
    const [factScores, setFactScores] = useState<FactScore[]>([
        {
            id: '1',
            text: 'The Roman Empire used a complex system of roads...',
            totalScore: 8.2,
            isApproved: true,
            criteria: [
                { name: 'Uniqueness', description: 'How rare is this fact in common knowledge?', score: 9, weight: 0.4 },
                { name: 'Engagement', description: 'Potential for social media interaction.', score: 8, weight: 0.3 },
                { name: 'Reliability', description: 'Source verification and factual accuracy.', score: 7, weight: 0.3 },
            ]
        },
        {
            id: '2',
            text: 'Vikings didn’t actually wear horned helmets...',
            totalScore: 6.8,
            isApproved: false,
            criteria: [
                { name: 'Uniqueness', description: 'How rare is this fact?', score: 6, weight: 0.4 },
                { name: 'Engagement', description: 'Interaction potential.', score: 7, weight: 0.3 },
                { name: 'Reliability', description: 'Source verification.', score: 8, weight: 0.3 },
            ]
        }
    ]);

    const [selectedId, setSelectedId] = useState<string | null>(factScores[0].id);
    const selectedFact = factScores.find(f => f.id === selectedId);

    const updateScore = (criteriaName: string, newScore: number) => {
        if (!selectedFact) return;
        
        const updatedCriteria = selectedFact.criteria.map(c => 
            c.name === criteriaName ? { ...c, score: newScore } : c
        );
        
        const newTotal = updatedCriteria.reduce((acc, c) => acc + (c.score * c.weight), 0);
        
        setFactScores(factScores.map(f => 
            f.id === selectedId ? { ...f, criteria: updatedCriteria, totalScore: Number(newTotal.toFixed(1)) } : f
        ));
    };

    const toggleApproval = () => {
        if (!selectedFact) return;
        setFactScores(factScores.map(f => 
            f.id === selectedId ? { ...f, isApproved: !f.isApproved } : f
        ));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-4">
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Fact Scoring Queue
                    </h3>
                    <div className="space-y-2">
                        {factScores.map(fact => (
                            <button
                                key={fact.id}
                                onClick={() => setSelectedId(fact.id)}
                                className={clsx(
                                    "w-full text-left p-4 rounded-lg border transition-all",
                                    selectedId === fact.id 
                                        ? "bg-emerald-500/10 border-emerald-500/50" 
                                        : "bg-zinc-950/50 border-white/5 hover:border-white/10"
                                )}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-mono text-zinc-500">#{fact.id}</span>
                                    <span className={clsx(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                        fact.totalScore >= 7 ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10"
                                    )}>
                                        {fact.totalScore} / 10
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-300 line-clamp-1">{fact.text}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8">
                {selectedFact ? (
                    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 space-y-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                                    Scoring Breakdown
                                </h2>
                                <p className="text-zinc-500 text-sm mt-1">Detailed analysis of the Gemini classification result.</p>
                            </div>
                            <button 
                                onClick={toggleApproval}
                                className={clsx(
                                    "px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all active:scale-95",
                                    selectedFact.isApproved 
                                        ? "bg-emerald-500 text-zinc-950" 
                                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                )}
                            >
                                {selectedFact.isApproved ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                                {selectedFact.isApproved ? 'Approved for Production' : 'Mark as Approved'}
                            </button>
                        </div>

                        <div className="p-4 bg-zinc-950 border border-white/5 rounded-lg italic text-zinc-400 text-sm">
                            "{selectedFact.text}"
                        </div>

                        <div className="space-y-6">
                            {selectedFact.criteria.map((c, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-zinc-200">{c.name}</span>
                                            <div className="group relative">
                                                <Info className="w-3.5 h-3.5 text-zinc-600 cursor-help" />
                                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-zinc-800 text-[10px] text-zinc-300 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                                    {c.description}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xl font-mono font-bold text-emerald-500">{c.score}<span className="text-[10px] text-zinc-600 ml-1">/ 10</span></span>
                                    </div>
                                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-500"
                                            style={{ width: `${c.score * 10}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-1">
                                            {[...Array(10)].map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => updateScore(c.name, idx + 1)}
                                                    className={clsx(
                                                        "w-6 h-4 rounded-sm transition-all",
                                                        idx + 1 <= c.score ? "bg-emerald-500/40" : "bg-zinc-800 hover:bg-zinc-700"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider">Weight: {c.weight * 100}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="text-zinc-500 text-sm uppercase font-bold">Total Weighted Score</span>
                                <div className="text-3xl font-mono font-bold text-zinc-100">
                                    {selectedFact.totalScore}
                                </div>
                            </div>
                            <button className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 text-sm font-medium transition-colors">
                                <Save className="w-4 h-4" />
                                Save Scoring Override
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-12 text-center h-full flex flex-col justify-center items-center">
                        <TrendingUp className="w-12 h-12 text-zinc-800 mb-4" />
                        <p className="text-zinc-500">Select a fact from the queue to debug its viral scoring breakdown.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
