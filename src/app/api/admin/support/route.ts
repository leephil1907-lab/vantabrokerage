import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    const status = new URL(req.url).searchParams.get('status');
    const tickets = await prisma.supportTicket.findMany({
      where: status && status !== 'ALL' ? { status: status as never } : {},
      include: { user: { select: { email: true } }, messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: 100,
    });
    return json({
      tickets: tickets.map((t) => ({
        id: t.id, email: t.user.email, subject: t.subject, category: t.category, priority: t.priority, status: t.status,
        createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
        messages: t.messages.map((m) => ({ id: m.id, body: m.body, isStaff: m.isStaff, attachments: m.attachments, createdAt: m.createdAt.toISOString() })),
      })),
    });
  } catch (err) {
    return fail(err);
  }
}
