import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WalletState } from '../types';

interface WalletContextType {
  wallet: WalletState;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  updateBalance: (delta: number) => void;
  updatePnl: (delta: number) => void;
}

const INITIAL_WALLET: WalletState = {
  address: '',
  balance: 10000, // 初始 10,000 USDT
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

  // 从 localStorage 恢复钱包状态
  useEffect(() => {
    const savedWallet = localStorage.getItem('aiperp_wallet');
    const savedConnected = localStorage.getItem('aiperp_connected');
    
    if (savedWallet && savedConnected === 'true') {
      try {
        const parsed = JSON.parse(savedWallet);
        setWallet(prev => ({ ...prev, ...parsed }));
        setIsConnected(true);
      } catch (e) {
        console.error('Failed to restore wallet:', e);
      }
    }
  }, []);

  // 保存钱包状态到 localStorage
  useEffect(() => {
    if (isConnected) {
      localStorage.setItem('aiperp_wallet', JSON.stringify(wallet));
      localStorage.setItem('aiperp_connected', 'true');
    }
  }, [wallet, isConnected]);

  // 生成随机钱包地址
  const generateAddress = () => {
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  };

  const connect = useCallback(async () => {
    setIsConnecting(true);
    
    // 模拟连接延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const address = generateAddress();
    setWallet(prev => ({
      ...prev,
      address
    }));
    setIsConnected(true);
    setIsConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setWallet(INITIAL_WALLET);
    localStorage.removeItem('aiperp_wallet');
    localStorage.removeItem('aiperp_connected');
  }, []);

  const updateBalance = useCallback((delta: number) => {
    setWallet(prev => ({
      ...prev,
      balance: Math.max(0, prev.balance + delta)
    }));
  }, []);

  const updatePnl = useCallback((delta: number) => {
    setWallet(prev => ({
      ...prev,
      totalPnl: prev.totalPnl + delta
    }));
  }, []);

  return (
    <WalletContext.Provider value={{
      wallet,
      isConnected,
      isConnecting,
      connect,
      disconnect,
      updateBalance,
      updatePnl
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
