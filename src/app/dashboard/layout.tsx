import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DashboardShell } from '@/components/dashboard-shell';
import { ToastProvider } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  if (!session) redirect('/login?next=/dashboard');
  const user = await prisma.user.findUnique({ where: { id: session.id }, include: { profile: true, kyc: true } });
  return (
    <ToastProvider>
      <DashboardShell
        user={{
          email: session.email,
          role: session.role,
          name: [user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ') || session.email.split('@')[0],
          emailVerified: session.emailVerified,
          kycStatus: session.kycStatus,
        }}
      >
        {children}
      </DashboardShell>
    </ToastProvider>
  );
}
