import React, { useState, useMemo } from 'react';
import { WalletState, Agent } from '../types';
import { UserLiquidityStake } from '../lib/api/liquidity';
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
  Activity,
  Coins,
  PiggyBank,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  CheckCircle2
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
  const [copied, setCopied] = useState(false);

  // User agents data
  const userAgents = useMemo(() => agents.filter(a => a.owner === 'USER'), [agents]);
  const activeAgents = userAgents.filter(a => a.status === 'ACTIVE');
  
  // Calculations
  const tradingPnl = userAgents.reduce((acc, agent) => acc + agent.pnl, 0);
  const totalAllocated = activeAgents.reduce((acc, agent) => acc + agent.balance, 0);
  const liquidityEarnings = userStake ? userStake.rewards + userStake.pending_rewards : 0;
  const totalEquity = wallet.monBalance + totalAllocated + tradingPnl;
  const totalEarnings = tradingPnl + liquidityEarnings;

  // Stats
  const wins = userAgents.reduce((acc, a) => acc + a.wins, 0);
  const losses = userAgents.reduce((acc, a) => acc + a.losses, 0);
  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';

  // Build real chart data from agents' pnlHistory
  const chartData = useMemo(() => {
    const allHistory: { time: number; pnl: number }[] = [];
    
    userAgents.forEach(agent => {
      agent.pnlHistory.forEach(point => {
        allHistory.push({
          time: new Date(point.time).getTime(),
          pnl: point.value
        });
      });
    });
    
    allHistory.sort((a, b) => a.time - b.time);
    
    if (allHistory.length === 0) {
      return [];
    }
    
    const now = Date.now();
    const groupedData: { label: string; pnl: number }[] = [];
    
    if (timeRange === '24h') {
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0c14]">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          
          {/* Total Equity Card - Hero Section */}
          <div className="bg-gradient-to-r from-[#836EF9]/10 via-[#00D4AA]/10 to-[#00FF9D]/10 rounded-3xl p-8 border border-[#836EF9]/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#836EF9]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#00FF9D]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#836EF9] to-[#00D4AA] flex items-center justify-center shadow-lg shadow-[#836EF9]/20">
                  <PiggyBank size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{t('wallet_total_equity')}</p>
                  <p className="text-4xl font-bold text-white mt-1">
                    {hideBalance ? '•••••' : `${formatNumber(totalEquity)} MON`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${totalEarnings >= 0 ? 'bg-[#00D4AA]/20' : 'bg-[#FF4757]/20'}`}>
                    {totalEarnings >= 0 ? <ArrowUpRight size={16} className="text-[#00D4AA]" /> : <ArrowDownRight size={16} className="text-[#FF4757]" />}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('wallet_total_earnings')}</p>
                    <p className={`text-sm font-bold ${totalEarnings >= 0 ? 'text-[#00D4AA]' : 'text-[#FF4757]'}`}>
                      {hideBalance ? '•••' : `${totalEarnings >= 0 ? '+' : ''}${formatNumber(totalEarnings)} MON`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Breakdown Cards */}
          <div className="grid grid-cols-3 gap-4">
            <AssetCard
              label={t('wallet_available')}
              value={hideBalance ? '•••' : formatNumber(wallet.monBalance)}
              subValue="MON"
              icon={Coins}
              color="from-[#FFD700] to-[#FFA500]"
              bgColor="bg-[#FFD700]/5"
              borderColor="border-[#FFD700]/20"
            />
            <AssetCard
              label={t('wallet_trading_pnl')}
              value={hideBalance ? '•••' : `${tradingPnl >= 0 ? '+' : ''}${formatNumber(tradingPnl)}`}
              subValue="MON"
              icon={tradingPnl >= 0 ? TrendingUp : TrendingDown}
              color={tradingPnl >= 0 ? 'from-[#00D4AA] to-[#00FF9D]' : 'from-[#FF4757] to-[#FF6B8A]'}
              bgColor={tradingPnl >= 0 ? 'bg-[#00D4AA]/5' : 'bg-[#FF4757]/5'}
              borderColor={tradingPnl >= 0 ? 'border-[#00D4AA]/20' : 'border-[#FF4757]/20'}
            />
            <AssetCard
              label={t('wallet_liquidity')}
              value={hideBalance ? '•••' : `+${formatNumber(liquidityEarnings)}`}
              subValue={`APR ${poolApr.toFixed(0)}%`}
              icon={Droplets}
              color="from-[#00D4AA] to-[#00B4D8]"
              bgColor="bg-[#00D4AA]/5"
              borderColor="border-[#00D4AA]/20"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: PnL Line Chart */}
            <div className="lg:col-span-2 bg-[#0f111a] rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#836EF9]/10 flex items-center justify-center">
                    <TrendingUp size={20} className="text-[#836EF9]" />
                  </div>
                  <span className="font-semibold text-white">{t('wallet_pnl_chart')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(['24h', 'week', 'month'] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                        timeRange === range 
                          ? 'bg-[#836EF9] text-white shadow-lg shadow-[#836EF9]/20' 
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {range === '24h' ? '24H' : range === 'week' ? t('wallet_week') : t('wallet_month')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Stats */}
              <div className="flex items-center gap-6 mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00D4AA]" />
                  <span className="text-slate-500">{t('wallet_best')}:</span>
                  <span className="text-[#00D4AA] font-bold">+{formatNumber(maxPnL)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF4757]" />
                  <span className="text-slate-500">{t('wallet_worst')}:</span>
                  <span className="text-[#FF4757] font-bold">{formatNumber(minPnL)}</span>
                </div>
              </div>

              {/* Professional Chart */}
              <div className="relative h-56">
                {chartData.length > 0 ? (
                  <PnLChart data={chartData} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-3">
                      <TrendingUp size={32} className="opacity-30" />
                    </div>
                    <p className="text-sm">{t('wallet_no_data')}</p>
                    <p className="text-xs mt-1">{t('wallet_start_trading')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Trading Stats */}
            <div className="bg-[#0f111a] rounded-2xl border border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#836EF9]/10 flex items-center justify-center">
                  <Activity size={20} className="text-[#836EF9]" />
                </div>
                <span className="font-semibold text-white">{t('wallet_trading_stats')}</span>
              </div>
              
              <div className="space-y-4">
                <StatRow label={t('wallet_total_trades')} value={totalTrades.toString()} color="white" />
                <StatRow label={t('wallet_wins')} value={wins.toString()} color="[#00D4AA]" />
                <StatRow label={t('wallet_losses')} value={losses.toString()} color="[#FF4757]" />
                
                <div className="pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">{t('wallet_win_rate')}</span>
                    <span className="text-2xl font-bold text-[#00D4AA]">{winRate}%</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#00D4AA] to-[#836EF9] rounded-full transition-all duration-500"
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#836EF9]/10 flex items-center justify-center">
                    <Target size={20} className="text-[#836EF9]" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">{t('wallet_agent_accounts')}</span>
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-[#836EF9]/10 text-[#836EF9] text-xs">
                      {activeAgents.length} {t('wallet_active')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeAgents.map(agent => (
                  <div key={agent.id} className="bg-slate-900/50 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          agent.direction === 'LONG' ? 'bg-[#00D4AA]/10' : 
                          agent.direction === 'SHORT' ? 'bg-[#FF4757]/10' : 'bg-[#836EF9]/10'
                        }`}>
                          {agent.direction === 'LONG' ? <TrendingUp size={18} className="text-[#00D4AA]" /> : 
                           agent.direction === 'SHORT' ? <TrendingDown size={18} className="text-[#FF4757]" /> : 
                           <Zap size={18} className="text-[#836EF9]" />}
                        </div>
                        <div>
                          <span className="font-semibold text-white block">{agent.name}</span>
                          <span className="text-xs text-slate-500">{agent.asset}</span>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                        agent.pnl >= 0 ? 'bg-[#00D4AA]/10 text-[#00D4AA]' : 'bg-[#FF4757]/10 text-[#FF4757]'
                      }`}>
                        {agent.pnl >= 0 ? '+' : ''}{formatNumber(agent.pnl)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">{t('wallet_allocated')}</p>
                        <p className="text-sm font-bold text-white">{formatNumber(agent.balance)} MON</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">{t('wallet_leverage')}</p>
                        <p className="text-sm font-bold text-[#836EF9]">{agent.leverage}x</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liquidity Position */}
          {userStake && userStake.amount > 0 && (
            <div className="bg-gradient-to-r from-[#00D4AA]/5 to-[#00B4D8]/5 rounded-2xl border border-[#00D4AA]/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D4AA] to-[#00B4D8] flex items-center justify-center shadow-lg shadow-[#00D4AA]/20">
                    <Droplets size={24} className="text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-white block">{t('wallet_liquidity_position')}</span>
                    <span className="text-xs text-[#00D4AA]">APR {poolApr.toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <LiquidityStat label={t('liquidity_staked')} value={formatNumber(userStake.amount)} suffix="MON" />
                <LiquidityStat label={t('liquidity_earned')} value={`+${formatNumber(userStake.rewards)}`} suffix="MON" highlight />
                <LiquidityStat label={t('liquidity_pending')} value={userStake.pending_rewards.toFixed(4)} suffix="MON" pending />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// Sub-components
const AssetCard = ({ 
  label, 
  value, 
  subValue,
  icon: Icon,
  color,
  bgColor,
  borderColor
}: { 
  label: string; 
  value: string;
  subValue: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}) => (
  <div className={`${bgColor} ${borderColor} border rounded-2xl p-5 hover:scale-[1.02] transition-all duration-300 group`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{subValue}</p>
      </div>
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const StatRow = ({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: string;
  color: string;
}) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0">
    <span className="text-sm text-slate-400">{label}</span>
    <span className={`text-lg font-bold text-${color}`}>{value}</span>
  </div>
);

const LiquidityStat = ({
  label,
  value,
  suffix,
  highlight = false,
  pending = false
}: {
  label: string;
  value: string;
  suffix: string;
  highlight?: boolean;
  pending?: boolean;
}) => (
  <div>
    <p className="text-xs text-slate-500 mb-2">{label}</p>
    <p className={`text-2xl font-bold ${highlight ? 'text-[#00D4AA]' : pending ? 'text-[#FFD700]' : 'text-white'}`}>
      {value} <span className="text-sm text-slate-500">{suffix}</span>
    </p>
  </div>
);

// PnL Chart Component
const PnLChart = ({ data }: { data: { label: string; pnl: number }[] }) => {
  const maxPnL = Math.max(...data.map(d => d.pnl));
  const minPnL = Math.min(...data.map(d => d.pnl));
  const range = Math.max(Math.abs(maxPnL), Math.abs(minPnL)) || 1;

  // Calculate SVG path
  const width = 100;
  const height = 50;
  const padding = 5;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const getX = (index: number) => padding + (index / (data.length - 1)) * chartWidth;
  const getY = (pnl: number) => {
    const normalized = pnl / range;
    return height / 2 - normalized * (chartHeight / 2);
  };

  // Build smooth curve path
  const buildPath = () => {
    if (data.length === 0) return '';

    let path = `M ${getX(0)} ${getY(data[0].pnl)}`;

    for (let i = 1; i < data.length; i++) {
      const x = getX(i);
      const y = getY(data[i].pnl);
      const prevX = getX(i - 1);
      const prevY = getY(data[i - 1].pnl);

      // Control points for smooth curve
      const cp1x = prevX + (x - prevX) / 3;
      const cp1y = prevY;
      const cp2x = x - (x - prevX) / 3;
      const cp2y = y;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
    }

    return path;
  };

  // Build area path (for gradient fill)
  const buildAreaPath = () => {
    const linePath = buildPath();
    if (!linePath) return '';

    const lastX = getX(data.length - 1);
    const firstX = getX(0);

    return `${linePath} L ${lastX} ${height} L ${firstX} ${height} Z`;
  };

  // Determine line color based on overall trend
  const isPositive = data[data.length - 1]?.pnl >= data[0]?.pnl;
  const lineColor = isPositive ? '#00D4AA' : '#FF4757';
  const gradientColor = isPositive ? '#00D4AA' : '#FF4757';

  return (
    <div className="w-full h-full relative">
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Grid lines */}
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#1e293b" strokeWidth="0.3" strokeDasharray="2,2" />
        <line x1="0" y1={height / 4} x2={width} y2={height / 4} stroke="#1e293b" strokeWidth="0.2" strokeDasharray="2,2" opacity="0.5" />
        <line x1="0" y1={height * 3 / 4} x2={width} y2={height * 3 / 4} stroke="#1e293b" strokeWidth="0.2" strokeDasharray="2,2" opacity="0.5" />

        {/* Gradient definition */}
        <defs>
          <linearGradient id={`pnlGradient-${isPositive ? 'up' : 'down'}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={gradientColor} stopOpacity="0.4" />
            <stop offset="50%" stopColor={gradientColor} stopOpacity="0.1" />
            <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Area fill */}
        <path
          d={buildAreaPath()}
          fill={`url(#pnlGradient-${isPositive ? 'up' : 'down'})`}
        />

        {/* Line */}
        <path
          d={buildPath()}
          fill="none"
          stroke={lineColor}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = getY(d.pnl);
          const isMax = d.pnl === maxPnL;
          const isMin = d.pnl === minPnL;

          return (
            <g key={i}>
              {/* Regular point */}
              <circle
                cx={x}
                cy={y}
                r="1.2"
                fill={lineColor}
                stroke="#0f111a"
                strokeWidth="0.3"
              />

              {/* Highlight max/min points */}
              {(isMax || isMin) && (
                <>
                  <circle
                    cx={x}
                    cy={y}
                    r="2.5"
                    fill={isMax ? '#00D4AA' : '#FF4757'}
                    opacity="0.3"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill={isMax ? '#00D4AA' : '#FF4757'}
                    stroke="#0f111a"
                    strokeWidth="0.3"
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-slate-500 px-2">
        {data.map((d, i) => (
          <span key={i} className={i % 2 === 0 ? '' : 'hidden sm:inline'}>{d.label}</span>
        ))}
      </div>

      {/* Tooltip on hover (simplified) */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00D4AA]" />
          <span className="text-[10px] text-slate-400">Max: +{formatNumber(maxPnL)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FF4757]" />
          <span className="text-[10px] text-slate-400">Min: {formatNumber(minPnL)}</span>
        </div>
      </div>
    </div>
  );
};
