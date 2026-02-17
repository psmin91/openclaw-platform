'use client';
import { mockUsers, getStats } from '@/lib/mock-data';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';

export default function AdminDashboard() {
  const stats = getStats();
  const recentUsers = mockUsers.slice(0, 10);

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Admin Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Running" value={stats.running} color="text-green-400" />
        <StatCard label="Stopped" value={stats.stopped} color="text-red-400" />
        <StatCard label="Monthly Cost" value={`$${stats.totalMonthlyCost.toLocaleString()}`} color="text-blue-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pending" value={stats.pending} color="text-yellow-400" />
        <StatCard label="Not Created" value={stats.notCreated} />
        <StatCard label="Avg CPU" value={`${stats.avgCpuUsage}%`} sub="Running instances" />
        <StatCard label="Avg Memory" value={`${stats.avgMemoryUsage}%`} sub="Running instances" />
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="font-semibold text-sm">Recent Users</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)] text-xs">
              <th className="text-left px-4 py-2">User</th>
              <th className="text-left px-4 py-2">Instance</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">CPU</th>
              <th className="text-left px-4 py-2">Cost</th>
              <th className="text-left px-4 py-2">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map(u => (
              <tr key={u.id} className="border-b border-[var(--border)] hover:bg-[var(--border)]/50">
                <td className="px-4 py-2">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-[var(--muted)]">{u.slackDisplayName}</div>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{u.instanceId || '—'}</td>
                <td className="px-4 py-2"><StatusBadge status={u.instanceState} /></td>
                <td className="px-4 py-2">{u.cpuUsage > 0 ? `${u.cpuUsage}%` : '—'}</td>
                <td className="px-4 py-2">${u.monthlyCost}</td>
                <td className="px-4 py-2 text-xs text-[var(--muted)]">{new Date(u.lastActive).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
