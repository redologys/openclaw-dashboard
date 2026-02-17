import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { TerminalWidget } from '../../components/imperial/TerminalWidget';

export default function Terminal() {
  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <IVBreadcrumb />
        <h1 className="text-2xl font-bold text-zinc-100 mt-2">Remote Terminal</h1>
        <p className="text-zinc-500">Secure SSH access to the imperial rendering infrastructure.</p>
      </div>

      <TerminalWidget />
    </div>
  );
}
