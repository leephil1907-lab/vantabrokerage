import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { AppError } from '@/lib/errors';
import { requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** GET /api/admin/chat — live chat conversations for the support console. */
export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    const status = new URL(req.url).searchParams.get('status') ?? 'OPEN';
    const sessions = await prisma.chatSession.findMany({
      where: status === 'ALL' ? undefined : { status: status === 'CLOSED' ? 'CLOSED' : 'OPEN' },
      orderBy: { updatedAt: 'desc' },
      take: 60,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
    });
    return json({
      sessions: sessions.map((s) => ({
        id: s.id,
        displayName: s.displayName,
        contact: s.contact,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        messageCount: s._count.messages,
        lastMessage: s.messages[0] ? { sender: s.messages[0].sender, body: s.messages[0].body, createdAt: s.messages[0].createdAt.toISOString() } : null,
      })),
    });
  } catch (e) {
    return fail(e);
  }
}
