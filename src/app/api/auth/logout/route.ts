import { NextRequest } from 'next/server';
import { fail, json } from '@/lib/http';
import { clearSessionCookie, getSessionUser, revokeSession } from '@/lib/auth';

export async function POST(_req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user) await revokeSession(user.sessionId);
    await clearSessionCookie();
    return json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
