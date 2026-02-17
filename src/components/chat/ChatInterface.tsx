import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  MoreHorizontal, 
  Terminal,
  Zap,
  ChevronDown,
  Microscope,
  RotateCcw
} from 'lucide-react';
import { Agent, ChatMessage, RestoreContextResult } from '../../lib/types';
import { XRayPanel } from './XRayPanel';

interface ChatInterfaceProps {
  agent: Agent;
}

export function ChatInterface({ agent }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isXRayOpen, setIsXRayOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreContextResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [agent.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/conversations?agentId=${agent.id}`);
      const data = await res.json();
      if (data.length > 0) {
        const fullConv = await fetch(`/api/conversations/${data[0].id}`);
        const convData = await fullConv.json();
        setMessages(convData.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      conversationId: 'default',
      senderType: 'user',
      agentId: agent.id,
      text: input,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Create message via API
      // For now we'll mock the response to show the typing state
      setTimeout(() => {
        const agentMsg: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          conversationId: 'default',
          senderType: 'agent',
          senderAgentId: agent.id,
          agentId: agent.id,
          text: `I've processed your request regarding "${input}". I'm currently monitoring the Imperial Vault pipelines.`,
          createdAt: new Date().toISOString(),
          thinkingTrace: "I need to check the current status of the historian agent and the search sandbox. The user is asking about the imperial vault. I will simulate a tool call to verify the last batch.",
          toolCalls: [
            { id: 'tc1', toolId: 'vault_status', args: {} }
          ],
          toolResults: [
            { toolCallId: 'tc1', result: { status: 'COMPLETE', facts: 5 } }
          ]
        };
        setMessages(prev => [...prev, agentMsg]);
        setLoading(false);
      }, 1500);
    } catch (err) {
      console.error('Send failed:', err);
      setLoading(false);
    }
  };

  const handleRestoreContext = async () => {
    try {
      setRestoring(true);
      const res = await fetch(`/api/chat/${agent.id}/restore-context`, { method: 'POST' });
      if (!res.ok) throw new Error(`Restore failed (${res.status})`);
      const payload = (await res.json()) as RestoreContextResult;
      setRestoreResult(payload);
    } catch (err) {
      console.error('Restore context failed:', err);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-white/5 bg-zinc-900/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Bot className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-zinc-100">{agent.name}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{agent.role}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              void handleRestoreContext();
            }}
            disabled={restoring}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-zinc-900 text-zinc-300 hover:text-white border border-white/5 disabled:opacity-60"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {restoring ? 'Restoring...' : 'Restore Context'}
          </button>
          <button 
            onClick={() => setIsXRayOpen(!isXRayOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isXRayOpen 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <Microscope className="w-3.5 h-3.5" />
            X-RAY
          </button>
          <button className="p-1.5 hover:bg-white/5 text-zinc-500 rounded-lg transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        {restoreResult && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm">
            <div className="text-xs uppercase tracking-wider text-cyan-300 mb-2">Context-anchor Recovery</div>
            <div className="text-zinc-100">{restoreResult.summary}</div>
            {restoreResult.anchorPoints.length > 0 && (
              <div className="mt-3 space-y-2">
                {restoreResult.anchorPoints.map((anchor) => (
                  <div key={anchor.id} className="rounded-lg border border-white/10 bg-black/20 p-2">
                    <div className="text-[10px] text-zinc-500 mb-1">{new Date(anchor.timestamp).toLocaleString()}</div>
                    <div className="text-xs text-zinc-200">{anchor.snippet}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-4 max-w-[80%] ${msg.senderType === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-2 rounded-xl h-fit shrink-0 ${
                msg.senderType === 'user' ? 'bg-zinc-800' : 'bg-amber-500/10 border border-amber-500/20'
              }`}>
                {msg.senderType === 'user' ? <User className="w-4 h-4 text-zinc-400" /> : <Bot className="w-4 h-4 text-amber-500" />}
              </div>
              <div className={`space-y-2 ${msg.senderType === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.senderType === 'user' 
                    ? 'bg-zinc-800/50 text-zinc-100 rounded-tr-none border border-white/5' 
                    : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-white/5 shadow-xl'
                }`}>
                  {msg.text}
                </div>
                {msg.senderType === 'agent' && msg.text.length > 120 && (
                  <div className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300">
                    Context optimized by Sophie
                  </div>
                )}
                <div className="text-[10px] text-zinc-600 px-1 uppercase tracking-tighter">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-4">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-pulse">
                <Bot className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex gap-1 items-center px-4 py-3 bg-zinc-900 rounded-2xl rounded-tl-none border border-white/5">
                <div className="w-1 h-1 bg-amber-500 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-1 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-zinc-900/10">
        <div className="max-w-4xl mx-auto relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Message ${agent.name}...`}
            className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:border-amber-500/50 transition-all shadow-2xl"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 p-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="max-w-4xl mx-auto mt-2 flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
              <Zap className="w-3 h-3 text-amber-500" />
              Turbo Mode
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
              <Terminal className="w-3 h-3 text-zinc-600" />
              Reasoning Trace On
            </div>
          </div>
          <div className="text-[10px] text-zinc-700 italic">
            ClawDB v2.4 Intelligence Engine
          </div>
        </div>
      </div>

      {/* X-Ray Panel Drawer */}
      <div className={`absolute left-0 right-0 bottom-0 bg-zinc-950 border-t border-amber-500/30 transition-all duration-300 z-50 ${
        isXRayOpen ? 'h-[400px]' : 'h-0 overflow-hidden'
      }`}>
        <div className="h-full flex flex-col">
          <div className="p-2 border-b border-white/5 bg-zinc-900/50 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Microscope className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Execution X-Ray</span>
            </div>
            <button onClick={() => setIsXRayOpen(false)} className="p-1 hover:bg-white/5 rounded text-zinc-500">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <XRayPanel messages={messages} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
