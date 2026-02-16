import { supabase } from '../supabase';
import type { Database } from '../database.types';

export type LiquidityPool = Database['public']['Tables']['liquidity_pools']['Row'];
export type UserLiquidityStake = Database['public']['Tables']['user_liquidity_stakes']['Row'];
export type UserLiquidityStakeInsert = Database['public']['Tables']['user_liquidity_stakes']['Insert'];
export type UserLiquidityStakeUpdate = Database['public']['Tables']['user_liquidity_stakes']['Update'];

/**
 * Get all liquidity pools
 */
export async function getAllLiquidityPools(): Promise<LiquidityPool[]> {
  const { data, error } = await supabase
    .from('liquidity_pools')
    .select('*');

  if (error) {
    console.error('Error fetching liquidity pools:', error);
    return [];
  }

  return data || [];
}

/**
 * Get liquidity pool by ID
 */
export async function getLiquidityPool(poolId: string): Promise<LiquidityPool | null> {
  const { data, error } = await supabase
    .from('liquidity_pools')
    .select('*')
    .eq('pool_id', poolId)
    .single();

  if (error) {
    console.error('Error fetching liquidity pool:', error);
    return null;
  }

  return data;
}

/**
 * Update liquidity pool
 */
export async function updateLiquidityPool(
  poolId: string,
  updates: Partial<LiquidityPool>
): Promise<LiquidityPool | null> {
  const { data, error } = await supabase
    .from('liquidity_pools')
    .update(updates)
    .eq('pool_id', poolId)
    .select()
    .single();

  if (error) {
    console.error('Error updating liquidity pool:', error);
    return null;
  }

  return data;
}

/**
 * Recalculate total staked from all user stakes
 */
export async function recalculateTotalStaked(poolId: string): Promise<LiquidityPool | null> {
  // First ensure pool exists
  let pool = await getLiquidityPool(poolId);
  
  if (!pool) {
    // Create pool if it doesn't exist
    const { data: newPool, error } = await supabase
      .from('liquidity_pools')
      .insert({
        pool_id: poolId,
        total_staked: 0,
        total_rewards: 0,
        apr: 100,
        fee_share: 0.7,
        daily_volume: 0
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating liquidity pool:', error);
      return null;
    }
    pool = newPool;
  }
  
  // Calculate total staked from all user stakes
  const { data: allStakes, error: stakesError } = await supabase
    .from('user_liquidity_stakes')
    .select('amount')
    .eq('pool_id', poolId);
    
  if (stakesError) {
    console.error('Error fetching stakes for recalculation:', stakesError);
    return pool;
  }
  
  const totalStaked = allStakes?.reduce((sum, stake) => sum + (stake.amount || 0), 0) || 0;
  
  console.log('[API] Recalculated total staked:', totalStaked, 'from', allStakes?.length, 'stakes');
  
  // Update pool with correct total
  return await updateLiquidityPool(poolId, {
    total_staked: totalStaked
  });
}

/**
 * Get user liquidity stakes
 */
export async function getUserLiquidityStakes(userId: string): Promise<UserLiquidityStake[]> {
  const { data, error } = await supabase
    .from('user_liquidity_stakes')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user stakes:', error);
    return [];
  }

  return data || [];
}

/**
 * Get user stake for a specific pool
 */
export async function getUserStakeForPool(
  userId: string,
  poolId: string
): Promise<UserLiquidityStake | null> {
  const { data, error } = await supabase
    .from('user_liquidity_stakes')
    .select('*')
    .eq('user_id', userId)
    .eq('pool_id', poolId)
    .single();

  if (error) {
    console.error('Error fetching user stake:', error);
    return null;
  }

  return data;
}

/**
 * Create or update user stake
 */
export async function upsertUserStake(
  userId: string,
  poolId: string,
  amount: number,
  rewards: number = 0,
  pendingRewards: number = 0
): Promise<UserLiquidityStake | null> {
  const { data: existing } = await supabase
    .from('user_liquidity_stakes')
    .select('id, amount, rewards')
    .eq('user_id', userId)
    .eq('pool_id', poolId)
    .single();

  if (existing) {
    // Update existing stake
    const { data, error } = await supabase
      .from('user_liquidity_stakes')
      .update({
        amount: existing.amount + amount,
        rewards: existing.rewards + rewards,
        pending_rewards: pendingRewards
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating stake:', error);
      return null;
    }

    return data;
  } else {
    // Create new stake
    const { data, error } = await supabase
      .from('user_liquidity_stakes')
      .insert({
        user_id: userId,
        pool_id: poolId,
        amount,
        rewards,
        pending_rewards: pendingRewards
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating stake:', error);
      return null;
    }

    return data;
  }
}

/**
 * Update user stake amount
 */
export async function updateUserStakeAmount(
  stakeId: string,
  amountDelta: number
): Promise<UserLiquidityStake | null> {
  const { data: stake } = await supabase
    .from('user_liquidity_stakes')
    .select('amount')
    .eq('id', stakeId)
    .single();

  if (!stake) return null;

  const newAmount = Math.max(0, stake.amount + amountDelta);

  const { data, error } = await supabase
    .from('user_liquidity_stakes')
    .update({ amount: newAmount })
    .eq('id', stakeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating stake amount:', error);
    return null;
  }

  return data;
}

/**
 * Update pending rewards
 */
export async function updatePendingRewards(
  stakeId: string,
  pendingRewards: number
): Promise<UserLiquidityStake | null> {
  const { data, error } = await supabase
    .from('user_liquidity_stakes')
    .update({ pending_rewards: pendingRewards })
    .eq('id', stakeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating pending rewards:', error);
    return null;
  }

  return data;
}

/**
 * Claim rewards
 */
export async function claimRewards(stakeId: string): Promise<UserLiquidityStake | null> {
  const { data: stake } = await supabase
    .from('user_liquidity_stakes')
    .select('rewards, pending_rewards')
    .eq('id', stakeId)
    .single();

  if (!stake) return null;

  const { data, error } = await supabase
    .from('user_liquidity_stakes')
    .update({
      rewards: stake.rewards + stake.pending_rewards,
      pending_rewards: 0
    })
    .eq('id', stakeId)
    .select()
    .single();

  if (error) {
    console.error('Error claiming rewards:', error);
    return null;
  }

  return data;
}

/**
 * Initialize default liquidity pool
 */
export async function initializeLiquidityPool(): Promise<void> {
  const { error } = await supabase
    .from('liquidity_pools')
    .upsert({
      pool_id: 'mon-lp-1',
      total_staked: 2500000,
      total_rewards: 125000,
      apr: 100,
      fee_share: 0.7,
      daily_volume: 0
    }, {
      onConflict: 'pool_id'
    });

  if (error) {
    console.error('Error initializing liquidity pool:', error);
  }
}
