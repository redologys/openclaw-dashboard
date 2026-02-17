import { useState, useEffect } from 'react';
import { LayoutBuilder } from '../components/dashboard/LayoutBuilder';
import { Topbar } from '../components/layout/Topbar';
import { DEFAULT_LAYOUTS } from '../lib/defaults';
import { DashboardLayout, DashboardLayoutItem } from '../lib/types';

export default function Dashboard() {
  // State for layouts
  const [layouts, setLayouts] = useState<Record<string, DashboardLayout>>(DEFAULT_LAYOUTS);
  const [currentLayoutId, setCurrentLayoutId] = useState<string>('default');
  const [currentLayout, setCurrentLayout] = useState<DashboardLayout>(DEFAULT_LAYOUTS['default']);
  const [isEditable] = useState(true);

  // Mock connection states
  const [serverConnected] = useState(true);
  const [gatewayConnected] = useState(false);

  useEffect(() => {
    // Sync current layout when ID changes
    if (layouts[currentLayoutId]) {
      setCurrentLayout(layouts[currentLayoutId]);
    }
  }, [currentLayoutId, layouts]);

  const handleLayoutChange = (newItems: DashboardLayoutItem[]) => {
    const updatedLayout = {
      ...currentLayout,
      items: newItems,
      updatedAt: new Date().toISOString()
    };
    
    // Update local state and global layouts collection
    setCurrentLayout(updatedLayout);
    setLayouts(prev => ({
      ...prev,
      [currentLayoutId]: updatedLayout
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      <Topbar 
        currentLayout={currentLayoutId}
        layouts={Object.keys(layouts)}
        onLayoutChange={setCurrentLayoutId}
        gatewayConnected={gatewayConnected}
        serverConnected={serverConnected}
      />
      
      <main className="relative">
         {/* Background Grid Pattern */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none mix-blend-overlay" />
         
         <LayoutBuilder 
           items={currentLayout.items}
           widgets={currentLayout.widgets}
           onLayoutChange={handleLayoutChange}
           isEditable={isEditable}
         />
      </main>

      {/* Footer / Status Bar could go here */}
    </div>
  );
}
