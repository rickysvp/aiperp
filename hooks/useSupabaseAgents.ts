import { useState, useEffect, useCallback } from 'react';
import { Agent, AgentOwner, Direction, AssetSymbol } from '../types';
import {
  getAllAgents,
  getAgentsByOwner,
  createAgent,
  deployAgent,
  withdrawAgent,
  liquidateAgent,
  updateAgentPnL,
  recordAgentPnLHistory
} from '../lib/api/agents';
import { isSupabaseConfigured } from '../lib/supabase';

export function useSupabaseAgents(userId: string | null) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load agents from Supabase
  const loadAgents = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getAllAgents();
      if (data) {
        // Transform database format to app format
        const transformedAgents: Agent[] = data.map(dbAgent => ({
          id: dbAgent.id,
          owner: (dbAgent.owner_id === userId ? 'USER' : 'SYSTEM') as AgentOwner,
          minter: dbAgent.minter,
          minterTwitter: dbAgent.minter_twitter || undefined,
          name: dbAgent.name,
          nftId: dbAgent.nft_id || undefined,
          bio: dbAgent.bio || '',
          avatarSeed: dbAgent.avatar_seed,
          direction: (dbAgent.direction || 'LONG') as Direction,
          leverage: dbAgent.leverage,
          balance: dbAgent.balance,
          pnl: dbAgent.pnl,
          wins: dbAgent.wins,
          losses: dbAgent.losses,
          status: dbAgent.status,
          strategy: dbAgent.strategy || '',
          riskLevel: (dbAgent.risk_level || 'MEDIUM') as Agent['riskLevel'],
          asset: (dbAgent.asset || 'MON') as AssetSymbol,
          takeProfit: dbAgent.take_profit || undefined,
          stopLoss: dbAgent.stop_loss || undefined,
          entryPrice: dbAgent.entry_price || 0,
          twitterHandle: dbAgent.twitter_handle || undefined,
          effectiveDirection: dbAgent.effective_direction || undefined,
          pnlHistory: [] // Will be loaded separately if needed
        }));
        setAgents(transformedAgents);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadAgents();
    
    // Set up polling for real-time updates
    const interval = setInterval(loadAgents, 5000);
    return () => clearInterval(interval);
  }, [loadAgents]);

  // Create a new agent
  const handleCreateAgent = useCallback(async (agentData: Partial<Agent>) => {
    if (!userId || !isSupabaseConfigured()) return null;
    
    try {
      const newAgent = await createAgent({
        owner_id: userId,
        minter: userId,
        name: agentData.name!,
        avatar_seed: agentData.avatarSeed!,
        bio: agentData.bio,
        strategy: agentData.strategy,
        risk_level: agentData.riskLevel,
        twitter_handle: agentData.twitterHandle,
        direction: 'LONG',
        leverage: 1,
        balance: 0,
        pnl: 0,
        wins: 0,
        losses: 0,
        status: 'IDLE'
      });
      
      if (newAgent) {
        await loadAgents();
        return newAgent.id;
      }
    } catch (err) {
      console.error('Error creating agent:', err);
    }
    return null;
  }, [userId, loadAgents]);

  // Deploy an agent
  const handleDeployAgent = useCallback(async (
    agentId: string,
    direction: string,
    leverage: number,
    collateral: number,
    takeProfit?: number,
    stopLoss?: number,
    asset?: string
  ) => {
    if (!isSupabaseConfigured()) return false;
    
    try {
      const entryPrice = 100; // Should come from market data
      const updated = await deployAgent(
        agentId,
        collateral,
        asset || 'MON',
        direction,
        leverage,
        entryPrice
      );
      
      if (updated) {
        await loadAgents();
        return true;
      }
    } catch (err) {
      console.error('Error deploying agent:', err);
    }
    return false;
  }, [loadAgents]);

  // Withdraw an agent
  const handleWithdrawAgent = useCallback(async (agentId: string) => {
    if (!isSupabaseConfigured()) return false;
    
    try {
      const updated = await withdrawAgent(agentId);
      if (updated) {
        await loadAgents();
        return true;
      }
    } catch (err) {
      console.error('Error withdrawing agent:', err);
    }
    return false;
  }, [loadAgents]);

  // Update agent PnL (called from game loop)
  const handleUpdatePnL = useCallback(async (agentId: string, pnl: number) => {
    if (!isSupabaseConfigured()) return;
    
    try {
      await updateAgentPnL(agentId, pnl);
      
      // Occasionally record history
      if (Math.random() < 0.1) {
        await recordAgentPnLHistory(agentId, pnl);
      }
    } catch (err) {
      console.error('Error updating PnL:', err);
    }
  }, []);

  // Liquidate an agent
  const handleLiquidateAgent = useCallback(async (agentId: string) => {
    if (!isSupabaseConfigured()) return false;
    
    try {
      const updated = await liquidateAgent(agentId);
      if (updated) {
        await loadAgents();
        return true;
      }
    } catch (err) {
      console.error('Error liquidating agent:', err);
    }
    return false;
  }, [loadAgents]);

  return {
    agents,
    isLoading,
    error,
    loadAgents,
    createAgent: handleCreateAgent,
    deployAgent: handleDeployAgent,
    withdrawAgent: handleWithdrawAgent,
    liquidateAgent: handleLiquidateAgent,
    updateAgentPnL: handleUpdatePnL
  };
}
