import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { WidgetConfig } from '../../lib/types';
import { cn } from '../ui/card'; // utilizing cn from card utility

interface WidgetBaseProps extends React.HTMLAttributes<HTMLDivElement> {
  config: WidgetConfig;
  isDraggable?: boolean;
  onRemove?: () => void;
  children: React.ReactNode;
}

export const WidgetBase = React.forwardRef<HTMLDivElement, WidgetBaseProps>(
  ({ config, isDraggable, onRemove, children, className, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "h-full w-full flex flex-col overflow-hidden transition-all duration-200",
          isDraggable && "cursor-grab active:cursor-grabbing hover:border-white/20",
          className
        )}
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
          <CardTitle className="text-sm font-medium text-white/80 select-none">
            {config.title}
          </CardTitle>
          {/* Controls can go here */}
        </CardHeader>
        <CardContent className="flex-1 p-4 pt-2 overflow-auto relative">
          {children}
        </CardContent>
      </Card>
    );
  }
);

WidgetBase.displayName = "WidgetBase";
