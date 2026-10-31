import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { fail, json, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireUser();
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.notification.count({ where: { userId: user.id, read: false } }),
    ]);
    return json({ notifications: items.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, href: n.href, read: n.read, createdAt: n.createdAt.toISOString() })), unread });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { id, all } = await parseBody(req, z.object({ id: z.string().optional(), all: z.boolean().optional() }));
    if (all) await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
    else if (id) await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
