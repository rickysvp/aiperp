import React, { useState } from 'react';
import { XCircle, ArrowUpDown, Wallet, Coins } from 'lucide-react';
import { WalletState } from '../types';
import { useWallet } from '../contexts/WalletContext';
import { formatNumber } from '../utils/financialUtils';

interface SwapModalProps {
  wallet: WalletState;
  onClose: () => void;
}

export const SwapModal: React.FC<SwapModalProps> = ({ wallet, onClose }) => {
  const [fromToken, setFromToken] = useState<'MON' | 'USDC'>('MON');
  const [amount, setAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const { swapMonToUsdc, swapUsdcToMon } = useWallet();

  // Exchange rate: 1 MON = 0.02 USDC, 1 USDC = 50 MON
  const getExchangeRate = () => {
    return fromToken === 'MON' ? 0.02 : 50;
  };

  const getExpectedOutput = () => {
    const inputAmount = parseFloat(amount) || 0;
    const rate = getExchangeRate();
    return inputAmount * rate;
  };

  const getBalance = () => {
    return fromToken === 'MON' ? wallet.monBalance : wallet.balance;
  };

  const handleSwap = async () => {
    const inputAmount = parseFloat(amount);
    if (inputAmount <= 0 || inputAmount > getBalance()) return;

    setIsSwapping(true);
    
    // Simulate swap delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (fromToken === 'MON') {
      swapMonToUsdc(inputAmount);
    } else {
      swapUsdcToMon(inputAmount);
    }
    
    setIsSwapping(false);
    setAmount('');
    onClose();
  };

  const switchTokens = () => {
    setFromToken(fromToken === 'MON' ? 'USDC' : 'MON');
    setAmount('');
  };

  const toToken = fromToken === 'MON' ? 'USDC' : 'MON';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f111a] border border-[#836EF9]/30 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
            <ArrowUpDown size={18} className="text-[#836EF9]" /> Swap
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <XCircle size={20} />
          </button>
        </div>

        {/* Exchange Rate Info */}
        <div className="mb-6 p-3 bg-[#836EF9]/10 border border-[#836EF9]/30 rounded-xl">
          <p className="text-xs text-slate-400 text-center">Exchange Rate</p>
          <p className="text-sm font-bold text-white text-center">
            1 MON = 0.02 USDC
          </p>
          <p className="text-xs text-slate-500 text-center mt-1">
            1 USDC = 50 MON
          </p>
        </div>

        {/* From Token */}
        <div className="mb-4 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">From</span>
            <span className="text-xs text-slate-400">
              Balance: {formatNumber(getBalance())} {fromToken}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              fromToken === 'MON' 
                ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                : 'bg-gradient-to-br from-green-500 to-emerald-500'
            }`}>
              {fromToken === 'MON' ? (
                <span className="text-xs font-bold text-white">MON</span>
              ) : (
                <Coins size={16} className="text-white" />
              )}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-slate-600"
            />
            <button
              onClick={() => setAmount(getBalance().toString())}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 rounded"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={switchTokens}
            className="p-2 bg-[#1a1d2d] border border-slate-700 rounded-full hover:bg-[#252a3d] hover:border-[#836EF9] transition-all"
          >
            <ArrowUpDown size={16} className="text-[#836EF9]" />
          </button>
        </div>

        {/* To Token */}
        <div className="mt-2 mb-6 p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">To</span>
            <span className="text-xs text-slate-400">
              Balance: {formatNumber(toToken === 'MON' ? wallet.monBalance : wallet.balance)} {toToken}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              toToken === 'MON' 
                ? 'bg-gradient-to-br from-purple-500 to-indigo-500' 
                : 'bg-gradient-to-br from-green-500 to-emerald-500'
            }`}>
              {toToken === 'MON' ? (
                <span className="text-xs font-bold text-white">MON</span>
              ) : (
                <Coins size={16} className="text-white" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-white">
                {amount ? formatNumber(getExpectedOutput()) : '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > getBalance() || isSwapping}
          className="w-full py-4 bg-gradient-to-r from-[#836EF9] to-[#6c56e0] hover:shadow-[0_0_20px_rgba(131,110,249,0.5)] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSwapping ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Swapping...
            </>
          ) : (
            <>
              <ArrowUpDown size={18} />
              Swap {fromToken} to {toToken}
            </>
          )}
        </button>

        {/* Info */}
        <p className="mt-4 text-xs text-slate-500 text-center">
          MON is used for gas and minting agents. USDC is used for trading.
        </p>
      </div>
    </div>
  );
};
