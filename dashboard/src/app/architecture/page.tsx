'use client';
import { useState } from 'react';
import Link from 'next/link';

interface Component {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  description: string;
  details: string[];
}

const components: Component[] = [
  {
    id: 'slack', label: 'Slack', icon: '💬', x: 50, y: 180, w: 140, h: 80,
    color: '#4A154B',
    description: 'Slack Workspace',
    details: [
      'Users interact with OpenClaw through Slack',
      'Single Slack Bot App handles all users',
      'Messages are routed based on Slack User ID',
      'Supports DMs and channel mentions',
    ],
  },
  {
    id: 'router', label: 'Central Router', icon: '🔀', x: 300, y: 160, w: 160, h: 120,
    color: '#2563eb',
    description: 'Message Router (Lambda / API Gateway)',
    details: [
      'Receives Slack events via webhook',
      'Maps Slack User ID → EC2 instance',
      'Auto-starts stopped instances on mention',
      'Auto-stops idle instances after 30 min',
      'Handles user registration & routing table',
    ],
  },
  {
    id: 'ec2-1', label: 'User A EC2', icon: '🐾', x: 570, y: 60, w: 150, h: 70,
    color: '#16a34a',
    description: 'Dedicated OpenClaw Instance',
    details: [
      'Each user gets an isolated EC2 instance',
      'Runs OpenClaw gateway + AI agent',
      'Configurable AI model per user',
      'Private workspace & memory',
    ],
  },
  {
    id: 'ec2-2', label: 'User B EC2', icon: '🐾', x: 570, y: 160, w: 150, h: 70,
    color: '#16a34a',
    description: 'Dedicated OpenClaw Instance',
    details: [
      'Same architecture as User A',
      'Completely isolated environment',
      'Independent model & token usage',
      'SSM access for debugging',
    ],
  },
  {
    id: 'ec2-3', label: 'User C EC2', icon: '🐾', x: 570, y: 260, w: 150, h: 70,
    color: '#16a34a',
    description: 'Dedicated OpenClaw Instance',
    details: [
      'Scales horizontally — add more users easily',
      'Terraform manages all instances',
      'Consistent configuration via Packer AMI',
    ],
  },
  {
    id: 'terraform', label: 'Terraform', icon: '🔧', x: 300, y: 370, w: 160, h: 80,
    color: '#7c3aed',
    description: 'Infrastructure as Code',
    details: [
      'Manages all AWS resources',
      'VPC, Subnets, Security Groups',
      'EC2 instances per user (tfvars driven)',
      'Plan → Apply workflow via dashboard',
      'State stored in S3 backend',
    ],
  },
  {
    id: 'dashboard', label: 'Dashboard', icon: '📊', x: 50, y: 350, w: 140, h: 100,
    color: '#ea580c',
    description: 'Management Dashboard (This App)',
    details: [
      'Admin: manage all users, instances, costs',
      'User Portal: view my OpenClaw status',
      'Trigger Terraform plan/apply',
      'Monitor resource usage & costs',
      'SSM access to instances',
    ],
  },
];

const arrows = [
  { from: 'slack', to: 'router', label: 'Slack Events' },
  { from: 'router', to: 'ec2-1', label: '' },
  { from: 'router', to: 'ec2-2', label: 'Route by User ID' },
  { from: 'router', to: 'ec2-3', label: '' },
  { from: 'terraform', to: 'ec2-1', label: '' },
  { from: 'terraform', to: 'ec2-2', label: 'Provision' },
  { from: 'terraform', to: 'ec2-3', label: '' },
  { from: 'dashboard', to: 'terraform', label: 'Plan / Apply' },
  { from: 'dashboard', to: 'router', label: 'Config API' },
];

function getCenter(c: Component) {
  return { x: c.x + c.w / 2, y: c.y + c.h / 2 };
}

export default function ArchitecturePage() {
  const [selected, setSelected] = useState<Component | null>(null);

  const compMap = Object.fromEntries(components.map(c => [c.id, c]));

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">🏗️ OpenClaw Architecture</h1>
            <p className="text-sm text-[var(--muted)] mt-1">Click on any component to learn more</p>
          </div>
          <Link href="/" className="text-sm text-[var(--accent)] hover:underline">← Back</Link>
        </div>

        <div className="relative bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden" style={{ height: 500 }}>
          <svg width="100%" height="100%" viewBox="0 0 780 500" className="absolute inset-0">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#525252" />
              </marker>
            </defs>

            {/* Arrows */}
            {arrows.map((a, i) => {
              const from = getCenter(compMap[a.from]);
              const to = getCenter(compMap[a.to]);
              const mx = (from.x + to.x) / 2;
              const my = (from.y + to.y) / 2;
              return (
                <g key={i}>
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                    stroke="#525252" strokeWidth="1.5" markerEnd="url(#arrowhead)" strokeDasharray="6 3" />
                  {a.label && (
                    <text x={mx} y={my - 8} textAnchor="middle" fill="#737373" fontSize="10" fontFamily="system-ui">
                      {a.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Component boxes */}
          {components.map(c => (
            <button key={c.id} onClick={() => setSelected(selected?.id === c.id ? null : c)}
              className="absolute rounded-xl border-2 transition-all hover:scale-105 cursor-pointer flex flex-col items-center justify-center gap-1 text-center"
              style={{
                left: c.x, top: c.y, width: c.w, height: c.h,
                backgroundColor: c.color + '20',
                borderColor: selected?.id === c.id ? c.color : c.color + '60',
                boxShadow: selected?.id === c.id ? `0 0 20px ${c.color}40` : 'none',
              }}>
              <span className="text-xl">{c.icon}</span>
              <span className="text-xs font-medium">{c.label}</span>
            </button>
          ))}

          {/* User flow labels */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="text-[10px] px-2 py-1 bg-[var(--border)] rounded-full text-[var(--muted)]">👆 Click components</span>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="mt-6 bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 animate-in fade-in">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{selected.icon}</span>
              <div>
                <h3 className="text-lg font-bold">{selected.label}</h3>
                <p className="text-sm text-[var(--muted)]">{selected.description}</p>
              </div>
              <button onClick={() => setSelected(null)} className="ml-auto text-[var(--muted)] hover:text-white">✕</button>
            </div>
            <ul className="space-y-2">
              {selected.details.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-[var(--accent)] mt-0.5">•</span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Flow explanation */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: '1',
              title: 'User sends message in Slack',
              desc: 'Slack Bot receives the event and forwards it to the Central Router via webhook.',
              color: 'bg-purple-500',
            },
            {
              step: '2',
              title: 'Router maps to user\'s instance',
              desc: 'The router looks up the Slack User ID, finds the mapped EC2 instance, and forwards the message. Auto-starts if stopped.',
              color: 'bg-blue-500',
            },
            {
              step: '3',
              title: 'OpenClaw processes & responds',
              desc: 'The dedicated OpenClaw instance processes the request with the configured AI model and responds back through Slack.',
              color: 'bg-green-500',
            },
          ].map(s => (
            <div key={s.step} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
              <div className={`w-7 h-7 ${s.color} rounded-full flex items-center justify-center text-white text-sm font-bold mb-3`}>
                {s.step}
              </div>
              <h4 className="font-medium text-sm mb-2">{s.title}</h4>
              <p className="text-xs text-[var(--muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
