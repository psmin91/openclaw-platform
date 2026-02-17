'use client';
import { mockUsers, getStats } from '@/lib/mock-data';
import StatCard from '@/components/StatCard';

export default function CostsPage() {
  const stats = getStats();
  const byPlan = {
    basic: mockUsers.filter(u => u.plan === 'basic'),
    pro: mockUsers.filter(u => u.plan === 'pro'),
    enterprise: mockUsers.filter(u => u.plan === 'enterprise'),
  };
  const byRegion = mockUsers.reduce((acc, u) => {
    acc[u.region] = (acc[u.region] || 0) + u.monthlyCost;
    return acc;
  }, {} as Record<string, number>);

  const topSpenders = [...mockUsers].sort((a, b) => b.monthlyCost - a.monthlyCost).slice(0, 10);
  const potentialSavings = mockUsers
    .filter(u => u.instanceState === 'running' && (Date.now() - new Date(u.lastActive).getTime()) > 30 * 60 * 1000)
    .reduce((sum, u) => sum + u.monthlyCost * 0.7, 0);

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Cost Monitoring</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Monthly" value={`$${stats.totalMonthlyCost.toLocaleString()}`} color="text-blue-400" />
        <StatCard label="Avg per User" value={`$${(stats.totalMonthlyCost / stats.totalUsers).toFixed(2)}`} />
        <StatCard label="Running Cost" value={`$${mockUsers.filter(u => u.instanceState === 'running').reduce((s, u) => s + u.monthlyCost, 0).toFixed(2)}`} color="text-green-400" />
        <StatCard label="Potential Savings" value={`$${potentialSavings.toFixed(2)}`} sub="Stop idle instances" color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Cost by Plan</h3>
          {Object.entries(byPlan).map(([plan, users]) => {
            const cost = users.reduce((s, u) => s + u.monthlyCost, 0);
            const pct = (cost / stats.totalMonthlyCost) * 100;
            return (
              <div key={plan} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{plan} ({users.length} users)</span>
                  <span>${cost.toFixed(2)}</span>
                </div>
                <div className="w-full h-2 bg-[var(--border)] rounded-full">
                  <div className={`h-full rounded-full ${plan === 'enterprise' ? 'bg-purple-500' : plan === 'pro' ? 'bg-blue-500' : 'bg-gray-500'}`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Cost by Region</h3>
          {Object.entries(byRegion).sort(([,a], [,b]) => b - a).map(([region, cost]) => {
            const pct = (cost / stats.totalMonthlyCost) * 100;
            return (
              <div key={region} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>{region}</span>
                  <span>${cost.toFixed(2)}</span>
                </div>
                <div className="w-full h-2 bg-[var(--border)] rounded-full">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <h3 className="font-semibold text-sm">Top 10 Spenders</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)] text-xs">
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">User</th>
              <th className="text-left px-4 py-2">Plan</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Monthly Cost</th>
            </tr>
          </thead>
          <tbody>
            {topSpenders.map((u, i) => (
              <tr key={u.id} className="border-b border-[var(--border)]">
                <td className="px-4 py-2 text-[var(--muted)]">{i + 1}</td>
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2 capitalize">{u.plan}</td>
                <td className="px-4 py-2 text-xs">{u.instanceType}</td>
                <td className="px-4 py-2 font-medium">${u.monthlyCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
