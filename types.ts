
export type Direction = 'LONG' | 'SHORT' | 'AUTO';
export type AgentOwner = 'USER' | 'SYSTEM';
export type AssetSymbol = 'BTC' | 'ETH' | 'SOL' | 'MON';

export interface Agent {
  id: string;
  owner: AgentOwner;
  minter: string;
  minterTwitter?: string;
  name: string;
  nftId?: string;
  bio: string;
  avatarSeed: string;
  direction: Direction;
  leverage: number;
  balance: number;
  pnl: number;
  pnlHistory: { time: string; value: number }[];
  wins: number;
  losses: number;
  status: 'IDLE' | 'ACTIVE' | 'LIQUIDATED';
  strategy: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  asset: AssetSymbol;
  takeProfit?: number;
  stopLoss?: number;
  entryPrice?: number;
  twitterHandle?: string;
  effectiveDirection?: 'LONG' | 'SHORT';
}

export interface AgentPersona {
  name: string;
  bio: string;
  strategy: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  specialties: string[];
  catchphrase: string;
}

export interface MarketState {
  symbol: AssetSymbol;
  price: number;
  history: { time: string; price: number }[];
  trend: 'UP' | 'DOWN' | 'FLAT';
  lastChangePct: number;
  // Second-level settlement data
  longEarningsPerSecond: number;
  shortEarningsPerSecond: number;
  totalLongStaked: number;
  totalShortStaked: number;
}

export interface WalletState {
  address: string;
  balance: number;
  monBalance: number;
  totalPnl: number;
  referralCode?: string;
  referralEarnings: number;
  referralCount: number;
  energy: number;
  totalEnergyEarned: number;
}

export interface BattleLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'WIN' | 'LOSS' | 'LIQUIDATION' | 'MINT' | 'SOCIAL' | 'EXIT';
  amount?: number;
}

export interface LootEvent {
  amount: number;
  winner: Direction;
  timestamp: number;
  winnerName?: string;
  victimName?: string;
  isUserInvolved?: boolean;
}

export enum Tab {
  ARENA = 'ARENA',
  AGENTS = 'AGENTS',
  WALLET = 'WALLET',
  LEADERBOARD = 'LEADERBOARD',
  LIQUIDITY = 'LIQUIDITY'
}

// Liquidity Pool Types
export interface LiquidityPool {
  id: string;
  totalStaked: number;
  totalRewards: number;
  apr: number;
  feeShare: number;
  dailyVolume: number;
}

export interface UserLiquidityStake {
  id: string;
  amount: number;
  stakedAt: number;
  rewards: number;
  pendingRewards: number;
  lockPeriod: number;
}


