import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { Bot, User } from 'lucide-react';

export default function Discord() {
  const messages = [
      { id: 1, user: 'Agent-007', role: 'bot', channel: '#pipeline-logs', content: 'Processing batch #492 complete. Upload scheduled for 18:00 UTC.', time: '2m ago' },
      { id: 2, user: 'Admin', role: 'human', channel: '#general', content: 'Can we check the perplexity scores on the last script batch?', time: '15m ago' },
      { id: 3, user: 'Agent-Scout', role: 'bot', channel: '#intel-feed', content: 'New viral trend detected: "Ancient Rome Facts" (+400% search volume).', time: '1h ago' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <IVBreadcrumb />
        <h1 className="text-2xl font-bold text-zinc-100 mt-2">Discord Activity</h1>
        <p className="text-zinc-500">Live feed from connected Discord channels.</p>
      </div>

      <div className="space-y-4">
          {messages.map(msg => (
              <div key={msg.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex gap-4 hover:border-white/10 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'bot' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {msg.role === 'bot' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                      <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-200">{msg.user}</span>
                              <span className="text-xs text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">{msg.channel}</span>
                          </div>
                          <span className="text-xs text-zinc-600">{msg.time}</span>
                      </div>
                      <p className="text-zinc-400 text-sm mt-1">{msg.content}</p>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
}
