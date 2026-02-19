import React, { useState, useEffect, useMemo } from 'react';
import { Droplets, TrendingUp, Wallet, Clock, Gift, ArrowUpRight, ArrowDownRight, Info, AlertCircle, CheckCircle2, Zap, Percent, Coins, BarChart3, Lock, Unlock, Activity } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useWallet } from '../contexts/WalletContext';
import { Agent } from '../types';
import { LiquidityPool, UserLiquidityStake } from '../lib/api/liquidity';
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
  const { wallet, updateMonBalance, userId, userStake, refreshUserStake } = useWallet();
  
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Local user stake for real-time updates
  const [localUserStake, setLocalUserStake] = useState<UserLiquidityStake | null>(userStake);
  
  // Sync with WalletContext userStake
  useEffect(() => {
    setLocalUserStake(userStake);
  }, [userStake]);
  
  // Calculate daily trading fees from active agents
  const dailyFees = useMemo(() => {
    const activeAgents = agents.filter(a => a.status === 'ACTIVE');
    // Fee is 0.1% of daily volume per agent
    return activeAgents.reduce((acc, agent) => acc + (agent.balance * 0.001), 0);
  }, [agents]);
  
  // Calculate dynamic APR based on fees
  const [pool, setPool] = useState<LiquidityPool>({
    id: 'mon-lp-1',
    pool_id: 'mon-lp-1',
    total_staked: 0,
    total_rewards: 0,
    apr: BASE_APR,
    fee_share: 0.7,
    daily_volume: 0,
    updated_at: new Date().toISOString()
  });
  const [isPoolLoading, setIsPoolLoading] = useState(true);
  
  // Update APR based on trading fees
  useEffect(() => {
    const annualFees = dailyFees * 365;
    const dynamicApr = pool.total_staked > 0 
      ? (annualFees / pool.total_staked) * pool.fee_share * 100 
      : BASE_APR;
    // APR fluctuates between 50% and 150% based on fees
    const clampedApr = Math.max(50, Math.min(150, dynamicApr));
    setPool(prev => ({ ...prev, apr: clampedApr, daily_volume: dailyFees * 100 }));
  }, [dailyFees, pool.total_staked, pool.fee_share]);
  
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
          ...updatedPool
        });
      } else {
        // Fallback to getLiquidityPool if recalculate failed
        const dbPool = await getLiquidityPool('mon-lp-1');
        if (dbPool) {
          console.log('[Liquidity] Loaded pool data from Supabase:', dbPool);
          setPool({
            ...dbPool
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
  
  // Calculate real-time rewards based on current APR
  useEffect(() => {
    const interval = setInterval(() => {
      if (localUserStake && localUserStake.amount > 0) {
        const rewardPerSecond = (localUserStake.amount * (pool.apr / 100)) / (365 * 24 * 3600);
        setLocalUserStake(prev => prev ? {
          ...prev,
          pending_rewards: prev.pending_rewards + rewardPerSecond
        } : null);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [localUserStake?.amount, pool.apr]);
  
  // Calculate estimated daily earnings
  const estimatedDailyEarnings = useMemo(() => {
    const amount = Number(stakeAmount) || 0;
    return (amount * (pool.apr / 100)) / 365;
  }, [stakeAmount, pool.apr]);
  
  // Calculate user's share percentage
  const userSharePercent = useMemo(() => {
    if (!localUserStake || pool.total_staked === 0) return 0;
    return (localUserStake.amount / pool.total_staked) * 100;
  }, [localUserStake, pool.total_staked]);
  
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
    
    const newStake = localUserStake ? {
      ...localUserStake,
      amount: localUserStake.amount + amount,
      pending_rewards: localUserStake.pending_rewards
    } : {
      id: `stake-${Date.now()}`,
      user_id: userId || '',
      pool_id: 'mon-lp-1',
      amount: amount,
      rewards: 0,
      pending_rewards: 0,
      staked_at: new Date().toISOString(),
      lock_period: 0
    } as UserLiquidityStake;
    
    setLocalUserStake(newStake);
    
    // Sync to Supabase
    if (userId && isSupabaseConfigured()) {
      console.log('[Liquidity] Syncing stake to Supabase...');
      await upsertUserStake(userId, 'mon-lp-1', amount, 0, newStake.pending_rewards);
      
      // Refresh from WalletContext
      await refreshUserStake();
      
      // Recalculate total staked from all users
      console.log('[Liquidity] Recalculating total staked...');
      const updatedPool = await recalculateTotalStaked('mon-lp-1');
      if (updatedPool) {
        setPool(prev => ({
          ...prev,
          total_staked: updatedPool.total_staked,
          total_rewards: updatedPool.total_rewards,
          apr: updatedPool.apr,
          fee_share: updatedPool.fee_share,
          daily_volume: updatedPool.daily_volume
        }));
      }
    } else {
      // Fallback to local calculation
      const newTotalStaked = pool.total_staked + amount;
      setPool(prev => ({
        ...prev,
        total_staked: newTotalStaked
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
    if (!localUserStake || amount > localUserStake.amount) return;
    
    updateMonBalance(amount);
    
    const newAmount = localUserStake.amount - amount;
    setLocalUserStake(prev => prev ? {
      ...prev,
      amount: newAmount,
      pending_rewards: newAmount <= 0 ? 0 : prev.pending_rewards
    } : null);
    
    // Sync to Supabase
    if (userId && isSupabaseConfigured() && localUserStake) {
      console.log('[Liquidity] Syncing unstake to Supabase...');
      await upsertUserStake(userId, 'mon-lp-1', -amount, 0, newAmount <= 0 ? 0 : localUserStake.pending_rewards);
      
      // Refresh from WalletContext
      await refreshUserStake();
      
      // Recalculate total staked from all users
      console.log('[Liquidity] Recalculating total staked after unstake...');
      const updatedPool = await recalculateTotalStaked('mon-lp-1');
      if (updatedPool) {
        setPool(prev => ({
          ...prev,
          total_staked: updatedPool.total_staked,
          total_rewards: updatedPool.total_rewards,
          apr: updatedPool.apr,
          fee_share: updatedPool.fee_share,
          daily_volume: updatedPool.daily_volume
        }));
      }
    } else {
      // Fallback to local calculation
      const newTotalStaked = Math.max(0, pool.total_staked - amount);
      setPool(prev => ({
        ...prev,
        total_staked: newTotalStaked
      }));
    }
    
    setUnstakeAmount('');
    setSuccessMessage(t('liquidity_unstake_success'));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  const handleClaimRewards = async () => {
    console.log('[Liquidity] handleClaimRewards called', { localUserStake, userId, isConfigured: isSupabaseConfigured() });
    
    if (!localUserStake || localUserStake.pending_rewards <= 0) {
      console.log('[Liquidity] No pending rewards to claim');
      return;
    }
    
    const claimedAmount = localUserStake.pending_rewards;
    console.log('[Liquidity] Claiming amount:', claimedAmount);
    
    updateMonBalance(claimedAmount);
    
    // Update local user stake
    setLocalUserStake(prev => {
      console.log('[Liquidity] Updating localUserStake:', prev);
      return prev ? {
        ...prev,
        rewards: prev.rewards + prev.pending_rewards,
        pending_rewards: 0
      } : null;
    });
    
    // Update total rewards in pool
    setPool(prev => {
      const newTotalRewards = prev.total_rewards + claimedAmount;
      console.log('[Liquidity] Updating pool.total_rewards:', prev.total_rewards, '->', newTotalRewards);
      return {
        ...prev,
        total_rewards: newTotalRewards
      };
    });
    
    // Sync to Supabase
    if (userId && isSupabaseConfigured() && localUserStake) {
      console.log('[Liquidity] Syncing claim rewards to Supabase...', { stakeId: localUserStake.id, poolId: pool.pool_id });
      const result = await claimRewards(localUserStake.id, pool.pool_id);
      console.log('[Liquidity] claimRewards result:', result);
      
      // Refresh from WalletContext
      await refreshUserStake();
    } else {
      console.log('[Liquidity] Skipping Supabase sync:', { userId, isConfigured: isSupabaseConfigured(), hasStake: !!localUserStake });
    }
    
    setSuccessMessage(t('liquidity_claim_success'));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  const maxStake = wallet.monBalance;
  const maxUnstake = localUserStake?.amount || 0;
  
  return (
    <div className="h-full flex flex-col bg-[#0a0c14] overflow-hidden">
      {/* Header */}
      <div className="bg-[#0f111a] border-b border-slate-800 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#00FF9D] flex items-center justify-center">
            <Droplets size={16} className="sm:w-5 sm:h-5 text-black" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">{t('liquidity_title')}</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">{t('liquidity_subtitle')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right">
            <p className="text-[10px] sm:text-xs text-slate-500">{t('liquidity_total_staked')}</p>
            <p className="text-sm sm:text-lg font-bold text-[#00FF9D]">
              {isPoolLoading ? (
                <span className="inline-block w-16 sm:w-20 h-5 sm:h-6 bg-slate-700 rounded animate-pulse" />
              ) : (
                <>{formatNumber(pool.total_staked)} MON</>
              )}
            </p>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-gradient-to-br from-[#0f111a] to-[#1a1d2e] border border-[#00FF9D]/30 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-[0_0_60px_rgba(0,255,157,0.3)] animate-scaleIn">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#00FF9D] to-[#00D4AA] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(0,255,157,0.5)]">
                <CheckCircle2 size={32} className="sm:w-10 sm:h-10 text-black" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{t('liquidity_success_title')}</h3>
              <p className="text-[#00FF9D] font-semibold text-base sm:text-lg mb-4">{successMessage}</p>
              <div className="bg-slate-800/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                  <Droplets size={16} className="text-[#00FF9D]" />
                  <span>{t('liquidity_success_desc')}</span>
                </div>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-[#00FF9D] to-[#00D4AA] text-black font-bold rounded-lg hover:shadow-[0_0_30px_rgba(0,255,157,0.4)] transition-all"
              >
                {t('liquidity_success_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Cards - Scrollable on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 shrink-0">
        <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5 text-[#00FF9D]" />
            <span className="text-[10px] sm:text-xs text-slate-500">{t('liquidity_apr')}</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-[#00FF9D]">{formatPercentage(pool.apr)}</p>
          <p className="text-[9px] sm:text-[10px] text-slate-600">{t('liquidity_annual_yield')}</p>
        </div>
        
        <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <Activity size={12} className="sm:w-3.5 sm:h-3.5 text-[#836EF9]" />
            <span className="text-[10px] sm:text-xs text-slate-500">{t('liquidity_daily_fees')}</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-white">{formatNumber(dailyFees)}</p>
          <p className="text-[9px] sm:text-[10px] text-slate-600">MON</p>
        </div>
        
        <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <Percent size={12} className="sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span className="text-[10px] sm:text-xs text-slate-500">{t('liquidity_fee_share')}</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-amber-400">{pool.fee_share * 100}%</p>
          <p className="text-[9px] sm:text-[10px] text-slate-600">{t('liquidity_of_fees')}</p>
        </div>
        
        <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-2.5 sm:p-3">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <Zap size={12} className="sm:w-3.5 sm:h-3.5 text-[#FF0055]" />
            <span className="text-[10px] sm:text-xs text-slate-500">{t('liquidity_total_rewards')}</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-[#FF0055]">
            {isPoolLoading ? (
              <span className="inline-block w-12 sm:w-16 h-5 sm:h-6 bg-slate-700 rounded animate-pulse" />
            ) : (
              formatNumber(pool.total_rewards, 4)
            )}
          </p>
          <p className="text-[9px] sm:text-[10px] text-slate-600">MON {t('liquidity_distributed')}</p>
        </div>
      </div>
      
      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 px-3 sm:px-4 pb-3 sm:pb-4 min-h-0 overflow-y-auto">
        {/* Left: Stake/Unstake Panel */}
        <div className="flex-1 bg-[#0f111a] border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[300px] lg:min-h-0">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('stake')}
              className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 sm:gap-2 ${
                activeTab === 'stake' 
                  ? 'bg-[#00FF9D]/10 text-[#00FF9D] border-b-2 border-[#00FF9D]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Lock size={14} className="sm:w-4 sm:h-4" />
              {t('liquidity_stake')}
            </button>
            <button
              onClick={() => setActiveTab('unstake')}
              className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 sm:gap-2 ${
                activeTab === 'unstake' 
                  ? 'bg-[#FF0055]/10 text-[#FF0055] border-b-2 border-[#FF0055]' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Unlock size={14} className="sm:w-4 sm:h-4" />
              {t('liquidity_unstake')}
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-3 sm:p-4 flex-1 flex flex-col">
            {activeTab === 'stake' ? (
              <>
                <div className="mb-3 sm:mb-4">
                  <label className="text-[10px] sm:text-xs text-slate-500 mb-1.5 sm:mb-2 block">{t('liquidity_amount')}</label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 sm:p-3">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-transparent text-xl sm:text-2xl font-bold text-white w-full outline-none"
                      />
                      <span className="text-slate-500 font-bold text-sm sm:text-base">MON</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
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
                  <div className="bg-[#00FF9D]/5 border border-[#00FF9D]/20 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] sm:text-xs text-slate-500">{t('liquidity_estimated_daily')}</span>
                      <span className="text-xs sm:text-sm font-bold text-[#00FF9D]">+{estimatedDailyEarnings.toFixed(4)} MON</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-slate-500">{t('liquidity_estimated_monthly')}</span>
                      <span className="text-xs sm:text-sm font-bold text-[#00FF9D]">+{(estimatedDailyEarnings * 30).toFixed(2)} MON</span>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    console.log('[Liquidity] Button clicked', { stakeAmount, maxStake });
                    handleStake();
                  }}
                  disabled={!stakeAmount || Number(stakeAmount) <= 0 || Number(stakeAmount) > maxStake}
                  className="w-full py-2.5 sm:py-3 bg-[#00FF9D] text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                >
                  <Lock size={16} className="sm:w-5 sm:h-5" />
                  {t('liquidity_confirm_stake')}
                </button>
              </>
            ) : (
              <>
                <div className="mb-3 sm:mb-4">
                  <label className="text-[10px] sm:text-xs text-slate-500 mb-1.5 sm:mb-2 block">{t('liquidity_amount')}</label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 sm:p-3">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="number"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-transparent text-xl sm:text-2xl font-bold text-white w-full outline-none"
                      />
                      <span className="text-slate-500 font-bold text-sm sm:text-base">MON</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
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
                  className="w-full py-2.5 sm:py-3 bg-[#FF0055] text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(255,0,85,0.3)] transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                >
                  <Unlock size={16} className="sm:w-5 sm:h-5" />
                  {t('liquidity_confirm_unstake')}
                </button>
              </>
            )}
            
            {/* Info Box */}
            <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-800">
              <div className="flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500">
                <Info size={12} className="sm:w-3.5 sm:h-3.5 shrink-0 mt-0.5" />
                <p>{t('liquidity_info_text')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right: User Position & Rewards */}
        <div className="w-full lg:w-80 flex flex-col gap-3 sm:gap-4">
          {/* My Position */}
          <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <Wallet size={14} className="sm:w-4 sm:h-4 text-[#836EF9]" />
              <span className="font-bold text-white text-sm sm:text-base">{t('liquidity_my_position')}</span>
            </div>
            
            {localUserStake && localUserStake.amount > 0 ? (
              <>
                <div className="mb-2 sm:mb-3">
                  <p className="text-[10px] sm:text-xs text-slate-500 mb-1">{t('liquidity_staked_amount')}</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">{formatNumber(localUserStake.amount)} <span className="text-xs sm:text-sm text-slate-500">MON</span></p>
                </div>
                
                <div className="flex items-center justify-between py-1.5 sm:py-2 border-t border-slate-800">
                  <span className="text-[10px] sm:text-xs text-slate-500">{t('liquidity_pool_share')}</span>
                  <span className="text-xs sm:text-sm font-bold text-[#836EF9]">{userSharePercent.toFixed(4)}%</span>
                </div>
                
                <div className="flex items-center justify-between py-1.5 sm:py-2 border-t border-slate-800">
                  <span className="text-[10px] sm:text-xs text-slate-500">{t('liquidity_total_earned')}</span>
                  <span className="text-xs sm:text-sm font-bold text-[#00FF9D]">+{formatNumber(localUserStake.rewards)} MON</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4 sm:py-6">
                <Droplets size={28} className="sm:w-8 sm:h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-slate-500">{t('liquidity_no_position')}</p>
                <p className="text-[10px] sm:text-xs text-slate-600 mt-1">{t('liquidity_start_earning')}</p>
              </div>
            )}
          </div>
          
          {/* Pending Rewards */}
          <div className="bg-gradient-to-br from-[#836EF9]/20 to-[#00FF9D]/10 border border-[#836EF9]/30 rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <Gift size={14} className="sm:w-4 sm:h-4 text-[#FFD700]" />
              <span className="font-bold text-white text-sm sm:text-base">{t('liquidity_pending_rewards')}</span>
            </div>
            
            <div className="mb-2 sm:mb-3">
              <p className="text-2xl sm:text-3xl font-bold text-[#FFD700]">
                {localUserStake ? localUserStake.pending_rewards.toFixed(6) : '0.000000'}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500">MON</p>
            </div>
            
            <button
              onClick={handleClaimRewards}
              disabled={!localUserStake || localUserStake.pending_rewards <= 0.000001}
              className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-[#836EF9] to-[#00FF9D] text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(131,110,249,0.4)] transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <Gift size={14} className="sm:w-4 sm:h-4" />
              {t('liquidity_claim_rewards')}
            </button>
          </div>
          
          {/* How It Works */}
          <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-3 sm:p-4">
            <h3 className="font-bold text-white mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <BarChart3 size={14} className="sm:w-4 sm:h-4 text-slate-500" />
              {t('liquidity_how_it_works')}
            </h3>
            <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-slate-500">
              <div className="flex items-start gap-1.5 sm:gap-2">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#00FF9D]/20 text-[#00FF9D] flex items-center justify-center shrink-0 font-bold text-[10px] sm:text-xs">1</span>
                <p>{t('liquidity_step1')}</p>
              </div>
              <div className="flex items-start gap-1.5 sm:gap-2">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#00FF9D]/20 text-[#00FF9D] flex items-center justify-center shrink-0 font-bold text-[10px] sm:text-xs">2</span>
                <p>{t('liquidity_step2')}</p>
              </div>
              <div className="flex items-start gap-1.5 sm:gap-2">
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#00FF9D]/20 text-[#00FF9D] flex items-center justify-center shrink-0 font-bold text-[10px] sm:text-xs">3</span>
                <p>{t('liquidity_step3')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
