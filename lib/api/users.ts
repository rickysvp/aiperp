import { supabase } from '../supabase';
import type { Database } from '../database.types';

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

/**
 * Get or create a user by wallet address
 */
export async function getOrCreateUser(walletAddress: string): Promise<User | null> {
  const { data, error } = await supabase
    .rpc('get_or_create_user', { p_wallet_address: walletAddress });

  if (error) {
    console.error('Error getting or creating user:', error);
    return null;
  }

  // Fetch the full user record
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data)
    .single();

  if (fetchError) {
    console.error('Error fetching user:', fetchError);
    return null;
  }

  return user;
}

/**
 * Get user by wallet address
 */
export async function getUserByWalletAddress(walletAddress: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', walletAddress)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

/**
 * Update user data
 */
export async function updateUser(userId: string, updates: UserUpdate): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }

  return data;
}

/**
 * Update user balance
 */
export async function updateUserBalance(
  userId: string, 
  monDelta: number, 
  usdcDelta: number = 0
): Promise<User | null> {
  const { data: user } = await supabase
    .from('users')
    .select('mon_balance, usdc_balance')
    .eq('id', userId)
    .single();

  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .update({
      mon_balance: user.mon_balance + monDelta,
      usdc_balance: user.usdc_balance + usdcDelta
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating balance:', error);
    return null;
  }

  return data;
}

/**
 * Update user PnL
 */
export async function updateUserPnL(userId: string, pnlDelta: number): Promise<User | null> {
  const { data: user } = await supabase
    .from('users')
    .select('total_pnl')
    .eq('id', userId)
    .single();

  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .update({
      total_pnl: user.total_pnl + pnlDelta
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating PnL:', error);
    return null;
  }

  return data;
}

/**
 * Add referral earnings
 */
export async function addReferralEarnings(userId: string, amount: number): Promise<User | null> {
  const { data: user } = await supabase
    .from('users')
    .select('referral_earnings, referral_count')
    .eq('id', userId)
    .single();

  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .update({
      referral_earnings: user.referral_earnings + amount,
      referral_count: user.referral_count + 1
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating referral earnings:', error);
    return null;
  }

  return data;
}
