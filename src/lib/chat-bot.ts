/**
 * PRIMEVEST Customer Support — automated first responder.
 * Keyword-matched FAQ answers so visitors get instant help; anything the bot
 * cannot answer is handed to a human agent in the admin live-chat console.
 */
const GREETING =
  "Hello, and welcome to PRIMEVEST Customer Support. I'm the support assistant — ask me about deposits, withdrawals, verification, trading sessions, spreads or your account, and I'll answer right away. A human agent can also join this chat.";

const FAQ: { keys: string[]; answer: string }[] = [
  {
    keys: ['deposit', 'fund', 'funding', 'pay in', 'top up'],
    answer:
      'To fund your account, open Dashboard → Wallet → Deposit and choose your asset from the dropdown. Crypto deposits are credited after network confirmation; bank transfers become available once a payment provider is configured for your region. Deposits are reviewed by our payments team before credit.',
  },
  {
    keys: ['withdraw', 'withdrawal', 'payout', 'cash out'],
    answer:
      'Withdrawals are processed from Dashboard → Wallet → Withdrawals after identity verification is approved. Requests are reviewed within one business day and returned to the same method used to deposit, per our AML policy.',
  },
  {
    keys: ['verif', 'kyc', 'identity', 'document', 'id card', 'passport'],
    answer:
      'Verification takes about five minutes: Dashboard → Verification, choose your document type and issuing country from the dropdowns, enter your details and upload a clear photo of the document front. Most reviews complete within one business day.',
  },
  {
    keys: ['session', 'hours', 'open', 'closed', 'trading time', 'weekend'],
    answer:
      'Crypto markets trade 24/7. Forex and CFD sessions follow the major centres — Sydney, Tokyo, London and New York — and the live session clock on the Markets page shows exactly which windows are open right now, including weekend status.',
  },
  {
    keys: ['spread', 'fee', 'commission', 'cost', 'swap', 'charge'],
    answer:
      'Spreads and fees per instrument are listed on the Trading Conditions page, and each order confirmation shows the venue and fee applied. There are no hidden charges; financing (swap) applies only to positions held overnight on leveraged products.',
  },
  {
    keys: ['demo', 'paper', 'practice', 'virtual'],
    answer:
      'Every new account includes a demo trading account with virtual capital. Switch between demo and live accounts from the account switcher at the top of the trading terminal.',
  },
  {
    keys: ['screener', 'scan', 'screen', 'gainers', 'stock list'],
    answer:
      'The Global Screener (Markets → Global screener) scans thousands of listed stocks, crypto pairs, currencies and CFDs for gainers, losers, volume and technical ratings. It is research data powered by the TradingView public scanner.',
  },
  {
    keys: ['news', 'headline'],
    answer:
      'Live market headlines from Finnhub appear on the Markets page, the screener and inside the trading terminal — the wire automatically follows the asset class of the instrument you have selected.',
  },
  {
    keys: ['password', 'reset', 'forgot', 'login problem', 'sign in'],
    answer:
      'If you cannot sign in, use "Forgot password" on the login page to receive a reset link. If you use two-factor authentication, enter the 6-digit code from your authenticator app when prompted.',
  },
  {
    keys: ['account', 'register', 'sign up', 'open account', 'create'],
    answer:
      'Opening an account takes about two minutes: click "Open account", choose your country from the dropdown and set a strong password. Your demo account and dashboard are ready immediately after email confirmation.',
  },
  {
    keys: ['leverage', 'margin', 'liquidation'],
    answer:
      'Maximum leverage per instrument is shown in Trading Conditions and on the order ticket. Margin usage and liquidation levels are displayed live on your dashboard; positions are monitored continuously by the risk engine.',
  },
  {
    keys: ['alert', 'notification', 'price alert'],
    answer:
      'You can create price alerts from the Markets page or Dashboard → Markets. When the market crosses your level, the alert fires and a notification is delivered in-app.',
  },
];

const HANDOFF =
  "Thanks — I've passed this to a human support agent who can see this whole conversation. They'll reply here as soon as they're available. Meanwhile, feel free to add any details (account email, instrument, timestamps).";

export const BOT_GREETING = GREETING;

/** Situations a bot must never guess at — straight to a human agent. */
const FORCE_HANDOFF = ['locked', 'blocked', 'frozen', 'human', 'agent', 'someone', 'complaint', 'refund', 'hack', 'stolen', 'urgent', 'lawyer', 'police', 'chargeback', 'dispute'];

/** Returns a bot answer for recognisable questions, otherwise null (agent handoff). */
export function botReply(text: string): string | null {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')} `;
  if (t.trim().length < 3) return null;
  if (FORCE_HANDOFF.some((k) => t.includes(` ${k} `) || t.includes(` ${k}s `) || t.includes(` ${k}ed `))) return null;
  let best: { score: number; answer: string } | null = null;
  for (const entry of FAQ) {
    // Word-boundary matching only: "account" must not fire inside "cousin's account was locked".
    const score = entry.keys.reduce((acc, k) => (new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(t.slice(1)) && t.includes(k) ? acc + k.length : acc), 0);
    if (score > 0 && (!best || score > best.score)) best = { score, answer: entry.answer };
  }
  return best ? best.answer : null;
}

export const HANDOFF_MESSAGE = HANDOFF;
