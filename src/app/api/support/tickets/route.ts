import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';

const schema = z.object({
  subject: z.string().trim().min(4).max(140),
  category: z.enum(['ACCOUNT', 'DEPOSIT', 'WITHDRAWAL', 'TRADING', 'VERIFICATION', 'TECHNICAL', 'OTHER']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  message: z.string().trim().min(10).max(4000),
  attachments: z.array(z.object({ filename: z.string(), dataUrl: z.string().max(3_000_000) })).max(3).default([]),
});

export async function GET() {
  try {
    const user = await requireUser();
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return json({
      tickets: tickets.map((t) => ({
        id: t.id, subject: t.subject, category: t.category, priority: t.priority, status: t.status,
        createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
        messages: t.messages.map((m) => ({ id: m.id, body: m.body, isStaff: m.isStaff, attachments: m.attachments, createdAt: m.createdAt.toISOString() })),
      })),
    });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await parseBody(req, schema);
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user.id, subject: body.subject, category: body.category, priority: body.priority, status: 'OPEN',
        messages: { create: { authorId: user.id, body: body.message, isStaff: false, attachments: body.attachments as never } },
      },
    });
    return json({ ticket: { id: ticket.id, status: ticket.status } }, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}
