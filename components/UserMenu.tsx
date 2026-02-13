import React, { useState, useRef, useEffect } from 'react';
import { Wallet as WalletIcon, Settings, Gift, Download, FileText, LogOut, Copy, Zap, Users } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

interface UserMenuProps {
  wallet: {
    balance: number;
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

  // Format address to show first 4 and last 4 characters
  const formatAddress = (address: string | undefined) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Get wallet address
  const evmAddress = walletState.address;
  const userName = 'Trader';

  return (
    <div className="relative" ref={menuRef}>
      {/* Top Bar Display */}
      <div className="flex items-center gap-2">
        {/* Referral Earnings Button */}
        <button className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-colors">
          <Users size={16} className="text-blue-400" />
          <span className="text-sm font-bold text-white">${wallet.referralEarnings || 0}</span>
        </button>

        {/* Energy/Xp Display */}
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-xl">
          <Zap size={16} className="text-green-400" fill="currentColor" />
          <span className="text-sm font-bold text-white">{wallet.energy || 0} XP</span>
        </div>

        {/* Main Wallet Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-[#1a1d2d] hover:bg-[#252a3d] border border-white/10 rounded-xl transition-colors"
        >
          <span className="text-sm font-bold text-white">{userName}</span>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#836EF9] to-[#00FF9D] flex items-center justify-center">
              <WalletIcon size={12} className="text-white" />
            </div>
            {evmAddress && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center -ml-2 border-2 border-[#1a1d2d]">
                <span className="text-[8px] font-bold text-white">S</span>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1d2d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          {/* Wallet Addresses Section */}
          <div className="p-4 space-y-3">
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

            {/* Solana Wallet (placeholder) */}
            <div className="flex items-center justify-between p-3 bg-[#0f111a] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
                  <span className="text-lg font-bold text-white">S</span>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Solana</p>
                  <p className="text-sm font-mono font-bold text-white">Not Connected</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-[#836EF9]/20 hover:bg-[#836EF9]/30 text-[#836EF9] text-xs font-bold rounded-lg transition-colors">
                Connect
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10" />

          {/* Menu Items */}
          <div className="p-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left">
              <Settings size={18} className="text-slate-400" />
              <span className="text-sm font-medium text-white">Settings</span>
            </button>

            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left">
              <div className="flex items-center gap-3">
                <Gift size={18} className="text-slate-400" />
                <span className="text-sm font-medium text-white">Invite friends</span>
              </div>
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-lg flex items-center gap-1">
                <Zap size={12} fill="currentColor" /> Earn XP
              </span>
            </button>

            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-left">
              <div className="flex items-center gap-3">
                <Download size={18} className="text-slate-400" />
                <span className="text-sm font-medium text-white">Download mobile app</span>
              </div>
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg">
                New
              </span>
            </button>

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
