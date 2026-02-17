'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';

// Mock data for user portal
const userInstances: Record<string, {
  instanceId: string;
  state: string;
  instanceType: string;
  region: string;
  model: string;
  version: string;
  gatewayState: string;
  uptime: string;
  tokenUsage: { prompt: number; completion: number };
  cpuUsage: number;
  memoryUsage: number;
  monthlyCost: number;
  channels: string[];
  lastActive: string;
} | null> = {
  'user-001': {
    instanceId: 'i-0a1b2c3d4e5f',
    state: 'running',
    instanceType: 't3.small',
    region: 'ap-northeast-2',
    model: 'claude-sonnet-4-20250514',
    version: '0.28.4',
    gatewayState: 'running',
    uptime: '48h 23m',
    tokenUsage: { prompt: 234521, completion: 89432 },
    cpuUsage: 23,
    memoryUsage: 45,
    monthlyCost: 42.50,
    channels: ['slack'],
    lastActive: new Date(Date.now() - 300000).toISOString(),
  },
  'user-002': {
    instanceId: 'i-1b2c3d4e5f6a',
    state: 'stopped',
    instanceType: 't3.medium',
    region: 'ap-northeast-2',
    model: 'claude-opus-4-20250514',
    version: '0.28.3',
    gatewayState: 'stopped',
    uptime: '0h 0m',
    tokenUsage: { prompt: 567123, completion: 234567 },
    cpuUsage: 0,
    memoryUsage: 0,
    monthlyCost: 8.20,
    channels: ['slack', 'discord'],
    lastActive: new Date(Date.now() - 86400000).toISOString(),
  },
  'user-003': null, // No instance
  'user-004': {
    instanceId: 'i-3d4e5f6a7b8c',
    state: 'running',
    instanceType: 't3.small',
    region: 'us-east-1',
    model: 'gpt-4o',
    version: '0.28.4',
    gatewayState: 'running',
    uptime: '12h 5m',
    tokenUsage: { prompt: 123456, completion: 45678 },
    cpuUsage: 15,
    memoryUsage: 38,
    monthlyCost: 35.80,
    channels: ['slack'],
    lastActive: new Date(Date.now() - 600000).toISOString(),
  },
};

export default function PortalDashboard() {
  const { user } = useAuth();
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  if (!user) return null;

  const instance = userInstances[user.id] ?? null;

  const handleRequest = async () => {
    setRequesting(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setRequesting(false);
    setRequested(true);
  };

  // No instance flow
  if (!instance) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-6">My OpenClaw</h2>
        <div className="max-w-lg mx-auto mt-16 text-center">
          <div className="text-6xl mb-6">🐾</div>
          <h3 className="text-2xl font-bold mb-3">아직 OpenClaw가 설정되지 않았습니다</h3>
          <p className="text-[var(--muted)] mb-8">
            OpenClaw 인스턴스가 아직 생성되지 않았습니다.<br />
            아래 버튼을 클릭하여 생성을 요청하세요.
          </p>
          {requested ? (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-6">
              <div className="text-2xl mb-2">✅</div>
              <p className="font-medium mb-1">요청이 전송되었습니다!</p>
              <p className="text-sm text-[var(--muted)]">Admin이 확인 후 인스턴스가 생성됩니다. 잠시만 기다려주세요.</p>
            </div>
          ) : (
            <button onClick={handleRequest} disabled={requesting}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {requesting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> 요청 전송 중...
                </span>
              ) : (
                '🚀 OpenClaw 생성 요청'
              )}
            </button>
          )}
          <div className="mt-8 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg text-left text-sm">
            <p className="font-medium mb-2">생성 후 제공되는 기능:</p>
            <ul className="space-y-1 text-[var(--muted)] text-xs">
              <li>• 전용 EC2 인스턴스 (t3.small)</li>
              <li>• Slack 연동 AI 어시스턴트</li>
              <li>• 모델 선택 (Claude, GPT 등)</li>
              <li>• SSM 원격 접속</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Has instance
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">My OpenClaw</h2>
          <p className="text-sm text-[var(--muted)]">Welcome, {user.name}</p>
        </div>
        <StatusBadge status={instance.state} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Status" value={instance.gatewayState} color={instance.gatewayState === 'running' ? 'text-green-400' : 'text-yellow-400'} />
        <StatCard label="Uptime" value={instance.uptime} />
        <StatCard label="Model" value={instance.model.split('-').slice(0, 2).join(' ')} sub={instance.version} />
        <StatCard label="Monthly Cost" value={`$${instance.monthlyCost}`} color="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Token Usage */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Token Usage</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--muted)]">Prompt Tokens</span>
                <span>{instance.tokenUsage.prompt.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-[var(--border)] rounded-full">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(instance.tokenUsage.prompt / 5000, 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--muted)]">Completion Tokens</span>
                <span>{instance.tokenUsage.completion.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-[var(--border)] rounded-full">
                <div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(instance.tokenUsage.completion / 3000, 100)}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-[var(--border)] flex justify-between text-sm font-medium">
              <span>Total</span>
              <span>{(instance.tokenUsage.prompt + instance.tokenUsage.completion).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Instance Info */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Instance Details</h3>
          <div className="space-y-2 text-sm">
            {[
              ['Instance ID', instance.instanceId],
              ['Type', instance.instanceType],
              ['Region', instance.region],
              ['Channels', instance.channels.join(', ')],
              ['Last Active', new Date(instance.lastActive).toLocaleString()],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-[var(--muted)]">{label}</span>
                <span className="font-mono text-xs">{value}</span>
              </div>
            ))}
          </div>

          {instance.state === 'running' && instance.instanceId && (
            <a href={`https://console.aws.amazon.com/systems-manager/session-manager/start-session?region=${instance.region}&target=${instance.instanceId}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-500/20 text-orange-400 py-2 rounded-lg text-sm hover:bg-orange-500/30 transition-colors">
              🔗 SSM 접속
            </a>
          )}
        </div>
      </div>

      {/* Resource Usage */}
      {instance.state === 'running' && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Resource Usage</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--muted)]">CPU</span>
                <span className={instance.cpuUsage > 70 ? 'text-red-400' : instance.cpuUsage > 40 ? 'text-yellow-400' : 'text-green-400'}>
                  {instance.cpuUsage}%
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--border)] rounded-full">
                <div className={`h-full rounded-full ${instance.cpuUsage > 70 ? 'bg-red-500' : instance.cpuUsage > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${instance.cpuUsage}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--muted)]">Memory</span>
                <span className={instance.memoryUsage > 70 ? 'text-red-400' : instance.memoryUsage > 40 ? 'text-yellow-400' : 'text-green-400'}>
                  {instance.memoryUsage}%
                </span>
              </div>
              <div className="w-full h-3 bg-[var(--border)] rounded-full">
                <div className={`h-full rounded-full ${instance.memoryUsage > 70 ? 'bg-red-500' : instance.memoryUsage > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${instance.memoryUsage}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
