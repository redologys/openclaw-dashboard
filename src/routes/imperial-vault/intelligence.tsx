import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { PromptLab } from '../../components/dev/PromptLab';
import { SkillMatrix } from '../../components/dev/SkillMatrix';
import { ReasoningTrace } from '../../components/dev/ReasoningTrace';
import { TokenUsageMeter } from '../../components/dev/TokenUsageMeter';

export default function Intelligence() {
  return (
    <div className="space-y-8 pb-20">
      <div>
        <BackButton />
        <IVBreadcrumb />
        <h1 className="text-2xl font-bold text-zinc-100 mt-2">Agent Intelligence & Brain Lab</h1>
        <p className="text-zinc-500">Modify system instructions, manage skill matrices, and monitor real-time reasoning.</p>
      </div>

      <div className="space-y-12">
        <section>
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-amber-500 text-xs font-black uppercase tracking-[0.2em]">01. Prompt Engineering Lab</h2>
            </div>
            <PromptLab />
        </section>

        <section>
            <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-amber-500 text-xs font-black uppercase tracking-[0.2em]">02. Skill Association Matrix</h2>
            </div>
            <SkillMatrix />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div>
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-amber-500 text-xs font-black uppercase tracking-[0.2em]">03. Live Reasoning Trace</h2>
                </div>
                <ReasoningTrace />
            </div>
            <div className="space-y-8">
                <div>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-amber-500 text-xs font-black uppercase tracking-[0.2em]">04. Resource Utilization</h2>
                    </div>
                    <TokenUsageMeter />
                </div>
            </div>
        </section>
      </div>
    </div>
  );
}
