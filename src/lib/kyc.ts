import { prisma } from './db';
import { AppError } from './errors';

export const KYC_REQUIRED_FOR_WITHDRAWAL = true;

export async function kycGate(userId: string, action: 'withdraw' | 'deposit' = 'withdraw') {
  const require = (await prisma.systemConfig.findUnique({ where: { key: 'kyc.requireForWithdrawal' } }))?.value;
  const enforced = require === undefined || require === null ? KYC_REQUIRED_FOR_WITHDRAWAL : Boolean(require);
  if (!enforced || action !== 'withdraw') return;
  const kyc = await prisma.kycRecord.findUnique({ where: { userId } });
  if (!kyc || kyc.status !== 'APPROVED') {
    throw new AppError('KYC_REQUIRED', 'Identity verification must be approved before you can withdraw funds.', 403, { kycStatus: kyc?.status ?? 'NOT_SUBMITTED' });
  }
}
