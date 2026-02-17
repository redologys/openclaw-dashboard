import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { SearchSandbox } from '../../components/imperial/SearchSandbox';

export default function Sandbox() {
  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <IVBreadcrumb />
        <h1 className="text-2xl font-bold text-zinc-100 mt-2">Brave Search Sandbox</h1>
        <p className="text-zinc-500">Test and refine footage discovery queries for the generation engine.</p>
      </div>

      <SearchSandbox />
    </div>
  );
}
