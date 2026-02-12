import { AssetSymbol } from '../types';

// Binance API endpoints
const BINANCE_REST_API = 'https://api.binance.com/api/v3';
const BINANCE_WS_STREAM = 'wss://stream.binance.com:9443/ws';

// Symbol mapping from our internal format to Binance format
const SYMBOL_MAP: Record<AssetSymbol, string> = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'SOL': 'SOLUSDT',
  'MON': 'MONUSDT', // $MON is not on Binance, will use simulated price
};

// $MON simulated price config
const MON_CONFIG = {
  basePrice: 0.5, // $0.5 USD
  volatility: 0.02, // 2% volatility
};

// Types
export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
  change24h: number;
}

// REST API - Get current price
export const fetchCurrentPrice = async (symbol: AssetSymbol): Promise<number> => {
  // For MON, return simulated price
  if (symbol === 'MON') {
    return getSimulatedMONPrice();
  }
  
  try {
    const binanceSymbol = SYMBOL_MAP[symbol];
    const response = await fetch(`${BINANCE_REST_API}/ticker/price?symbol=${binanceSymbol}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('Error fetching price from Binance:', error);
    throw error;
  }
};

// REST API - Get 24h statistics
export const fetch24hStats = async (symbol: AssetSymbol) => {
  // For MON, return simulated stats
  if (symbol === 'MON') {
    const price = getSimulatedMONPrice();
    return {
      price,
      change24h: (Math.random() - 0.5) * 10, // Random -5% to +5%
      high24h: price * 1.05,
      low24h: price * 0.95,
      volume24h: Math.random() * 1000000,
    };
  }
  
  try {
    const binanceSymbol = SYMBOL_MAP[symbol];
    const response = await fetch(`${BINANCE_REST_API}/ticker/24hr?symbol=${binanceSymbol}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
    };
  } catch (error) {
    console.error('Error fetching 24h stats from Binance:', error);
    throw error;
  }
};

// Simulated $MON price generator
let monCurrentPrice = MON_CONFIG.basePrice;
let monPriceInterval: NodeJS.Timeout | null = null;
let monSubscribers: ((price: number, change24h: number) => void)[] = [];

const getSimulatedMONPrice = (): number => {
  return monCurrentPrice;
};

const startMONSimulation = () => {
  if (monPriceInterval) return; // Already running
  
  console.log('[PriceService] Starting $MON price simulation');
  
  monPriceInterval = setInterval(() => {
    // Random walk with mean reversion
    const change = (Math.random() - 0.5) * MON_CONFIG.volatility;
    monCurrentPrice = monCurrentPrice * (1 + change);
    
    // Mean reversion to base price
    const meanReversion = (MON_CONFIG.basePrice - monCurrentPrice) * 0.01;
    monCurrentPrice = monCurrentPrice + meanReversion;
    
    // Keep price in reasonable range
    monCurrentPrice = Math.max(0.1, Math.min(2.0, monCurrentPrice));
    
    // Notify subscribers
    const change24h = (monCurrentPrice - MON_CONFIG.basePrice) / MON_CONFIG.basePrice * 100;
    monSubscribers.forEach(cb => cb(monCurrentPrice, change24h));
  }, 1000); // Update every second
};

const stopMONSimulation = () => {
  if (monPriceInterval) {
    clearInterval(monPriceInterval);
    monPriceInterval = null;
    console.log('[PriceService] Stopping $MON price simulation');
  }
  monSubscribers = [];
};

// WebSocket subscription for real-time price
export const subscribePrice = (
  symbol: AssetSymbol,
  onUpdate: (price: number, change24h: number) => void,
  onError?: (error: Error) => void
): (() => void) => {
  // For MON, use simulated price
  if (symbol === 'MON') {
    console.log('[PriceService] Subscribing to simulated $MON price');
    
    // Add subscriber
    monSubscribers.push(onUpdate);
    
    // Start simulation if not running
    startMONSimulation();
    
    // Send initial price
    onUpdate(monCurrentPrice, 0);
    
    // Return cleanup function
    return () => {
      console.log('[PriceService] Unsubscribing from $MON price');
      monSubscribers = monSubscribers.filter(cb => cb !== onUpdate);
      if (monSubscribers.length === 0) {
        stopMONSimulation();
      }
    };
  }
  
  // For other assets, use Binance WebSocket
  const binanceSymbol = SYMBOL_MAP[symbol].toLowerCase();
  const wsUrl = `${BINANCE_WS_STREAM}/${binanceSymbol}@ticker`;
  
  console.log(`[PriceService] Connecting to ${wsUrl}`);
  
  const ws = new WebSocket(wsUrl);
  let isActive = true;
  
  ws.onopen = () => {
    if (isActive) {
      console.log(`[PriceService] Connected to ${symbol}`);
    }
  };
  
  ws.onmessage = (event) => {
    if (!isActive) return;
    
    try {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.c);
      const change24h = parseFloat(data.P);
      onUpdate(price, change24h);
    } catch (error) {
      console.error('[PriceService] Parse error:', error);
    }
  };
  
  ws.onerror = (error) => {
    if (isActive && onError) {
      onError(new Error('WebSocket error'));
    }
  };
  
  ws.onclose = () => {
    console.log(`[PriceService] Disconnected from ${symbol}`);
  };
  
  // Return cleanup function
  return () => {
    console.log(`[PriceService] Cleaning up ${symbol}`);
    isActive = false;
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  };
};
