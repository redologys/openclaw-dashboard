import { useState } from 'react';
import { Bell, Shield, Zap, MessageSquare, Plus, Trash2, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Rule {
    id: string;
    name: string;
    trigger: string;
    action: string;
    channel: 'Discord' | 'Telegram' | 'Email';
    enabled: boolean;
}

export function AlertRulesEngine() {
    const [rules, setRules] = useState<Rule[]>([
        { id: '1', name: 'Fatal Error Alert', trigger: 'Log contains "FATAL"', action: 'Notify Admin', channel: 'Discord', enabled: true },
        { id: '2', name: 'Rate Limit Warning', trigger: 'Status Code 429', action: 'Pause Pipeline', channel: 'Telegram', enabled: false },
        { id: '3', name: 'Daily Digest', trigger: 'Cron: 0 0 * * *', action: 'Send Summary', channel: 'Email', enabled: true },
    ]);

    const toggleRule = (id: string) => {
        setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    const deleteRule = (id: string) => {
        setRules(rules.filter(r => r.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    Automation Triggers
                </h3>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold rounded-lg flex items-center gap-2 transition-all">
                    <Plus className="w-3.5 h-3.5" />
                    CREATE NEW RULE
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {rules.map(rule => (
                    <div key={rule.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-5 flex items-center justify-between group hover:border-white/10 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={clsx(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                rule.enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-800 text-zinc-500"
                            )}>
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-zinc-200">{rule.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                                        <Zap className="w-3 h-3" />
                                        {rule.trigger}
                                    </span>
                                    <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3" />
                                        {rule.channel}: {rule.action}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => toggleRule(rule.id)}
                                className={clsx(
                                    "relative w-10 h-5 rounded-full transition-colors",
                                    rule.enabled ? "bg-emerald-500" : "bg-zinc-700"
                                )}
                            >
                                <div className={clsx(
                                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                    rule.enabled ? "left-6" : "left-1"
                                )} />
                            </button>
                            <button 
                                onClick={() => deleteRule(rule.id)}
                                className="p-2 text-zinc-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-zinc-950/50 border border-white/5 rounded-lg border-l-4 border-l-emerald-500">
                <div className="flex gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                        <span className="text-zinc-200 font-bold">Rule Engine Active:</span> All logs are being filtered through the global alert system. 
                        Critical failures will trigger immediate notification via encrypted webhooks.
                    </p>
                </div>
            </div>
        </div>
    );
}
