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
 * Batch update multiple agents PnL (for game loop)
 */
export async function batchUpdateAgentsPnL(updates: Array<{ id: string; pnl: number; status?: string; balance?: number }>): Promise<void> {
  if (updates.length === 0) return;

  for (const update of updates) {
    const { id, pnl, status, balance } = update;
    const updateData: AgentUpdate = { pnl };
    if (status !== undefined) updateData.status = status as any;
    if (balance !== undefined) updateData.balance = balance;

    await supabase
      .from('agents')
      .update(updateData)
      .eq('id', id);
  }
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
  entryPrice: number,
  takeProfit?: number,
  stopLoss?: number
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
      take_profit: takeProfit,
      stop_loss: stopLoss,
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
export async function withdrawAgent(agentId: string): Promise<{ agent: Agent | null; finalBalance: number }> {
  const { data: agent } = await supabase
    .from('agents')
    .select('pnl, balance, wins, losses')
    .eq('id', agentId)
    .single();

  if (!agent) return { agent: null, finalBalance: 0 };

  const finalBalance = agent.balance + agent.pnl;
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
    return { agent: null, finalBalance: 0 };
  }

  return { agent: data, finalBalance };
}

/**
 * Liquidate an agent
 */
export async function liquidateAgent(agentId: string): Promise<Agent | null> {
  const { data: agent } = await supabase
    .from('agents')
    .select('balance')
    .eq('id', agentId)
    .single();

  if (!agent) return null;

  const { data, error } = await supabase
    .from('agents')
    .update({
      status: 'LIQUIDATED',
      balance: 0,
      pnl: -agent.balance
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
  if (agentId.startsWith('bot-')) {
    return;
  }

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
 * Batch record PnL history for multiple agents
 */
export async function batchRecordPnLHistory(records: Array<{ agentId: string; value: number }>): Promise<void> {
  if (records.length === 0) return;

  const validRecords = records.filter(r => !r.agentId.startsWith('bot-'));
  if (validRecords.length === 0) return;

  const { error } = await supabase
    .from('agent_pnl_history')
    .insert(validRecords.map(r => ({
      agent_id: r.agentId,
      value: r.value
    })));

  if (error) {
    console.error('Error batch recording PnL history:', error);
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

/**
 * Create system bot agents (for initial setup)
 */
export async function createSystemAgents(agents: Array<Omit<AgentInsert, 'owner_id' | 'minter'>>): Promise<Agent[]> {
  const systemAgents = agents.map(agent => ({
    ...agent,
    owner_id: null,
    minter: 'Protocol'
  }));

  const { data, error } = await supabase
    .from('agents')
    .insert(systemAgents)
    .select();

  if (error) {
    console.error('Error creating system agents:', error);
    return [];
  }

  return data || [];
}
