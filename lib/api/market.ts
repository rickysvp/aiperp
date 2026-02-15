import { supabase } from '../supabase';
import type { Database } from '../database.types';

export type MarketData = Database['public']['Tables']['market_data']['Row'];
export type MarketDataInsert = Database['public']['Tables']['market_data']['Insert'];
export type MarketDataUpdate = Database['public']['Tables']['market_data']['Update'];

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
    console.error('Error fetching market data:', error);
    return null;
  }

  return data;
}

/**
 * Update market data
 */
export async function updateMarketData(
  symbol: string,
  updates: MarketDataUpdate
): Promise<MarketData | null> {
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
}

/**
 * Record price history
 */
export async function recordPriceHistory(symbol: string, price: number): Promise<void> {
  const { error } = await supabase
    .from('market_price_history')
    .insert({
      symbol: symbol as any,
      price
    });

  if (error) {
    console.error('Error recording price history:', error);
  }
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
    MON: 1
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
