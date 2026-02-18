'use client';
import { useState, useEffect } from 'react';

export default function ModeBadge() {
  const [mode, setMode] = useState<'demo' | 'live'>('demo');
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetch(`${API}/api/mode`)
      .then(r => r.json())
      .then(d => setMode(d.mode || 'demo'))
      .catch(() => {});
  }, [API]);

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
      mode === 'live'
        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    }`}>
      {mode === 'live' ? '🟢 Live' : '🟡 Demo'}
    </span>
  );
}
