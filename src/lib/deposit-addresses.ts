import { prisma } from '@/lib/db';

export type CryptoDepositAddress = {
  asset: string;
  network: string;
  address: string;
  enabled: boolean;
  minConfirmations: number;
};

// Initial shared-address book supplied for PRIMEVEST. Admin changes are persisted
// in SystemConfig and take precedence over this bootstrap list.
export const INITIAL_CRYPTO_DEPOSIT_ADDRESSES: CryptoDepositAddress[] = [
  {
    "asset": "BTC",
    "network": "Bitcoin",
    "address": "bc1qjaargqate7yvacq065t0wtv64as85k7td2aq0",
    "enabled": true,
    "minConfirmations": 3
  },
  {
    "asset": "SOL",
    "network": "Solana",
    "address": "EQR4wm7xFa6UMeCEpY5TTtCSFkcH83xcqiWwbxtyaAqF",
    "enabled": true,
    "minConfirmations": 32
  },
  {
    "asset": "DOGE",
    "network": "Dogecoin",
    "address": "DD52RyrB4m7G5aZXtkX6FKmf73pFp2i7Sd",
    "enabled": true,
    "minConfirmations": 6
  },
  {
    "asset": "ETH",
    "network": "Ethereum (ERC20)",
    "address": "0x8703180060f0f92e319a4406c1324a71c6647903",
    "enabled": true,
    "minConfirmations": 12
  },
  {
    "asset": "USDT",
    "network": "Ethereum (ERC20)",
    "address": "0x8703180060f0f92e319a4406c1324a71c6647903",
    "enabled": true,
    "minConfirmations": 12
  },
  {
    "asset": "USDT",
    "network": "Tron (TRC20)",
    "address": "TSFPrRStowD5VMZBAsHZ2JPZ6pjyKMTCp1",
    "enabled": true,
    "minConfirmations": 20
  },
  {
    "asset": "TRX",
    "network": "Tron",
    "address": "TSFPrRStowD5VMZBAsHZ2JPZ6pjyKMTCp1",
    "enabled": true,
    "minConfirmations": 20
  }
];

export async function getCryptoDepositAddresses(includeDisabled = false): Promise<CryptoDepositAddress[]> {
  const config = await prisma.systemConfig.findUnique({ where: { key: 'funding.cryptoAddresses' } });
  const stored = config?.value;
  const list = Array.isArray(stored) ? stored as CryptoDepositAddress[] : INITIAL_CRYPTO_DEPOSIT_ADDRESSES;
  return list.filter((item) => includeDisabled || item.enabled);
}
