import React from 'react';
import { Agent } from '../types';
import { Bot, TrendingUp, TrendingDown, Activity, Wallet, Trophy, Target, Zap, BarChart3, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AgentsDashboardProps {
  agents: Agent[];
  market: any;
  onSelectAgent: (agentId: string) => void;
  onFabricate: () => void;
  walletBalance: number;
}

export const AgentsDashboard: React.FC<AgentsDashboardProps> = ({ agents, market, onSelectAgent, onFabricate, walletBalance }) => {
  const { t } = useLanguage();

  // Calculate statistics
  const activeAgents = agents.filter(a => a.status === 'ACTIVE');
  const idleAgents = agents.filter(a => a.status === 'IDLE');
  const deadAgents = agents.filter(a => a.status === 'LIQUIDATED');

  const totalAgents = agents.length;
  const totalPnl = agents.reduce((sum, a) => sum + a.pnl, 0);
  const totalBalance = agents.reduce((sum, a) => sum + a.balance, 0);
  const totalTrades = agents.reduce((sum, a) => sum + a.wins + a.losses, 0);
  const totalWins = agents.reduce((sum, a) => sum + a.wins, 0);
  const totalLosses = agents.reduce((sum, a) => sum + a.losses, 0);

  const winRate = totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;

  // Best performing agent
  const bestAgent = agents.length > 0
    ? agents.reduce((best, current) => current.pnl > best.pnl ? current : best, agents[0])
    : null;

  // Risk distribution
  const riskDistribution = {
    low: agents.filter(a => a.riskLevel === 'LOW').length,
    medium: agents.filter(a => a.riskLevel === 'MEDIUM').length,
    high: agents.filter(a => a.riskLevel === 'HIGH').length,
    extreme: agents.filter(a => a.riskLevel === 'EXTREME').length,
  };

  // Direction distribution
  const longAgents = agents.filter(a => a.direction === 'LONG').length;
  const shortAgents = agents.filter(a => a.direction === 'SHORT').length;

  const StatCard = ({ title, value, unit, subtext, icon: Icon, color, trend }: any) => (
    <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${color} bg-opacity-20 flex items-center justify-center`}>
          <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
        {trend && (
          <span className={`text-xs font-mono flex items-center gap-1 ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-2xl font-bold text-white">{value}</p>
        {unit && <span className="text-sm text-slate-500 font-mono">{unit}</span>}
      </div>
      <p className="text-xs text-slate-500">{title}</p>
      {subtext && <p className="text-[10px] text-slate-600 mt-1">{subtext}</p>}
    </div>
  );

  const ProgressBar = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">{label}</span>
          <span className="text-slate-500">{value} ({Math.round(percentage)}%)</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  };



  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-[#836EF9]" /> Fleet Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {totalAgents} agents • {activeAgents.length} active • {idleAgents.length} idle
          </p>
        </div>
        <button
          onClick={onFabricate}
          className="px-4 py-2 bg-[#836EF9] hover:bg-[#6c56e0] rounded-lg text-white font-bold text-sm flex items-center gap-2 transition-all"
        >
          <Zap size={16} /> Mint New
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total PnL"
          value={`${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}`}
          unit="MON"
          subtext="All time profit/loss"
          icon={totalPnl >= 0 ? TrendingUp : TrendingDown}
          color={totalPnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}
        />
        <StatCard
          title="Total Staked"
          value={totalBalance.toFixed(2)}
          unit="MON"
          subtext="Active collateral"
          icon={Wallet}
          color="bg-blue-500"
        />
        <StatCard
          title="Win Rate"
          value={`${winRate}%`}
          subtext={`${totalWins}W / ${totalLosses}L`}
          icon={Target}
          color="bg-amber-500"
        />
        <StatCard
          title="Total Trades"
          value={totalTrades.toLocaleString()}
          subtext="Across all agents"
          icon={Activity}
          color="bg-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Risk Distribution */}
        <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={18} className="text-[#836EF9]" />
            <h3 className="text-sm font-bold text-white">Risk Distribution</h3>
          </div>
          <ProgressBar label="Low Risk (1-3x)" value={riskDistribution.low} total={totalAgents} color="bg-emerald-500" />
          <ProgressBar label="Medium Risk (4-8x)" value={riskDistribution.medium} total={totalAgents} color="bg-blue-500" />
          <ProgressBar label="High Risk (9-15x)" value={riskDistribution.high} total={totalAgents} color="bg-amber-500" />
          <ProgressBar label="Extreme Risk (16-20x)" value={riskDistribution.extreme} total={totalAgents} color="bg-rose-500" />
        </div>

        {/* Direction Bias */}
        <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-[#836EF9]" />
            <h3 className="text-sm font-bold text-white">Direction Bias</h3>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-emerald-400">LONG</span>
                <span className="text-emerald-400">{longAgents}</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalAgents > 0 ? (longAgents / totalAgents) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-rose-400">SHORT</span>
                <span className="text-rose-400">{shortAgents}</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${totalAgents > 0 ? (shortAgents / totalAgents) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500">
            {longAgents > shortAgents ? 'Bullish bias detected' : shortAgents > longAgents ? 'Bearish bias detected' : 'Neutral stance'}
          </div>
        </div>
      </div>

      {/* Best Performer */}
      {bestAgent && bestAgent.pnl > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">Top Performer</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-black overflow-hidden border border-amber-500/30">
              <img src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${bestAgent.avatarSeed}`} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">{bestAgent.name}</p>
              <p className="text-xs text-slate-500">{bestAgent.strategy}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-emerald-400">+{bestAgent.pnl.toFixed(2)} MON</p>
              <p className="text-xs text-slate-500">Best profit</p>
            </div>
            <button
              onClick={() => onSelectAgent(bestAgent.id)}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-bold transition-all"
            >
              View
            </button>
          </div>
        </div>
      )}

      {/* Recent Activity - Agent List Preview */}
      <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bot size={16} className="text-[#836EF9]" /> Your Agents
          </h3>
          <span className="text-xs text-slate-500">Click to manage</span>
        </div>
        <div className="grid gap-2">
          {agents.slice(0, 5).map(agent => (
            <div
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-800 cursor-pointer transition-all group"
            >
              <div className={`w-10 h-10 rounded-lg bg-black overflow-hidden border ${agent.status === 'LIQUIDATED' ? 'border-slate-800 grayscale' : 'border-slate-700'}`}>
                <img src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${agent.avatarSeed}`} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{agent.name}</p>
                <p className="text-xs text-slate-500">{agent.strategy}</p>
              </div>
              <div className="text-right">
                {agent.status === 'ACTIVE' ? (
                  <>
                    <p className={`text-sm font-mono font-bold ${agent.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {agent.pnl >= 0 ? '+' : ''}{agent.pnl.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-slate-500">{agent.leverage}x {agent.direction}</p>
                  </>
                ) : agent.status === 'IDLE' ? (
                  <span className="text-xs text-amber-400">Idle</span>
                ) : (
                  <span className="text-xs text-slate-600">Liquidated</span>
                )}
              </div>
              <ArrowUpRight size={16} className="text-slate-600 group-hover:text-[#836EF9] transition-colors" />
            </div>
          ))}
          {agents.length > 5 && (
            <button
              onClick={() => onSelectAgent(agents[0].id)}
              className="text-center text-xs text-slate-500 hover:text-white py-2 transition-all"
            >
              View all {agents.length} agents →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
