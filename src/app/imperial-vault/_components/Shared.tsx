import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export function IVBreadcrumb() {
  const location = useLocation();
  const path = location.pathname;
  
  const segments = path.split('/').filter(Boolean);
  // segments[0] should be "imperial-vault"
  
  const formattedSegments = segments.map((segment, index) => {
    const isLast = index === segments.length - 1;
    const name = segment === 'imperial-vault' ? 'Imperial Vault' : segment.charAt(0).toUpperCase() + segment.slice(1);
    
    return { name, isLast };
  });

  return (
    <div className="flex items-center space-x-2 text-xs font-mono mb-4 text-zinc-500">
      {formattedSegments.map((seg, i) => (
        <div key={i} className="flex items-center">
            {i > 0 && <ChevronRight className="w-3 h-3 mx-1 text-zinc-700" />}
            <span className={seg.isLast ? 'text-amber-400' : 'text-zinc-500'}>{seg.name}</span>
        </div>
      ))}
    </div>
  );
}

export function BackButton() {
    return (
        <Link to="/imperial-vault" className="flex items-center space-x-2 text-sm text-zinc-400 hover:text-amber-400 transition-colors mb-4 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Imperial Vault</span>
        </Link>
    );
}

interface IVStatCardProps {
    title: string;
    description: string;
    stat: string;
    icon: ReactNode;
    to: string;
    statusColor?: string;
}

export function IVStatCard({ title, description, stat, icon, to, statusColor = 'text-zinc-400' }: IVStatCardProps) {
    return (
        <Link to={to} className="block group">
            <div className="h-full bg-zinc-900/40 border border-white/5 rounded-xl p-5 hover:border-amber-500/30 hover:bg-zinc-900/60 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-amber-500">
                    {icon}
                </div>
                
                <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-lg bg-zinc-950 border border-white/5 text-amber-500 group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                    <h3 className="font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors">{title}</h3>
                </div>
                
                <p className="text-xs text-zinc-500 mb-4 min-h-[2.5em]">{description}</p>
                
                <div className={`text-sm font-mono ${statusColor} border-t border-white/5 pt-3 mt-auto`}>
                    {stat}
                </div>
            </div>
        </Link>
    );
}
