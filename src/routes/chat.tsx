import { useState, useEffect } from 'react';
import { Agent } from '../lib/types';
import {
  MessageSquare,
  Search,
  Plus,
  History,
  Sparkles,
  ChevronRight,
  Bot
} from 'lucide-react';
import { ChatInterface } from '../components/chat/ChatInterface';

export default function Chat() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(data);
      if (data.length > 0 && !selectedAgentId) {
        setSelectedAgentId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Chats Sidebar */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-zinc-900/20">
        <div className="p-4 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              Intelligence
            </h1>
            <button className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Filter agents..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-2 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Available Agents</div>
          {loading ? (
            <div className="p-4 text-center text-zinc-500 text-sm">Initializing...</div>
          ) : agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`w-full group flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedAgentId === agent.id 
                  ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20' 
                  : 'hover:bg-white/5 text-zinc-400'
              }`}
            >
              <div className={`p-2 rounded-lg transition-colors ${
                selectedAgentId === agent.id ? 'bg-amber-500/20' : 'bg-zinc-800 group-hover:bg-zinc-700'
              }`}>
                <Bot className="w-4 h-4" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-bold text-sm truncate text-zinc-100">{agent.name}</div>
                <div className="text-[10px] text-zinc-500 truncate uppercase tracking-tighter">{agent.role}</div>
              </div>
              <ChevronRight className={`w-3 h-3 transition-transform ${
                selectedAgentId === agent.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
              }`} />
            </button>
          ))}
          
          <div className="pt-4 px-3 py-2 text-[10px] text-zinc-500 uppercase font-bold tracking-widest border-t border-white/5 mt-4">Active Swarms</div>
          <div className="p-4 text-center text-[10px] text-zinc-700 italic">No active multi-agent swarms</div>
        </div>

        <div className="p-4 border-t border-white/5 bg-zinc-950/50">
          <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 transition-all">
            <History className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">Conversation History</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-zinc-950">
        {selectedAgent ? (
          <ChatInterface agent={selectedAgent} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
              <Sparkles className="w-16 h-16 text-zinc-800 relative" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-zinc-200">Select an Intelligence Node</h2>
              <p className="text-sm text-zinc-600 max-w-xs">Start a conversation with an agent or activate a swarm pipeline to begin processing.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
