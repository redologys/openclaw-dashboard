import { useState } from 'react';
import { 
  Play, 
  Trash2, 
  Settings, 
  MoveRight, 
  Zap, 
  Webhook, 
  Bot, 
  Code,
  Save,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

interface PipelineStep {
  id: string;
  type: 'trigger' | 'agent' | 'tool' | 'logic';
  name: string;
  config: any;
}

const INITIAL_STEPS: PipelineStep[] = [
  { id: '1', type: 'trigger', name: 'YouTube Webhook', config: { event: 'new_video' } },
  { id: '2', type: 'agent', name: 'Research Lead', config: { task: 'Analyze transcript' } },
  { id: '3', type: 'logic', name: 'Quality Filter', config: { threshold: 0.8 } },
  { id: '4', type: 'tool', name: 'Slack Notify', config: { channel: 'notifications' } },
];

export function PipelineAutopilot() {
  const [steps, setSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [activeStepId, setActiveStepId] = useState<string | null>('1');

  const addStep = (type: PipelineStep['type']) => {
    const newStep: PipelineStep = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      config: {}
    };
    setSteps([...steps, newStep]);
    setActiveStepId(newStep.id);
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
    if (activeStepId === id) setActiveStepId(null);
  };

  const activeStep = steps.find(s => s.id === activeStepId);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-zinc-900/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-tight">Pipeline Autopilot</h2>
            <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Autonomous Workflow Architect</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
            <Settings className="w-3.5 h-3.5" />
            Config
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-black rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10">
            <Play className="w-3.5 h-3.5 fill-current" />
            Deploy Sequence
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Step Canvas */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center gap-6 relative custom-scrollbar bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:32px_32px]">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center gap-6 w-full max-w-md">
              <div 
                onClick={() => setActiveStepId(step.id)}
                className={`w-full group relative p-5 rounded-2xl border transition-all cursor-pointer ${
                  activeStepId === step.id 
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.05)]' 
                    : 'bg-zinc-900/50 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    step.type === 'trigger' ? 'bg-purple-500/20 text-purple-500' :
                    step.type === 'agent' ? 'bg-blue-500/20 text-blue-500' :
                    step.type === 'tool' ? 'bg-emerald-500/20 text-emerald-500' :
                    'bg-zinc-500/20 text-zinc-400'
                  }`}>
                    {step.type === 'trigger' && <Webhook className="w-5 h-5" />}
                    {step.type === 'agent' && <Bot className="w-5 h-5" />}
                    {step.type === 'tool' && <Code className="w-5 h-5" />}
                    {step.type === 'logic' && <Settings className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">{step.type}</div>
                    <div className="text-sm font-bold text-zinc-100">{step.name}</div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                    className="p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="h-6 w-0.5 bg-zinc-800 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 bg-zinc-950 rounded-full border border-zinc-800">
                    <MoveRight className="w-3 h-3 text-zinc-700 rotate-90" />
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="mt-4 flex gap-3">
            <AddStepButton onClick={() => addStep('trigger')} icon={<Webhook className="w-3.5 h-3.5" />} label="Trigger" color="purple" />
            <AddStepButton onClick={() => addStep('agent')} icon={<Bot className="w-3.5 h-3.5" />} label="Agent" color="blue" />
            <AddStepButton onClick={() => addStep('tool')} icon={<Code className="w-3.5 h-3.5" />} label="Tool" color="emerald" />
            <AddStepButton onClick={() => addStep('logic')} icon={<Settings className="w-3.5 h-3.5" />} label="Logic" color="zinc" />
          </div>
        </div>

        {/* Inspector Sidebar */}
        <div className="w-80 border-l border-white/5 bg-zinc-900/20 p-6 flex flex-col">
          {activeStep ? (
            <>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-zinc-950 rounded-lg border border-white/5">
                  <Settings className="w-4 h-4 text-zinc-400" />
                </div>
                <h3 className="font-bold text-zinc-100 uppercase tracking-widest text-xs">Step Inspector</h3>
              </div>

              <div className="space-y-6 flex-1">
                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-2 block">Step Name</label>
                  <input 
                    type="text" 
                    value={activeStep.name}
                    onChange={(e) => {
                      const newSteps = [...steps];
                      const idx = newSteps.findIndex(s => s.id === activeStep.id);
                      newSteps[idx].name = e.target.value;
                      setSteps(newSteps);
                    }}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/30 transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-2 block">Configuration</label>
                  <div className="bg-zinc-950 rounded-2xl border border-white/5 p-4 space-y-4">
                    {/* Dynamic config fields based on step type */}
                    {activeStep.type === 'trigger' && (
                      <ConfigField label="Source" value="YouTube API" />
                    )}
                    {activeStep.type === 'agent' && (
                      <ConfigField label="Model" value="Gemini 2.0 Flash" />
                    )}
                    <ConfigField label="On Failure" value="Retry (3x)" />
                  </div>
                </div>

                <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                  <div className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">
                    <Save className="w-3 h-3" />
                    State Persistence
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed mb-4">
                    Inputs from previous steps are available via the <code className="text-zinc-300">ctx</code> variable.
                  </p>
                  <button className="w-full py-2 bg-zinc-950 border border-white/10 rounded-xl text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-100 transition-all">
                    Test this step
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-white/5 hover:bg-zinc-900 transition-all group">
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] text-zinc-600 uppercase font-black tracking-[0.2em]">Execution Logs</span>
                    <span className="text-[10px] text-zinc-400 font-bold">14 Recent Runs</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-amber-500 transition-all" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4">
              <div className="w-12 h-12 bg-zinc-950 rounded-2xl border border-white/5 flex items-center justify-center">
                <MoreHorizontal className="w-6 h-6 text-zinc-800" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No Step Selected</h4>
                <p className="text-[10px] text-zinc-600 mt-2 leading-relaxed">Select a pipeline node on the canvas to configure its specialized parameters.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddStepButton({ onClick, icon, label, color }: { onClick: () => void, icon: React.ReactNode, label: string, color: string }) {
  const getColors = () => {
    switch(color) {
      case 'purple': return 'hover:bg-purple-500/10 hover:border-purple-500/30 text-purple-500';
      case 'blue': return 'hover:bg-blue-500/10 hover:border-blue-500/30 text-blue-500';
      case 'emerald': return 'hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-500';
      default: return 'hover:bg-zinc-500/10 hover:border-zinc-500/30 text-zinc-400';
    }
  };

  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 bg-zinc-900/50 border border-white/5 rounded-xl flex items-center gap-2 transition-all ${getColors()}`}
    >
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function ConfigField({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{label}</span>
      <span className="text-[10px] text-zinc-300 font-black tracking-tight">{value}</span>
    </div>
  );
}
