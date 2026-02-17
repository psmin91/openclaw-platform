'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.push(user.role === 'admin' ? '/admin' : '/portal');
    }
  }, [user, loading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = login(username, password);
    if (err) setError(err);
  };

  if (loading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen flex">
      {/* Left - Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">🐾 OpenClaw</h1>
            <p className="text-[var(--muted)]">Multi-Tenant AI Assistant Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1.5">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="admin / user001~004"
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs text-[var(--muted)] mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="admin / password"
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" />
            </div>
            <button type="submit"
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
              Sign In
            </button>
          </form>

          <div className="mt-6 p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg">
            <p className="text-xs text-[var(--muted)] mb-2">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-blue-400">admin</span> / admin</div>
              <div className="text-[var(--muted)]">→ Admin Dashboard</div>
              <div><span className="text-green-400">user001</span> / password</div>
              <div className="text-[var(--muted)]">→ User Portal (active)</div>
              <div><span className="text-yellow-400">user003</span> / password</div>
              <div className="text-[var(--muted)]">→ User Portal (no instance)</div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link href="/architecture" className="text-xs text-[var(--accent)] hover:underline">
              View Architecture →
            </Link>
          </div>
        </div>
      </div>

      {/* Right - Hero */}
      <div className="flex-1 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-l border-[var(--border)] hidden md:flex items-center justify-center p-12">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-4">AI Assistant for Every Team Member</h2>
          <p className="text-[var(--muted)] mb-6">
            OpenClaw provides each user with a dedicated AI assistant instance, managed centrally through Slack integration and automated infrastructure.
          </p>
          <div className="space-y-3">
            {[
              ['💬', 'Slack Integration', 'One bot, per-user routing to dedicated instances'],
              ['🖥️', 'Dedicated EC2', 'Each user gets their own isolated OpenClaw instance'],
              ['⚡', 'Auto Scaling', 'Auto-start on mention, auto-stop when idle'],
              ['🔧', 'Terraform Managed', 'Infrastructure as Code for reliable provisioning'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex gap-3 p-3 bg-black/20 rounded-lg">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-[var(--muted)]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
