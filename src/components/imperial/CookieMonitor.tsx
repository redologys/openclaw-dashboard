import { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Shield, Clock, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface CookieData {
    name: string;
    domain: string;
    status: 'active' | 'expiring' | 'expired';
    expires: string;
    account: string;
}

export function CookieMonitor() {
    const [cookies] = useState<CookieData[]>([
        { name: 'SECURE_SID', domain: '.youtube.com', status: 'active', expires: '2025-01-15T00:00:00Z', account: 'Imperial Vault HQ' },
        { name: 'LOGIN_INFO', domain: '.youtube.com', status: 'expiring', expires: '2024-05-25T12:00:00Z', account: 'History Bypass' },
        { name: 'HSID', domain: '.google.com', status: 'active', expires: '2025-02-10T00:00:00Z', account: 'Imperial Vault HQ' },
        { name: 'SAPISID', domain: '.google.com', status: 'expired', expires: '2024-05-18T09:00:00Z', account: 'Secondary Intel' },
    ]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'expiring': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'expired': return <Clock className="w-4 h-4 text-rose-500" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Active Sessions', value: '12', color: 'text-emerald-500' },
                    { label: 'Expiring Soon', value: '2', color: 'text-amber-500' },
                    { label: 'Total Accounts', value: '4', color: 'text-zinc-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className={clsx("text-2xl font-mono font-bold", stat.color)}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        Session Health Monitor
                    </h3>
                    <button className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1.5 transition-colors">
                        <RefreshCw className="w-3 h-3" />
                        REFRESH ALL
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-zinc-950/50">
                                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Account</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Cookie Name</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Domain</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {cookies.map((cookie, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-zinc-200">{cookie.account}</span>
                                            <span className="text-[10px] text-zinc-500 font-mono italic">UID: {Math.random().toString(36).substr(2, 6)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 font-mono">
                                        {cookie.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                        {cookie.domain}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(cookie.status)}
                                            <span className={clsx(
                                                "text-[10px] font-bold uppercase tracking-wider",
                                                cookie.status === 'active' ? "text-emerald-500" :
                                                cookie.status === 'expiring' ? "text-amber-500" : "text-rose-500"
                                            )}>
                                                {cookie.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-emerald-500 transition-colors">
                                                <RefreshCw className="w-3.5 h-3.5" />
                                            </button>
                                            <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-5 flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-sm font-bold text-amber-500 mb-1">Session Refresh Required</h4>
                    <p className="text-sm text-amber-500/70 leading-relaxed">
                        The 'History Bypass' account sessions are expiring in less than 5 days. 
                        Please complete the ritualistic re-authentication process to prevent pipeline downtime.
                    </p>
                </div>
            </div>
        </div>
    );
}
