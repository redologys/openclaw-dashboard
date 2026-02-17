import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  LayoutGrid, 
  MessageSquare, 
  Bot, 
  Database, 
  BarChart3, 
  Power,
  GitBranch,
  Monitor,
  Terminal,
  Github,
  Layout,
  ShieldAlert,
  Sparkles,
  Activity,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

export function Sidebar() {
  const [browserStatus] = useState<'running' | 'idle' | 'error'>('idle');

  return (
    <div className="w-16 flex flex-col items-center py-6 bg-zinc-950 border-r border-white/5 h-screen sticky top-0 z-40">
      <div className="mb-10 px-2">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <LayoutGrid className="text-black w-6 h-6" />
        </div>
      </div>

      <nav className="flex-1 space-y-4">
        <SidebarLink to="/" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
        
        <div className="py-4 flex flex-col items-center gap-4 border-y border-white/5 mt-4">
          <SidebarLink to="/browser" icon={<div className="relative">
            <Monitor className="w-5 h-5" />
            <div className={clsx(
              "absolute -top-1 -right-1 w-2 h-2 rounded-full border-2 border-zinc-950",
              browserStatus === 'running' ? "bg-emerald-500" : browserStatus === 'error' ? "bg-red-500" : "bg-zinc-600"
            )} />
          </div>} label="Browser Console" />
          <SidebarLink to="/imperial-vault" icon={<Layout className="w-5 h-5" />} label="Imperial Vault" />
          <SidebarLink to="/imperial-vault/pipeline" icon={<Activity className="w-5 h-5" />} label="IV Pipeline" />
        </div>

        <SidebarLink to="/chat" icon={<MessageSquare className="w-5 h-5" />} label="Conversations" />
        <SidebarLink to="/agents" icon={<Bot className="w-5 h-5" />} label="Agents Hub" />
        <SidebarLink to="/memory" icon={<Database className="w-5 h-5" />} label="Memory Hub" />
        <SidebarLink to="/skills" icon={<Sparkles className="w-5 h-5" />} label="Skills" />
        <SidebarLink to="/monitoring" icon={<Activity className="w-5 h-5" />} label="Monitoring" />
        <SidebarLink to="/pipelines" icon={<GitBranch className="w-5 h-5" />} label="Autopilot" />
        <SidebarLink to="/analytics" icon={<BarChart3 className="w-5 h-5" />} label="Analytics" />
        <SidebarLink to="/sentinel" icon={<ShieldAlert className="w-5 h-5" />} label="Reliability" />
        
        <SidebarLink to="/dev" icon={<Terminal className="w-5 h-5" />} label="Dev Console" />
      </nav>

      <div className="mt-auto space-y-4 pt-6 border-t border-white/5 w-full flex flex-col items-center">
        <SidebarLink to="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
        <a 
          href="https://github.com/redologys/Imperial-Vault-Website" 
          target="_blank" 
          rel="noreferrer"
          className="p-2.5 rounded-xl text-zinc-600 hover:text-zinc-400 transition-all group relative"
        >
          <Github className="w-5 h-5" />
          <span className="absolute left-14 bg-zinc-900 border border-white/5 px-2 py-1 rounded text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            Repository
          </span>
        </a>
        <button className="p-2.5 text-zinc-700 hover:text-red-500 transition-colors">
          <Power className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function SidebarLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        clsx(
          'p-2.5 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-amber-500/5 transition-all group relative block',
          isActive && 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20',
        )
      }
    >
      {icon}
      <span className="absolute left-14 bg-zinc-900 border border-amber-500/20 px-2 py-1 rounded text-xs text-amber-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
        {label}
      </span>
    </NavLink>
  );
}
