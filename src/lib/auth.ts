import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { AppError } from './errors';

export const SESSION_COOKIE = 'vanta_session';
const SESSION_TTL_DAYS = 14;

export function hashToken(token: string) {
  return createHash('sha256').update(token + (process.env.SESSION_SECRET ?? '')).digest('hex');
}

export function newToken() {
  return randomBytes(32).toString('base64url');
}

export type AuthUser = {
  id: string;
  email: string;
  role: 'USER' | 'SUPPORT' | 'FINANCE' | 'ADMIN' | 'SUPERADMIN';
  status: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  sessionId: string;
  kycStatus: string;
};

export async function createSession(userId: string, meta: { ip?: string; userAgent?: string }) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000);
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      device: deviceFromUA(meta.userAgent),
    },
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
  return session;
}

export function deviceFromUA(ua?: string) {
  if (!ua) return 'Unknown device';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown OS';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'Browser';
  return `${browser} · ${os}`;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { kyc: true } } },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  const u = session.user;
  if (u.status === 'SUSPENDED' || u.status === 'CLOSED') return null;
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    status: u.status,
    emailVerified: !!u.emailVerifiedAt,
    twoFactorEnabled: u.twoFactorEnabled,
    sessionId: session.id,
    kycStatus: u.kyc?.status ?? 'NOT_SUBMITTED',
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError('UNAUTHENTICATED', 'You must be signed in.', 401);
  return user;
}

export async function requireStaff(): Promise<AuthUser> {
  const user = await requireUser();
  if (!['ADMIN', 'SUPERADMIN', 'SUPPORT', 'FINANCE'].includes(user.role)) {
    throw new AppError('FORBIDDEN', 'Administrator access required.', 403);
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (!['ADMIN', 'SUPERADMIN'].includes(user.role)) {
    throw new AppError('FORBIDDEN', 'Administrator access required.', 403);
  }
  return user;
}

export async function revokeSession(sessionId: string) {
  await prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } }).catch(() => undefined);
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
