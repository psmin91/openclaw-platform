'use client';
import { useState, useEffect } from 'react';

interface AwsConfig {
  awsAccountId: string;
  awsRegion: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  useIamRole: boolean;
  openclawAmiId: string;
  sshKeyPairName: string;
  vpcCidr: string;
  enableNatGateway: boolean;
}

const defaultConfig: AwsConfig = {
  awsAccountId: '',
  awsRegion: 'ap-northeast-2',
  awsAccessKeyId: '',
  awsSecretAccessKey: '',
  useIamRole: false,
  openclawAmiId: '',
  sshKeyPairName: '',
  vpcCidr: '10.0.0.0/16',
  enableNatGateway: false,
};

const regions = [
  'ap-northeast-2', 'ap-northeast-1', 'ap-southeast-1', 'ap-southeast-2',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1',
];

export default function SettingsPage() {
  const [config, setConfig] = useState<AwsConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [awsConfigured, setAwsConfigured] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetch(`${API}/api/aws-config`)
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setConfig({ ...defaultConfig, ...data.config });
        }
        setAwsConfigured(data.awsConfigured || false);
      })
      .catch(() => {});
  }, [API]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`${API}/api/aws-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setAwsConfigured(data.awsConfigured || false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Failed to save configuration');
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API}/api/aws-config/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, message: 'Connection failed' });
    }
    setTesting(false);
  };

  const update = (key: keyof AwsConfig, value: string | boolean) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">⚙️ AWS Configuration</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          awsConfigured
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
        }`}>
          {awsConfigured ? '🟢 Live Mode' : '🟡 Demo Mode'}
        </span>
      </div>

      {!awsConfigured && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-300 text-sm">
            <strong>Demo Mode:</strong> AWS credentials are not configured. All data is simulated.
            Enter your AWS credentials below to switch to Live Mode with real infrastructure.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {/* AWS Account */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">AWS Account</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Account ID</label>
              <input
                type="text"
                value={config.awsAccountId}
                onChange={e => update('awsAccountId', e.target.value)}
                placeholder="123456789012"
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">Region</label>
              <select
                value={config.awsRegion}
                onChange={e => update('awsRegion', e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm"
              >
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Credentials */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Authentication</h2>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={config.useIamRole}
              onChange={e => update('useIamRole', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Use IAM Role (recommended for EC2-hosted dashboard)</span>
          </label>

          {!config.useIamRole && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Access Key ID</label>
                <input
                  type="password"
                  value={config.awsAccessKeyId}
                  onChange={e => update('awsAccessKeyId', e.target.value)}
                  placeholder="AKIA..."
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">Secret Access Key</label>
                <input
                  type="password"
                  value={config.awsSecretAccessKey}
                  onChange={e => update('awsSecretAccessKey', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          )}
        </section>

        {/* Infrastructure */}
        <section className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Infrastructure Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">OpenClaw AMI ID</label>
              <input
                type="text"
                value={config.openclawAmiId}
                onChange={e => update('openclawAmiId', e.target.value)}
                placeholder="ami-0abcdef1234567890"
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">SSH Key Pair Name</label>
              <input
                type="text"
                value={config.sshKeyPairName}
                onChange={e => update('sshKeyPairName', e.target.value)}
                placeholder="openclaw-key"
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">VPC CIDR</label>
              <input
                type="text"
                value={config.vpcCidr}
                onChange={e => update('vpcCidr', e.target.value)}
                placeholder="10.0.0.0/16"
                className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={config.enableNatGateway}
                  onChange={e => update('enableNatGateway', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Enable NAT Gateway (~$32/mo)</span>
              </label>
            </div>
          </div>
        </section>

        {/* Test & Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium disabled:opacity-50"
          >
            {testing ? '🔄 Testing...' : '🔌 Test Connection'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-medium disabled:opacity-50"
          >
            {saving ? '💾 Saving...' : '💾 Save Configuration'}
          </button>
          {saved && <span className="text-green-400 text-sm">✅ Saved!</span>}
        </div>

        {testResult && (
          <div className={`rounded-lg p-4 border ${
            testResult.ok
              ? 'bg-green-500/10 border-green-500/30 text-green-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <p className="text-sm font-medium">
              {testResult.ok ? '✅ Connection successful!' : '❌ Connection failed'}
            </p>
            <p className="text-xs mt-1 opacity-80">{testResult.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
