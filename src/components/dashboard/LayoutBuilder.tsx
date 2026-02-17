import { useMemo } from 'react';
import { Responsive, useContainerWidth, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { WidgetConfig, DashboardLayoutItem } from '../../lib/types';
import { WidgetBase } from './WidgetBase';
import { WidgetRenderer } from './WidgetRegistry';

// Define local interface to avoid RGL type issues
interface RGLLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

interface LayoutBuilderProps {
  items: DashboardLayoutItem[];
  widgets: Record<string, WidgetConfig>;
  onLayoutChange: (layout: DashboardLayoutItem[]) => void;
  isEditable: boolean;
}

export function LayoutBuilder({ items, widgets, onLayoutChange, isEditable }: LayoutBuilderProps) {
  const { width, mounted, containerRef } = useContainerWidth({ initialWidth: 1280 });

  // Convert our item format to RGL layout format
  const layout: RGLLayout[] = useMemo(() => items.map(item => ({
    i: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    minW: item.minW ?? 2,
    minH: item.minH ?? 2,
  })), [items]);

  const handleLayoutChange = (currentLayout: Layout) => {
    // Convert back to our format
    const newItems: DashboardLayoutItem[] = currentLayout.map(l => ({
      i: l.i,
      x: l.x,
      y: l.y,
      w: l.w,
      h: l.h,
      minW: l.minW,
      minH: l.minH,
    }));
    onLayoutChange(newItems);
  };

  return (
    <div ref={containerRef} className="w-full min-h-screen p-4">
      {mounted && (
        <Responsive
          className="layout"
          width={width}
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
        onLayoutChange={(l) => handleLayoutChange(l)}
        dragConfig={{ enabled: isEditable, handle: '.cursor-grab' }}
        resizeConfig={{ enabled: isEditable }}
        margin={[20, 20]}
      >
          {items.map((item) => {
              const widget = widgets[item.i];
              if (!widget) return null;

              return (
                  <div key={item.i}>
                      <WidgetBase config={widget} isDraggable={isEditable}>
                          <WidgetRenderer config={widget} />
                      </WidgetBase>
                  </div>
              );
          })}
        </Responsive>
      )}
    </div>
  );
}

