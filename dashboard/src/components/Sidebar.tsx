'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/instances', label: 'Instances', icon: '🖥️' },
  { href: '/infrastructure', label: 'Infrastructure', icon: '🏗️' },
  { href: '/costs', label: 'Costs', icon: '💰' },
  { href: '/slack', label: 'Slack Mapping', icon: '💬' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 min-h-screen border-r border-[var(--border)] bg-[var(--card)] flex flex-col">
      <div className="p-4 border-b border-[var(--border)]">
        <h1 className="text-lg font-bold">🐾 OpenClaw</h1>
        <p className="text-xs text-[var(--muted)]">Management Platform</p>
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
      <div className="p-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
        v0.1.0 · Multi-Tenant
      </div>
    </aside>
  );
}
