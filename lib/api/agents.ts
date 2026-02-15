import { supabase } from '../supabase';
import type { Database } from '../database.types';

export type Agent = Database['public']['Tables']['agents']['Row'];
export type AgentInsert = Database['public']['Tables']['agents']['Insert'];
export type AgentUpdate = Database['public']['Tables']['agents']['Update'];

/**
 * Get all agents
 */
export async function getAllAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching agents:', error);
    return [];
  }

  return data || [];
}

/**
 * Get agents by owner
 */
export async function getAgentsByOwner(ownerId: string): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user agents:', error);
    return [];
  }

  return data || [];
}

/**
 * Get active agents
 */
export async function getActiveAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('status', 'ACTIVE');

  if (error) {
    console.error('Error fetching active agents:', error);
    return [];
  }

  return data || [];
}

/**
 * Get agent by ID
 */
export async function getAgentById(agentId: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (error) {
    console.error('Error fetching agent:', error);
    return null;
  }

  return data;
}

/**
 * Create a new agent
 */
export async function createAgent(agent: AgentInsert): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .insert(agent)
    .select()
    .single();

  if (error) {
    console.error('Error creating agent:', error);
    return null;
  }

  return data;
}

/**
 * Update an agent
 */
export async function updateAgent(agentId: string, updates: AgentUpdate): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .update(updates)
    .eq('id', agentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating agent:', error);
    return null;
  }

  return data;
}

/**
 * Deploy an agent (set to ACTIVE)
 */
export async function deployAgent(
  agentId: string,
  collateral: number,
  asset: string,
  direction: string,
  leverage: number,
  entryPrice: number
): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .update({
      status: 'ACTIVE',
      balance: collateral,
      asset: asset as any,
      direction: direction as any,
      leverage,
      entry_price: entryPrice,
      pnl: 0,
      effective_direction: direction === 'AUTO' 
        ? (Math.random() > 0.5 ? 'LONG' : 'SHORT')
        : direction as any
    })
    .eq('id', agentId)
    .select()
    .single();

  if (error) {
    console.error('Error deploying agent:', error);
    return null;
  }

  return data;
}

/**
 * Withdraw an agent (set to IDLE)
 */
export async function withdrawAgent(agentId: string): Promise<Agent | null> {
  const { data: agent } = await supabase
    .from('agents')
    .select('pnl, balance, wins, losses')
    .eq('id', agentId)
    .single();

  if (!agent) return null;

  // Record win/loss based on PnL
  const isWin = agent.pnl > 0;
  const isLoss = agent.pnl < 0;

  const { data, error } = await supabase
    .from('agents')
    .update({
      status: 'IDLE',
      balance: 0,
      pnl: 0,
      wins: isWin ? agent.wins + 1 : agent.wins,
      losses: isLoss ? agent.losses + 1 : agent.losses
    })
    .eq('id', agentId)
    .select()
    .single();

  if (error) {
    console.error('Error withdrawing agent:', error);
    return null;
  }

  return data;
}

/**
 * Liquidate an agent
 */
export async function liquidateAgent(agentId: string): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .update({
      status: 'LIQUIDATED',
      balance: 0,
      pnl: 0
    })
    .eq('id', agentId)
    .select()
    .single();

  if (error) {
    console.error('Error liquidating agent:', error);
    return null;
  }

  return data;
}

/**
 * Update agent PnL
 */
export async function updateAgentPnL(agentId: string, pnl: number): Promise<Agent | null> {
  const { data, error } = await supabase
    .from('agents')
    .update({ pnl })
    .eq('id', agentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating agent PnL:', error);
    return null;
  }

  return data;
}

/**
 * Record PnL history for an agent
 */
export async function recordAgentPnLHistory(agentId: string, value: number): Promise<void> {
  const { error } = await supabase
    .from('agent_pnl_history')
    .insert({
      agent_id: agentId,
      value
    });

  if (error) {
    console.error('Error recording PnL history:', error);
  }
}

/**
 * Get PnL history for an agent
 */
export async function getAgentPnLHistory(agentId: string): Promise<{ time: string; value: number }[]> {
  const { data, error } = await supabase
    .from('agent_pnl_history')
    .select('recorded_at, value')
    .eq('agent_id', agentId)
    .order('recorded_at', { ascending: true });

  if (error) {
    console.error('Error fetching PnL history:', error);
    return [];
  }

  return (data || []).map(item => ({
    time: item.recorded_at,
    value: item.value
  }));
}
