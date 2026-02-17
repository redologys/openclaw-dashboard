import { Settings, Calendar, Search, Film, Music, MessageSquare, Layers, TrendingUp, Edit3, Terminal as TerminalIcon, Cookie, Bell, Brain } from 'lucide-react';
import { IVStatCard } from '../../app/imperial-vault/_components/Shared';

export default function ImperialVault() {
  return (
    <div className="space-y-8">
      <header>
         <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <span className="text-amber-500">⚔️</span> Imperial Vault Command Center
         </h1>
         <p className="text-zinc-500 mt-1">YouTube Shorts Automation Pipeline</p>
         
         <div className="mt-6 flex items-center space-x-2 bg-zinc-900/50 border border-white/5 px-4 py-2 rounded-lg w-fit text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-300">Today: 5 facts generated | 15 clips sourced | Batch complete ✅</span>
         </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <IVStatCard 
            to="/imperial-vault/overlay"
            title="Overlay Studio"
            icon={<Layers className="w-5 h-5" />}
            description="Remote control for overlay rendering and visual previews."
            stat="Historian: Connected"
            statusColor="text-amber-400"
        />
        
        <IVStatCard 
            to="/imperial-vault/viral-score"
            title="Score Debugger"
            icon={<TrendingUp className="w-5 h-5" />}
            description="Detailed scoring breakdown & manual pipeline overrides."
            stat="Pending Review: 3"
            statusColor="text-emerald-400"
        />
        
        <IVStatCard 
            to="/imperial-vault/facts"
            title="Fact Editor"
            icon={<Edit3 className="w-5 h-5" />}
            description="Inline editing and verification for fact batches."
            stat="Drafts: 12"
            statusColor="text-blue-400"
        />

        <IVStatCard 
            to="/imperial-vault/terminal"
            title="SSH Terminal"
            icon={<TerminalIcon className="w-5 h-5" />}
            description="Embedded console for remote script execution."
            stat="Idle"
            statusColor="text-zinc-500"
        />

        <IVStatCard 
            to="/imperial-vault/cookies"
            title="Cookie Monitor"
            icon={<Cookie className="w-5 h-5" />}
            description="Session health and ritualistic refresh alerts."
            stat="2 Expiring"
            statusColor="text-amber-500"
        />

        <IVStatCard 
            to="/imperial-vault/sandbox"
            title="Search Sandbox"
            icon={<Search className="w-5 h-5" />}
            description="Test footage discovery queries against the Brave API."
            stat="Ready"
            statusColor="text-zinc-500"
        />

        <IVStatCard 
            to="/imperial-vault/alerts"
            title="Alert Rules"
            icon={<Bell className="w-5 h-5" />}
            description="Configurable failure alerts (Discord/Telegram)."
            stat="Active"
            statusColor="text-emerald-500"
        />

        <IVStatCard 
            to="/imperial-vault/intelligence"
            title="Intelligence Lab"
            icon={<Brain className="w-5 h-5" />}
            description="Edit agent prompts, skill matrices, and trace logic."
            stat="Optimized"
            statusColor="text-emerald-500"
        />

        <IVStatCard 
            to="/imperial-vault/pipeline"
            title="Pipeline"
            icon={<Settings className="w-5 h-5" />}
            description="Live agent status & today's content batch progress."
            stat="Batch Complete ✅"
            statusColor="text-emerald-400"
        />
        
        <IVStatCard 
            to="/imperial-vault/calendar"
            title="Content Calendar"
            icon={<Calendar className="w-5 h-5" />}
            description="Production history, streak tracking, and schedule."
            stat="Current streak: 12 days"
            statusColor="text-amber-400"
        />

        <IVStatCard 
            to="/imperial-vault/intel"
            title="Competitor Intel"
            icon={<Search className="w-5 h-5" />}
            description="Channel analysis, topic gaps, and viral trends."
            stat="Updated 2h ago"
        />

        <IVStatCard 
            to="/imperial-vault/footage"
            title="Footage Manager"
            icon={<Film className="w-5 h-5" />}
            description="Clip queue, sourced validation, and download commands."
            stat="15/15 clips downloaded"
            statusColor="text-emerald-400"
        />

        <IVStatCard 
            to="/imperial-vault/music"
            title="Music Intelligence"
            icon={<Music className="w-5 h-5" />}
            description="Song performance tracking and viral categorizations."
            stat="Database: 420 tracks"
        />

        <IVStatCard 
            to="/imperial-vault/discord"
            title="Discord Activity"
            icon={<MessageSquare className="w-5 h-5" />}
            description="Recent pipeline posts from all agent channels."
            stat="Last post: 14m ago"
        />
      </div>
    </div>
  );
}
