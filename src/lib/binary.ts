import { prisma } from './db';
import { AppError } from './errors';
import { getQuote } from './market-data';
import { d, lockFunds, unlockFunds, postLedger, round, money, getOrCreateWallet } from './ledger';

export const EXPIRY_OPTIONS = [30, 60, 120, 300, 600, 900, 1800, 3600];
export const MIN_STAKE = 1;
export const MAX_STAKE = 5000;

/**
 * Short-expiry CALL/PUT trades. Settlement is always performed server-side using a
 * fresh provider quote at expiry and recorded with both entry and exit quote timestamps.
 * Execution is currently blocked for all account types.
 */
export async function openBinaryTrade(input: { userId: string; accountId: string; symbol: string; direction: 'CALL' | 'PUT'; stake: number; expirySeconds: number }) {
  const account = await prisma.account.findFirst({ where: { id: input.accountId, userId: input.userId } });
  if (!account) throw new AppError('NOT_FOUND', 'Account not found.', 404);
  if (account.status !== 'ACTIVE') throw new AppError('ACCOUNT_RESTRICTED', 'Account is not active.', 403);

  const pair = await prisma.tradingPair.findUnique({ where: { symbol: input.symbol } });
  if (!pair) throw new AppError('NOT_FOUND', 'Market not found.', 404);
  if (!pair.enabled || !['BINARY', 'CRYPTO'].includes(pair.category)) throw new AppError('MARKET_DISABLED', 'Short-expiry trading is unavailable for this market.', 403);
  if (!EXPIRY_OPTIONS.includes(input.expirySeconds)) throw new AppError('INVALID_EXPIRY', 'Unsupported expiry selected.', 400);

  const stake = round(input.stake, 2);
  if (!isFinite(stake) || stake < MIN_STAKE || stake > MAX_STAKE) {
    throw new AppError('INVALID_STAKE', `Stake must be between ${MIN_STAKE} and ${MAX_STAKE}.`, 400);
  }

  const quote = await getQuote(pair.id, 3000);
  if (quote.stale) throw new AppError('MARKET_DATA_STALE', 'A fresh reference quote is required for short-expiry contracts. Try again when market data is available.', 503);
  const entry = quote.last;
  const payoutRate = d(pair.payoutRate ?? 0.85);
  const expiresAt = new Date(Date.now() + input.expirySeconds * 1000);

  const trade = await prisma.$transaction(async (tx) => {
    const wallet = await getOrCreateWallet(tx, account.id, account.currency);
    if (d(wallet.available) + 1e-9 < stake) throw new AppError('INSUFFICIENT_FUNDS', 'Insufficient available balance for this stake.', 400);
    await lockFunds(tx, wallet.id, stake);
    return tx.binaryTrade.create({
      data: {
        accountId: account.id,
        symbol: pair.symbol,
        pairId: pair.id,
        direction: input.direction,
        stake: money(stake),
        payoutRate: payoutRate.toString(),
        entryPrice: String(round(entry, 8)),
        expiresAt,
        entryQuoteTs: new Date(quote.fetchedAt),
        priceFeed: quote.source,
        env: account.type === 'LIVE' ? 'LIVE' : 'PAPER',
        result: 'OPEN',
      },
    });
  });

  return { ...trade, potentialPayout: round(stake * (1 + payoutRate), 2) };
}

/** Settle every expired trade using a fresh server-side quote. */
export async function settleExpiredBinaryTrades() {
  const due = await prisma.binaryTrade.findMany({
    where: { result: 'OPEN', expiresAt: { lte: new Date() } },
    include: { account: true },
    take: 100,
  });
  const settled: { id: string; result: string; pnl: number }[] = [];
  for (const trade of due) {
    try {
      const pair = await prisma.tradingPair.findUnique({ where: { id: trade.pairId } });
      if (!pair) continue;
      const quote = await getQuote(pair.id, 2000);
      const exit = quote.last;
      const entry = d(trade.entryPrice);
      const stake = d(trade.stake);
      const rate = d(trade.payoutRate);
      let result: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
      if (exit > entry) result = 'WIN';
      else if (exit < entry) result = 'LOSS';
      // Direction decides the outcome: CALL wins when price rises, PUT wins when it falls.
      const won = (trade.direction === 'CALL' && result === 'WIN') || (trade.direction === 'PUT' && result === 'LOSS');
      const isDraw = exit === entry;
      const finalResult = isDraw ? 'DRAW' : won ? 'WIN' : 'LOSS';
      const pnl = isDraw ? 0 : won ? round(stake * rate, 10) : round(-stake, 10);
      const payout = isDraw ? stake : won ? round(stake * (1 + rate), 10) : 0;

      await prisma.$transaction(async (tx) => {
        const fresh = await tx.binaryTrade.findUnique({ where: { id: trade.id } });
        if (!fresh || fresh.result !== 'OPEN') return;
        const wallet = await getOrCreateWallet(tx, trade.accountId, trade.account.currency);
        await unlockFunds(tx, wallet.id, stake);
        if (payout > 0) {
          await postLedger(tx, {
            type: 'BINARY_SETTLEMENT',
            walletId: wallet.id,
            amount: payout,
            direction: 'CREDIT',
            description: `${finalResult} · ${trade.direction} ${trade.symbol}`,
            reference: `binary:${trade.id}`,
            metadata: { entry, exit, direction: trade.direction, stake },
          });
        } else {
          await postLedger(tx, {
            type: 'BINARY_SETTLEMENT',
            walletId: wallet.id,
            amount: stake,
            direction: 'DEBIT',
            description: `LOSS · ${trade.direction} ${trade.symbol}`,
            reference: `binary:${trade.id}`,
            metadata: { entry, exit, direction: trade.direction, stake },
          });
        }
        await tx.binaryTrade.update({
          where: { id: trade.id },
          data: { result: finalResult, settlePrice: String(round(exit, 8)), pnl: money(pnl), settledAt: new Date(), exitQuoteTs: new Date(quote.fetchedAt) },
        });
        await tx.notification.create({
          data: {
            userId: trade.account.userId,
            type: 'TRADE',
            title: `Short-expiry trade ${finalResult}`,
            body: `${trade.direction} ${trade.symbol} settled ${finalResult.toLowerCase()} at ${round(exit, 6)} (entry ${round(entry, 6)}). P/L ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}.`,
          },
        });
      });
      settled.push({ id: trade.id, result: finalResult, pnl });
    } catch (err) {
      console.error('[settleExpiredBinaryTrades]', trade.id, err);
    }
  }
  return settled;
}
