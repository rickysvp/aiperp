import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WalletState } from '../types';
import { getOrCreateUser, updateUserBalance, updateUserPnL } from '../lib/api/users';
import { isSupabaseConfigured } from '../lib/supabase';

interface WalletContextType {
  wallet: WalletState;
  isConnected: boolean;
  isConnecting: boolean;
  userId: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateBalance: (delta: number) => void;
  updateMonBalance: (delta: number) => void;
  updatePnl: (delta: number) => void;
  swapMonToUsdc: (monAmount: number) => number;
  swapUsdcToMon: (usdcAmount: number) => number;
  refreshWallet: () => Promise<void>;
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

  // Generate random wallet address
  const generateAddress = () => {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  };

  // Load wallet from localStorage on mount
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

  // Save wallet state to localStorage
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
    
    // Simulate wallet generation process
    await new Promise(resolve => setTimeout(resolve, 600));
    await new Promise(resolve => setTimeout(resolve, 500));
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const address = generateAddress();
    console.log('[Wallet] Generated address:', address);
    
    // Create or get user from Supabase
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
      } else {
        console.warn('[Wallet] Failed to create/get user from Supabase, using local state');
        // Fallback to local state if Supabase fails
        setWallet(prev => ({ ...prev, address }));
      }
    } else {
      console.warn('[Wallet] Supabase not configured, using local state');
      setWallet(prev => ({ ...prev, address }));
    }
    
    setIsConnected(true);
    setIsConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setWallet(INITIAL_WALLET);
    setUserId(null);
    localStorage.removeItem('aiperp_wallet');
    localStorage.removeItem('aiperp_connected');
    localStorage.removeItem('aiperp_user_id');
  }, []);

  const refreshWallet = useCallback(async () => {
    if (!userId || !isSupabaseConfigured()) return;
    
    const { getUserByWalletAddress } = await import('../lib/api/users');
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
    setWallet(prev => ({
      ...prev,
      balance: Math.max(0, prev.balance + delta)
    }));
    
    if (userId && isSupabaseConfigured()) {
      await updateUserBalance(userId, 0, delta);
    }
  }, [userId]);

  const updateMonBalance = useCallback(async (delta: number) => {
    setWallet(prev => ({
      ...prev,
      monBalance: Math.max(0, prev.monBalance + delta)
    }));
    
    if (userId && isSupabaseConfigured()) {
      await updateUserBalance(userId, delta, 0);
    }
  }, [userId]);

  const updatePnl = useCallback(async (delta: number) => {
    setWallet(prev => ({
      ...prev,
      totalPnl: prev.totalPnl + delta
    }));
    
    if (userId && isSupabaseConfigured()) {
      await updateUserPnL(userId, delta);
    }
  }, [userId]);

  // Swap MON to USDC - Rate: 1 MON = 0.02 USDC
  const swapMonToUsdc = useCallback(async (monAmount: number) => {
    const usdcAmount = monAmount * 0.02;
    setWallet(prev => ({
      ...prev,
      monBalance: Math.max(0, prev.monBalance - monAmount),
      balance: prev.balance + usdcAmount
    }));
    
    if (userId && isSupabaseConfigured()) {
      await updateUserBalance(userId, -monAmount, usdcAmount);
    }
    
    return usdcAmount;
  }, [userId]);

  // Swap USDC to MON - Rate: 1 USDC = 50 MON
  const swapUsdcToMon = useCallback(async (usdcAmount: number) => {
    const monAmount = usdcAmount * 50;
    setWallet(prev => ({
      ...prev,
      balance: Math.max(0, prev.balance - usdcAmount),
      monBalance: prev.monBalance + monAmount
    }));
    
    if (userId && isSupabaseConfigured()) {
      await updateUserBalance(userId, monAmount, -usdcAmount);
    }
    
    return monAmount;
  }, [userId]);

  return (
    <WalletContext.Provider value={{
      wallet,
      isConnected,
      isConnecting,
      userId,
      connect,
      disconnect,
      updateBalance,
      updateMonBalance,
      updatePnl,
      swapMonToUsdc,
      swapUsdcToMon,
      refreshWallet
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
