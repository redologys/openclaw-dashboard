import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { FactEditor } from '../../components/imperial/FactEditor';

export default function Facts() {
  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <IVBreadcrumb />
        <h1 className="text-2xl font-bold text-zinc-100 mt-2">Fact Editor</h1>
        <p className="text-zinc-500">Curate and verify historical facts for the video generation pipeline.</p>
      </div>

      <FactEditor />
    </div>
  );
}
