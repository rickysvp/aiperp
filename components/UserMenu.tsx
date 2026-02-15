import React, { useState, useRef, useEffect } from 'react';
import { Wallet as WalletIcon, FileText, LogOut, Copy, Coins } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

interface UserMenuProps {
  wallet: {
    balance: number; // MON balance
    monBalance: number; // MON balance
    energy: number;
    referralCode?: string;
    referralCount?: number;
    referralEarnings?: number;
  };
  agents: any[];
  onLogout: () => void;
  onShowLegal: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ wallet, agents, onLogout, onShowLegal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { wallet: walletState, disconnect } = useWallet();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    disconnect();
    onLogout();
    setIsOpen(false);
  };

  // Format address to show first 6 and last 4 characters
  const formatAddress = (address: string | undefined) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get wallet address
  const evmAddress = walletState.address;

  return (
    <div className="relative" ref={menuRef}>
      {/* Top Bar Display - Show Total Balance */}
      <div className="flex items-center gap-2">
        {/* Total Balance Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-[#1a1d2d] hover:bg-[#252a3d] border border-white/10 rounded-xl transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#836EF9] to-[#00FF9D] flex items-center justify-center">
            <WalletIcon size={12} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-white">
              {((wallet.monBalance || 0) + (wallet.balance || 0)).toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">MON</span>
          </div>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1d2d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          {/* Wallet Address Section */}
          <div className="p-4">
            {/* EVM Wallet */}
            {evmAddress && (
              <div className="flex items-center justify-between p-3 bg-[#0f111a] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#836EF9] to-[#00FF9D] flex items-center justify-center">
                    <WalletIcon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Monad Testnet</p>
                    <p className="text-sm font-mono font-bold text-white">{formatAddress(evmAddress)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleCopy(evmAddress)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Copy size={16} className={copied ? "text-green-400" : "text-slate-400"} />
                </button>
              </div>
            )}
          </div>

          {/* Total Balance Section */}
          <div className="px-4 pb-4">
            <div className="p-4 bg-gradient-to-br from-[#836EF9]/20 to-[#6c56e0]/10 border border-[#836EF9]/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">总资产余额</span>
                <span className="text-[10px] text-[#836EF9]">MON</span>
              </div>
              <p className="text-2xl font-mono font-bold text-white">
                {((wallet.monBalance || 0) + (wallet.balance || 0)).toLocaleString()} <span className="text-sm font-normal text-slate-400">MON</span>
              </p>
              <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">可用余额 (Gas & Mint)</span>
                  <span className="text-slate-300 font-mono">{(wallet.monBalance || 0).toLocaleString()} MON</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">交易保证金</span>
                  <span className="text-slate-300 font-mono">{(wallet.balance || 0).toLocaleString()} MON</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10" />

          {/* Menu Items - Only Legal & Privacy */}
          <div className="p-2">
            <button 
              onClick={onShowLegal}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left"
            >
              <FileText size={18} className="text-slate-400" />
              <span className="text-sm font-medium text-white">Legal & Privacy</span>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10" />

          {/* Logout */}
          <div className="p-2">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 rounded-xl transition-colors text-left"
            >
              <LogOut size={18} className="text-red-400" />
              <span className="text-sm font-medium text-red-400">Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
