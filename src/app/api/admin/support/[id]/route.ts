import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { requireStaff } from '@/lib/auth';
import { AppError } from '@/lib/errors';
import { queueTemplateEmail } from '@/lib/email';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    const { id } = await ctx.params;
    const body = await parseBody(req, z.object({
      reply: z.string().trim().min(1).max(4000).optional(),
      status: z.enum(['OPEN', 'PENDING_CUSTOMER', 'RESOLVED', 'CLOSED']).optional(),
    }));
    const ticket = await prisma.supportTicket.findUnique({ where: { id }, include: { user: { include: { profile: true } } } });
    if (!ticket) throw new AppError('NOT_FOUND', 'Ticket not found.', 404);
    if (body.reply) {
      await prisma.ticketMessage.create({ data: { ticketId: id, authorId: staff.id, body: body.reply, isStaff: true } });
      await prisma.notification.create({ data: { userId: ticket.userId, type: 'SUPPORT', title: `Support replied · ${ticket.subject}`, body: body.reply.slice(0, 180), href: '/dashboard/support' } });
    }
    const updated = await prisma.supportTicket.update({
      where: { id },
      data: { ...(body.status ? { status: body.status } : { status: body.reply ? 'PENDING_CUSTOMER' : ticket.status }), assignedToId: staff.id, updatedAt: new Date() },
    });
    if (body.reply) await queueTemplateEmail({ to: ticket.user.email, template: 'support_update', variables: { firstName: ticket.user.profile?.firstName ?? undefined, ticket: ticket.id, subject: ticket.subject, actionUrl: `${process.env.APP_URL ?? 'http://localhost:3000'}/dashboard/support` } }).catch((error) => console.error('[support reply email]', error));
    return json({ ok: true, status: updated.status });
  } catch (err) {
    return fail(err);
  }
}
