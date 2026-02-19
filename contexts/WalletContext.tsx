import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WalletState } from '../types';
import { UserLiquidityStake } from '../lib/api/liquidity';
import { getOrCreateUser, updateUserBalance, updateUserPnL, getUserByWalletAddress } from '../lib/api/users';
import { getUserLiquidityStakes } from '../lib/api/liquidity';
import { isSupabaseConfigured } from '../lib/supabase';

interface WalletContextType {
  wallet: WalletState;
  isConnected: boolean;
  isConnecting: boolean;
  userId: string | null;
  userStake: UserLiquidityStake | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateBalance: (delta: number) => Promise<void>;
  updateMonBalance: (delta: number) => Promise<void>;
  updatePnl: (delta: number) => Promise<void>;
  swapMonToUsdc: (monAmount: number) => Promise<number>;
  swapUsdcToMon: (usdcAmount: number) => Promise<number>;
  refreshWallet: () => Promise<void>;
  refreshUserStake: () => Promise<void>;
}

import { INITIAL_BALANCE, INITIAL_MON_BALANCE } from '../constants';

const INITIAL_WALLET: WalletState = {
  address: '',
  balance: 0,
  monBalance: INITIAL_MON_BALANCE,
  totalPnl: 0,
  referralEarnings: 0,
  referralCount: 0,
  energy: 0,
  totalEnergyEarned: 0
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>(INITIAL_WALLET);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userStake, setUserStake] = useState<UserLiquidityStake | null>(null);
  const pendingUpdatesRef = useRef<Array<{ type: 'balance' | 'monBalance' | 'pnl'; delta: number }>>([]);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);

  const generateAddress = () => {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  };

  const flushPendingUpdates = useCallback(async () => {
    if (!userId || !isSupabaseConfigured() || pendingUpdatesRef.current.length === 0) return;

    const updates = [...pendingUpdatesRef.current];
    pendingUpdatesRef.current = [];

    try {
      let monDelta = 0;
      let usdcDelta = 0;
      let pnlDelta = 0;

      for (const update of updates) {
        if (update.type === 'monBalance') monDelta += update.delta;
        else if (update.type === 'balance') usdcDelta += update.delta;
        else if (update.type === 'pnl') pnlDelta += update.delta;
      }

      if (monDelta !== 0 || usdcDelta !== 0) {
        await updateUserBalance(userId, monDelta, usdcDelta);
      }
      if (pnlDelta !== 0) {
        await updateUserPnL(userId, pnlDelta);
      }
    } catch (err) {
      console.error('Error flushing pending wallet updates:', err);
      pendingUpdatesRef.current = [...updates, ...pendingUpdatesRef.current];
    }
  }, [userId]);

  const refreshUserStake = useCallback(async () => {
    if (!userId || !isSupabaseConfigured()) return;
    
    const stakes = await getUserLiquidityStakes(userId);
    if (stakes && stakes.length > 0) {
      setUserStake(stakes[0]);
    } else {
      setUserStake(null);
    }
  }, [userId]);

  useEffect(() => {
    flushTimerRef.current = setInterval(flushPendingUpdates, 2000);
    return () => {
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
      }
    };
  }, [flushPendingUpdates]);

  useEffect(() => {
    const savedWallet = localStorage.getItem('aiperp_wallet');
    const savedConnected = localStorage.getItem('aiperp_connected');
    const savedUserId = localStorage.getItem('aiperp_user_id');
    
    if (savedWallet && savedConnected === 'true') {
      try {
        const parsed = JSON.parse(savedWallet);
        setWallet(prev => ({ ...prev, ...parsed }));
        setIsConnected(true);
        if (savedUserId) {
          setUserId(savedUserId);
        }
      } catch (e) {
        console.error('Failed to restore wallet:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      localStorage.setItem('aiperp_wallet', JSON.stringify(wallet));
      localStorage.setItem('aiperp_connected', 'true');
      if (userId) {
        localStorage.setItem('aiperp_user_id', userId);
      }
    }
  }, [wallet, isConnected, userId]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    await new Promise(resolve => setTimeout(resolve, 500));
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const savedAddress = localStorage.getItem('aiperp_wallet_address');
    const address = savedAddress || generateAddress();
    
    if (!savedAddress) {
      localStorage.setItem('aiperp_wallet_address', address);
    }
    
    console.log('[Wallet] Using address:', address, savedAddress ? '(restored)' : '(new)');
    
    const supabaseReady = isSupabaseConfigured();
    console.log('[Wallet] Supabase configured:', supabaseReady);
    
    if (supabaseReady) {
      console.log('[Wallet] Calling getOrCreateUser...');
      const user = await getOrCreateUser(address);
      console.log('[Wallet] getOrCreateUser result:', user);
      
      if (user) {
        console.log('[Wallet] User created/found:', user.id);
        setUserId(user.id);
        setWallet({
          address: user.wallet_address,
          balance: user.usdc_balance,
          monBalance: user.mon_balance,
          totalPnl: user.total_pnl,
          referralEarnings: user.referral_earnings,
          referralCount: user.referral_count,
          energy: user.energy,
          totalEnergyEarned: user.total_energy_earned
        });
        
        await refreshUserStake();
      } else {
        console.warn('[Wallet] Failed to create/get user from Supabase, using local state');
        setWallet(prev => ({ ...prev, address }));
      }
    } else {
      console.warn('[Wallet] Supabase not configured, using local state');
      setWallet(prev => ({ ...prev, address }));
    }
    
    setIsConnected(true);
    setIsConnecting(false);
  }, [refreshUserStake]);

  const disconnect = useCallback(() => {
    flushPendingUpdates();
    setIsConnected(false);
    setWallet(INITIAL_WALLET);
    setUserId(null);
    setUserStake(null);
    pendingUpdatesRef.current = [];
    localStorage.removeItem('aiperp_wallet');
    localStorage.removeItem('aiperp_connected');
    localStorage.removeItem('aiperp_user_id');
    localStorage.removeItem('aiperp_wallet_address');
  }, [flushPendingUpdates]);

  const refreshWallet = useCallback(async () => {
    if (!userId || !isSupabaseConfigured()) return;
    
    const user = await getUserByWalletAddress(wallet.address);
    if (user) {
      setWallet({
        address: user.wallet_address,
        balance: user.usdc_balance,
        monBalance: user.mon_balance,
        totalPnl: user.total_pnl,
        referralEarnings: user.referral_earnings,
        referralCount: user.referral_count,
        energy: user.energy,
        totalEnergyEarned: user.total_energy_earned
      });
    }
  }, [userId, wallet.address]);

  const updateBalance = useCallback(async (delta: number) => {
    const newBalance = Math.max(0, wallet.balance + delta);
    setWallet(prev => ({
      ...prev,
      balance: newBalance
    }));
    
    if (userId && isSupabaseConfigured()) {
      pendingUpdatesRef.current.push({ type: 'balance', delta });
    }
  }, [wallet.balance, userId]);

  const updateMonBalance = useCallback(async (delta: number) => {
    const newMonBalance = Math.max(0, wallet.monBalance + delta);
    setWallet(prev => ({
      ...prev,
      monBalance: newMonBalance
    }));
    
    if (userId && isSupabaseConfigured()) {
      pendingUpdatesRef.current.push({ type: 'monBalance', delta });
    }
  }, [wallet.monBalance, userId]);

  const updatePnl = useCallback(async (delta: number) => {
    setWallet(prev => ({
      ...prev,
      totalPnl: prev.totalPnl + delta
    }));
    
    if (userId && isSupabaseConfigured()) {
      pendingUpdatesRef.current.push({ type: 'pnl', delta });
    }
  }, [userId]);

  const swapMonToUsdc = useCallback(async (monAmount: number) => {
    const usdcAmount = monAmount * 0.02;
    setWallet(prev => ({
      ...prev,
      monBalance: Math.max(0, prev.monBalance - monAmount),
      balance: prev.balance + usdcAmount
    }));
    
    if (userId && isSupabaseConfigured()) {
      pendingUpdatesRef.current.push({ type: 'monBalance', delta: -monAmount });
      pendingUpdatesRef.current.push({ type: 'balance', delta: usdcAmount });
    }
    
    return usdcAmount;
  }, [userId]);

  const swapUsdcToMon = useCallback(async (usdcAmount: number) => {
    const monAmount = usdcAmount * 50;
    setWallet(prev => ({
      ...prev,
      balance: Math.max(0, prev.balance - usdcAmount),
      monBalance: prev.monBalance + monAmount
    }));
    
    if (userId && isSupabaseConfigured()) {
      pendingUpdatesRef.current.push({ type: 'balance', delta: -usdcAmount });
      pendingUpdatesRef.current.push({ type: 'monBalance', delta: monAmount });
    }
    
    return monAmount;
  }, [userId]);

  return (
    <WalletContext.Provider value={{
      wallet,
      isConnected,
      isConnecting,
      userId,
      userStake,
      connect,
      disconnect,
      updateBalance,
      updateMonBalance,
      updatePnl,
      swapMonToUsdc,
      swapUsdcToMon,
      refreshWallet,
      refreshUserStake
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
