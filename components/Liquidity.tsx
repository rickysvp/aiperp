import React, { useState, useEffect, useMemo } from 'react';
import { Droplets, TrendingUp, Wallet, Clock, Gift, ArrowUpRight, ArrowDownRight, Info, AlertCircle, CheckCircle2, Zap, Percent, Coins, BarChart3, Lock, Unlock, Activity } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useWallet } from '../contexts/WalletContext';
import { LiquidityPool, UserLiquidityStake, Agent } from '../types';
import { formatNumber, formatPercentage } from '../utils/financialUtils';
import { getUserLiquidityStakes, upsertUserStake, claimRewards, updateLiquidityPool, getLiquidityPool, recalculateTotalStaked } from '../lib/api/liquidity';
import { isSupabaseConfigured } from '../lib/supabase';

interface LiquidityProps {
  agents: Agent[];
}

// Base APR is 100%, but fluctuates based on trading fees
const BASE_APR = 100;

export const Liquidity: React.FC<LiquidityProps> = ({ agents }) => {
  const { t } = useLanguage();
  const { wallet, updateMonBalance, userId } = useWallet();
  
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Calculate daily trading fees from active agents
  const dailyFees = useMemo(() => {
    const activeAgents = agents.filter(a => a.status === 'ACTIVE');
    // Fee is 0.1% of daily volume per agent
    return activeAgents.reduce((acc, agent) => acc + (agent.balance * 0.001), 0);
  }, [agents]);
  
  // Calculate dynamic APR based on fees
  // APR = (Daily Fees * 365 / Total Staked) * Fee Share
  const [pool, setPool] = useState<LiquidityPool>({
    id: 'mon-lp-1',
    totalStaked: 0,
    totalRewards: 0,
    apr: BASE_APR,
    feeShare: 0.7,
    dailyVolume: 0
  });
  const [isPoolLoading, setIsPoolLoading] = useState(true);
  
  // Update APR based on trading fees
  useEffect(() => {
    const annualFees = dailyFees * 365;
    const dynamicApr = pool.totalStaked > 0 
      ? (annualFees / pool.totalStaked) * pool.feeShare * 100 
      : BASE_APR;
    // APR fluctuates between 50% and 150% based on fees
    const clampedApr = Math.max(50, Math.min(150, dynamicApr));
    setPool(prev => ({ ...prev, apr: clampedApr, dailyVolume: dailyFees * 100 }));
  }, [dailyFees, pool.totalStaked, pool.feeShare]);
  
  // User stake data - loaded from Supabase
  const [userStake, setUserStake] = useState<UserLiquidityStake | null>(null);
  
  // Load liquidity pool data from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsPoolLoading(false);
      return;
    }
    
    const loadPoolData = async () => {
      console.log('[Liquidity] Loading pool data from Supabase...');
      
      // Recalculate total staked to ensure accuracy
      const updatedPool = await recalculateTotalStaked('mon-lp-1');
      
      if (updatedPool) {
        console.log('[Liquidity] Loaded pool data from Supabase:', updatedPool);
        setPool({
          id: updatedPool.pool_id,
          totalStaked: updatedPool.total_staked,
          totalRewards: updatedPool.total_rewards || 0,
          apr: updatedPool.apr,
          feeShare: updatedPool.fee_share,
          dailyVolume: updatedPool.daily_volume
        });
      } else {
        // Fallback to getLiquidityPool if recalculate failed
        const dbPool = await getLiquidityPool('mon-lp-1');
        if (dbPool) {
          console.log('[Liquidity] Loaded pool data from Supabase:', dbPool);
          setPool({
            id: dbPool.pool_id,
            totalStaked: dbPool.total_staked,
            totalRewards: dbPool.total_rewards || 0,
            apr: dbPool.apr,
            feeShare: dbPool.fee_share,
            dailyVolume: dbPool.daily_volume
          });
        }
      }
      setIsPoolLoading(false);
    };
    
    loadPoolData();
    
    // Also set up a refresh every 30 seconds
    const refreshInterval = setInterval(loadPoolData, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [userId]);
  
  // Load user stake from Supabase
  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;
    
    const loadUserStake = async () => {
      const stakes = await getUserLiquidityStakes(userId);
      if (stakes && stakes.length > 0) {
        // Transform database format to app format
        const dbStake = stakes[0];
        setUserStake({
          id: dbStake.id,
          amount: dbStake.amount,
          stakedAt: new Date(dbStake.staked_at).getTime(),
          rewards: dbStake.rewards,
          pendingRewards: dbStake.pending_rewards,
          lockPeriod: dbStake.lock_period
        });
      }
    };
    
    loadUserStake();
  }, [userId]);
  
  // Calculate real-time rewards based on current APR
  useEffect(() => {
    const interval = setInterval(() => {
      if (userStake && userStake.amount > 0) {
        const rewardPerSecond = (userStake.amount * (pool.apr / 100)) / (365 * 24 * 3600);
        setUserStake(prev => prev ? {
          ...prev,
          pendingRewards: prev.pendingRewards + rewardPerSecond
        } : null);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [userStake?.amount, pool.apr]);
  
  // Calculate estimated daily earnings
  const estimatedDailyEarnings = useMemo(() => {
    const amount = Number(stakeAmount) || 0;
    return (amount * (pool.apr / 100)) / 365;
  }, [stakeAmount, pool.apr]);
  
  // Calculate user's share percentage
  const userSharePercent = useMemo(() => {
    if (!userStake || pool.totalStaked === 0) return 0;
    return (userStake.amount / pool.totalStaked) * 100;
  }, [userStake, pool.totalStaked]);
  
  const handleStake = async () => {
    const amount = Number(stakeAmount);
    console.log('[Liquidity] handleStake called:', { amount, stakeAmount, monBalance: wallet.monBalance, userId });
    if (isNaN(amount) || amount <= 0) {
      console.log('[Liquidity] Invalid amount:', amount);
      return;
    }
    if (amount > wallet.monBalance) {
      console.log('[Liquidity] Amount exceeds balance:', amount, '>', wallet.monBalance);
      return;
    }
    
    updateMonBalance(-amount);
    
    const newStake = userStake ? {
      ...userStake,
      amount: userStake.amount + amount,
      pendingRewards: userStake.pendingRewards
    } : {
      id: `stake-${Date.now()}`,
      amount: amount,
      stakedAt: Date.now(),
      rewards: 0,
      pendingRewards: 0,
      lockPeriod: 0
    };
    
    setUserStake(newStake);
    
    // Sync to Supabase
    if (userId && isSupabaseConfigured()) {
      console.log('[Liquidity] Syncing stake to Supabase...');
      await upsertUserStake(userId, 'mon-lp-1', amount, 0, newStake.pendingRewards);
      
      // Recalculate total staked from all users
      console.log('[Liquidity] Recalculating total staked...');
      const updatedPool = await recalculateTotalStaked('mon-lp-1');
      if (updatedPool) {
        setPool(prev => ({
          ...prev,
          totalStaked: updatedPool.total_staked,
          totalRewards: updatedPool.total_rewards,
          apr: updatedPool.apr,
          feeShare: updatedPool.fee_share,
          dailyVolume: updatedPool.daily_volume
        }));
      }
    } else {
      // Fallback to local calculation
      const newTotalStaked = pool.totalStaked + amount;
      setPool(prev => ({
        ...prev,
        totalStaked: newTotalStaked
      }));
    }
    
    setStakeAmount('');
    setSuccessMessage(t('liquidity_stake_success'));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  const handleUnstake = async () => {
    const amount = Number(unstakeAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (!userStake || amount > userStake.amount) return;
    
    updateMonBalance(amount);
    
    const newAmount = userStake.amount - amount;
    setUserStake(prev => prev ? {
      ...prev,
      amount: newAmount,
      pendingRewards: newAmount <= 0 ? 0 : prev.pendingRewards
    } : null);
    
    // Sync to Supabase
    if (userId && isSupabaseConfigured() && userStake) {
      console.log('[Liquidity] Syncing unstake to Supabase...');
      await upsertUserStake(userId, 'mon-lp-1', -amount, 0, newAmount <= 0 ? 0 : userStake.pendingRewards);
      
      // Recalculate total staked from all users
      console.log('[Liquidity] Recalculating total staked after unstake...');
      const updatedPool = await recalculateTotalStaked('mon-lp-1');
      if (updatedPool) {
        setPool(prev => ({
          ...prev,
          totalStaked: updatedPool.total_staked,
          totalRewards: updatedPool.total_rewards,
          apr: updatedPool.apr,
          feeShare: updatedPool.fee_share,
          dailyVolume: updatedPool.daily_volume
        }));
      }
    } else {
      // Fallback to local calculation
      const newTotalStaked = Math.max(0, pool.totalStaked - amount);
      setPool(prev => ({
        ...prev,
        totalStaked: newTotalStaked
      }));
    }
    
    setUnstakeAmount('');
    setSuccessMessage(t('liquidity_unstake_success'));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  const handleClaimRewards = async () => {
    if (!userStake || userStake.pendingRewards <= 0) return;
    
    const claimedAmount = userStake.pendingRewards;
    updateMonBalance(claimedAmount);
    
    setUserStake(prev => prev ? {
      ...prev,
      rewards: prev.rewards + prev.pendingRewards,
      pendingRewards: 0
    } : null);
    
    // Sync to Supabase
    if (userId && isSupabaseConfigured() && userStake) {
      console.log('[Liquidity] Syncing claim rewards to Supabase...');
      await claimRewards(userStake.id);
    }
    
    setSuccessMessage(t('liquidity_claim_success'));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  const maxStake = wallet.monBalance;
  const maxUnstake = userStake?.amount || 0;
  
  return (
    <div className="h-full flex flex-col bg-[#0a0c14]">
      {/* Header */}
      <div className="bg-[#0f111a] border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#00FF9D] flex items-center justify-center">
            <Droplets size={20} className="text-black" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{t('liquidity_title')}</h2>
            <p className="text-xs text-slate-500">{t('liquidity_subtitle')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-500">{t('liquidity_total_staked')}</p>
            <p className="text-lg font-bold text-[#00FF9D]">
              {isPoolLoading ? (
                <span className="inline-block w-20 h-6 bg-slate-700 rounded animate-pulse" />
              ) : (
                <>{formatNumber(pool.totalStaked)} MON</>
              )}
            </p>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gradient-to-br from-[#0f111a] to-[#1a1d2e] border border-[#00FF9D]/30 rounded-2xl p-8 max-w-sm w-full mx-4 shadow-[0_0_60px_rgba(0,255,157,0.3)] animate-scaleIn">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00D4AA] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(0,255,157,0.5)]">
                <CheckCircle2 size={40} className="text-black" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t('liquidity_success_title')}</h3>
              <p className="text-[#00FF9D] font-semibold text-lg mb-4">{successMessage}</p>
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                  <Droplets size={16} className="text-[#00FF9D]" />
                  <span>{t('liquidity_success_desc')}</span>
                </div>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full py-3 bg-gradient-to-r from-[#00FF9D] to-[#00D4AA] text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(0,255,157,0.4)] transition-all"
              >
                {t('liquidity_success_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 shrink-0">
        <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-[#00FF9D]" />
            <span className="text-xs text-slate-500">{t('liquidity_apr')}</span>
          </div>
          <p className="text-xl font-bold text-[#00FF9D]">{formatPercentage(pool.apr)}</p>
          <p className="text-[10px] text-slate-600">{t('liquidity_annual_yield')}</p>
        </div>
        
        <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity size={14} className="text-[#836EF9]" />
            <span className="text-xs text-slate-500">{t('liquidity_daily_fees')}</span>
          </div>
          <p className="text-xl font-bold text-white">{formatNumber(dailyFees)}</p>
          <p className="text-[10px] text-slate-600">MON</p>
        </div>
        
        <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Percent size={14} className="text-amber-400" />
            <span className="text-xs text-slate-500">{t('liquidity_fee_share')}</span>
          </div>
          <p className="text-xl font-bold text-amber-400">{pool.feeShare * 100}%</p>
          <p className="text-[10px] text-slate-600">{t('liquidity_of_fees')}</p>
        </div>
        
        <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-[#FF0055]" />
            <span className="text-xs text-slate-500">{t('liquidity_total_rewards')}</span>
          </div>
          <p className="text-xl font-bold text-[#FF0055]">
            {isPoolLoading ? (
              <span className="inline-block w-16 h-6 bg-slate-700 rounded animate-pulse" />
            ) : (
              formatNumber(pool.totalRewards)
            )}
          </p>
          <p className="text-[10px] text-slate-600">MON {t('liquidity_distributed')}</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 px-4 pb-4 min-h-0 overflow-y-auto">
        {/* Left: Stake/Unstake Panel */}
        <div className="flex-1 bg-[#0f111a] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('stake')}
              className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'stake' 
                  ? 'bg-[#00FF9D]/10 text-[#00FF9D] border-b-2 border-[#00FF9D]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Lock size={16} />
              {t('liquidity_stake')}
            </button>
            <button
              onClick={() => setActiveTab('unstake')}
              className={`flex-1 py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'unstake' 
                  ? 'bg-[#FF0055]/10 text-[#FF0055] border-b-2 border-[#FF0055]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Unlock size={16} />
              {t('liquidity_unstake')}
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-4 flex-1 flex flex-col">
            {activeTab === 'stake' ? (
              <>
                <div className="mb-4">
                  <label className="text-xs text-slate-500 mb-2 block">{t('liquidity_amount')}</label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-transparent text-2xl font-bold text-white w-full outline-none"
                      />
                      <span className="text-slate-500 font-bold">MON</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{t('liquidity_balance')}: {formatNumber(maxStake)} MON</span>
                      <button 
                        onClick={() => setStakeAmount(maxStake.toString())}
                        className="text-[#00FF9D] font-bold hover:underline"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </div>
                
                {Number(stakeAmount) > 0 && (
                  <div className="bg-[#00FF9D]/5 border border-[#00FF9D]/20 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">{t('liquidity_estimated_daily')}</span>
                      <span className="text-sm font-bold text-[#00FF9D]">+{estimatedDailyEarnings.toFixed(4)} MON</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{t('liquidity_estimated_monthly')}</span>
                      <span className="text-sm font-bold text-[#00FF9D]">+{(estimatedDailyEarnings * 30).toFixed(2)} MON</span>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    console.log('[Liquidity] Button clicked', { stakeAmount, maxStake });
                    handleStake();
                  }}
                  disabled={!stakeAmount || Number(stakeAmount) <= 0 || Number(stakeAmount) > maxStake}
                  className="w-full py-3 bg-[#00FF9D] text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <Lock size={18} />
                  {t('liquidity_confirm_stake')}
                </button>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-xs text-slate-500 mb-2 block">{t('liquidity_amount')}</label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="number"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-transparent text-2xl font-bold text-white w-full outline-none"
                      />
                      <span className="text-slate-500 font-bold">MON</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{t('liquidity_staked')}: {formatNumber(maxUnstake)} MON</span>
                      <button 
                        onClick={() => setUnstakeAmount(maxUnstake.toString())}
                        className="text-[#FF0055] font-bold hover:underline"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleUnstake}
                  disabled={!unstakeAmount || Number(unstakeAmount) <= 0 || Number(unstakeAmount) > maxUnstake}
                  className="w-full py-3 bg-[#FF0055] text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(255,0,85,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  <Unlock size={18} />
                  {t('liquidity_confirm_unstake')}
                </button>
              </>
            )}
            
            {/* Info Box */}
            <div className="mt-auto pt-4 border-t border-slate-800">
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>{t('liquidity_info_text')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right: User Position & Rewards */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          {/* My Position */}
          <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={16} className="text-[#836EF9]" />
              <span className="font-bold text-white">{t('liquidity_my_position')}</span>
            </div>
            
            {userStake && userStake.amount > 0 ? (
              <>
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-1">{t('liquidity_staked_amount')}</p>
                  <p className="text-2xl font-bold text-white">{formatNumber(userStake.amount)} <span className="text-sm text-slate-500">MON</span></p>
                </div>
                
                <div className="flex items-center justify-between py-2 border-t border-slate-800">
                  <span className="text-xs text-slate-500">{t('liquidity_pool_share')}</span>
                  <span className="text-sm font-bold text-[#836EF9]">{userSharePercent.toFixed(4)}%</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-t border-slate-800">
                  <span className="text-xs text-slate-500">{t('liquidity_total_earned')}</span>
                  <span className="text-sm font-bold text-[#00FF9D]">+{formatNumber(userStake.rewards)} MON</span>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Droplets size={32} className="text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">{t('liquidity_no_position')}</p>
                <p className="text-xs text-slate-600 mt-1">{t('liquidity_start_earning')}</p>
              </div>
            )}
          </div>
          
          {/* Pending Rewards */}
          <div className="bg-gradient-to-br from-[#836EF9]/20 to-[#00FF9D]/10 border border-[#836EF9]/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={16} className="text-[#FFD700]" />
              <span className="font-bold text-white">{t('liquidity_pending_rewards')}</span>
            </div>
            
            <div className="mb-3">
              <p className="text-3xl font-bold text-[#FFD700]">
                {userStake ? userStake.pendingRewards.toFixed(6) : '0.000000'}
              </p>
              <p className="text-xs text-slate-500">MON</p>
            </div>
            
            <button
              onClick={handleClaimRewards}
              disabled={!userStake || userStake.pendingRewards <= 0.000001}
              className="w-full py-2 bg-gradient-to-r from-[#836EF9] to-[#00FF9D] text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(131,110,249,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <Gift size={16} />
              {t('liquidity_claim_rewards')}
            </button>
          </div>
          
          {/* How It Works */}
          <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <BarChart3 size={16} className="text-slate-500" />
              {t('liquidity_how_it_works')}
            </h3>
            <div className="space-y-2 text-xs text-slate-500">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00FF9D]/20 text-[#00FF9D] flex items-center justify-center shrink-0 font-bold">1</span>
                <p>{t('liquidity_step1')}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00FF9D]/20 text-[#00FF9D] flex items-center justify-center shrink-0 font-bold">2</span>
                <p>{t('liquidity_step2')}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00FF9D]/20 text-[#00FF9D] flex items-center justify-center shrink-0 font-bold">3</span>
                <p>{t('liquidity_step3')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
