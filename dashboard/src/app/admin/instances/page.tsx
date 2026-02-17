'use client';
import { mockUsers } from '@/lib/mock-data';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';

export default function InstancesPage() {
  const instances = mockUsers.filter(u => u.instanceId);
  const running = instances.filter(u => u.instanceState === 'running');
  const stopped = instances.filter(u => u.instanceState === 'stopped');

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Instance Management</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Instances" value={instances.length} />
        <StatCard label="Running" value={running.length} color="text-green-400" />
        <StatCard label="Stopped" value={stopped.length} color="text-red-400" />
        <StatCard label="Auto-stop Eligible" value={running.filter(u => {
          const mins = (Date.now() - new Date(u.lastActive).getTime()) / 60000;
          return mins > 30;
        }).length} sub="Inactive > 30 min" color="text-yellow-400" />
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-semibold text-sm">All Instances</h3>
          <div className="flex gap-2">
            <button className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30">
              Stop All Idle
            </button>
            <button className="text-xs bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/30">
              Start All
            </button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)] text-xs">
              <th className="text-left px-4 py-2">Instance ID</th>
              <th className="text-left px-4 py-2">User</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Region</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">CPU</th>
              <th className="text-left px-4 py-2">Memory</th>
              <th className="text-left px-4 py-2">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {instances.map(u => (
              <tr key={u.id} className="border-b border-[var(--border)] hover:bg-[var(--border)]/50">
                <td className="px-4 py-2 font-mono text-xs">{u.instanceId}</td>
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2 text-xs">{u.instanceType}</td>
                <td className="px-4 py-2 text-xs">{u.region}</td>
                <td className="px-4 py-2"><StatusBadge status={u.instanceState} /></td>
                <td className="px-4 py-2">
                  {u.cpuUsage > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[var(--border)] rounded-full">
                        <div className={`h-full rounded-full ${u.cpuUsage > 70 ? 'bg-red-500' : u.cpuUsage > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${u.cpuUsage}%` }} />
                      </div>
                      <span className="text-xs">{u.cpuUsage}%</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  {u.memoryUsage > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[var(--border)] rounded-full">
                        <div className={`h-full rounded-full ${u.memoryUsage > 70 ? 'bg-red-500' : u.memoryUsage > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${u.memoryUsage}%` }} />
                      </div>
                      <span className="text-xs">{u.memoryUsage}%</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-[var(--muted)]">{new Date(u.lastActive).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
