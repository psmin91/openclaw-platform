'use client';
import { useState, useEffect } from 'react';
import StatusBadge from '@/components/StatusBadge';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Instance {
  userId: string;
  instanceId: string;
  instanceType: string;
  publicIp: string;
  privateIp: string;
  state: string;
  az: string;
  slackUserId: string | null;
  tags: Record<string, string>;
}

interface Network {
  vpcId?: string;
  cidr?: string;
  subnetId?: string;
  subnetCidr?: string;
  az?: string;
  sgId?: string;
}

interface InfraData {
  instances: Instance[];
  network: Network;
  serial?: number;
  terraformVersion?: string;
}

export default function InfrastructurePage() {
  const [infra, setInfra] = useState<InfraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfra = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/infrastructure`);
      const data = await res.json();
      setInfra(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInfra(); }, []);

  const running = infra?.instances.filter(i => i.state === 'running').length ?? 0;
  const stopped = infra?.instances.filter(i => i.state === 'stopped').length ?? 0;
  const total = infra?.instances.length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Infrastructure</h2>
          <p className="text-sm text-[var(--muted)]">
            Terraform state overview
            {infra?.terraformVersion && <span> · Terraform v{infra.terraformVersion}</span>}
            {infra?.serial !== undefined && <span> · Serial #{infra.serial}</span>}
          </p>
        </div>
        <button onClick={fetchInfra} disabled={loading}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {loading ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6 text-sm">{error}</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-xs text-[var(--muted)] mb-1">Total Instances</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-xs text-[var(--muted)] mb-1">Running</div>
          <div className="text-2xl font-bold text-green-400">{running}</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-xs text-[var(--muted)] mb-1">Stopped</div>
          <div className="text-2xl font-bold text-yellow-400">{stopped}</div>
        </div>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <div className="text-xs text-[var(--muted)] mb-1">VPC</div>
          <div className="text-sm font-mono truncate">{infra?.network?.vpcId || '—'}</div>
          <div className="text-xs text-[var(--muted)]">{infra?.network?.cidr || ''}</div>
        </div>
      </div>

      {/* Network Info */}
      {infra?.network?.vpcId && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3">Network</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-[var(--muted)]">Subnet:</span>{' '}
              <span className="font-mono text-xs">{infra.network.subnetId}</span>
              <span className="text-[var(--muted)] ml-2">{infra.network.subnetCidr}</span>
            </div>
            <div>
              <span className="text-[var(--muted)]">AZ:</span> {infra.network.az}
            </div>
            <div>
              <span className="text-[var(--muted)]">Security Group:</span>{' '}
              <span className="font-mono text-xs">{infra.network.sgId}</span>
            </div>
          </div>
        </div>
      )}

      {/* Instances Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)] text-xs">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Instance ID</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Public IP</th>
              <th className="text-left px-4 py-3">Private IP</th>
              <th className="text-left px-4 py-3">AZ</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Slack</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {infra?.instances.map(inst => (
              <tr key={inst.instanceId} className="border-b border-[var(--border)] hover:bg-[var(--border)]/50">
                <td className="px-4 py-2 font-medium">{inst.userId}</td>
                <td className="px-4 py-2 font-mono text-xs">{inst.instanceId}</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                    {inst.instanceType}
                  </span>
                </td>
                <td className="px-4 py-2 font-mono text-xs">{inst.publicIp}</td>
                <td className="px-4 py-2 font-mono text-xs">{inst.privateIp}</td>
                <td className="px-4 py-2 text-xs">{inst.az}</td>
                <td className="px-4 py-2"><StatusBadge status={inst.state} /></td>
                <td className="px-4 py-2 font-mono text-xs text-[var(--muted)]">{inst.slackUserId || '—'}</td>
                <td className="px-4 py-2">
                  {inst.instanceId && (
                    <a
                      href={`https://console.aws.amazon.com/systems-manager/session-manager/start-session?region=${inst.az?.slice(0, -1) || 'ap-northeast-2'}&target=${inst.instanceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded hover:bg-orange-500/30 inline-block"
                    >
                      SSM 접속
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {total === 0 && !loading && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-[var(--muted)]">No instances in state</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
