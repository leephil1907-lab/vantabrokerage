import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const { body } = await parseBody(req, z.object({ body: z.string().trim().min(1).max(4000) }));
    const ticket = await prisma.supportTicket.findFirst({ where: { id, userId: user.id } });
    if (!ticket) throw new AppError('NOT_FOUND', 'Ticket not found.', 404);
    if (ticket.status === 'CLOSED') throw new AppError('TICKET_CLOSED', 'This ticket is closed. Open a new ticket to continue.', 409);
    const message = await prisma.ticketMessage.create({ data: { ticketId: id, authorId: user.id, body, isStaff: false } });
    await prisma.supportTicket.update({ where: { id }, data: { status: 'OPEN', updatedAt: new Date() } });
    return json({ message: { id: message.id, body: message.body, createdAt: message.createdAt.toISOString() } }, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}
