import { prisma } from './db';
import { AppError } from './errors';
import { getQuote } from './market-data';
import { d, lockFunds, unlockFunds, postLedger, round, money, getOrCreateWallet } from './ledger';
import type { TradingPair, Account } from '@prisma/client';

export type PlaceOrderInput = {
  userId: string;
  accountId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_MARKET' | 'TAKE_PROFIT' | 'TAKE_PROFIT_MARKET';
  qty: number;
  price?: number;
  leverage?: number;
  marginMode?: 'CROSS' | 'ISOLATED';
  takeProfit?: number;
  stopLoss?: number;
  reduceOnly?: boolean;
};

const DERIVATIVE_CATEGORIES = new Set(['FOREX', 'CFD', 'FUTURES']);

export function isDerivative(pair: { category: string }) {
  return DERIVATIVE_CATEGORIES.has(pair.category);
}

export function executionMode() {
  // There is no live broker adapter yet. An environment flag must never turn
  // simulated fills into real-money execution.
  return 'paper' as const;
}

/** PnL expressed in account currency (USD). USDT is treated as 1:1 USD. */
export function pnlUsd(pair: Pick<TradingPair, 'baseAsset' | 'quoteAsset'>, side: 'LONG' | 'SHORT', entry: number, exit: number, qty: number) {
  const raw = (exit - entry) * qty * (side === 'LONG' ? 1 : -1);
  if (pair.quoteAsset === 'USD' || pair.quoteAsset === 'USDT') return round(raw, 10);
  if (pair.baseAsset === 'USD' || pair.baseAsset === 'USDT') {
    if (!exit) return 0;
    return round(raw / exit, 10);
  }
  return round(raw, 10);
}

export function liquidationPrice(side: 'LONG' | 'SHORT', entry: number, leverage: number, maintenanceRate = 0.005) {
  if (leverage <= 1) return null;
  const mm = 1 / leverage - maintenanceRate;
  return side === 'LONG' ? round(entry * (1 - mm), 8) : round(entry * (1 + mm), 8);
}

export async function loadTradablePair(symbol: string) {
  const pair = await prisma.tradingPair.findUnique({ where: { symbol } });
  if (!pair) throw new AppError('NOT_FOUND', `Market ${symbol} not found.`, 404);
  if (!pair.enabled) throw new AppError('MARKET_DISABLED', `Trading on ${symbol} is currently disabled.`, 403);
  return pair;
}

export async function loadAccount(userId: string, accountId: string) {
  const account = await prisma.account.findFirst({ where: { id: accountId, userId } });
  if (!account) throw new AppError('NOT_FOUND', 'Trading account not found.', 404);
  if (account.status !== 'ACTIVE') throw new AppError('ACCOUNT_RESTRICTED', 'This trading account is not active.', 403);
  return account;
}

function assertLiveAllowed(account: Account) {
  if (account.type === 'LIVE') {
    throw new AppError(
      'LIVE_EXECUTION_UNAVAILABLE',
      'Live execution provider is not connected. This deployment supports paper trading only — switch to your paper account to continue.',
      409,
    );
  }
}

export async function placeOrder(input: PlaceOrderInput) {
  const pair = await loadTradablePair(input.symbol);
  const account = await loadAccount(input.userId, input.accountId);
  assertLiveAllowed(account);

  const qty = round(Number(input.qty), pair.qtyPrecision);
  if (!isFinite(qty) || qty <= 0) throw new AppError('INVALID_QTY', 'Order quantity must be greater than zero.', 400);
  if (qty < d(pair.minQty) - 1e-12) throw new AppError('INVALID_QTY', `Minimum quantity for ${pair.symbol} is ${pair.minQty}.`, 400);

  const leverage = Math.max(1, Math.min(Number(input.leverage ?? 1), pair.maxLeverage, account.leverage));
  const derivative = isDerivative(pair);
  const quote = await getQuote(pair.id, 3000);
  const isMarket = input.type === 'MARKET';


  if (!isMarket && (!input.price || input.price <= 0)) {
    throw new AppError('INVALID_PRICE', 'Limit and stop orders require a trigger price.', 400);
  }
  if (!isMarket && input.type === 'LIMIT') {
    if (input.side === 'BUY' && input.price! > quote.ask * 1.5) throw new AppError('INVALID_PRICE', 'Buy limit price is too far from the market.', 400);
    if (input.side === 'SELL' && input.price! < quote.bid * 0.5) throw new AppError('INVALID_PRICE', 'Sell limit price is too far from the market.', 400);
  }

  const fillPrice = input.side === 'BUY' ? quote.ask : quote.bid;
  const refPrice = isMarket ? fillPrice : Number(input.price);
  const notional = round(refPrice * qty, 8);
  const takerFeeRate = derivative ? d(pair.takerFee) : d(pair.takerFee);
  const requiredMargin = derivative ? round(notional / leverage, 10) : round(notional, 10);
  const fee = round(notional * takerFeeRate, 10);

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await getOrCreateWallet(tx, account.id, account.currency);
    const available = d(wallet.available);

    // Spot sells do not need USD margin — they consume the base holding.
    const spotSell = !derivative && input.side === 'SELL';
    if (spotSell) {
      const holding = await tx.holding.findUnique({ where: { walletId_asset: { walletId: wallet.id, asset: pair.baseAsset } } });
      const held = d(holding?.amount);
      if (held + 1e-12 < qty) throw new AppError('INSUFFICIENT_FUNDS', `Insufficient ${pair.baseAsset} balance. Available: ${held}.`, 400);
    } else {
      const needed = requiredMargin + fee;
      if (available + 1e-9 < needed) {
        throw new AppError(
          'INSUFFICIENT_FUNDS',
          `Insufficient available balance. Required ${needed.toFixed(2)} ${account.currency}, available ${available.toFixed(2)}.`,
          400,
          { required: needed, available },
        );
      }
    }

    const order = await tx.order.create({
      data: {
        accountId: account.id,
        pairId: pair.id,
        symbol: pair.symbol,
        category: pair.category,
        side: input.side,
        type: input.type,
        status: 'OPEN',
        qty: qty.toString(),
        price: input.price ? input.price.toString() : null,
        stopPrice: null,
        takeProfit: input.takeProfit ? String(input.takeProfit) : null,
        stopLoss: input.stopLoss ? String(input.stopLoss) : null,
        leverage,
        marginMode: input.marginMode ?? 'CROSS',
        reserved: isMarket ? '0' : (spotSell ? '0' : money(requiredMargin + fee)),
        fee: '0',
        reduceOnly: !!input.reduceOnly,
        expiresAt: isMarket ? null : new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    });

    if (!isMarket) {
      if (!spotSell) await lockFunds(tx, wallet.id, requiredMargin + fee);
      return { order, filled: false, position: null };
    }

    // ── Immediate execution at the server-side quoted price ──
    await tx.execution.create({
      data: { orderId: order.id, qty: String(qty), price: String(round(fillPrice, 8)), fee: money(fee), venue: 'vanta-internal', quoteTs: new Date(quote.fetchedAt) },
    });

    let positionId: string | null = null;
    if (derivative) {
      await lockFunds(tx, wallet.id, requiredMargin + fee);
      positionId = await openOrMergePosition(tx, {
        accountId: account.id,
        orderId: order.id,
        pair,
        side: input.side === 'BUY' ? 'LONG' : 'SHORT',
        qty,
        price: round(fillPrice, 8),
        leverage,
        marginMode: input.marginMode ?? 'CROSS',
        margin: requiredMargin,
        fee,
        takeProfit: input.takeProfit ?? null,
        stopLoss: input.stopLoss ?? null,
      });
      await unlockFunds(tx, wallet.id, fee); // fee is consumed from the margin lock
      await settleFee(tx, wallet.id, fee, order.id, `Taker fee · ${pair.symbol}`);
    } else if (input.side === 'BUY') {
      // spot buy: pay notional + fee, receive base asset
      await settleSpotBuy(tx, wallet.id, pair, qty, round(fillPrice, 8), notional, fee, order.id);
    } else {
      await settleSpotSell(tx, wallet.id, pair, qty, round(fillPrice, 8), notional, fee, order.id);
    }

    const filled = await tx.order.update({
      where: { id: order.id },
      data: { status: 'FILLED', filledQty: qty.toString(), avgFillPrice: String(round(fillPrice, 8)), fee: money(fee), filledAt: new Date() },
    });
    return { order: filled, filled: true, position: positionId };
  });

  return { ...result, quote, pair: { symbol: pair.symbol, category: pair.category } };
}

async function settleFee(tx: any, walletId: string, fee: number, orderId: string, description: string) {
  if (fee <= 0) return;
  await postLedger(tx, { type: 'TRADE_FEE', walletId, amount: fee, direction: 'DEBIT', description, reference: `fee:${orderId}` });
}

async function settleSpotBuy(tx: any, walletId: string, pair: TradingPair, qty: number, price: number, notional: number, fee: number, orderId: string) {
  await postLedger(tx, {
    type: 'TRADE_PNL',
    walletId,
    amount: round(notional + fee, 10),
    direction: 'DEBIT',
    description: `Bought ${qty} ${pair.baseAsset} @ ${price}`,
    reference: `spot-buy:${orderId}`,
    metadata: { symbol: pair.symbol, qty, price },
  });
  const current = await tx.holding.findUnique({ where: { walletId_asset: { walletId, asset: pair.baseAsset } } });
  await tx.holding.upsert({
    where: { walletId_asset: { walletId, asset: pair.baseAsset } },
    create: { walletId, asset: pair.baseAsset, amount: String(qty) },
    update: { amount: money(d(current?.amount) + qty) },
  });
}

async function settleSpotSell(tx: any, walletId: string, pair: TradingPair, qty: number, price: number, notional: number, fee: number, orderId: string) {
  const holding = await tx.holding.findUnique({ where: { walletId_asset: { walletId, asset: pair.baseAsset } } });
  await tx.holding.update({
    where: { id: holding.id },
    data: { amount: money(d(holding.amount) - qty) },
  });
  await postLedger(tx, {
    type: 'TRADE_PNL',
    walletId,
    amount: round(notional - fee, 10),
    direction: 'CREDIT',
    description: `Sold ${qty} ${pair.baseAsset} @ ${price}`,
    reference: `spot-sell:${orderId}`,
    metadata: { symbol: pair.symbol, qty, price },
  });
}

async function openOrMergePosition(
  tx: any,
  p: {
    accountId: string;
    orderId: string;
    pair: TradingPair;
    side: 'LONG' | 'SHORT';
    qty: number;
    price: number;
    leverage: number;
    marginMode: 'CROSS' | 'ISOLATED';
    margin: number;
    fee: number;
    takeProfit: number | null;
    stopLoss: number | null;
  },
) {
  const existing = await tx.position.findFirst({
    where: { accountId: p.accountId, symbol: p.pair.symbol, side: p.side, status: 'OPEN', leverage: p.leverage, marginMode: p.marginMode },
  });
  const liq = liquidationPrice(p.side, p.price, p.leverage);
  if (existing) {
    const totalQty = round(d(existing.qty) + p.qty, 10);
    const entry = round((d(existing.entryPrice) * d(existing.qty) + p.price * p.qty) / totalQty, 8);
    const merged = await tx.position.update({
      where: { id: existing.id },
      data: {
        qty: String(totalQty),
        entryPrice: String(entry),
        initialMargin: money(d(existing.initialMargin) + p.margin),
        feesPaid: money(d(existing.feesPaid) + p.fee),
        liquidationPrice: liquidationPrice(p.side, entry, p.leverage)?.toString() ?? null,
        takeProfit: p.takeProfit ?? existing.takeProfit,
        stopLoss: p.stopLoss ?? existing.stopLoss,
      },
    });
    return merged.id as string;
  }
  const created = await tx.position.create({
    data: {
      accountId: p.accountId,
      orderId: p.orderId,
      pairId: p.pair.id,
      symbol: p.pair.symbol,
      category: p.pair.category,
      side: p.side,
      qty: String(p.qty),
      entryPrice: String(p.price),
      markPrice: String(p.price),
      leverage: p.leverage,
      marginMode: p.marginMode,
      initialMargin: money(p.margin + p.fee),
      isolatedMargin: p.marginMode === 'ISOLATED' ? money(p.margin) : null,
      liquidationPrice: liq?.toString() ?? null,
      takeProfit: p.takeProfit ?? null,
      stopLoss: p.stopLoss ?? null,
      feesPaid: money(p.fee),
      status: 'OPEN',
    },
  });
  return created.id as string;
}

export async function closePosition(opts: { userId: string; positionId: string; qty?: number; reason?: string }) {
  const position = await prisma.position.findUnique({ where: { id: opts.positionId }, include: { account: true } });
  if (!position) throw new AppError('NOT_FOUND', 'Position not found.', 404);
  if (position.account.userId !== opts.userId) throw new AppError('FORBIDDEN', 'You cannot close this position.', 403);
  assertLiveAllowed(position.account);
  if (position.status !== 'OPEN') throw new AppError('POSITION_CLOSED', 'This position is already closed.', 409);
  const pair = await prisma.tradingPair.findUnique({ where: { id: position.pairId } });
  if (!pair) throw new AppError('NOT_FOUND', 'Market unavailable.', 404);
  const quote = await getQuote(pair.id, 3000);
  const exitPrice = position.side === 'LONG' ? quote.bid : quote.ask;
  const closeQty = opts.qty && opts.qty > 0 ? Math.min(opts.qty, d(position.qty)) : d(position.qty);
  const pnl = pnlUsd(pair, position.side, d(position.entryPrice), exitPrice, closeQty);
  const releasedMargin = round((d(position.initialMargin) * closeQty) / d(position.qty), 10);
  const fee = round(exitPrice * closeQty * d(pair.takerFee), 10);

  const out = await prisma.$transaction(async (tx) => {
    const wallet = await getOrCreateWallet(tx, position.accountId, position.account.currency);
    const fullyClosed = closeQty >= d(position.qty) - 1e-12;

    // Release locked margin, apply PnL and exit fee.
    const release = round(Math.max(0, releasedMargin), 10);
    await unlockFunds(tx, wallet.id, release);
    await postLedger(tx, {
      type: 'TRADE_PNL',
      walletId: wallet.id,
      amount: Math.abs(pnl),
      direction: pnl >= 0 ? 'CREDIT' : 'DEBIT',
      description: `${pnl >= 0 ? 'Profit' : 'Loss'} on ${position.symbol} ${position.side}`,
      reference: `pos-close:${position.id}:${Date.now()}`,
      metadata: { symbol: position.symbol, entry: d(position.entryPrice), exit: exitPrice, qty: closeQty },
    });
    if (fee > 0) {
      await postLedger(tx, { type: 'TRADE_FEE', walletId: wallet.id, amount: fee, direction: 'DEBIT', description: `Exit fee · ${position.symbol}`, reference: `fee:close:${position.id}` });
    }

    if (fullyClosed) {
      await tx.position.update({
        where: { id: position.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          markPrice: String(round(exitPrice, 8)),
          realizedPnl: money(d(position.realizedPnl) + pnl),
          unrealizedPnl: '0',
          feesPaid: money(d(position.feesPaid) + fee),
        },
      });
    } else {
      const remainingQty = round(d(position.qty) - closeQty, 10);
      await tx.position.update({
        where: { id: position.id },
        data: {
          qty: String(remainingQty),
          initialMargin: money(d(position.initialMargin) - release),
          realizedPnl: money(d(position.realizedPnl) + pnl),
          feesPaid: money(d(position.feesPaid) + fee),
          markPrice: String(round(exitPrice, 8)),
        },
      });
    }
    return { pnl, exitPrice: round(exitPrice, 8), fee, fullyClosed };
  });

  return { positionId: position.id, symbol: position.symbol, ...out, reason: opts.reason ?? 'manual' };
}

export async function cancelOrder(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { account: true } });
  if (!order) throw new AppError('NOT_FOUND', 'Order not found.', 404);
  if (order.account.userId !== userId) throw new AppError('FORBIDDEN', 'You cannot cancel this order.', 403);
  if (order.status !== 'OPEN') throw new AppError('ORDER_NOT_OPEN', 'Only open orders can be cancelled.', 409);

  return prisma.$transaction(async (tx) => {
    const wallet = await getOrCreateWallet(tx, order.accountId, order.account.currency);
    const reserved = d(order.reserved);
    if (reserved > 0) await unlockFunds(tx, wallet.id, reserved);
    return tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED', cancelledAt: new Date(), reserved: '0' } });
  });
}

/**
 * Match resting orders against the live quote. Called by the background worker and
 * opportunistically after order placement. Creates the same fills a market order would.
 */
export async function matchRestingOrders(symbol?: string) {
  const orders = await prisma.order.findMany({
    where: { status: 'OPEN', ...(symbol ? { symbol } : {}), OR: [{ type: { in: ['LIMIT', 'STOP', 'STOP_MARKET'] } }] },
    include: { account: true },
    take: 200,
  });
  let filled = 0;
  for (const order of orders) {
    try {
      const pair = await prisma.tradingPair.findUnique({ where: { id: order.pairId } });
      if (!pair) continue;
      const quote = await getQuote(order.pairId, 2000);
      if (order.account.type === 'LIVE') continue;
      const side = order.side;
      const price = d(order.price);
      const q = side === 'BUY' ? quote.ask : quote.bid;
      let trigger = false;
      if (order.type === 'LIMIT') trigger = side === 'BUY' ? q <= price : q >= price;
      else if (order.type === 'STOP' || order.type === 'STOP_MARKET') trigger = side === 'BUY' ? q >= price : q <= price;
      if (!trigger) continue;

      await prisma.$transaction(async (tx) => {
        const current = await tx.order.findUnique({ where: { id: order.id } });
        if (!current || current.status !== 'OPEN') return;
        const derivative = isDerivative(pair);
        const fillPrice = round(q, 8);
        const notional = round(fillPrice * d(order.qty), 10);
        const fee = round(notional * d(pair.takerFee), 10);
        const wallet = await getOrCreateWallet(tx, order.accountId, order.account.currency);

        if (!derivative && side === 'SELL') {
          const holding = await tx.holding.findUnique({ where: { walletId_asset: { walletId: wallet.id, asset: pair.baseAsset } } });
          if (d(holding?.amount) < d(order.qty)) {
            await tx.order.update({ where: { id: order.id }, data: { status: 'REJECTED', rejectReason: 'Insufficient asset balance at fill time' } });
            return;
          }
          await settleSpotSell(tx, wallet.id, pair, d(order.qty), fillPrice, notional, fee, order.id);
        } else if (!derivative && side === 'BUY') {
          const reserved = d(order.reserved);
          await unlockFunds(tx, wallet.id, reserved);
          await postLedger(tx, { type: 'TRADE_PNL', walletId: wallet.id, amount: round(notional + fee, 10), direction: 'DEBIT', description: `Bought ${order.qty} ${pair.baseAsset}`, reference: `fill:${order.id}` });
          const h = await tx.holding.findUnique({ where: { walletId_asset: { walletId: wallet.id, asset: pair.baseAsset } } });
          await tx.holding.upsert({
            where: { walletId_asset: { walletId: wallet.id, asset: pair.baseAsset } },
            create: { walletId: wallet.id, asset: pair.baseAsset, amount: String(d(order.qty)) },
            update: { amount: money(d(h?.amount) + d(order.qty)) },
          });
        } else {
          const margin = round(notional / order.leverage, 10);
          const reserved = d(order.reserved);
          // reserved already covers margin+fee; adjust for any slippage difference
          const needed = round(margin + fee, 10);
          if (needed > reserved) {
            const extra = round(needed - reserved, 10);
            try {
              await lockFunds(tx, wallet.id, extra);
            } catch {
              await tx.order.update({ where: { id: order.id }, data: { status: 'REJECTED', rejectReason: 'Insufficient margin at fill time' } });
              return;
            }
          } else if (reserved > needed) {
            await unlockFunds(tx, wallet.id, round(reserved - needed, 10));
          }
          await openOrMergePosition(tx, {
            accountId: order.accountId,
            orderId: order.id,
            pair,
            side: side === 'BUY' ? 'LONG' : 'SHORT',
            qty: d(order.qty),
            price: fillPrice,
            leverage: order.leverage,
            marginMode: order.marginMode,
            margin,
            fee,
            takeProfit: order.takeProfit ? d(order.takeProfit) : null,
            stopLoss: order.stopLoss ? d(order.stopLoss) : null,
          });
          await unlockFunds(tx, wallet.id, fee);
          await postLedger(tx, { type: 'TRADE_FEE', walletId: wallet.id, amount: fee, direction: 'DEBIT', description: `Taker fee · ${order.symbol}`, reference: `fee:${order.id}` });
        }

        await tx.execution.create({
          data: { orderId: order.id, qty: String(d(order.qty)), price: String(fillPrice), fee: money(fee), venue: 'vanta-internal', quoteTs: new Date(quote.fetchedAt) },
        });
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'FILLED', filledQty: String(d(order.qty)), avgFillPrice: String(fillPrice), fee: money(fee), reserved: '0', filledAt: new Date() },
        });
        await tx.notification.create({
          data: { userId: order.account.userId, type: 'TRADE', title: 'Order filled', body: `${order.side} ${order.qty} ${order.symbol} filled at ${fillPrice}.` },
        });
      });
      filled++;
    } catch (err) {
      console.error('[matchRestingOrders]', order.id, err);
    }
  }
  return { checked: orders.length, filled };
}
