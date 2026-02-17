import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ApprovalRequest {
  id: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  requesterId: string;
  details: any;
  createdAt: string;
}

export default function DevApprovals() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/permissions/approvals');
      const data = await res.json();
      setApprovals(data);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await fetch(`/api/permissions/approvals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchApprovals();
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dev" className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-500" />
            Approvals Queue
          </h1>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-zinc-500">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
              Scanning for pending requests...
            </div>
          ) : approvals.length === 0 ? (
            <div className="p-20 text-center text-zinc-500 flex flex-col items-center gap-4">
              <CheckCircle className="w-12 h-12 text-zinc-800" />
              <p>All clear. No pending approval requests.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {approvals.map((req) => (
                <div key={req.id} className="p-6 hover:bg-zinc-800/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase font-bold tracking-widest text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded">
                          {req.type}
                        </span>
                        <span className="text-zinc-500 text-xs">ID: {req.id}</span>
                      </div>
                      <h3 className="text-lg font-medium text-zinc-200">
                        {req.requesterId} is requesting access
                      </h3>
                      <div className="text-sm text-zinc-400 bg-black/40 p-3 rounded mt-2 border border-zinc-800 font-mono">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(req.details, null, 2)}</pre>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(req.createdAt).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Requires manual intervention
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleAction(req.id, 'approved')}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/20"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'rejected')}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-400 rounded-lg font-medium transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
