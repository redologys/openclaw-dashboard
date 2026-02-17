import { CheckCircle2, Circle, Clock, Loader2, ListTodo } from 'lucide-react';

interface TaskStep {
    id: string;
    text: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    duration?: string;
}

export function TaskQueue() {
    // In production, this would subscribe to SSE/Gateway events
    // for actual agent steps.
    const tasks: TaskStep[] = [
        { id: '1', text: "Navigate to youtube.com", status: 'completed', duration: '0.8s' },
        { id: '2', text: "Wait for page to initialize", status: 'completed', duration: '2.4s' },
        { id: '3', text: "Click on search input and type query", status: 'in-progress' },
        { id: '4', text: "Verify search results contain documentaries", status: 'pending' },
        { id: '5', text: "Extract link and title for top 3 results", status: 'pending' }
    ];

    return (
        <div className="bg-zinc-900/40 rounded-2xl border border-white/5 p-5 h-full flex flex-col">
             <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest leading-none mb-1">TASK FEED</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Active Operation Queue</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-[9px] font-black text-blue-500 uppercase tracking-tighter">
                         Step 3/5
                    </div>
                    <ListTodo className="w-4 h-4 text-zinc-600" />
                 </div>
             </div>

             <div className="space-y-1 overflow-y-auto scrollbar-hide flex-1">
                {tasks.map((task) => (
                    <div 
                        key={task.id} 
                        className={`flex items-start gap-3 p-3.5 rounded-xl transition-all relative group
                            ${task.status === 'in-progress' ? 'bg-white/5 ring-1 ring-white/10' : 'opacity-40 hover:opacity-60'}`}
                    >
                         {task.status === 'in-progress' && (
                             <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                         )}

                         <div className="mt-0.5 shrink-0">
                             {task.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                             {task.status === 'in-progress' && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
                             {task.status === 'pending' && <Circle className="w-4 h-4 text-zinc-700" />}
                             {task.status === 'failed' && <Circle className="w-4 h-4 text-rose-500" />}
                         </div>
                         <div className="flex-1 min-w-0">
                             <div className={`text-xs font-semibold truncate ${task.status === 'in-progress' ? 'text-white' : 'text-zinc-300'}`}>
                                 {task.text}
                             </div>
                             <div className="flex items-center justify-between mt-1">
                                 <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest">
                                     {task.status === 'completed' ? 'Success' : (task.status === 'in-progress' ? 'Executing Tool' : 'Queued')}
                                 </div>
                                 {task.duration && (
                                     <div className="flex items-center gap-1 text-[9px] text-zinc-700">
                                         <Clock className="w-2.5 h-2.5" />
                                         {task.duration}
                                     </div>
                                 )}
                             </div>
                         </div>
                    </div>
                ))}
             </div>

             <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                    <span>Target</span>
                    <span className="text-zinc-400">google-chrome-headless</span>
                </div>
             </div>
        </div>
    );
}
