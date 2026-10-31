import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { fail, json } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { AppError } from '@/lib/errors';

export async function GET() {
  try {
    const user = await requireUser();
    const sessions = await prisma.session.findMany({ where: { userId: user.id, revokedAt: null }, orderBy: { lastSeenAt: 'desc' } });
    return json({
      sessions: sessions.map((s) => ({
        id: s.id, device: s.device, ip: s.ip, createdAt: s.createdAt, lastSeenAt: s.lastSeenAt,
        expiresAt: s.expiresAt, current: s.id === user.sessionId,
      })),
    });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const id = new URL(req.url).searchParams.get('id');
    if (!id) throw new AppError('MISSING_ID', 'Session id is required.', 400);
    const session = await prisma.session.findFirst({ where: { id, userId: user.id } });
    if (!session) throw new AppError('NOT_FOUND', 'Session not found.', 404);
    if (session.id === user.sessionId) throw new AppError('INVALID_ACTION', 'Use sign out to end your current session.', 400);
    await prisma.session.update({ where: { id }, data: { revokedAt: new Date() } });
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
