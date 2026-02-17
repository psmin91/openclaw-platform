'use client';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') return null;

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto min-h-screen">{children}</main>
    </div>
  );
}
