/**
 * Financial Utilities - Unified Asset & Number System
 * 
 * Rules:
 * 1. All monetary values are stored in base units (e.g., $MON)
 * 2. Display functions handle formatting only, never calculation
 * 3. All calculations use precise decimal arithmetic
 * 4. Negative values are protected at calculation level
 * 5. Percentages are calculated with proper safeguards
 */

// ==================== Constants ====================
export const DECIMAL_PLACES = 2;
export const DISPLAY_DECIMALS = 0;
export const PERCENT_DECIMALS = 2;

// USDT Conversion rate (mock)
export const USDT_RATE = 0.85;

// ==================== Type Guards ====================
export const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

export const isPositiveNumber = (value: number): boolean => {
  return isValidNumber(value) && value >= 0;
};

// ==================== Safe Calculations ====================

/**
 * Safely add numbers, returns 0 if any input is invalid
 */
export const safeAdd = (...values: number[]): number => {
  const validValues = values.filter(isValidNumber);
  if (validValues.length === 0) return 0;
  return validValues.reduce((acc, val) => acc + val, 0);
};

/**
 * Safely subtract, returns 0 if result would be negative or invalid
 */
export const safeSubtract = (a: number, b: number): number => {
  if (!isValidNumber(a) || !isValidNumber(b)) return 0;
  return Math.max(0, a - b);
};

/**
 * Safely multiply, returns 0 if any input is invalid
 */
export const safeMultiply = (a: number, b: number): number => {
  if (!isValidNumber(a) || !isValidNumber(b)) return 0;
  return a * b;
};

/**
 * Safely divide, returns 0 if divisor is 0 or any input is invalid
 */
export const safeDivide = (numerator: number, denominator: number): number => {
  if (!isValidNumber(numerator) || !isValidNumber(denominator) || denominator === 0) return 0;
  return numerator / denominator;
};

/**
 * Calculate percentage safely
 * Returns 0 if base is 0 or any input is invalid
 */
export const calculatePercentage = (value: number, base: number): number => {
  return safeDivide(value, base) * 100;
};

/**
 * Calculate ratio safely (0-1 range)
 */
export const calculateRatio = (value: number, base: number): number => {
  const ratio = safeDivide(value, base);
  return Math.min(1, Math.max(0, ratio));
};

// ==================== Formatting Functions ====================

/**
 * Format number with commas and specified decimals
 */
export const formatNumber = (value: number, decimals: number = DISPLAY_DECIMALS): string => {
  if (!isValidNumber(value)) return '0';
  const fixed = value.toFixed(decimals);
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimals > 0 && parts[1] ? `${parts[0]}.${parts[1]}` : parts[0];
};

/**
 * Format currency with symbol
 */
export const formatCurrency = (
  value: number,
  symbol: string = '$MON',
  decimals: number = DISPLAY_DECIMALS
): string => {
  return `${formatNumber(value, decimals)} ${symbol}`;
};

/**
 * Format USDT value
 */
export const formatUSDT = (value: number, rate: number = USDT_RATE): string => {
  const usdtValue = safeMultiply(value, rate);
  return `$${formatNumber(usdtValue, 2)}`;
};

/**
 * Format percentage with sign
 */
export const formatPercentage = (
  value: number,
  decimals: number = PERCENT_DECIMALS,
  showSign: boolean = true
): string => {
  if (!isValidNumber(value)) return showSign ? '+0.00%' : '0.00%';
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Mask number for privacy
 */
export const maskNumber = (): string => '****';

// ==================== Asset Calculations ====================

export interface AssetBreakdown {
  walletBalance: number;      // Available in wallet
  stakedAmount: number;       // Total in active positions
  totalEquity: number;        // walletBalance + stakedAmount
  isOverAllocated: boolean;   // walletBalance < 0
  actualWalletBalance: number; // Raw value (may be negative)
}

/**
 * Calculate complete asset breakdown
 */
export const calculateAssetBreakdown = (
  walletBalance: number,
  agentBalances: number[]
): AssetBreakdown => {
  const actualWalletBalance = isValidNumber(walletBalance) ? walletBalance : 0;
  const stakedAmount = safeAdd(...agentBalances);
  
  // Display wallet balance is never negative
  const displayWalletBalance = Math.max(0, actualWalletBalance);
  
  // Total equity = display wallet balance + staked amount
  // This ensures totalEquity is never negative
  const totalEquity = safeAdd(displayWalletBalance, stakedAmount);
  
  return {
    walletBalance: displayWalletBalance,
    stakedAmount,
    totalEquity,
    isOverAllocated: actualWalletBalance < 0,
    actualWalletBalance,
  };
};

// ==================== Position Calculations ====================

export interface PositionMetrics {
  longAllocation: number;
  shortAllocation: number;
  autoAllocation: number;
  totalAllocation: number;
  longRatio: number;    // 0-1
  shortRatio: number;   // 0-1
  autoRatio: number;    // 0-1
}

/**
 * Calculate position breakdown metrics
 */
export const calculatePositionMetrics = (
  longAlloc: number,
  shortAlloc: number,
  autoAlloc: number
): PositionMetrics => {
  const totalAllocation = safeAdd(longAlloc, shortAlloc, autoAlloc);
  
  return {
    longAllocation: longAlloc,
    shortAllocation: shortAlloc,
    autoAllocation: autoAlloc,
    totalAllocation,
    longRatio: calculateRatio(longAlloc, totalAllocation),
    shortRatio: calculateRatio(shortAlloc, totalAllocation),
    autoRatio: calculateRatio(autoAlloc, totalAllocation),
  };
};

// ==================== PnL Calculations ====================

export interface PnLMetrics {
  totalPnL: number;
  totalROI: number;           // Percentage
  realizedPnL: number;
  unrealizedPnL: number;
  isProfitable: boolean;
}

/**
 * Calculate PnL metrics
 * totalEquity: Current total equity
 * initialEquity: Initial investment (cost basis)
 */
export const calculatePnLMetrics = (
  totalEquity: number,
  initialEquity: number
): PnLMetrics => {
  const totalPnL = safeSubtract(totalEquity, initialEquity);
  const totalROI = calculatePercentage(totalPnL, initialEquity);
  
  return {
    totalPnL,
    totalROI,
    realizedPnL: 0,  // TODO: Track realized vs unrealized
    unrealizedPnL: totalPnL,
    isProfitable: totalPnL > 0,
  };
};

// ==================== Validation Helpers ====================

/**
 * Validate withdrawal amount
 */
export const validateWithdrawal = (
  amount: number,
  availableBalance: number
): { valid: boolean; error?: string } => {
  if (!isValidNumber(amount) || amount <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }
  if (amount > availableBalance) {
    return { valid: false, error: 'Insufficient balance' };
  }
  return { valid: true };
};

/**
 * Validate deployment collateral
 */
export const validateDeployment = (
  collateral: number,
  availableBalance: number,
  minCollateral: number = 100
): { valid: boolean; error?: string } => {
  if (!isValidNumber(collateral) || collateral < minCollateral) {
    return { valid: false, error: `Minimum collateral is ${minCollateral} $MON` };
  }
  if (collateral > availableBalance) {
    return { valid: false, error: 'Insufficient balance for deployment' };
  }
  return { valid: true };
};

// ==================== Color Helpers ====================

/**
 * Get color based on value (positive/negative)
 */
export const getValueColor = (value: number): string => {
  if (!isValidNumber(value) || value === 0) return 'text-slate-400';
  return value > 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]';
};

/**
 * Get background color based on value
 */
export const getValueBgColor = (value: number): string => {
  if (!isValidNumber(value) || value === 0) return 'bg-slate-500/10';
  return value > 0 ? 'bg-[#00FF9D]/10' : 'bg-[#FF0055]/10';
};
