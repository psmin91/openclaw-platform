'use client';
import { useState, useEffect, useCallback } from 'react';
import { mockUsers, User } from '@/lib/mock-data';
import StatusBadge from '@/components/StatusBadge';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PlanResult {
  add: number;
  change: number;
  destroy: number;
  unchanged?: number;
  summary: string;
  raw: string;
  changes?: { action: string; resource: string; detail: Record<string, unknown> }[];
  error?: boolean;
  message?: string;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const [adding, setAdding] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSlack, setFormSlack] = useState('');
  const [formPlan, setFormPlan] = useState('basic');
  const [formRegion, setFormRegion] = useState('ap-northeast-2');

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.slackDisplayName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.instanceState === filter;
    return matchSearch && matchFilter;
  });

  const handleDelete = (id: string) => {
    if (confirm('Remove this user?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
      // Also delete from API
      fetch(`${API}/api/users/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  };

  const handleAddUser = async () => {
    if (!formName || !formEmail || !formSlack) return;
    setAdding(true);
    try {
      const res = await fetch(`${API}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          slackUserId: formSlack,
          plan: formPlan,
          region: formRegion,
        }),
      });
      const data = await res.json();

      if (data.user) {
        setUsers(prev => [...prev, data.user as User]);
      }
      if (data.planResult) {
        setPlanResult(data.planResult);
        setShowPlan(true);
      }

      setShowAddModal(false);
      resetForm();
    } catch (e) {
      console.error('Failed to add user:', e);
    } finally {
      setAdding(false);
    }
  };

  const handleApply = async () => {
    try {
      const res = await fetch(`${API}/api/terraform/apply`, { method: 'POST' });
      const data = await res.json();
      alert(`${data.message}\nJob ID: ${data.jobId}`);
      setShowPlan(false);
      setPlanResult(null);
    } catch {
      alert('Failed to queue apply');
    }
  };

  const resetForm = () => {
    setFormName(''); setFormEmail(''); setFormSlack('');
    setFormPlan('basic'); setFormRegion('ap-northeast-2');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Users ({filtered.length})</h2>
        <button onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add User
        </button>
      </div>

      {/* Plan Result Banner */}
      {showPlan && planResult && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              📋 Terraform Plan Result
              {planResult.error && <span className="text-red-400 text-xs">Error</span>}
            </h3>
            <button onClick={() => setShowPlan(false)} className="text-xs text-[var(--muted)] hover:text-white">✕ Close</button>
          </div>

          {!planResult.error && (
            <>
              <div className="flex gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                  <span className="text-sm"><strong>{planResult.add}</strong> to add</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                  <span className="text-sm"><strong>{planResult.change}</strong> to change</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                  <span className="text-sm"><strong>{planResult.destroy}</strong> to destroy</span>
                </div>
                {planResult.unchanged !== undefined && (
                  <div className="text-sm text-[var(--muted)]">{planResult.unchanged} unchanged</div>
                )}
              </div>

              {/* Changes detail */}
              {planResult.changes && planResult.changes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {planResult.changes.map((c, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs px-3 py-2 rounded ${
                      c.action === 'create' ? 'bg-green-500/10 text-green-400' :
                      c.action === 'destroy' ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      <span className="font-bold">{c.action === 'create' ? '+' : c.action === 'destroy' ? '-' : '~'}</span>
                      <span className="font-mono">{c.resource}</span>
                      {c.detail?.instance_type && (
                        <span className="ml-auto text-[var(--muted)]">{c.detail.instance_type as string}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Raw output */}
              <details className="mb-3">
                <summary className="text-xs text-[var(--muted)] cursor-pointer hover:text-white">Show raw plan output</summary>
                <pre className="mt-2 text-xs bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {planResult.raw}
                </pre>
              </details>

              <div className="flex gap-2">
                <button onClick={handleApply}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  🚀 Apply Changes
                </button>
                <button onClick={() => { setShowPlan(false); setPlanResult(null); }}
                  className="border border-[var(--border)] px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--border)]">
                  Dismiss
                </button>
              </div>
            </>
          )}

          {planResult.error && (
            <pre className="text-xs text-red-400 bg-red-500/10 rounded-lg p-3 overflow-x-auto">
              {planResult.message || planResult.raw}
            </pre>
          )}
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:border-[var(--accent)]" />
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none">
          <option value="all">All Status</option>
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
          <option value="pending">Pending</option>
          <option value="not_created">Not Created</option>
        </select>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)] text-xs">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Slack</th>
              <th className="text-left px-4 py-3">Plan</th>
              <th className="text-left px-4 py-3">Instance</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Region</th>
              <th className="text-left px-4 py-3">Cost</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-b border-[var(--border)] hover:bg-[var(--border)]/50">
                <td className="px-4 py-2">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-[var(--muted)]">{u.email}</div>
                </td>
                <td className="px-4 py-2">
                  <div className="text-xs font-mono">{u.slackUserId}</div>
                  <div className="text-xs text-[var(--muted)]">@{u.slackDisplayName}</div>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    u.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                    u.plan === 'pro' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>{u.plan}</span>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{u.instanceId?.slice(0, 12) || '—'}</td>
                <td className="px-4 py-2"><StatusBadge status={u.instanceState} /></td>
                <td className="px-4 py-2 text-xs">{u.region}</td>
                <td className="px-4 py-2">${u.monthlyCost}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    {u.instanceState === 'stopped' && (
                      <button className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded hover:bg-green-500/30">Start</button>
                    )}
                    {u.instanceState === 'running' && (
                      <button className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded hover:bg-yellow-500/30">Stop</button>
                    )}
                    {u.instanceState === 'not_created' && (
                      <button className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/30">Create</button>
                    )}
                    <button onClick={() => handleDelete(u.id)}
                      className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Add New User</h3>
            <p className="text-xs text-[var(--muted)] mb-4">Adding a user will update tfvars and run <code>terraform plan</code>.</p>
            <div className="space-y-3">
              <input placeholder="Full Name" value={formName} onChange={e => setFormName(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Email" value={formEmail} onChange={e => setFormEmail(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Slack User ID (e.g. U01234567)" value={formSlack} onChange={e => setFormSlack(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
              <select value={formPlan} onChange={e => setFormPlan(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
                <option value="basic">basic</option><option value="pro">pro</option><option value="enterprise">enterprise</option>
              </select>
              <select value={formRegion} onChange={e => setFormRegion(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
                <option>ap-northeast-2</option><option>us-east-1</option><option>us-west-2</option><option>eu-west-1</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm border border-[var(--border)]">Cancel</button>
              <button onClick={handleAddUser} disabled={adding || !formName || !formEmail || !formSlack}
                className="px-4 py-2 rounded-lg text-sm bg-[var(--accent)] text-white disabled:opacity-50">
                {adding ? 'Adding & Planning...' : 'Add User & Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
