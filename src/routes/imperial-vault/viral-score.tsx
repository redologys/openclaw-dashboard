import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { ViralScoreDebugger } from '../../components/imperial/ViralScoreDebugger';

export default function ViralScore() {
  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <IVBreadcrumb />
        <h1 className="text-2xl font-bold text-zinc-100 mt-2">Viral Score Debugger</h1>
        <p className="text-zinc-500">Manual scoring overrides and Gemini classification breakdown.</p>
      </div>

      <ViralScoreDebugger />
    </div>
  );
}
