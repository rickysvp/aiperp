import React, { useState, useMemo, useEffect } from 'react';
import { WalletState, Agent, BattleLog } from '../types';
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  History,
  LogOut,
  Copy,
  Share2,
  Download,
  Upload,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Zap,
  Gift,
  XCircle,
  AlertCircle,
  Info,
  ChevronRight,
  Sword,
  LayoutDashboard,
  TrendingUp as TrendingUpIcon,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Wallet2,
  Coins,
  Link as LinkIcon,
  CircleDollarSign,
  ArrowUp,
  ArrowDown,
  ArrowLeftRight,
  FileText,
  Settings,
  CheckCircle2,
  Eye,
  EyeOff,
  Link2,
  Users,
  Percent,
  TrendingUpDown
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import {
  calculateAssetBreakdown,
  calculatePositionMetrics,
  formatNumber,
  formatUSDT,
  formatPercentage,
  maskNumber,
  getValueColor,
  validateWithdrawal,
  safeMultiply,
} from '../utils/financialUtils';

interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'MINT' | 'DEPLOY' | 'EXIT' | 'REFERRAL' | 'TRADE_PROFIT' | 'TRADE_LOSS';
  amount: number;
  timestamp: number;
  description: string;
  agentName?: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

interface WalletV2Props {
  wallet: WalletState;
  agents: Agent[];
  logs: BattleLog[];
  onLogout?: () => void;
  onShowLegal?: () => void;
  onDeposit?: (amount: number) => void;
  onWithdrawToExternal?: (amount: number, address: string) => void;
  referralCode: string;
  referralCount: number;
  referralEarnings: number;
}

const generateMockTransactions = (wallet: WalletState, agents: Agent[]): Transaction[] => {
  const txs: Transaction[] = [];
  
  txs.push({
    id: 'tx-001',
    type: 'DEPOSIT',
    amount: 10000,
    timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
    description: 'Initial deposit',
    status: 'COMPLETED'
  });

  agents.forEach((agent, idx) => {
    txs.push({
      id: `tx-mint-${idx}`,
      type: 'MINT',
      amount: -100,
      timestamp: Date.now() - (20 - idx) * 24 * 60 * 60 * 1000,
      description: `Minted ${agent.name}`,
      agentName: agent.name,
      status: 'COMPLETED'
    });

    if (agent.status === 'ACTIVE' || agent.status === 'LIQUIDATED') {
      txs.push({
        id: `tx-deploy-${idx}`,
        type: 'DEPLOY',
        amount: -agent.balance,
        timestamp: Date.now() - (19 - idx) * 24 * 60 * 60 * 1000,
        description: `Deployed ${agent.name}`,
        agentName: agent.name,
        status: 'COMPLETED'
      });
    }

    if (agent.pnl !== 0) {
      txs.push({
        id: `tx-pnl-${idx}`,
        type: agent.pnl > 0 ? 'TRADE_PROFIT' : 'TRADE_LOSS',
        amount: agent.pnl,
        timestamp: Date.now() - (10 - idx) * 24 * 60 * 60 * 1000,
        description: `${agent.name} ${agent.pnl > 0 ? 'profit' : 'loss'}`,
        agentName: agent.name,
        status: 'COMPLETED'
      });
    }
  });

  if (wallet.referralEarnings > 0) {
    txs.push({
      id: 'tx-ref',
      type: 'REFERRAL',
      amount: wallet.referralEarnings,
      timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
      description: 'Referral rewards',
      status: 'COMPLETED'
    });
  }

  return txs.sort((a, b) => b.timestamp - a.timestamp);
};

export const WalletV2: React.FC<WalletV2Props> = ({
  wallet,
  agents,
  logs,
  onLogout,
  onShowLegal,
  onDeposit,
  onWithdrawToExternal,
  referralCode,
  referralCount,
  referralEarnings
}) => {
  const { t } = useLanguage();
  const { primaryWallet } = useDynamicContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'analytics'>('overview');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [hideBalance, setHideBalance] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // ==================== Unified Asset Calculations ====================
  const userAgents = useMemo(() => agents.filter(a => a.owner === 'USER'), [agents]);
  const activeUserAgents = userAgents.filter(a => a.status === 'ACTIVE');

  // Calculate asset breakdown using unified system
  const agentBalances = activeUserAgents.map(a => a.balance);
  const assetBreakdown = useMemo(() => 
    calculateAssetBreakdown(wallet.balance, agentBalances),
    [wallet.balance, agentBalances]
  );

  // Destructure for convenience
  const { 
    walletBalance: liquid, 
    stakedAmount: totalAllocated, 
    totalEquity, 
    isOverAllocated 
  } = assetBreakdown;

  // Calculate position metrics
  const longAlloc = activeUserAgents.filter(a => a.direction === 'LONG').reduce((acc, c) => acc + c.balance, 0);
  const shortAlloc = activeUserAgents.filter(a => a.direction === 'SHORT').reduce((acc, c) => acc + c.balance, 0);
  const autoAlloc = activeUserAgents.filter(a => a.direction === 'AUTO').reduce((acc, c) => acc + c.balance, 0);
  
  const positionMetrics = useMemo(() => 
    calculatePositionMetrics(longAlloc, shortAlloc, autoAlloc),
    [longAlloc, shortAlloc, autoAlloc]
  );

  // Calculate total PnL
  const totalPnl = userAgents.reduce((acc, a) => acc + a.pnl, 0);

  // Calculate Energy: +1 energy per $10 profit, +2 energy per $10 loss
  const energyFromProfit = Math.floor(Math.max(0, totalPnl) / 10) * 1;
  const energyFromLoss = Math.floor(Math.max(0, -totalPnl) / 10) * 2;
  const calculatedEnergy = energyFromProfit + energyFromLoss;
  const currentEnergy = wallet.energy || calculatedEnergy;
  const totalEnergy = wallet.totalEnergyEarned || calculatedEnergy;

  const transactions = useMemo(() => generateMockTransactions(wallet, userAgents), [wallet, userAgents]);

  // Generate real PnL & Equity data from userAgents
  const pnlHistoryData = useMemo(() => {
    // Collect all pnlHistory from all user agents
    const allHistory: { time: string; pnl: number; equity: number }[] = [];
    
    // Get unique time points from all agents
    const timePoints = new Set<string>();
    userAgents.forEach(agent => {
      agent.pnlHistory?.forEach(h => timePoints.add(h.time));
    });
    
    // Sort time points
    const sortedTimes = Array.from(timePoints).sort();
    
    // Calculate cumulative PnL and Equity for each time point
    sortedTimes.forEach((time, index) => {
      let totalPnlAtTime = 0;
      let totalEquityAtTime = wallet.balance;
      
      userAgents.forEach(agent => {
        const historyPoint = agent.pnlHistory?.find(h => h.time === time);
        if (historyPoint) {
          totalPnlAtTime += historyPoint.value;
          totalEquityAtTime += agent.balance + historyPoint.value;
        } else if (index > 0) {
          // Use previous value if no data at this time point
          const prevPoint = allHistory[index - 1];
          if (prevPoint) {
            totalPnlAtTime += prevPoint.pnl;
            totalEquityAtTime += prevPoint.equity;
          }
        }
      });
      
      allHistory.push({
        time,
        pnl: totalPnlAtTime,
        equity: totalEquityAtTime
      });
    });
    
    // If no history data, generate from current PnL
    if (allHistory.length === 0) {
      const now = new Date();
      for (let i = 0; i <= 6; i++) {
        const hour = i * 4;
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        const progress = i / 6;
        const pnlAtTime = totalPnl * progress;
        allHistory.push({
          time: timeStr,
          pnl: pnlAtTime,
          equity: wallet.balance + totalAllocated + pnlAtTime
        });
      }
    }
    
    return allHistory;
  }, [userAgents, wallet.balance, totalAllocated, totalPnl]);

  const totalTrades = userAgents.reduce((acc, a) => acc + a.wins + a.losses, 0);
  const totalWins = userAgents.reduce((acc, a) => acc + a.wins, 0);
  const winRate = totalTrades > 0 ? ((totalWins / totalTrades) * 100).toFixed(1) : '0';
  const avgLeverage = activeUserAgents.length > 0
    ? (activeUserAgents.reduce((acc, a) => acc + a.leverage, 0) / activeUserAgents.length).toFixed(1)
    : '0';

  const getTxIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT': return <ArrowDown size={14} className="text-[#00FF9D]" />;
      case 'WITHDRAW': return <ArrowUp size={14} className="text-[#FF0055]" />;
      case 'MINT': return <Zap size={14} className="text-[#836EF9]" />;
      case 'DEPLOY': return <Target size={14} className="text-blue-400" />;
      case 'EXIT': return <LogOut size={14} className="text-slate-500" />;
      case 'REFERRAL': return <Gift size={14} className="text-amber-400" />;
      case 'TRADE_PROFIT': return <TrendingUp size={14} className="text-[#00FF9D]" />;
      case 'TRADE_LOSS': return <TrendingDown size={14} className="text-[#FF0055]" />;
      default: return <CircleDollarSign size={14} className="text-slate-400" />;
    }
  };

  const getTxBgColor = (type: Transaction['type']) => {
    switch (type) {
      case 'DEPOSIT': return 'bg-[#00FF9D]/10';
      case 'WITHDRAW': return 'bg-[#FF0055]/10';
      case 'MINT': return 'bg-[#836EF9]/10';
      case 'DEPLOY': return 'bg-blue-500/10';
      case 'EXIT': return 'bg-slate-500/10';
      case 'REFERRAL': return 'bg-amber-500/10';
      case 'TRADE_PROFIT': return 'bg-[#00FF9D]/10';
      case 'TRADE_LOSS': return 'bg-[#FF0055]/10';
      default: return 'bg-slate-500/10';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="max-w-6xl mx-auto h-full">
      {/* Top Section - Wallet Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Main Card - Available Balance Focus */}
        <div className="lg:col-span-2">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase flex items-center gap-2">
                <Wallet2 size={14} className="text-[#836EF9]" /> BALANCE ACCOUNT
              </h3>
            </div>

            {/* Balance Account - Primary Display */}
            <div className="mb-6">
              <div className="flex items-center justify-end mb-2">
                {isOverAllocated && (
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                    <AlertCircle size={10} />
                    Over-allocated
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-5xl lg:text-6xl font-bold text-white tracking-tight drop-shadow-lg">
                  {hideBalance ? maskNumber() : formatNumber(liquid)}
                </span>
                <span className="text-xl lg:text-2xl text-slate-400 font-medium">USDT</span>
              </div>
              <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9D]"></span>
                ≈ {hideBalance ? '****' : `$${formatNumber(liquid * 0.85)}`} USDT
              </p>
              {isOverAllocated && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-xs text-amber-400 flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>Your wallet balance is negative. Exit some Agents to restore available funds.</span>
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="group p-4 bg-gradient-to-br from-slate-900/80 to-slate-900/40 rounded-2xl border border-slate-800 hover:border-[#836EF9]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#836EF9]/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-[#836EF9]/20 flex items-center justify-center">
                    <Target size={12} className="text-[#836EF9]" />
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Active Agents</p>
                </div>
                <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{activeUserAgents.length}</p>
              </div>
              <div className="group p-4 bg-gradient-to-br from-slate-900/80 to-slate-900/40 rounded-2xl border border-slate-800 hover:border-[#00FF9D]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#00FF9D]/5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-[#00FF9D]/20 flex items-center justify-center">
                    <TrendingUp size={12} className="text-[#00FF9D]" />
                  </div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Equity</p>
                </div>
                <p className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{hideBalance ? maskNumber() : formatNumber(totalEquity)} <span className="text-xs text-slate-500">USDT</span></p>
              </div>
            </div>

            {/* PnL & ROI */}
            <div className="flex items-center gap-6 mb-5">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${totalPnl >= 0 ? 'bg-[#00FF9D]/20' : 'bg-[#FF0055]/20'}`}>
                  {totalPnl >= 0 ? <TrendingUp size={14} className="text-[#00FF9D]" /> : <TrendingDown size={14} className="text-[#FF0055]" />}
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">Total PnL</p>
                  <p className={`font-bold ${totalPnl >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                    {hideBalance ? maskNumber() : `${totalPnl >= 0 ? '+' : ''}${formatNumber(totalPnl)}`} USDT
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${totalPnl >= 0 ? 'bg-[#00FF9D]/20' : 'bg-[#FF0055]/20'}`}>
                  <Percent size={14} className={totalPnl >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase">ROI</p>
                  <p className={`font-bold ${totalPnl >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                    {totalEquity > 0 ? ((totalPnl / (totalEquity - totalPnl)) * 100).toFixed(2) : '0.00'}%
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-auto">
              <button
                onClick={() => setShowDepositModal(true)}
                className="group flex-1 py-3 px-4 bg-gradient-to-r from-[#00FF9D] to-[#00D48A] hover:from-[#00FF9D]/90 hover:to-[#00D48A]/90 text-black rounded-xl flex items-center justify-center gap-2 transition-all duration-300 text-sm font-semibold shadow-lg shadow-[#00FF9D]/20 hover:shadow-xl hover:shadow-[#00FF9D]/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Download size={16} className="group-hover:animate-bounce" /> 
                <span>Deposit</span>
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={liquid <= 0}
                className="group flex-1 py-3 px-4 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-white rounded-xl flex items-center justify-center gap-2 transition-all duration-300 text-sm font-semibold border border-slate-600 hover:border-slate-500 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Upload size={16} className="group-hover:-translate-y-0.5 transition-transform" /> 
                <span>Withdraw</span>
              </button>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="group flex-1 py-3 px-4 bg-gradient-to-r from-[#836EF9] to-[#6c56e0] hover:from-[#836EF9]/90 hover:to-[#6c56e0]/90 text-white rounded-xl flex items-center justify-center gap-2 transition-all duration-300 text-sm font-semibold shadow-lg shadow-[#836EF9]/20 hover:shadow-xl hover:shadow-[#836EF9]/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                <History size={16} className="group-hover:scale-110 transition-transform" /> 
                <span>History</span>
              </button>
            </div>
          </div>
        </div>

        {/* Agents Account Card */}
        <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-5 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase flex items-center gap-2">
              <PieChartIcon size={14} className="text-[#836EF9]" /> Agents Account
            </h3>
          </div>

          {/* Total Agents Assets */}
          <div className="mb-5 p-4 bg-gradient-to-br from-[#836EF9]/20 via-[#836EF9]/10 to-transparent rounded-2xl border border-[#836EF9]/30 hover:border-[#836EF9]/50 transition-all duration-300 group">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md bg-[#836EF9]/30 flex items-center justify-center">
                <Coins size={10} className="text-[#836EF9]" />
              </div>
              <p className="text-[10px] text-[#836EF9]/80 uppercase tracking-wider">Total Assets</p>
            </div>
            <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{hideBalance ? maskNumber() : formatNumber(totalAllocated)} <span className="text-base text-slate-400 font-medium">USDT</span></p>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <Info size={10} className="text-slate-600" />
              {totalAllocated > 0 ? 'Manual withdrawal required to reallocate' : 'No assets in Agents'}
            </p>
          </div>

          {/* Direction Allocation */}
          {totalAllocated > 0 ? (
            <div className="flex-1">
              {/* Combined Progress Bar */}
              <div className="mb-3">
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                  {longAlloc > 0 && (
                    <div 
                      className="h-full bg-[#00FF9D]"
                      style={{ width: `${(longAlloc/totalAllocated)*100}%` }}
                      title={`Long ${((longAlloc/totalAllocated)*100).toFixed(0)}%`}
                    />
                  )}
                  {shortAlloc > 0 && (
                    <div 
                      className="h-full bg-[#FF0055]"
                      style={{ width: `${(shortAlloc/totalAllocated)*100}%` }}
                      title={`Short ${((shortAlloc/totalAllocated)*100).toFixed(0)}%`}
                    />
                  )}
                  {autoAlloc > 0 && (
                    <div 
                      className="h-full bg-[#836EF9]"
                      style={{ width: `${(autoAlloc/totalAllocated)*100}%` }}
                      title={`Auto ${((autoAlloc/totalAllocated)*100).toFixed(0)}%`}
                    />
                  )}
                </div>
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-3 gap-2">
                {longAlloc > 0 && (
                  <div className="text-center p-2 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full bg-[#00FF9D]" />
                      <span className="text-xs text-slate-400">Long</span>
                    </div>
                    <p className="text-lg font-bold text-white">{hideBalance ? maskNumber() : formatNumber(longAlloc)}</p>
                    <p className="text-[10px] text-slate-500">{((longAlloc/totalAllocated)*100).toFixed(0)}%</p>
                  </div>
                )}
                {shortAlloc > 0 && (
                  <div className="text-center p-2 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full bg-[#FF0055]" />
                      <span className="text-xs text-slate-400">Short</span>
                    </div>
                    <p className="text-lg font-bold text-white">{hideBalance ? maskNumber() : formatNumber(shortAlloc)}</p>
                    <p className="text-[10px] text-slate-500">{((shortAlloc/totalAllocated)*100).toFixed(0)}%</p>
                  </div>
                )}
                {autoAlloc > 0 && (
                  <div className="text-center p-2 bg-slate-900/30 rounded-lg">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full bg-[#836EF9]" />
                      <span className="text-xs text-slate-400">Auto</span>
                    </div>
                    <p className="text-lg font-bold text-white">{hideBalance ? maskNumber() : formatNumber(autoAlloc)}</p>
                    <p className="text-[10px] text-slate-500">{((autoAlloc/totalAllocated)*100).toFixed(0)}%</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-3">
                <PieChartIcon size={20} className="text-slate-600" />
              </div>
              <p className="text-xs text-slate-500">No active Agents</p>
              <p className="text-[10px] text-slate-600 mt-1">Deploy Agents to start trading</p>
            </div>
          )}
          
          {/* Withdrawal Notice */}
          {totalAllocated > 0 && (
            <div className="mt-auto pt-3 border-t border-slate-800">
              <div className="flex items-start gap-2">
                <span className="text-amber-400 text-xs">*</span>
                <p className="text-[10px] text-slate-500">
                  Assets must be withdrawn from Agents before they can be reallocated
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row - Daily PnL & Equity Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Daily PnL */}
        <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase flex items-center gap-2">
                <TrendingUpDown size={14} className="text-[#836EF9]" /> Daily PnL
              </h3>
              <span className={`text-sm font-bold ${totalPnl >= 0 ? 'text-[#00FF9D]' : 'text-[#FF0055]'}`}>
                {totalPnl >= 0 ? '+' : ''}{formatNumber(totalPnl)} USDT
              </span>
            </div>
            <div className="flex gap-1">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    timeRange === range ? 'bg-[#836EF9] text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={pnlHistoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f111a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(value: number) => [`${value} USDT`, 'PnL']}
                />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {pnlHistoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#00FF9D' : '#FF0055'} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equity Chart */}
        <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase flex items-center gap-2">
                <TrendingUpIcon size={14} className="text-[#836EF9]" /> Equity
              </h3>
              <span className="text-sm font-bold text-white">
                {formatNumber(wallet.balance + totalAllocated + totalPnl)} USDT
              </span>
            </div>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlHistoryData}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#836EF9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#836EF9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f111a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                  formatter={(value: number) => [`${value} USDT`, 'Equity']}
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#836EF9" 
                  strokeWidth={1.5}
                  fill="url(#equityGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Referral Section */}
      <div className="mb-6">
        <div className="group bg-gradient-to-br from-[#0f111a] to-[#151825] border border-slate-800 hover:border-[#836EF9]/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-[#836EF9]/5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#836EF9] to-[#6c56e0] flex items-center justify-center shadow-lg shadow-[#836EF9]/20 group-hover:shadow-[#836EF9]/30 transition-shadow">
                <Gift size={18} className="text-white relative z-10" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#836EF9] to-[#6c56e0] opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Invite & Earn</h3>
                <p className="text-[10px] text-slate-500">Dual Rewards</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Invited Count */}
              <div className="text-right">
                <p className="text-xl font-bold text-[#836EF9] group-hover:scale-110 transition-transform">{referralCount}</p>
                <p className="text-[10px] text-slate-500">Friends Invited</p>
              </div>
              {/* Earnings */}
              <div className="text-right pl-4 border-l border-slate-700">
                <p className="text-xl font-bold text-[#00FF9D] group-hover:scale-110 transition-transform">+{formatNumber(referralEarnings)}</p>
                <p className="text-[10px] text-slate-500">USDT earned</p>
              </div>
            </div>
          </div>

          {/* Rewards Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500/10 to-transparent rounded-xl border border-amber-500/20">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Percent size={14} className="text-amber-400" />
              </div>
              <span className="text-xs text-slate-300">Earn <span className="text-amber-400 font-bold">10%</span> of friends' trading fees</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-500/10 to-transparent rounded-xl border border-amber-500/20">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Zap size={14} className="text-amber-400" />
              </div>
              <span className="text-xs text-slate-300">Both receive <span className="text-amber-400 font-bold">5%</span> energy boost</span>
            </div>
          </div>

          {/* Referral Link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative group/input">
              <input
                type="text"
                value={`aiperp.fun?ref=${referralCode || ''}`}
                readOnly
                className="w-full px-3 py-2.5 bg-slate-900 rounded-xl font-mono font-bold text-white tracking-[0.05em] text-center border border-slate-700 text-xs focus:outline-none focus:border-[#836EF9]/50 focus:shadow-[0_0_15px_rgba(131,110,249,0.1)] transition-all cursor-pointer"
                onClick={() => {
                  if (referralCode) {
                    navigator.clipboard.writeText(referralCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }
                }}
              />
              {copiedCode && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#00FF9D] text-[10px] bg-[#00FF9D]/10 px-2 py-1 rounded-lg">
                  <CheckCircle2 size={10} />
                  <span>Copied!</span>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                const link = `https://aiperp.fun?ref=${referralCode}`;
                navigator.clipboard.writeText(link);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="px-3 py-2.5 bg-gradient-to-r from-[#836EF9] to-[#6c56e0] hover:from-[#836EF9]/90 hover:to-[#6c56e0]/90 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all hover:shadow-lg hover:shadow-[#836EF9]/30 whitespace-nowrap"
            >
              <Link2 size={12} />
              <span className="hidden sm:inline">Copy Link</span>
              <span className="sm:hidden">Link</span>
            </button>
            <button
              onClick={() => {
                const text = `Join me on AIperp.fun! Use my code ${referralCode} and earn 10% lifetime commission! 🚀`;
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
              }}
              className="px-3 py-2.5 bg-gradient-to-r from-[#1DA1F2] to-[#1a91da] hover:from-[#1DA1F2]/90 hover:to-[#1a91da]/90 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all hover:shadow-lg hover:shadow-[#1DA1F2]/30 whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span className="hidden sm:inline">Share on X</span>
              <span className="sm:hidden">X</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Spacer for Tab Bar */}
      <div className="h-24"></div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-[#00FF9D]/30 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                <Download size={18} className="text-[#00FF9D]" /> Deposit
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-500 hover:text-white">
                <XCircle size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 mb-2">Your Wallet Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-white bg-black p-3 rounded-lg break-all">{primaryWallet?.address || wallet.address}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(primaryWallet?.address || wallet.address)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="p-3 bg-[#00FF9D]/10 border border-[#00FF9D]/30 rounded-lg text-xs text-[#00FF9D]">
                Send USDT tokens to this address
              </div>
              <button
                onClick={() => setShowDepositModal(false)}
                className="w-full py-3 bg-[#00FF9D] hover:bg-[#00FF9D]/90 text-black font-semibold rounded-xl"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-[#FF0055]/30 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                <Upload size={18} className="text-[#FF0055]" /> Withdraw
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-500 hover:text-white">
                <XCircle size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-500 mb-1">Available</p>
                <p className="text-2xl font-bold text-white">{formatNumber(liquid)} USDT</p>
              </div>
              <div className="p-3 bg-[#FF0055]/10 border border-[#FF0055]/30 rounded-lg text-xs text-[#FF0055]">
                Withdrawal coming soon
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                <History size={18} className="text-[#836EF9]" /> Transaction History
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-500 hover:text-white">
                <XCircle size={20} />
              </button>
            </div>
            <div className="flex gap-1 mb-4">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    timeRange === range ? 'bg-[#836EF9] text-white' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {range === 'all' ? 'All' : range}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-800/50">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-3 flex items-center gap-3 hover:bg-slate-900/30 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTxBgColor(tx.type)}`}>
                    {getTxIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{tx.description}</p>
                    <p className="text-[10px] text-slate-500">{formatTime(tx.timestamp)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-[#00FF9D]' : 'text-white'}`}>
                      {tx.amount > 0 ? '+' : ''}{hideBalance ? maskNumber() : tx.amount.toFixed(0)}
                    </p>
                    <p className="text-[10px] text-slate-500">USDT</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
