import { useState } from 'react';
import { Package, X, GripVertical, Plus, Info, Zap, Shield, Globe } from 'lucide-react';
import { clsx } from 'clsx';

interface Skill {
    id: string;
    name: string;
    description: string;
    category: 'Search' | 'Extraction' | 'Social' | 'Utility';
    isDangerous: boolean;
}

export function SkillMatrix() {
    const [assignedSkills, setAssignedSkills] = useState<string[]>(['s1', 's2']);
    
    const allSkills: Skill[] = [
        { id: 's1', name: 'Brave Search', description: 'Query web for real-time data.', category: 'Search', isDangerous: false },
        { id: 's2', name: 'Gemini Fact Check', description: 'Cross-reference facts via LLM.', category: 'Extraction', isDangerous: false },
        { id: 's3', name: 'Discord Post', description: 'Post verified facts to channel.', category: 'Social', isDangerous: true },
        { id: 's4', name: 'SSH Execute', description: 'Run scripts on remote server.', category: 'Utility', isDangerous: true },
        { id: 's5', name: 'Cookie Refresh', description: 'Update session tokens.', category: 'Utility', isDangerous: false },
    ];

    const toggleSkill = (id: string) => {
        if (assignedSkills.includes(id)) {
            setAssignedSkills(assignedSkills.filter(s => s !== id));
        } else {
            setAssignedSkills([...assignedSkills, id]);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Library */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Skill Library
                    </h3>
                    <div className="text-[10px] text-zinc-600 font-mono">
                        {allSkills.length} AVAILABLE
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {allSkills.map(skill => {
                        const isAssigned = assignedSkills.includes(skill.id);
                        return (
                            <div 
                                key={skill.id}
                                onClick={() => toggleSkill(skill.id)}
                                className={clsx(
                                    "p-4 rounded-xl border transition-all cursor-pointer group flex items-start gap-4",
                                    isAssigned 
                                        ? "bg-emerald-500/5 border-emerald-500/20" 
                                        : "bg-zinc-900 border-white/5 hover:border-white/10"
                                )}
                            >
                                <div className={clsx(
                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all shrink-0",
                                    isAssigned ? "bg-emerald-500/20 text-emerald-500" : "bg-zinc-800 text-zinc-500 group-hover:text-zinc-300"
                                )}>
                                    {skill.category === 'Search' && <Globe className="w-5 h-5" />}
                                    {skill.category === 'Extraction' && <Zap className="w-5 h-5" />}
                                    {skill.category === 'Social' && <Globe className="w-5 h-5" />}
                                    {skill.category === 'Utility' && <Package className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold text-zinc-200">{skill.name}</h4>
                                        {skill.isDangerous && <Shield className="w-3 h-3 text-rose-500" />}
                                    </div>
                                    <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">{skill.description}</p>
                                </div>
                                <div className="shrink-0 pt-1">
                                    <div className={clsx(
                                        "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                        isAssigned ? "bg-emerald-500 border-emerald-500 text-zinc-950" : "border-white/10 text-transparent"
                                    )}>
                                        <Plus className="w-3 h-3 stroke-[3]" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Matrix / Config */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Active Manifest</h3>
                    <div className="text-[10px] text-zinc-600 font-mono">
                        {assignedSkills.length} ATTACHED
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 min-h-[400px] flex flex-col">
                    {assignedSkills.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-3 border-2 border-dashed border-white/5 rounded-xl">
                            <Info className="w-8 h-8 opacity-20" />
                            <p className="text-xs">No skills assigned to this agent.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {assignedSkills.map(id => {
                                const skill = allSkills.find(s => s.id === id);
                                if (!skill) return null;
                                return (
                                    <div key={id} className="bg-zinc-900 border border-white/5 p-3 rounded-lg flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <GripVertical className="w-4 h-4 text-zinc-700 group-hover:text-zinc-500 cursor-grab" />
                                            <div>
                                                <div className="text-xs font-bold text-zinc-200">{skill.name}</div>
                                                <div className="text-[9px] text-zinc-600 uppercase font-mono tracking-tighter">{skill.category}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => toggleSkill(id)}
                                            className="p-1.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-auto pt-6">
                        <div className="p-4 bg-zinc-950/50 rounded-xl border border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-zinc-400">Total Tool Complexity</span>
                                <span className="text-[11px] font-mono text-emerald-500">Low (2/10)</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-zinc-400">Security Clearance</span>
                                <span className="text-[11px] font-mono text-zinc-500">L3 - VERIFIED</span>
                            </div>
                            <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold rounded-lg transition-all border border-white/5 mt-2">
                                UPDATE AGENT BRAIN
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
