import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { AppError } from '@/lib/errors';
import { requireStaff } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const shape = (m: { id: string; sender: string; body: string; createdAt: Date }) => ({
  id: m.id,
  sender: m.sender,
  body: m.body,
  createdAt: m.createdAt.toISOString(),
});

/** GET /api/admin/chat/:id — full conversation thread. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff();
    const { id } = await ctx.params;
    const session = await prisma.chatSession.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
    if (!session) return fail(new AppError('NOT_FOUND', 'Conversation not found.', 404));
    return json({
      session: { id: session.id, displayName: session.displayName, contact: session.contact, status: session.status, createdAt: session.createdAt.toISOString() },
      messages: session.messages.map(shape),
    });
  } catch (e) {
    return fail(e);
  }
}

/** POST /api/admin/chat/:id — agent reply and/or status change. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    const { id } = await ctx.params;
    const body = (await req.json()) as { reply?: string; status?: 'OPEN' | 'CLOSED' };
    const session = await prisma.chatSession.findUnique({ where: { id } });
    if (!session) return fail(new AppError('NOT_FOUND', 'Conversation not found.', 404));

    const reply = (body.reply ?? '').trim().slice(0, 4000);
    if (reply) {
      await prisma.$transaction([
        prisma.chatMessage.create({ data: { sessionId: id, sender: 'AGENT', body: reply } }),
        prisma.chatSession.update({ where: { id }, data: { status: 'OPEN' } }),
      ]);
      void staff;
    }
    if (body.status === 'CLOSED' || body.status === 'OPEN') {
      await prisma.chatSession.update({ where: { id }, data: { status: body.status } });
    }
    const fresh = await prisma.chatSession.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
    return json({ session: { id: fresh!.id, status: fresh!.status }, messages: fresh!.messages.map(shape) });
  } catch (e) {
    return fail(e);
  }
}
