'use client';
import { useState } from 'react';
import { mockUsers } from '@/lib/mock-data';
import StatusBadge from '@/components/StatusBadge';

export default function SlackPage() {
  const [search, setSearch] = useState('');
  const mapped = mockUsers.filter(u => u.instanceId);
  const unmapped = mockUsers.filter(u => !u.instanceId);

  const filteredMapped = mapped.filter(u =>
    u.slackDisplayName.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Slack ↔ OpenClaw Mapping</h2>
      <p className="text-sm text-[var(--muted)] mb-6">Single Slack App · Per-user OpenClaw EC2 instance mapping</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-xs text-[var(--muted)]">Slack App</p>
          <p className="text-lg font-bold mt-1">OpenClaw Bot</p>
          <p className="text-xs text-green-400 mt-1">● Connected</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-xs text-[var(--muted)]">Mapped Users</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{mapped.length}</p>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <p className="text-xs text-[var(--muted)]">Unmapped Users</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{unmapped.length}</p>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-sm mb-3">Auto-start/stop Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3 p-3 bg-[var(--bg)] rounded-lg">
            <span className="text-xl">⏸️</span>
            <div>
              <p className="font-medium">Auto-stop</p>
              <p className="text-xs text-[var(--muted)]">Inactive for 30 minutes → EC2 stop</p>
            </div>
            <span className="ml-auto text-green-400 text-xs">Active</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[var(--bg)] rounded-lg">
            <span className="text-xl">▶️</span>
            <div>
              <p className="font-medium">Auto-start</p>
              <p className="text-xs text-[var(--muted)]">Slack mention → EC2 start</p>
            </div>
            <span className="ml-auto text-green-400 text-xs">Active</span>
          </div>
        </div>
      </div>

      <input type="text" placeholder="Search by name or Slack handle..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-[var(--accent)]" />

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)] text-xs">
              <th className="text-left px-4 py-2">Slack User</th>
              <th className="text-left px-4 py-2">Slack ID</th>
              <th className="text-left px-4 py-2">OpenClaw Instance</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMapped.map(u => (
              <tr key={u.id} className="border-b border-[var(--border)] hover:bg-[var(--border)]/50">
                <td className="px-4 py-2">
                  <div className="font-medium">@{u.slackDisplayName}</div>
                  <div className="text-xs text-[var(--muted)]">{u.name}</div>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{u.slackUserId}</td>
                <td className="px-4 py-2 font-mono text-xs">{u.instanceId}</td>
                <td className="px-4 py-2"><StatusBadge status={u.instanceState} /></td>
                <td className="px-4 py-2">
                  <button className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/30">Unmap</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
