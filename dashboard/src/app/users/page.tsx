'use client';
import { useState } from 'react';
import { mockUsers, User } from '@/lib/mock-data';
import StatusBadge from '@/components/StatusBadge';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [users, setUsers] = useState<User[]>(mockUsers);

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
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Users ({filtered.length})</h2>
        <button onClick={() => setShowAddModal(true)}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add User
        </button>
      </div>

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

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Add New User</h3>
            <div className="space-y-3">
              <input placeholder="Full Name" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Email" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Slack User ID (e.g. U01234567)" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm" />
              <select className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
                <option>basic</option><option>pro</option><option>enterprise</option>
              </select>
              <select className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
                <option>ap-northeast-2</option><option>us-east-1</option><option>us-west-2</option><option>eu-west-1</option>
              </select>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="autoCreate" />
                <label htmlFor="autoCreate" className="text-sm">Auto-create EC2 instance</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm border border-[var(--border)]">Cancel</button>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm bg-[var(--accent)] text-white">Add User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
