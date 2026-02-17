import { useState, useEffect } from 'react';
import { BrowserStatusBar } from './BrowserStatusBar';
import { InteractiveOverlay } from './InteractiveOverlay';
import { Loader2, AlertCircle } from 'lucide-react';
import { clientConfig } from '../../../lib/clientConfig';

export function BrowserPreview() {
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [state, setState] = useState<any>(null);
    const [interactive, setInteractive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchScreenshot = async (manual = false) => {
        if (!manual && (!state?.active || clientConfig.SAFE_MODE)) return;
        
        try {
            const res = await fetch('/api/browser/screenshot');
            const data = await res.json();
            if (data.image) {
                setScreenshot(data.image);
                setError(null);
            }
        } catch (e: any) {
            console.error('Failed to fetch screenshot:', e);
        }
    };

    const fetchState = async () => {
        try {
            const res = await fetch('/api/browser/state');
            const data = await res.json();
            setState(data);
        } catch (e) {}
    };

    useEffect(() => {
        const timer = setInterval(fetchState, 5000);
        fetchState();
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let timer: any;
        const tick = async () => {
            await fetchScreenshot();
            timer = setTimeout(tick, 1000);
        };
        tick();
        return () => clearTimeout(timer);
    }, [state?.active]);

    useEffect(() => {
        const events = new EventSource('/api/browser/events');
        events.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'screenshot_updated') {
                fetchScreenshot(true);
            } else if (data.type === 'page_navigated') {
                setState((prev: any) => ({ ...prev, url: data.url, title: data.title }));
                fetchScreenshot(true);
            }
        };
        return () => events.close();
    }, []);

    const handleInteract = async (x: number, y: number) => {
        setLoading(true);
        try {
            const res = await fetch('/api/browser/click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x, y })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Click failed');
            }
            setTimeout(() => fetchScreenshot(true), 500);
        } catch (e: any) {
            setError(e.message);
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950/20 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-xl">
            <div className="p-4 border-b border-white/5 bg-black/40">
                <BrowserStatusBar 
                    url={state?.url || 'About:Blank'} 
                    active={state?.active || false}
                    agentName={state?.agent}
                    lastUpdated={state?.lastScreenshot ? new Date(state.lastScreenshot).toLocaleTimeString() : 'Never'}
                    onRefresh={() => fetchScreenshot(true)}
                />
            </div>

            <div className="flex-1 relative bg-black/40 flex flex-col items-center justify-center p-6 gap-4">
                <div className="relative shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 rounded-xl overflow-hidden max-w-full max-h-full aspect-[16/10] bg-zinc-900 group">
                    {screenshot ? (
                        <img 
                            src={`data:image/png;base64,${screenshot}`} 
                            className="w-full h-full object-contain pointer-events-none select-none"
                            alt="Browser Viewport"
                        />
                    ) : (
                        <div className="w-[1280px] h-[800px] flex flex-col items-center justify-center text-zinc-600 font-mono text-xs max-w-full bg-zinc-900/50 p-10 text-center gap-4">
                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-white/5">
                                <AlertCircle className="w-8 h-8 text-zinc-700" />
                            </div>
                            <div>
                                <p className="text-zinc-400 font-bold mb-1 uppercase tracking-widest text-[10px]">Browser Stream Offline</p>
                                <p className="opacity-50 max-w-xs">{clientConfig.SAFE_MODE ? 'Safemode active. Live stream requires gateway connection.' : 'Connect gateway to enable live visual monitoring.'}</p>
                            </div>
                        </div>
                    )}
                    
                    <InteractiveOverlay enabled={interactive} onInteract={handleInteract} />

                    {error && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-50 animate-bounce flex items-center gap-2">
                             <AlertCircle className="w-3 h-3" />
                             {error}
                        </div>
                    )}

                    {loading && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-20">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Interactive Mode</span>
                        <button 
                            onClick={() => setInteractive(!interactive)}
                            className={`w-10 h-5 rounded-full transition-all relative ${interactive ? 'bg-blue-600' : 'bg-zinc-800'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${interactive ? 'right-1' : 'left-1'}`} />
                        </button>
                    </div>

                    {interactive && (
                        <div className="text-[10px] text-amber-500 flex items-center gap-2 animate-pulse font-medium">
                            <AlertCircle className="w-3 h-3" />
                            User input overriding agent controls
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
