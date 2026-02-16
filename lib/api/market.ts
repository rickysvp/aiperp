import { supabase } from '../supabase';
import type { Database } from '../database.types';

export type MarketData = Database['public']['Tables']['market_data']['Row'];
export type MarketDataInsert = Database['public']['Tables']['market_data']['Insert'];
export type MarketDataUpdate = Database['public']['Tables']['market_data']['Update'];

let pendingMarketUpdates: Array<{ symbol: string; updates: MarketDataUpdate }> = [];
let pendingPriceHistory: Array<{ symbol: string; price: number }> = [];
let flushTimer: NodeJS.Timeout | null = null;
let isFlushing = false;

const flushMarketUpdates = async () => {
  if (isFlushing || pendingMarketUpdates.length === 0 && pendingPriceHistory.length === 0) return;
  
  isFlushing = true;
  
  const updates = [...pendingMarketUpdates];
  const priceHistory = [...pendingPriceHistory];
  pendingMarketUpdates = [];
  pendingPriceHistory = [];
  
  try {
    for (const update of updates) {
      await updateMarketDataDirect(update.symbol, update.updates);
    }
    
    if (priceHistory.length > 0) {
      const { error } = await supabase
        .from('market_price_history')
        .insert(priceHistory.map(p => ({
          symbol: p.symbol as any,
          price: p.price
        })));
      
      if (error) {
        console.error('Error batch recording price history:', error);
        pendingPriceHistory = [...priceHistory, ...pendingPriceHistory];
      }
    }
  } catch (err) {
    console.error('Error flushing market updates:', err);
    pendingMarketUpdates = [...updates, ...pendingMarketUpdates];
    pendingPriceHistory = [...priceHistory, ...pendingPriceHistory];
  } finally {
    isFlushing = false;
  }
};

const updateMarketDataDirect = async (
  symbol: string,
  updates: MarketDataUpdate
): Promise<MarketData | null> => {
  const { data, error } = await supabase
    .from('market_data')
    .update(updates)
    .eq('symbol', symbol)
    .select()
    .single();

  if (error) {
    console.error('Error updating market data:', error);
    return null;
  }

  return data;
};

/**
 * Get market data for all assets
 */
export async function getAllMarketData(): Promise<MarketData[]> {
  const { data, error } = await supabase
    .from('market_data')
    .select('*');

  if (error) {
    console.error('Error fetching market data:', error);
    return [];
  }

  return data || [];
}

/**
 * Get market data for a specific asset
 */
export async function getMarketData(symbol: string): Promise<MarketData | null> {
  const { data, error } = await supabase
    .from('market_data')
    .select('*')
    .eq('symbol', symbol)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      console.warn(`Market data not found for ${symbol}, initializing...`);
      await initializeMarketData();
      const { data: retryData, error: retryError } = await supabase
        .from('market_data')
        .select('*')
        .eq('symbol', symbol)
        .single();
      if (retryError) {
        console.error('Error fetching market data after init:', retryError);
        return null;
      }
      return retryData;
    }
    console.error('Error fetching market data:', error);
    return null;
  }

  return data;
}

/**
 * Update market data (batched for performance)
 */
export async function updateMarketData(
  symbol: string,
  updates: MarketDataUpdate
): Promise<void> {
  pendingMarketUpdates.push({ symbol, updates });
  
  if (!flushTimer) {
    flushTimer = setInterval(flushMarketUpdates, 1000);
  }
}

/**
 * Force flush pending market updates
 */
export async function forceFlushMarketUpdates(): Promise<void> {
  await flushMarketUpdates();
}

/**
 * Record price history (batched for performance)
 */
export async function recordPriceHistory(symbol: string, price: number): Promise<void> {
  pendingPriceHistory.push({ symbol, price });
}

/**
 * Get price history for a symbol
 */
export async function getPriceHistory(
  symbol: string,
  limit: number = 100
): Promise<{ time: string; price: number }[]> {
  const { data, error } = await supabase
    .from('market_price_history')
    .select('recorded_at, price')
    .eq('symbol', symbol)
    .order('recorded_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching price history:', error);
    return [];
  }

  return (data || []).map(item => ({
    time: item.recorded_at,
    price: item.price
  })).reverse();
}

/**
 * Initialize market data for all assets
 */
export async function initializeMarketData(): Promise<void> {
  const assets = ['BTC', 'ETH', 'SOL', 'MON'];
  const initialPrices = {
    BTC: 65000,
    ETH: 3500,
    SOL: 150,
    MON: 0.02
  };

  for (const symbol of assets) {
    const { error } = await supabase
      .from('market_data')
      .upsert({
        symbol: symbol as any,
        price: initialPrices[symbol as keyof typeof initialPrices],
        trend: 'FLAT',
        last_change_pct: 0,
        long_earnings_per_second: 0,
        short_earnings_per_second: 0,
        total_long_staked: 0,
        total_short_staked: 0
      }, {
        onConflict: 'symbol'
      });

    if (error) {
      console.error(`Error initializing ${symbol} market data:`, error);
    }
  }
}

/**
 * Cleanup function to be called on app unmount
 */
export function cleanupMarketData() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  forceFlushMarketUpdates();
}
