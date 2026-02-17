import { useRef } from 'react';

interface InteractiveOverlayProps {
    enabled: boolean;
    onInteract: (x: number, y: number) => void;
}

export function InteractiveOverlay({ enabled, onInteract }: InteractiveOverlayProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    const handleClick = (e: React.MouseEvent) => {
        if (!enabled || !overlayRef.current) return;

        const rect = overlayRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Scale coordinates to internal 1280x800 browser resolution
        const scaledX = Math.round((x / rect.width) * 1280);
        const scaledY = Math.round((y / rect.height) * 800);

        onInteract(scaledX, scaledY);
    };

    if (!enabled) return null;

    return (
        <div 
            ref={overlayRef}
            onClick={handleClick}
            className="absolute inset-0 z-10 cursor-crosshair bg-blue-500/5 hover:bg-blue-500/10 transition-colors border-2 border-dashed border-blue-500/20"
        >
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500 text-[10px] font-bold text-white uppercase rounded shadow-lg shadow-blue-500/50">
                Interactive Multi-Control
            </div>
        </div>
    );
}
