'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/api';
import { AdminLayout } from '@/components/AdminLayout';

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/admin/login';
  const [status, setStatus] = useState<'checking' | 'signed-in' | 'signed-out'>(isLogin ? 'signed-in' : 'checking');
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    if (isLogin) return;
    api.check().then(({ user }) => {
      setAdminName(user.name);
      setStatus('signed-in');
    }).catch(() => setStatus('signed-out'));
  }, [isLogin]);

  useEffect(() => {
    if (status === 'signed-out') router.replace('/admin/login');
  }, [router, status]);

  if (isLogin) return children;
  if (status !== 'signed-in') return <div className="screen-state">{status === 'checking' ? 'Verifying session…' : 'Redirecting to sign in…'}</div>;
  return <AdminLayout adminName={adminName}>{children}</AdminLayout>;
}