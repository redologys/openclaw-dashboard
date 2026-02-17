import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { AlertRulesEngine } from '../../components/imperial/AlertRulesEngine';

export default function Alerts() {
  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <IVBreadcrumb />
        <h1 className="text-2xl font-bold text-zinc-100 mt-2">Alert Rules Engine</h1>
        <p className="text-zinc-500">Configure automated notifications and failure handling protocols.</p>
      </div>

      <AlertRulesEngine />
    </div>
  );
}
