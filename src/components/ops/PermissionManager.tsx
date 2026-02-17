import { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Power } from 'lucide-react';
import { PermissionRule, WidgetConfig } from '../../lib/types';

interface PermissionManagerProps {
  config: WidgetConfig;
}

export function PermissionManager({ config: _config }: PermissionManagerProps) {
  const [rules, setRules] = useState<PermissionRule[]>([
    {
      id: 'rule-safe-shell',
      name: 'Safe Mode Shell Block',
      description: 'Block shell execution while safe mode is active.',
      resource: 'shell',
      action: 'execute',
      policy: 'deny',
      enabled: true,
    },
    {
      id: 'rule-files-approval',
      name: 'File Write Approval',
      description: 'Require approval before write operations.',
      resource: 'files',
      action: 'write',
      policy: 'ask',
      enabled: true,
    },
    {
      id: 'rule-web-allow',
      name: 'Web Read Access',
      description: 'Allow read-only access to web endpoints.',
      resource: 'web',
      action: 'read',
      policy: 'allow',
      enabled: true,
    },
  ]);
  const [filter, setFilter] = useState('');

  const toggleRule = (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setRules((prev) => prev.map((rule) => (
      rule.id === id ? { ...rule, enabled: newStatus } : rule
    )));
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
  };

  const filteredRules = rules.filter(r => 
    r.name.toLowerCase().includes(filter.toLowerCase()) || 
    r.resource.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-zinc-900/50 p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-bold">Firewall Rules</span>
        </div>
        <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <input 
        type="text" 
        placeholder="Filter rules..." 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="bg-zinc-950/50 border border-zinc-800 rounded px-3 py-1.5 text-sm text-zinc-200 mb-3 focus:outline-none focus:border-emerald-500/50"
      />

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredRules.map(rule => (
          <div key={rule.id} className={`group flex flex-col p-3 rounded border transition-all ${rule.enabled ? 'bg-zinc-900/40 border-zinc-800/60' : 'bg-zinc-950/40 border-zinc-900 opacity-60'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                 <div className={`mt-1 w-2 h-2 rounded-full ${rule.policy === 'allow' ? 'bg-emerald-500' : rule.policy === 'ask' ? 'bg-amber-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(var(--color-primary),0.3)]`} />
                 <div>
                    <h4 className="font-medium text-zinc-200 text-sm">{rule.name}</h4>
                    <p className="text-xs text-zinc-500 mt-0.5">{rule.description}</p>
                 </div>
              </div>
              
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => toggleRule(rule.id, rule.enabled)}
                  className={`p-1.5 rounded ${rule.enabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-zinc-600 hover:bg-zinc-800'}`}
                  title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => deleteRule(rule.id)}
                  className="p-1.5 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Rule Details */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500">
               <div className="bg-zinc-950/30 px-2 py-1 rounded border border-white/5">
                 <span className="text-zinc-600 uppercase mr-1">ACT:</span> 
                 <span className="text-zinc-300">{rule.action}</span>
               </div>
               <div className="bg-zinc-950/30 px-2 py-1 rounded border border-white/5">
                 <span className="text-zinc-600 uppercase mr-1">RES:</span> 
                 <span className="text-zinc-300">{rule.resource}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
