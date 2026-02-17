import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

const ACCENTS = [
  { name: 'Emerald', value: 'emerald', hex: '#10b981' },
  { name: 'Sky', value: 'sky', hex: '#0ea5e9' },
  { name: 'Violet', value: 'violet', hex: '#8b5cf6' },
  { name: 'Rose', value: 'rose', hex: '#f43f5e' },
  { name: 'Amber', value: 'amber', hex: '#f59e0b' },
];

export function ThemePicker() {
  const [activeAccent, setActiveAccent] = useState('emerald');

  useEffect(() => {
    // Apply theme to document root
    // In a real app, this would toggle a class on <html> or use a CSS variable
    document.documentElement.style.setProperty('--accent-color', ACCENTS.find(a => a.value === activeAccent)?.hex || '#10b981');
  }, [activeAccent]);

  return (
    <div className="flex items-center space-x-2 bg-zinc-900/50 p-1.5 rounded-full border border-white/5">
      {ACCENTS.map((accent) => (
        <button
          key={accent.value}
          onClick={() => setActiveAccent(accent.value)}
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
            activeAccent === accent.value ? 'ring-2 ring-white/20 scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'
          }`}
          style={{ backgroundColor: accent.hex }}
          title={accent.name}
        >
          {activeAccent === accent.value && <Check className="w-3 h-3 text-white mix-blend-difference" />}
        </button>
      ))}
    </div>
  );
}
