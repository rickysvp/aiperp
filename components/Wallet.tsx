import React from 'react';
import { WalletState, Agent } from '../types';
import { Wallet as WalletIcon, TrendingUp, DollarSign, History, LogOut, User, Users, Copy, Share2, Shield } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from './Button';
import { useLanguage } from '../contexts/LanguageContext';

interface WalletProps {
  wallet: WalletState;
  agents: Agent[];
  onLogout?: () => void;
  onShowLegal?: () => void;
}

export const Wallet: React.FC<WalletProps> = ({ wallet, agents, onLogout, onShowLegal }) => {
  const { t } = useLanguage();
  // Only calculate stats for USER agents
  const userAgents = agents.filter(a => a.owner === 'USER');
  const activeUserAgents = userAgents.filter(a => a.status === 'ACTIVE');
  const retiredUserAgents = userAgents.filter(a => a.status === 'LIQUIDATED');
  
  const totalAllocated = activeUserAgents.reduce((acc, curr) => acc + curr.balance, 0);
  const liquid = wallet.balance - totalAllocated;

  const data = [
    { name: t('liquid'), value: liquid, color: '#836EF9' },
    { name: t('long_alloc'), value: activeUserAgents.filter(a => a.direction === 'LONG').reduce((acc, c) => acc + c.balance, 0), color: '#22c55e' },
    { name: t('short_alloc'), value: activeUserAgents.filter(a => a.direction === 'SHORT').reduce((acc, c) => acc + c.balance, 0), color: '#ef4444' },
  ].filter(d => d.value > 0);

  const handleCopyCode = () => {
    if(wallet.referralCode) {
        navigator.clipboard.writeText(wallet.referralCode);
        alert(t('referral_copied'));
    }
  };

  const handleShareRef = () => {
      const text = `Join my faction on AIPerps.fun! Use code ${wallet.referralCode} to mint your Agent and battle for liquidity. ⚔️ #Monad #AIPerps`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Account Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-900/50 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#836EF9]/10 border border-[#836EF9]/50 flex items-center justify-center">
                  <User size={32} className="text-[#836EF9]" />
              </div>
              <div>
                  <h2 className="text-xl font-display font-bold text-white">{t('embedded_account')}</h2>
                  <p className="text-sm font-mono text-slate-400">{wallet.address}</p>
              </div>
          </div>
          <div className="flex gap-2">
            {onShowLegal && (
                <Button onClick={onShowLegal} variant="secondary" className="border-slate-700 hover:text-white">
                    <Shield size={16} /> {t('legal_title')}
                </Button>
            )}
            {onLogout && (
                <Button onClick={onLogout} variant="secondary" className="border-slate-700 hover:border-red-500 hover:text-red-400">
                    <LogOut size={16} /> {t('disconnect')}
                </Button>
            )}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Equity & PnL */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-[#836EF9]/20 rounded-lg text-[#836EF9]">
                    <WalletIcon size={24} />
                </div>
                <div>
                    <h3 className="text-slate-400 text-sm font-bold uppercase">{t('total_equity')}</h3>
                    <p className="text-3xl font-mono font-bold text-white">{wallet.balance.toFixed(2)} $MON</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-sm">{t('realized_pnl')}</span>
                    <span className={`font-mono font-bold ${wallet.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {wallet.totalPnl > 0 ? '+' : ''}{wallet.totalPnl.toFixed(2)} $MON
                    </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-sm">{t('active_agents')}</span>
                    <span className="font-mono text-white">{activeUserAgents.length}</span>
                </div>
            </div>
        </div>

        {/* KOL / Partner Program */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 relative overflow-hidden group">
            {/* Gloss FX */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 opacity-5 blur-[60px] pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400">
                    <Users size={24} />
                </div>
                <div>
                    <h3 className="text-indigo-400 text-sm font-bold uppercase">{t('partner_program')}</h3>
                    <p className="text-xs text-slate-400">{t('invite_earn')}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                 <div className="bg-black/30 p-3 rounded-lg border border-indigo-500/20">
                     <p className="text-[10px] text-slate-500 uppercase">{t('recruits')}</p>
                     <p className="text-xl font-mono font-bold text-white">{wallet.referralCount}</p>
                 </div>
                 <div className="bg-black/30 p-3 rounded-lg border border-indigo-500/20">
                     <p className="text-[10px] text-slate-500 uppercase">{t('earnings')}</p>
                     <p className="text-xl font-mono font-bold text-[#00FF9D]">{wallet.referralEarnings} $MON</p>
                 </div>
            </div>

            <div className="bg-black/40 border border-slate-700 rounded-xl p-1 flex items-center relative z-10">
                <div className="flex-1 px-3 font-mono font-bold text-white tracking-widest text-center">
                    {wallet.referralCode || "LOADING..."}
                </div>
                <button onClick={handleCopyCode} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <Copy size={16} />
                </button>
            </div>
            
            <button onClick={handleShareRef} className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors relative z-10">
                 <Share2 size={16} /> {t('share_invite')}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
            <h3 className="text-slate-400 text-sm font-bold uppercase mb-4">{t('allocation')}</h3>
            <div className="flex-1 min-h-[150px] flex items-center">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                        <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => value.toFixed(2)}
                        />
                    </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full text-center text-slate-600 text-sm">{t('no_funds')}</div>
                )}
            </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase mb-1">{t('my_wins')}</p>
            <p className="text-2xl font-bold text-blue-400">{userAgents.reduce((acc, a) => acc + a.wins, 0)}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase mb-1">{t('liquidations')}</p>
            <p className="text-2xl font-bold text-red-500">{retiredUserAgents.length}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase mb-1">{t('avg_leverage')}</p>
            <p className="text-2xl font-bold text-yellow-400">
                {activeUserAgents.length > 0 
                ? (activeUserAgents.reduce((acc, a) => acc + a.leverage, 0) / activeUserAgents.length).toFixed(1) 
                : 0}x
            </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <p className="text-xs text-slate-500 uppercase mb-1">{t('protocol')}</p>
            <p className="text-2xl font-bold text-[#836EF9]">Monad</p>
            </div>
        </div>
      </div>
    </div>
  );
};
