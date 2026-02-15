import React, { useState, useMemo } from 'react';
import { WalletState, Agent, UserLiquidityStake } from '../types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  LogOut,
  Eye,
  EyeOff,
  Droplets,
  Zap,
  Target,
  Activity
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNumber } from '../utils/financialUtils';

interface WalletV2Props {
  wallet: WalletState;
  agents: Agent[];
  userStake?: UserLiquidityStake | null;
  poolApr?: number;
  onLogout?: () => void;
}

type TimeRange = '24h' | 'week' | 'month';

export const WalletV2: React.FC<WalletV2Props> = ({
  wallet,
  agents,
  userStake,
  poolApr = 100,
  onLogout
}) => {
  const { t } = useLanguage();
  const [hideBalance, setHideBalance] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  // User agents data
  const userAgents = useMemo(() => agents.filter(a => a.owner === 'USER'), [agents]);
  const activeAgents = userAgents.filter(a => a.status === 'ACTIVE');
  
  // Calculations
  const tradingPnl = userAgents.reduce((acc, agent) => acc + agent.pnl, 0);
  const totalAllocated = activeAgents.reduce((acc, agent) => acc + agent.balance, 0);
  const liquidityEarnings = userStake ? userStake.rewards + userStake.pendingRewards : 0;
  const totalEquity = wallet.monBalance + totalAllocated + tradingPnl;
  const totalEarnings = tradingPnl + liquidityEarnings;

  // Stats
  const wins = userAgents.reduce((acc, a) => acc + a.wins, 0);
  const losses = userAgents.reduce((acc, a) => acc + a.losses, 0);
  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';

  // Build real chart data from agents' pnlHistory
  const chartData = useMemo(() => {
    // Collect all pnl history points from user agents
    const allHistory: { time: number; pnl: number }[] = [];
    
    userAgents.forEach(agent => {
      agent.pnlHistory.forEach(point => {
        allHistory.push({
          time: new Date(point.time).getTime(),
          pnl: point.value
        });
      });
    });
    
    // Sort by time
    allHistory.sort((a, b) => a.time - b.time);
    
    // If no history data, return empty array
    if (allHistory.length === 0) {
      return [];
    }
    
    // Group by time range
    const now = Date.now();
    const groupedData: { label: string; pnl: number }[] = [];
    
    if (timeRange === '24h') {
      // Last 24 hours, group by 4 hours
      for (let i = 0; i < 24; i += 4) {
        const startTime = now - (24 - i) * 60 * 60 * 1000;
        const endTime = now - (24 - i - 4) * 60 * 60 * 1000;
        const points = allHistory.filter(h => h.time >= startTime && h.time < endTime);
        const avgPnl = points.length > 0 
          ? points.reduce((sum, p) => sum + p.pnl, 0) / points.length 
          : 0;
        groupedData.push({ label: `${i}:00`, pnl: avgPnl });
      }
    } else if (timeRange === 'week') {
      // Last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const points = allHistory.filter(h => h.time >= dayStart && h.time < dayEnd);
        const avgPnl = points.length > 0 
          ? points.reduce((sum, p) => sum + p.pnl, 0) / points.length 
          : 0;
        groupedData.push({ label: days[date.getDay()], pnl: avgPnl });
      }
    } else {
      // Last 30 days, group by 5 days
      for (let i = 25; i >= 0; i -= 5) {
        const startTime = now - (i + 5) * 24 * 60 * 60 * 1000;
        const endTime = now - i * 24 * 60 * 60 * 1000;
        const points = allHistory.filter(h => h.time >= startTime && h.time < endTime);
        const avgPnl = points.length > 0 
          ? points.reduce((sum, p) => sum + p.pnl, 0) / points.length 
          : 0;
        const day = Math.floor(i / 5) + 1;
        groupedData.push({ label: `${day}w`, pnl: avgPnl });
      }
    }
    
    return groupedData;
  }, [userAgents, timeRange]);

  // Calculate chart stats
  const maxPnL = chartData.length > 0 ? Math.max(...chartData.map(d => d.pnl)) : 0;
  const minPnL = chartData.length > 0 ? Math.min(...chartData.map(d => d.pnl)) : 0;
  const chartRange = Math.max(Math.abs(maxPnL), Math.abs(minPnL)) || 1;

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0c14]">
      {/* Header */}
      <div className="bg-[#0f111a] border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#836EF9] to-[#00D4AA] flex items-center justify-center">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{t('wallet_title')}</h1>
            <p className="text-xs text-slate-500">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideBalance(!hideBalance)}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-[#FF4757]/10 text-[#FF4757] hover:bg-[#FF4757]/20 transition-all"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          
          {/* Top Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              label={t('wallet_total_equity')}
              value={hideBalance ? '•••••' : formatNumber(totalEquity)}
              subValue="MON"
              icon={Wallet}
              color="text-white"
            />
            <StatCard
              label={t('wallet_available')}
              value={hideBalance ? '•••' : formatNumber(wallet.monBalance)}
              subValue="MON"
              icon={Zap}
              color="text-slate-400"
            />
            <StatCard
              label={t('wallet_trading_pnl')}
              value={hideBalance ? '•••' : `${tradingPnl >= 0 ? '+' : ''}${formatNumber(tradingPnl)}`}
              subValue="MON"
              icon={tradingPnl >= 0 ? TrendingUp : TrendingDown}
              color={tradingPnl >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}
              bgColor={tradingPnl >= 0 ? 'bg-[#00D4AA]/10' : 'bg-[#FF4757]/10'}
            />
            <StatCard
              label={t('wallet_liquidity')}
              value={hideBalance ? '•••' : `+${formatNumber(liquidityEarnings)}`}
              subValue={`APR ${poolApr.toFixed(0)}%`}
              icon={Droplets}
              color="text-[#00D4AA]"
              bgColor="bg-[#00D4AA]/10"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: PnL Line Chart */}
            <div className="lg:col-span-2 bg-[#0f111a] rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#836EF9]" />
                  <span className="font-semibold text-white">{t('wallet_pnl_chart')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Time Range Tabs */}
                  <button
                    onClick={() => setTimeRange('24h')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      timeRange === '24h' 
                        ? 'bg-[#836EF9] text-white' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    24H
                  </button>
                  <button
                    onClick={() => setTimeRange('week')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      timeRange === 'week' 
                        ? 'bg-[#836EF9] text-white' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('wallet_week')}
                  </button>
                  <button
                    onClick={() => setTimeRange('month')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      timeRange === 'month' 
                        ? 'bg-[#836EF9] text-white' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('wallet_month')}
                  </button>
                </div>
              </div>

              {/* Chart Stats */}
              <div className="flex items-center gap-6 mb-4 text-xs">
                <span className="text-slate-500">
                  {t('wallet_best')}: <span className="text-[#00D4AA]">+{formatNumber(maxPnL)}</span>
                </span>
                <span className="text-slate-500">
                  {t('wallet_worst')}: <span className="text-[#FF4757]">{formatNumber(minPnL)}</span>
                </span>
                <span className="text-slate-500">
                  {t('wallet_data_points')}: <span className="text-white">{chartData.length}</span>
                </span>
              </div>

              {/* Line Chart */}
              <div className="relative h-48">
                {chartData.length > 0 ? (
                  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                    <line x1="0" y1="12.5" x2="100" y2="12.5" stroke="#1e293b" strokeWidth="0.3" strokeDasharray="2,2" />
                    <line x1="0" y1="37.5" x2="100" y2="37.5" stroke="#1e293b" strokeWidth="0.3" strokeDasharray="2,2" />
                    
                    {/* Area fill */}
                    <defs>
                      <linearGradient id="pnlGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    
                    {/* Area path */}
                    <path
                      d={chartData.map((d, i) => {
                        const x = (i / (chartData.length - 1)) * 100;
                        const y = 25 - ((d.pnl / chartRange) * 20);
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ') + ` L 100 50 L 0 50 Z`}
                      fill="url(#pnlGradient)"
                    />
                    
                    {/* Line path */}
                    <path
                      d={chartData.map((d, i) => {
                        const x = (i / (chartData.length - 1)) * 100;
                        const y = 25 - ((d.pnl / chartRange) * 20);
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#00D4AA"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Data points */}
                    {chartData.map((d, i) => {
                      const x = (i / (chartData.length - 1)) * 100;
                      const y = 25 - ((d.pnl / chartRange) * 20);
                      return (
                        <g key={i}>
                          <circle
                            cx={x}
                            cy={y}
                            r="1.5"
                            fill="#00D4AA"
                            stroke="#0f111a"
                            strokeWidth="0.3"
                          />
                        </g>
                      );
                    })}
                  </svg>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <TrendingUp size={32} className="mb-2 opacity-30" />
                    <p className="text-sm">{t('wallet_no_data')}</p>
                    <p className="text-xs mt-1">{t('wallet_start_trading')}</p>
                  </div>
                )}
                
                {/* X-axis labels */}
                {chartData.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-500 px-2">
                    {chartData.map((d, i) => (
                      <span key={i}>{d.label}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Trading Stats */}
            <div className="bg-[#0f111a] rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity size={18} className="text-[#836EF9]" />
                <span className="font-semibold text-white">{t('wallet_trading_stats')}</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-800">
                  <span className="text-sm text-slate-400">{t('wallet_total_trades')}</span>
                  <span className="text-xl font-bold text-white">{totalTrades}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-800">
                  <span className="text-sm text-slate-400">{t('wallet_wins')}</span>
                  <span className="text-xl font-bold text-[#00D4AA]">{wins}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-800">
                  <span className="text-sm text-slate-400">{t('wallet_losses')}</span>
                  <span className="text-xl font-bold text-[#FF4757]">{losses}</span>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">{t('wallet_win_rate')}</span>
                    <span className="text-2xl font-bold text-[#00D4AA]">{winRate}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00D4AA] to-[#836EF9] rounded-full transition-all"
                      style={{ width: `${winRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Accounts */}
          {activeAgents.length > 0 && (
            <div className="bg-[#0f111a] rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-[#836EF9]" />
                  <span className="font-semibold text-white">{t('wallet_agent_accounts')}</span>
                </div>
                <span className="text-xs text-slate-500">{activeAgents.length} {t('wallet_active')}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeAgents.map(agent => (
                  <div key={agent.id} className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          agent.direction === 'LONG' ? 'bg-[#00D4AA]' : 
                          agent.direction === 'SHORT' ? 'bg-[#FF4757]' : 'bg-[#836EF9]'
                        }`} />
                        <span className="font-semibold text-white">{agent.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{agent.asset}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{t('wallet_allocated')}</span>
                        <span className="text-white font-medium">{formatNumber(agent.balance)} MON</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{t('wallet_pnl')}</span>
                        <span className={`font-medium ${agent.pnl >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>
                          {agent.pnl >= 0 ? '+' : ''}{formatNumber(agent.pnl)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{t('wallet_leverage')}</span>
                        <span className="text-[#836EF9] font-medium">{agent.leverage}x</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{t('wallet_entry_price')}</span>
                      <span className="text-xs text-white">${agent.entryPrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liquidity Position */}
          {userStake && userStake.amount > 0 && (
            <div className="bg-[#0f111a] rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Droplets size={18} className="text-[#00D4AA]" />
                  <span className="font-semibold text-white">{t('wallet_liquidity_position')}</span>
                </div>
                <span className="text-xs text-[#00D4AA] bg-[#00D4AA]/10 px-3 py-1 rounded-full">
                  APR {poolApr.toFixed(0)}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">{t('liquidity_staked')}</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(userStake.amount)} <span className="text-sm text-slate-500">MON</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{t('liquidity_earned')}</p>
                  <p className="text-2xl font-bold text-[#00D4AA]">+{formatNumber(userStake.rewards)} <span className="text-sm text-slate-500">MON</span></p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{t('liquidity_pending')}</p>
                  <p className="text-2xl font-bold text-[#FFD700]">{userStake.pendingRewards.toFixed(4)} <span className="text-sm text-slate-500">MON</span></p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Sub-components
const StatCard = ({ 
  label, 
  value, 
  subValue,
  icon: Icon,
  color,
  bgColor = 'bg-slate-800/50'
}: { 
  label: string; 
  value: string;
  subValue: string;
  icon: React.ElementType;
  color: string;
  bgColor?: string;
}) => (
  <div className={`${bgColor} rounded-2xl p-5 border border-slate-800/50`}>
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} className={color} />
      <span className="text-xs text-slate-400">{label}</span>
    </div>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-slate-500 mt-1">{subValue}</p>
  </div>
);
