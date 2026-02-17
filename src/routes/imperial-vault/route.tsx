import { Outlet } from 'react-router-dom';

export default function ImperialVaultLayout() {
  return (
    <div className="flex-1 p-8 bg-zinc-950 min-h-screen relative overflow-hidden">
       {/* Ambient amber glow for this section */}
       <div className="absolute top-0 left-0 w-full h-96 bg-amber-900/10 blur-[100px] pointer-events-none" />
       
       <div className="relative z-10 max-w-7xl mx-auto">
         <Outlet />
       </div>
    </div>
  );
}
