import { useRef, useEffect } from 'react';
import { clientConfig } from '../../lib/clientConfig';
import { useGatewayStatus } from '../../lib/useGatewayStatus';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Terminal as TerminalIcon, Maximize2, RefreshCw } from 'lucide-react';

export function TerminalWidget() {
    const { status } = useGatewayStatus(5000);
    const safeMode = status.safeMode;

    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new XTerm({
            theme: {
                background: '#09090b',
                foreground: '#a1a1aa',
                cursor: '#f59e0b',
                selectionBackground: '#f59e0b44',
            },
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
            fontSize: 13,
            cursorBlink: true,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        
        term.open(terminalRef.current);
        fitAddon.fit();
        
        term.writeln('\x1b[38;5;214mOpenClaw Imperial Terminal v1.0.0\x1b[0m');
        if (safeMode) {
            term.writeln('\x1b[38;5;196m[SAFE_MODE] Connection restricted to Simulation Layer.\x1b[0m');
        } else {
            term.writeln(`Connecting to remote host: \x1b[38;5;111m${clientConfig.SSH_HOST}\x1b[0m`);
        }
        term.writeln('');
        term.write('\x1b[32mubuntu@openclaw\x1b[0m:\x1b[34m~\x1b[0m$ ');

        xtermRef.current = term;

        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
        };
    }, [safeMode]);

    const handleClear = () => {
        if (xtermRef.current) {
            xtermRef.current.clear();
            xtermRef.current.write('\x1b[32mubuntu@openclaw\x1b[0m:\x1b[34m~\x1b[0m$ ');
        }
    };

    return (
        <div className="bg-zinc-950 border border-white/5 rounded-xl overflow-hidden flex flex-col h-[500px] shadow-2xl">
            <div className="bg-zinc-900/50 border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <TerminalIcon className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-mono font-medium text-zinc-400">REMOTE_SSH_SESSION [{clientConfig.SSH_HOST}]</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={handleClear}
                        className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Clear Terminal"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 hover:bg-white/5 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            <div className="flex-1 p-2 bg-[#09090b] relative">
                <div ref={terminalRef} className="h-full w-full" />
                {safeMode && (
                    <div className="absolute top-4 right-4 z-20 bg-rose-500/10 border border-rose-500/50 px-3 py-1.5 rounded-full backdrop-blur-md flex items-center gap-2">
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Safe Mode Active</span>
                    </div>
                )}
            </div>
            <div className="bg-zinc-900/30 px-4 py-2 border-t border-white/5 flex items-center justify-between">
                <div className="flex gap-4">
                    <span className="text-[10px] font-mono text-zinc-600">STATUS: <span className="text-emerald-500/80">LATENCY 42ms</span></span>
                    <span className="text-[10px] font-mono text-zinc-600">ENCRYPTION: <span className="text-zinc-500">AES-256-GCM</span></span>
                </div>
                <div className="flex gap-2">
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[9px] font-mono">CTRL+C</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[9px] font-mono">CTRL+L</kbd>
                </div>
            </div>
        </div>
    );
}
