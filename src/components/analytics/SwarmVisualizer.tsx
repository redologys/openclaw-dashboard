import { useState } from 'react';
import { 
  Users, 
  Cpu, 
  Zap, 
  Share2, 
  Activity
} from 'lucide-react';

const INITIAL_NODES: AgentNode[] = [
  { id: '1', name: 'Historian Alpha', role: 'Research', x: 200, y: 150, status: 'active' },
  { id: '2', name: 'System Ops', role: 'Automation', x: 500, y: 300, status: 'busy' },
  { id: '3', name: 'Vault Guardian', role: 'Security', x: 800, y: 100, status: 'idle' },
  { id: '4', name: 'Batch Master', role: 'Worker', x: 300, y: 450, status: 'active' },
  { id: '5', name: 'Intelligence Link', role: 'Router', x: 700, y: 400, status: 'busy' },
];

const INITIAL_CONNECTIONS: Connection[] = [
  { from: '1', to: '2', type: 'message', strength: 0.8 },
  { from: '2', to: '5', type: 'tool', strength: 0.5 },
  { from: '4', to: '1', type: 'handshake', strength: 0.9 },
  { from: '5', to: '3', type: 'message', strength: 0.4 },
];

interface AgentNode {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  status: 'active' | 'idle' | 'busy';
}

interface Connection {
  from: string;
  to: string;
  type: 'message' | 'tool' | 'handshake';
  strength: number;
}

export function SwarmVisualizer() {
  const [nodes] = useState<AgentNode[]>(INITIAL_NODES);
  const [connections] = useState<Connection[]>(INITIAL_CONNECTIONS);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  return (
    <div className="w-full h-full relative overflow-hidden bg-zinc-950 p-8">
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* SVG Container for connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {connections.map((conn, i) => {
          const from = nodes.find(n => n.id === conn.from);
          const to = nodes.find(n => n.id === conn.to);
          if (!from || !to) return null;

          return (
            <g key={i}>
              <line 
                x1={from.x} y1={from.y} 
                x2={to.x} y2={to.y} 
                stroke="url(#lineGrad)" 
                strokeWidth="1" 
                strokeDasharray="5,5"
                className="animate-[dash_20s_linear_infinite]"
              />
              <circle r="2" fill="#f59e0b">
                <animateMotion 
                  dur={`${3 / conn.strength}s`} 
                  repeatCount="indefinite" 
                  path={`M ${from.x} ${from.y} L ${to.x} ${to.y}`} 
                />
              </circle>
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map(node => (
        <div 
          key={node.id}
          className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 group ${
            selectedNode === node.id ? 'z-50 scale-110' : 'hover:scale-105'
          }`}
          style={{ left: node.x, top: node.y }}
          onClick={() => setSelectedNode(node.id)}
        >
          <div className="relative">
             {/* Pulse ring */}
             {node.status === 'active' && (
               <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
             )}
             {node.status === 'busy' && (
               <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-pulse" />
             )}
             
             <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all ${
               selectedNode === node.id 
                 ? 'bg-amber-500 border-white shadow-[0_0_30px_rgba(245,158,11,0.5)]' 
                 : 'bg-zinc-900 border-white/10 group-hover:border-amber-500/50'
             }`}>
               <Cpu className={`w-8 h-8 ${selectedNode === node.id ? 'text-black' : 'text-amber-500'}`} />
             </div>

             {/* Node Label */}
             <div className={`absolute left-20 top-1/2 -translate-y-1/2 bg-zinc-900/90 border border-white/10 px-4 py-2 rounded-xl whitespace-nowrap backdrop-blur-md shadow-2xl transition-all ${
               selectedNode === node.id ? 'opacity-100' : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100'
             }`}>
                <div className="text-xs font-black text-zinc-100 uppercase tracking-tighter">{node.name}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{node.role}</div>
                <div className={`mt-2 flex items-center gap-1.5 text-[9px] font-black uppercase ${
                  node.status === 'active' ? 'text-emerald-500' : node.status === 'busy' ? 'text-blue-500' : 'text-zinc-600'
                }`}>
                   <Activity className="w-3 h-3" />
                   {node.status}
                </div>
             </div>
          </div>
        </div>
      ))}

      {/* HUD Controls */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-4">
        <VisualizerHUDCard title="Active Protocol" value="SWARM-D-04" icon={<Share2 className="w-4 h-4 text-amber-500" />} />
        <VisualizerHUDCard title="Latency Buffer" value="2.4ms" icon={<Zap className="w-4 h-4 text-emerald-500" />} />
      </div>

      <div className="absolute top-8 left-8 flex items-center gap-6">
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/80 border border-white/5 rounded-2xl backdrop-blur-md">
           <Users className="w-4 h-4 text-amber-500" />
           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mesh Network: ON</span>
        </div>
        <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest animate-pulse">
           LIVE STREAMING TELEMETRY
        </div>
      </div>
    </div>
  );
}

function VisualizerHUDCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-zinc-900/80 border border-white/5 p-4 rounded-2xl backdrop-blur-md min-w-[180px] shadow-2xl">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{title}</span>
        {icon}
      </div>
      <div className="text-lg font-black text-zinc-100 font-mono">{value}</div>
    </div>
  );
}
