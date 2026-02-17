import { IVBreadcrumb, BackButton } from '../../app/imperial-vault/_components/Shared';
import { OverlayStudio } from '../../components/imperial/OverlayStudio';

export default function Overlay() {
  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <IVBreadcrumb />
        <h1 className="text-2xl font-bold text-zinc-100 mt-2">Overlay Studio</h1>
        <p className="text-zinc-500 font-mono text-sm tracking-tight capitalize">Remote Control for `render_overlay.py` on AWS Historian</p>
      </div>

      <OverlayStudio />
    </div>
  );
}
