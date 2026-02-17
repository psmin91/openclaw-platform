'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

const models = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', desc: 'Fast & capable' },
  { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', desc: 'Most powerful' },
  { id: 'gpt-4o', name: 'GPT-4o', desc: 'OpenAI flagship' },
  { id: 'claude-3.5-haiku', name: 'Claude 3.5 Haiku', desc: 'Fastest, lightweight' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Budget-friendly' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-20250514');
  const [autoStop, setAutoStop] = useState(true);
  const [autoStopMin, setAutoStopMin] = useState(30);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Settings</h2>

      <div className="max-w-2xl space-y-6">
        {/* Model Selection */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">AI Model</h3>
          <div className="space-y-2">
            {models.map(m => (
              <label key={m.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedModel === m.id ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/50' : 'bg-[var(--bg)] border border-transparent hover:bg-[var(--border)]'
                }`}>
                <input type="radio" name="model" value={m.id} checked={selectedModel === m.id}
                  onChange={e => setSelectedModel(e.target.value)} className="accent-[var(--accent)]" />
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-[var(--muted)]">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Auto-stop */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Auto-stop</h3>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm">Auto-stop when idle</p>
              <p className="text-xs text-[var(--muted)]">Automatically stop instance after inactivity</p>
            </div>
            <button onClick={() => setAutoStop(!autoStop)}
              className={`w-12 h-6 rounded-full transition-colors ${autoStop ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${autoStop ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {autoStop && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--muted)]">Stop after</span>
              <select value={autoStopMin} onChange={e => setAutoStopMin(Number(e.target.value))}
                className="bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm">
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
              <span className="text-sm text-[var(--muted)]">of inactivity</span>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Profile</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Name</span>
              <span>{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Slack Handle</span>
              <span>@{user?.slackDisplayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">User ID</span>
              <span className="font-mono text-xs">{user?.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleSave}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Save Changes
          </button>
          {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}
