import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db';
import { fail } from '@/lib/http';
import { AppError } from '@/lib/errors';
import { BOT_GREETING, HANDOFF_MESSAGE, botReply } from '@/lib/chat-bot';

export const dynamic = 'force-dynamic';

const shape = (m: { id: string; sender: string; body: string; createdAt: Date }) => ({
  id: m.id,
  sender: m.sender,
  body: m.body,
  createdAt: m.createdAt.toISOString(),
});

/** GET /api/support/chat?token=… — visitor polls their conversation. */
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') ?? '';
  if (!token) return NextResponse.json({ session: null, messages: [] });
  const session = await prisma.chatSession.findUnique({
    where: { visitorToken: token },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!session) return NextResponse.json({ session: null, messages: [] });
  return NextResponse.json({
    session: { id: session.id, status: session.status, createdAt: session.createdAt.toISOString() },
    messages: session.messages.map(shape),
  });
}

/**
 * POST /api/support/chat — visitor sends a message (creates the session on
 * first contact). The assistant answers instantly when it recognises the
 * question; otherwise the message queues for a human agent.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { token?: string; name?: string; contact?: string; message?: string };
    const message = (body.message ?? '').trim().slice(0, 2000);
    if (!message) throw new AppError('BAD_REQUEST', 'Message is required.', 400);

    let token = (body.token ?? '').trim();
    let session = token ? await prisma.chatSession.findUnique({ where: { visitorToken: token } }) : null;
    const isNew = !session;
    if (!session) {
      token = token || randomBytes(24).toString('hex');
      session = await prisma.chatSession.create({
        data: {
          visitorToken: token,
          displayName: (body.name ?? '').trim().slice(0, 80) || null,
          contact: (body.contact ?? '').trim().slice(0, 120) || null,
        },
      });
    }
    if (session.status === 'CLOSED') {
      session = await prisma.chatSession.update({ where: { id: session.id }, data: { status: 'OPEN' } });
    }

    const created: Awaited<ReturnType<typeof prisma.chatMessage.create>>[] = [];
    if (isNew) {
      created.push(await prisma.chatMessage.create({ data: { sessionId: session.id, sender: 'BOT', body: BOT_GREETING } }));
    }
    created.push(await prisma.chatMessage.create({ data: { sessionId: session.id, sender: 'VISITOR', body: message } }));

    const answer = botReply(message);
    if (answer) {
      created.push(await prisma.chatMessage.create({ data: { sessionId: session.id, sender: 'BOT', body: answer } }));
    } else if (isNew || !(await prisma.chatMessage.findFirst({ where: { sessionId: session.id, sender: 'BOT', body: HANDOFF_MESSAGE } }))) {
      created.push(await prisma.chatMessage.create({ data: { sessionId: session.id, sender: 'BOT', body: HANDOFF_MESSAGE } }));
    }

    const fresh = await prisma.chatSession.findUnique({
      where: { id: session.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    return NextResponse.json({
      token,
      session: { id: fresh!.id, status: fresh!.status, createdAt: fresh!.createdAt.toISOString() },
      messages: fresh!.messages.map(shape),
    });
  } catch (e) {
    return fail(e);
  }
}
