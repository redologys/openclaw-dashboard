import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { CookieMonitor } from '../../components/imperial/CookieMonitor';

export default function Cookies() {
  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <IVBreadcrumb />
        <h1 className="text-2xl font-bold text-zinc-100 mt-2">Cookie Health Monitor</h1>
        <p className="text-zinc-500">Track and refresh authentication sessions for automated agents.</p>
      </div>

      <CookieMonitor />
    </div>
  );
}
