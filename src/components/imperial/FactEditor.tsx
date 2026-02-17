import { useState } from 'react';
import { Edit3, Save, Trash2, Plus, Search, Filter, CheckCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface Fact {
    id: string;
    text: string;
    source: string;
    category: string;
    status: 'draft' | 'verified' | 'used';
    timestamp: string;
}

export function FactEditor() {
    const [facts, setFacts] = useState<Fact[]>([
        {
            id: 'f1',
            text: 'The first person convicted of speeding was going 8 mph.',
            source: 'Guinness World Records',
            category: 'History',
            status: 'verified',
            timestamp: '2024-05-20T10:00:00Z'
        },
        {
            id: 'f2',
            text: 'Honey never spoils. Archaeologists have found edible honey in ancient Egyptian tombs.',
            source: 'National Geographic',
            category: 'Science',
            status: 'draft',
            timestamp: '2024-05-20T11:30:00Z'
        },
        {
            id: 'f3',
            text: 'A group of crows is called a murder.',
            source: 'Audubon Society',
            category: 'Nature',
            status: 'used',
            timestamp: '2024-05-19T15:45:00Z'
        }
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const filteredFacts = facts.filter(f => 
        f.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEdit = (fact: Fact) => {
        setEditingId(fact.id);
        setEditContent(fact.text);
    };

    const handleSave = () => {
        if (!editingId) return;
        setFacts(facts.map(f => f.id === editingId ? { ...f, text: editContent } : f));
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        setFacts(facts.filter(f => f.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                        type="text"
                        placeholder="Search facts by content or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                    <button className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all">
                        <Plus className="w-4 h-4" />
                        Add New Fact
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredFacts.map(fact => (
                    <div 
                        key={fact.id}
                        className={clsx(
                            "bg-zinc-900/50 border rounded-xl p-5 transition-all group",
                            editingId === fact.id ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "border-white/5 hover:border-white/10"
                        )}
                    >
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{fact.category}</span>
                                    <div className="w-1 h-1 rounded-full bg-zinc-700" />
                                    <div className="flex items-center gap-1.5">
                                        {fact.status === 'verified' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                                        {fact.status === 'draft' && <Clock className="w-3 h-3 text-amber-500" />}
                                        <span className={clsx(
                                            "text-[10px] font-bold uppercase tracking-wider",
                                            fact.status === 'verified' ? "text-emerald-500" : 
                                            fact.status === 'draft' ? "text-amber-500" : "text-zinc-500"
                                        )}>
                                            {fact.status}
                                        </span>
                                    </div>
                                </div>
                                
                                {editingId === fact.id ? (
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full bg-zinc-950 border border-white/10 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 min-h-[100px]"
                                    />
                                ) : (
                                    <p className="text-zinc-200 text-sm leading-relaxed mb-4">
                                        {fact.text}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-4 items-center mt-2">
                                    <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                                        Source: <span className="text-zinc-400 italic">{fact.source}</span>
                                    </span>
                                    <span className="text-[11px] text-zinc-600">
                                        {new Date(fact.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {editingId === fact.id ? (
                                    <button 
                                        onClick={handleSave}
                                        className="p-2 bg-emerald-500 text-zinc-950 rounded-lg hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                    >
                                        <Save className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleEdit(fact)}
                                        className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-zinc-200 hover:bg-zinc-700 transition-all"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                )}
                                <button 
                                    onClick={() => handleDelete(fact.id)}
                                    className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:text-rose-400 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredFacts.length === 0 && (
                    <div className="py-20 text-center">
                        <Edit3 className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                        <p className="text-zinc-500">No facts found matching your search. Try a different query.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
