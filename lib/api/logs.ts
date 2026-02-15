import { supabase } from '../supabase';
import type { Database } from '../database.types';

export type BattleLog = Database['public']['Tables']['battle_logs']['Row'];
export type BattleLogInsert = Database['public']['Tables']['battle_logs']['Insert'];
export type LootEvent = Database['public']['Tables']['loot_events']['Row'];
export type LootEventInsert = Database['public']['Tables']['loot_events']['Insert'];

/**
 * Add a battle log
 */
export async function addBattleLog(
  userId: string,
  message: string,
  type: BattleLog['type'],
  amount?: number
): Promise<BattleLog | null> {
  const { data, error } = await supabase
    .from('battle_logs')
    .insert({
      user_id: userId,
      message,
      type,
      amount
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding battle log:', error);
    return null;
  }

  return data;
}

/**
 * Get battle logs for a user
 */
export async function getBattleLogs(
  userId: string,
  limit: number = 100
): Promise<BattleLog[]> {
  const { data, error } = await supabase
    .from('battle_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching battle logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Add a loot event
 */
export async function addLootEvent(
  amount: number,
  winner: LootEvent['winner'],
  winnerName?: string,
  victimName?: string,
  isUserInvolved: boolean = false
): Promise<LootEvent | null> {
  const { data, error } = await supabase
    .from('loot_events')
    .insert({
      amount,
      winner,
      winner_name: winnerName,
      victim_name: victimName,
      is_user_involved: isUserInvolved
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding loot event:', error);
    return null;
  }

  return data;
}

/**
 * Get recent loot events
 */
export async function getRecentLootEvents(limit: number = 50): Promise<LootEvent[]> {
  const { data, error } = await supabase
    .from('loot_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching loot events:', error);
    return [];
  }

  return data || [];
}
