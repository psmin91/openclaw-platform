'use client';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import PortalSidebar from '@/components/PortalSidebar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'user')) router.push('/');
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'user') return null;

  return (
    <div className="flex">
      <PortalSidebar />
      <main className="flex-1 p-6 overflow-auto min-h-screen">{children}</main>
    </div>
  );
}
