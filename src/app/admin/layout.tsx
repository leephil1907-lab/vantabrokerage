import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { AdminShell } from '@/components/admin-shell';
import { ToastProvider } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect('/login?next=/admin');
  if (!['ADMIN', 'SUPERADMIN', 'SUPPORT', 'FINANCE'].includes(session.role)) redirect('/dashboard');
  return (
    <ToastProvider>
      <AdminShell role={session.role} email={session.email}>{children}</AdminShell>
    </ToastProvider>
  );
}
