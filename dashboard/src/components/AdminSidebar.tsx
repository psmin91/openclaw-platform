'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/instances', label: 'Instances', icon: '🖥️' },
  { href: '/admin/infrastructure', label: 'Infrastructure', icon: '🏗️' },
  { href: '/admin/costs', label: 'Costs', icon: '💰' },
  { href: '/admin/slack', label: 'Slack Mapping', icon: '💬' },
  { href: '/architecture', label: 'Architecture', icon: '🗺️' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  return (
    <aside className="w-56 min-h-screen border-r border-[var(--border)] bg-[var(--card)] flex flex-col">
      <div className="p-4 border-b border-[var(--border)]">
        <h1 className="text-lg font-bold">🐾 OpenClaw</h1>
        <p className="text-xs text-[var(--muted)]">Admin Dashboard</p>
      </div>
      <nav className="flex-1 p-2">
        {nav.map(n => (
          <Link key={n.href} href={n.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              pathname === n.href ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--border)]'
            }`}>
            <span>{n.icon}</span>{n.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--muted)]">👤 {user?.name}</span>
          <button onClick={logout} className="text-xs text-red-400 hover:text-red-300">Logout</button>
        </div>
        <p className="text-xs text-[var(--muted)]">v0.1.0 · Admin</p>
      </div>
    </aside>
  );
}
