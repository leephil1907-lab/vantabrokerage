import { d } from './ledger';

export function serializeOrder(o: {
  id: string; symbol: string; side: string; type: string; status: string; qty: unknown; price: unknown; filledQty: unknown;
  avgFillPrice: unknown; leverage: number; marginMode: string; fee: unknown; reserved: unknown; takeProfit: unknown; stopLoss: unknown;
  rejectReason: string | null; createdAt: Date; filledAt: Date | null; cancelledAt: Date | null; expiresAt: Date | null;
}) {
  return {
    id: o.id, symbol: o.symbol, side: o.side, type: o.type, status: o.status,
    qty: d(o.qty as never), price: o.price != null ? d(o.price as never) : null,
    filledQty: d(o.filledQty as never), avgFillPrice: o.avgFillPrice != null ? d(o.avgFillPrice as never) : null,
    leverage: o.leverage, marginMode: o.marginMode, fee: d(o.fee as never), reserved: d(o.reserved as never),
    takeProfit: o.takeProfit != null ? d(o.takeProfit as never) : null, stopLoss: o.stopLoss != null ? d(o.stopLoss as never) : null,
    rejectReason: o.rejectReason, createdAt: o.createdAt.toISOString(), filledAt: o.filledAt?.toISOString() ?? null,
    cancelledAt: o.cancelledAt?.toISOString() ?? null, expiresAt: o.expiresAt?.toISOString() ?? null,
  };
}
